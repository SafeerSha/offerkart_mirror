import { createStructuredLogger } from "@/lib/logger";

export const HF_MODELS = [
    "google/gemma-2-9b-it",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "meta-llama/Meta-Llama-3-8B-Instruct",
    "microsoft/Phi-3-mini-4k-instruct",
];

const REQUEST_TIMEOUT_MS = 60000;

interface HFResponse {
    content: string;
    model: string;
}

const hfLogger = createStructuredLogger("HuggingFaceClient");

function getErrorMessage(error: unknown): string {
    if (!error) return "Unknown error";
    if (typeof error === "string") return error;
    if (typeof error === "object" && "message" in error) {
        const msg = (error as Record<string, unknown>).message;
        if (typeof msg === "string") return msg;
    }
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}

export async function callHuggingFace(messages: any[]): Promise<HFResponse> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const endpoint = "https://router.huggingface.co/v1/chat/completions";

    if (!apiKey) {
        hfLogger.error("HUGGINGFACE_API_KEY is not defined in environment variables.");
        throw new Error("HUGGINGFACE_API_KEY is not defined in environment variables.");
    }

    hfLogger.info("Starting request", { modelCount: HF_MODELS.length });

    for (const model of HF_MODELS) {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            try {
                hfLogger.debug("Calling endpoint", { endpoint, model, attempt: attempts + 1 });

                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ model, messages, max_tokens: 1000 }),
                    signal: controller.signal,
                });

                const isJson = response.headers.get("content-type")?.includes("application/json");
                const data = isJson ? await response.json() : await response.text();

                const errMsg = getErrorMessage(data);
                const isRateLimited = response.status === 429 ||
                    errMsg.toLowerCase().includes("rate") ||
                    errMsg.toLowerCase().includes("limit");

                if (isRateLimited) {
                    hfLogger.warn("Rate limit hit", { model });
                    clearTimeout(timeoutId);
                    break;
                }

                if (!response.ok) {
                    throw new Error(errMsg || `HTTP error ${response.status}`);
                }

                if (typeof data !== 'object' || !data.choices?.[0]?.message?.content) {
                    hfLogger.error("Invalid response format", undefined, { data });
                    throw new Error("Invalid response format from HF.");
                }

                hfLogger.info("Success", { model });
                return { content: data.choices[0].message.content, model };

            } catch (error: any) {
                clearTimeout(timeoutId);
                attempts++;
                hfLogger.error("Error with model", error instanceof Error ? error : new Error(String(error)), { model, attempt: attempts });

                if (attempts < maxAttempts) {
                    const backoff = Math.pow(2, attempts - 1) * 1000;
                    hfLogger.debug("Retrying with backoff", { backoffMs: backoff });
                    await new Promise(resolve => setTimeout(resolve, backoff));
                } else {
                    hfLogger.warn("Model exhausted, moving to next", { model });
                }
            }
        }
    }

    hfLogger.error("All models unavailable");
    throw new Error("All Hugging Face models are currently unavailable OR rate-limited.");
}
