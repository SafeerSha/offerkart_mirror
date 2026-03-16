/**
 * Client-side AI helper
 * 
 * Sends text + role to the server-side AI proxy route.
 * The server handles the actual AI API call securely.
 */

export interface AIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

const REQUEST_TIMEOUT_MS = 30000; // 30 second timeout for client-side

/**
 * Ask the AI to analyze text with a specific role/prompt.
 * 
 * @param text - The text to analyze (e.g., raw OCR output)
 * @param role - The prompt role to use (e.g., 'product_extraction', 'category_suggestion')
 * @returns Parsed JSON response from the AI model
 */
export async function askAI<T = any>(
    text: string,
    role: string
): Promise<AIResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    
    try {
        const response = await fetch('/api/ai/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, role }),
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
        return {
            success: true,
            data: result.data as T,
        };
    } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('AI Client Error:', error);
        return {
            success: false,
            error: error.name === 'AbortError' 
                ? 'Request timed out. Please try again.' 
                : error.message || 'Failed to connect to AI service',
        };
    }
}
