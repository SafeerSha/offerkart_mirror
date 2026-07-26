import { logger } from "@/lib/logger";

export interface AIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

const REQUEST_TIMEOUT_MS = 90000;

async function compressImageIfNeeded(dataUrl: string, maxDim = 800, quality = 0.7): Promise<string> {
    if (typeof window === 'undefined' || !dataUrl || !dataUrl.startsWith('data:image')) {
        return dataUrl;
    }
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                let { width, height } = img;
                if (width <= maxDim && height <= maxDim && dataUrl.length < 200000) {
                    return resolve(dataUrl);
                }
                if (width > height) {
                    if (width > maxDim) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    }
                } else {
                    if (height > maxDim) {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(dataUrl);
                ctx.drawImage(img, 0, 0, width, height);
                const compressed = canvas.toDataURL('image/jpeg', quality);
                resolve(compressed);
            } catch (e) {
                resolve(dataUrl);
            }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

export function askAI<T = any>(
    text: string,
    role: string,
    image?: string
): Promise<AIResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const imagePromise = image ? compressImageIfNeeded(image) : Promise.resolve(undefined);

    return imagePromise
        .then((processedImage) => {
            const payload = processedImage ? { text, role, image: processedImage } : { text, role };

            return fetch('/api/ai/vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
        })
        .then((response) => {
            if (!response.ok) {
                return response.json().catch(() => ({})).then((errorData) => {
                    return {
                        success: false,
                        error: errorData.error || `AI request failed with status ${response.status}`,
                    };
                });
            }

            return response.json().then((result) => {
                clearTimeout(timeoutId);
                return { success: true, data: result.data as T };
            });
        })
        .catch((error: any) => {
            clearTimeout(timeoutId);
            logger.error('AI Client Error:', error);
            return {
                success: false,
                error: error.name === 'AbortError'
                    ? 'Request timed out. Please try again.'
                    : error.message || 'Failed to connect to AI service',
            };
        });
}
