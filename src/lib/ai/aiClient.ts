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

export interface AIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    model?: string;
    tokenSavings?: number;
}

// --- Client-Side Cache ---
const extractionCache = new Map<string, AIResponse<ProductExtractionResult>>();

function getCacheKey(base64Data: string): string {
    // Generate a lightweight cache key from string length and key substrings
    return `${base64Data.length}_${base64Data.slice(0, 40)}_${base64Data.slice(-40)}`;
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
        return extractionCache.get(cacheKey)!;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        // 1. Downscale client-side to save tokens
        const downscaled = await downscaleImage(
            base64DataUrl,
            mimeType,
            DOWNSCALE_MAX_DIMENSION
        );

        // 2. Call the server endpoint
        const response = await fetch('/api/ai/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileData: downscaled.base64Data,
                mimeType: downscaled.mimeType,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            clearTimeout(timeoutId);
            return {
                success: false,
                error: errorData.error || `Gemini extraction failed (HTTP ${response.status})`,
            };
        }

        const result = await response.json();
        clearTimeout(timeoutId);

        const aiResponse: AIResponse<ProductExtractionResult> = {
            success: true,
            data: result.data as ProductExtractionResult,
            model: result.model,
            tokenSavings: downscaled.tokenSavings,
        };

        // Store successful extraction in cache
        extractionCache.set(cacheKey, aiResponse);

        return aiResponse;
    } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('[AI Client] Extraction error:', error);
        return {
            success: false,
            error:
                error.name === 'AbortError'
                    ? 'Extraction timed out. Please try again.'
                    : error.message || 'Failed to connect to AI service.',
        };
    }
}
