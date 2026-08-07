export interface AIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export async function askAI<T = any>(
    text: string,
    role: string,
    image?: string
): Promise<AIResponse<T>> {
    return {
        success: false,
        error: 'AI Vision image extraction has been removed.',
    };
}
