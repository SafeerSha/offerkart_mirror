// src/lib/ai/imageDownscaler.ts
// Client-side image downscaler to optimize Gemini Vision token usage.
// Gemini charges based on 768×768 pixel tiles (258 tokens per tile).
// Downscaling to 768px max dimension keeps cropped segments within 1 tile.

export interface DownscaleResult {
    base64Data: string;
    mimeType: string;
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
    originalTokens: number;
    newTokens: number;
    tokenSavings: number;
}

/**
 * Estimated text prompt tokens for system instructions and user request text (~130 tokens).
 */
export const ESTIMATED_PROMPT_SCHEMA_OVERHEAD_TOKENS = 130;

/**
 * Estimates Gemini Vision image tokens based on the 768×768 tile grid algorithm.
 * Note: This estimates the IMAGE portion of tokens (258 tokens per 768px tile).
 */
export function estimateGeminiTokens(width: number, height: number): number {
    if (width <= 0 || height <= 0) return 0;
    if (width <= 384 && height <= 384) return 258;

    let targetWidth = width;
    let targetHeight = height;
    const maxBBox = 2048;

    if (targetWidth > maxBBox || targetHeight > maxBBox) {
        if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * maxBBox) / targetWidth);
            targetWidth = maxBBox;
        } else {
            targetWidth = Math.round((targetWidth * maxBBox) / targetHeight);
            targetHeight = maxBBox;
        }
    }

    const xTiles = Math.ceil(targetWidth / 768);
    const yTiles = Math.ceil(targetHeight / 768);
    return xTiles * yTiles * 258;
}

/**
 * Downscales a base64-encoded image to fit within maxDimension while
 * maintaining aspect ratio. Returns a clean base64 string (no data: prefix).
 *
 * @param base64Data - The raw base64 string or data URL
 * @param mimeType   - e.g. "image/png" or "image/jpeg"
 * @param maxDimension - Target longest edge in px (768 recommended). null = no scaling.
 * @param quality    - JPEG quality 0-1 (default 0.85)
 */
export function downscaleImage(
    base64Data: string,
    mimeType: string,
    maxDimension: number | null = 768,
    quality: number = 0.85
): Promise<DownscaleResult> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") {
            const cleanBase64 = base64Data.includes(";base64,")
                ? base64Data.split(";base64,").pop() || ""
                : base64Data;
            return resolve({
                base64Data: cleanBase64,
                mimeType,
                width: 0,
                height: 0,
                originalWidth: 0,
                originalHeight: 0,
                originalTokens: 0,
                newTokens: 0,
                tokenSavings: 0,
            });
        }

        const img = new Image();
        const src = base64Data.startsWith("data:")
            ? base64Data
            : `data:${mimeType};base64,${base64Data}`;

        img.onload = () => {
            const originalWidth = img.width;
            const originalHeight = img.height;
            const originalTokens = estimateGeminiTokens(originalWidth, originalHeight);

            let targetWidth = originalWidth;
            let targetHeight = originalHeight;

            if (
                maxDimension !== null &&
                (originalWidth > maxDimension || originalHeight > maxDimension)
            ) {
                if (originalWidth > originalHeight) {
                    targetHeight = Math.round((originalHeight * maxDimension) / originalWidth);
                    targetWidth = maxDimension;
                } else {
                    targetWidth = Math.round((originalWidth * maxDimension) / originalHeight);
                    targetHeight = maxDimension;
                }
            }

            const newTokens = estimateGeminiTokens(targetWidth, targetHeight);
            const tokenSavings =
                originalTokens > 0
                    ? Math.max(0, Math.round(((originalTokens - newTokens) / originalTokens) * 100))
                    : 0;

            // No resize needed
            if (targetWidth === originalWidth && targetHeight === originalHeight) {
                const cleanBase64 = base64Data.includes(";base64,")
                    ? base64Data.split(";base64,").pop() || ""
                    : base64Data;

                resolve({
                    base64Data: cleanBase64,
                    mimeType,
                    width: originalWidth,
                    height: originalHeight,
                    originalWidth,
                    originalHeight,
                    originalTokens,
                    newTokens,
                    tokenSavings: 0,
                });
                return;
            }

            const canvas = document.createElement("canvas");
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                reject(new Error("Canvas 2D context unavailable"));
                return;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            const outputMime = mimeType === "image/png" ? "image/png" : "image/jpeg";
            const dataUrl = canvas.toDataURL(outputMime, quality);
            const cleanBase64 = dataUrl.split(";base64,").pop() || "";

            resolve({
                base64Data: cleanBase64,
                mimeType: outputMime,
                width: targetWidth,
                height: targetHeight,
                originalWidth,
                originalHeight,
                originalTokens,
                newTokens,
                tokenSavings,
            });
        };

        img.onerror = () => reject(new Error("Failed to load image for downscaling"));
        img.src = src;
    });
}
