import { logger, createStructuredLogger } from "@/lib/logger";

export const OPENROUTER_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-2.0-flash-lite-preview-02-05:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-3-12b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "qwen/qwen2.5-72b-instruct:free",
  "deepseek/deepseek-chat:free",
  "microsoft/phi-3-mini-128k-instruct:free",
  "huggingfaceh4/zephyr-7b-beta:free",
  "openchat/openchat-7b:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
];

const REQUEST_TIMEOUT_MS = 60000;

interface OpenRouterResponse {
  content: string;
  model: string;
}

const orLogger = createStructuredLogger("OpenRouterClient");

export async function callOpenRouter(messages: any[]): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  if (!apiKey) {
    orLogger.error("OPENROUTER_API_KEY is not defined in environment variables.");
    throw new Error("OPENROUTER_API_KEY is not defined in environment variables.");
  }

  orLogger.info("Starting request", { modelCount: OPENROUTER_MODELS.length });

  for (const model of OPENROUTER_MODELS) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      
      try {
        const endpoint = "https://openrouter.ai/api/v1/chat/completions";
        orLogger.debug("Calling endpoint", { endpoint, model, attempt: attempts + 1 });
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": siteUrl,
            "X-Title": "offerKart",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
          }),
          signal: controller.signal,
        });

        const isJson = response.headers.get("content-type")?.includes("application/json");
        const data = isJson ? await response.json() : await response.text();

        if (response.status === 429 || (typeof data === 'object' && data.error && data.error.message?.toLowerCase().includes("rate"))) {
          orLogger.warn("Rate limit hit", { model });
          clearTimeout(timeoutId);
          break;
        }

        if (!response.ok) {
          const errorMsg = typeof data === 'object' ? data.error?.message : data;
          throw new Error(errorMsg || `HTTP error ${response.status}`);
        }

        if (typeof data !== 'object' || !data.choices?.[0]?.message?.content) {
          orLogger.error("Invalid response format", undefined, { data });
          throw new Error("Invalid response format from AI.");
        }

        orLogger.info("Success", { model });
        return {
          content: data.choices[0].message.content,
          model: model,
        };

      } catch (error: any) {
        clearTimeout(timeoutId);
        attempts++;
        orLogger.error(`Error with model`, error instanceof Error ? error : new Error(String(error)), { model, attempt: attempts });
        
        if (attempts < maxAttempts) {
          const backoff = Math.pow(2, attempts - 1) * 1000;
          orLogger.debug("Retrying with backoff", { backoffMs: backoff });
          await new Promise(resolve => setTimeout(resolve, backoff));
        } else {
          orLogger.warn("Model exhausted, moving to next", { model });
        }
      }
    }
  }

  orLogger.error("All models unavailable");
  throw new Error("All AI models are currently unavailable or rate-limited. Please try again in a few minutes.");
}
