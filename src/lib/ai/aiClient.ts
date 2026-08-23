import { downscaleImage } from './imageDownscaler';

// --- Types ---

export interface ProductExtractionResult {
    productName: string;
    brand: string;
    description: string;
    oldPrice: number;
    offerPrice: number;
    discount: string;
    mainCategory: string;
    subcategories: string[];
}

export interface TokenUsage {
    promptTokens: number;
    candidateTokens: number;
    totalTokens: number;
    promptBreakdown?: {
        imageTokens: number;
        systemPromptTokens: number;
        userTextTokens: number;
        schemaOverheadTokens: number;
    };
}

export interface AIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    model?: string;
    tokenSavings?: number;
    executionTimeMs?: number;
    totalTimeMs?: number;
    usage?: TokenUsage;
}

// --- Client-Side Cache ---
const extractionCache = new Map<string, AIResponse<ProductExtractionResult>>();

function getCacheKey(base64DataUrl: string): string {
    // Generate a lightweight cache key from string length and key substrings
    return `${base64DataUrl.length}_${base64DataUrl.slice(0, 40)}_${base64DataUrl.slice(-40)}`;
}

// --- Constants ---
const REQUEST_TIMEOUT_MS = 90_000;
const DOWNSCALE_MAX_DIMENSION = 768; // Fits a single Gemini 768×768 tile (258 tokens)

// --- Public API ---

/**
 * Extracts structured product data from a cropped poster image using Gemini Vision.
 * Features:
 * - Client-side image downscaling (saves up to 90% vision tokens)
 * - In-memory result caching to eliminate redundant API calls
 * - Automatic retry with exponential backoff on the server
 *
 * @param base64DataUrl - The cropped image as a data URL (data:image/png;base64,...)
 * @param mimeType      - The MIME type of the image (e.g. "image/png")
 */
export async function extractProductFromImage(
    base64DataUrl: string,
    mimeType: string = 'image/png'
): Promise<AIResponse<ProductExtractionResult>> {
    // Check client-side cache first
    const cacheKey = getCacheKey(base64DataUrl);
    if (extractionCache.has(cacheKey)) {
        console.log('[Gemini AI Client] Cache hit for image extraction');
        return extractionCache.get(cacheKey)!;
    }

    console.log('[Gemini AI Client] 🚀 Starting Gemini AI extraction API call...');
    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        // 1. Downscale client-side to save tokens
        const downscaled = await downscaleImage(
            base64DataUrl,
            mimeType,
            DOWNSCALE_MAX_DIMENSION
        );

        console.log(`🖼️ [Gemini AI Client] Image Resolution Breakdown:`);
        console.log(` ├─ 📐 Original Cropped Area: ${downscaled.originalWidth}px × ${downscaled.originalHeight}px`);
        console.log(` └─ 📤 Resolution Sent to API: ${downscaled.width}px × ${downscaled.height}px (${downscaled.tokenSavings}% image token savings)`);

        // 2. Call the server endpoint
        const response = await fetch('/api/ai/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileData: downscaled.base64Data,
                mimeType: downscaled.mimeType,
                imageDimensions: {
                    originalWidth: downscaled.originalWidth,
                    originalHeight: downscaled.originalHeight,
                    sentWidth: downscaled.width,
                    sentHeight: downscaled.height,
                },
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;
            const durationSec = (duration / 1000).toFixed(2);
            const errorMsg = errorData.error || `Gemini extraction failed (HTTP ${response.status})`;
            console.error(`[Gemini AI Client] ❌ Extraction Call Failed in ${duration}ms (${durationSec}s):`, errorMsg);
            return {
                success: false,
                error: errorMsg,
                totalTimeMs: duration,
            };
        }

        const result = await response.json();
        clearTimeout(timeoutId);
        const totalDuration = Date.now() - startTime;
        const totalSec = (totalDuration / 1000).toFixed(2);
        const serverSec = result.executionTimeMs ? (result.executionTimeMs / 1000).toFixed(2) : undefined;

        console.log(`[Gemini AI Client] ✅ Extraction Call Completed Successfully!`);
        console.log(` ├─ 🟢 Server Gemini API Call Time: ${result.executionTimeMs ?? 'N/A'}ms (${serverSec ? serverSec + 's' : 'N/A'})`);
        if (result.usage) {
            console.log(` ├─ 📊 Exact Token Usage: ${result.usage.promptTokens} Input + ${result.usage.candidateTokens} Output = ${result.usage.totalTokens} Total Tokens`);
            if (result.usage.promptBreakdown) {
                const b = result.usage.promptBreakdown;
                console.log(` │   ├── 🖼️ Image Tokens: ${b.imageTokens} (1 tile @ 768px)`);
                console.log(` │   ├── 📝 System Rules: ~${b.systemPromptTokens} tokens`);
                console.log(` │   ├── 💬 User Text: ~${b.userTextTokens} tokens`);
                console.log(` │   └── 📋 JSON Schema & Output Formatting Overhead: ~${b.schemaOverheadTokens} tokens`);
            }
        }
        console.log(` └─ 🔵 Total Client Roundtrip Time: ${totalDuration}ms (${totalSec}s) [Model: ${result.model}]`);

        const aiResponse: AIResponse<ProductExtractionResult> = {
            success: true,
            data: result.data as ProductExtractionResult,
            model: result.model,
            tokenSavings: downscaled.tokenSavings,
            executionTimeMs: result.executionTimeMs,
            totalTimeMs: totalDuration,
            usage: result.usage,
        };

        // Store successful extraction in cache
        extractionCache.set(cacheKey, aiResponse);

        return aiResponse;
    } catch (error: any) {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        const durationSec = (duration / 1000).toFixed(2);
        console.error(`[Gemini AI Client] ❌ Extraction Call Failed in ${duration}ms (${durationSec}s):`, error);
        return {
            success: false,
            error:
                error.name === 'AbortError'
                    ? 'Extraction timed out. Please try again.'
                    : error.message || 'Failed to connect to AI service.',
            totalTimeMs: duration,
        };
    }
}
