import { logger } from "@/lib/logger";
/**
 * Hugging Face Provider Utility
 * 
 * Implements strict model rotation, retry logic with exponential backoff,
 * and safe error handling as per the integration guidelines.
 */

export const HF_MODELS = [
    "google/gemma-2-9b-it",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "meta-llama/Meta-Llama-3-8B-Instruct",
    "microsoft/Phi-3-mini-4k-instruct",
];

const REQUEST_TIMEOUT_MS = 60000; // 60 second timeout

interface HFResponse {
    content: string;
    model: string;
}

/**
 * Safely extracts error message from various error types
 */
function getErrorMessage(error: any): string {
    if (!error) return "Unknown error";
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        return error.message || error.error || JSON.stringify(error);
    }
    return String(error);
}

export async function callHuggingFace(messages: any[]): Promise<HFResponse> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const endpoint = "https://router.huggingface.co/v1/chat/completions";

    if (!apiKey) {
        throw new Error("HUGGINGFACE_API_KEY is not defined in environment variables.");
    }

    logger.log(`[HuggingFace] Starting request with ${HF_MODELS.length} models in rotation.`);

    for (const model of HF_MODELS) {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
            
            try {
                logger.log(`[HuggingFace] CALLING ENDPOINT: ${endpoint} | MODEL: ${model} (Attempt ${attempts + 1}/3)`);
                
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: messages,
                        max_tokens: 1000,
                    }),
                    signal: controller.signal,
                });

                const isJson = response.headers.get("content-type")?.includes("application/json");
                const data = isJson ? await response.json() : await response.text();

                // Safe error extraction for check
                const errMsg = getErrorMessage(data);
                const isRateLimited = response.status === 429 || 
                                    errMsg.toLowerCase().includes("rate") || 
                                    errMsg.toLowerCase().includes("limit");

                if (isRateLimited) {
                    logger.warn(`[HuggingFace] Rate limit hit for ${model}. skipping...`);
                    break; // Skip to next model immediately
                }

                if (!response.ok) {
                    throw new Error(errMsg || `HTTP error ${response.status}`);
                }

                if (typeof data !== 'object' || !data.choices?.[0]?.message?.content) {
                    logger.error("[HuggingFace] Invalid response format:", data);
                    throw new Error("Invalid response format from HF.");
                }

                logger.log(`[HuggingFace] Success with ${model}`);
                return {
                    content: data.choices[0].message.content,
                    model: model,
                };

            } catch (error: any) {
                clearTimeout(timeoutId);
                attempts++;
                const errMsg = getErrorMessage(error);
                logger.error(`[HuggingFace] Error with ${model}: ${errMsg}`);
                
                if (attempts < maxAttempts) {
                    const backoff = Math.pow(2, attempts - 1) * 1000;
                    logger.log(`[HuggingFace] Retrying in ${backoff}ms...`);
                    await new Promise(resolve => setTimeout(resolve, backoff));
                } else {
                    logger.warn(`[HuggingFace] ${model} exhausted. Moving to next.`);
                }
            }
        }
    }

    throw new Error("All Hugging Face models are currently unavailable OR rate-limited.");
}
