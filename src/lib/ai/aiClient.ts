import { logger } from "@/lib/logger";

export interface AIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

const REQUEST_TIMEOUT_MS = 30000;

export async function askAI<T = any>(
    text: string,
    role: string,
    image?: string
): Promise<AIResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const payload = image ? { text, role, image } : { text, role };
        const response = await fetch('/api/ai/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `AI request failed with status ${response.status}`,
            };
        }

        const result = await response.json();
        return { success: true, data: result.data as T };
    } catch (error: any) {
        clearTimeout(timeoutId);
        logger.error('AI Client Error:', error);
        return {
            success: false,
            error: error.name === 'AbortError'
                ? 'Request timed out. Please try again.'
                : error.message || 'Failed to connect to AI service',
        };
    }
}
