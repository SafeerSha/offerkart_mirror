import { ApiResponse } from "../types/api";
import { sanitizePayload } from "../security";
import { getSession } from "next-auth/react";

export async function apiClient<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        // Automatically sanitize request body if it's a JSON string
        let body = options.body;
        if (typeof body === "string") {
            try {
                const parsed = JSON.parse(body);
                body = JSON.stringify(sanitizePayload(parsed));
            } catch (e) {
                // If not valid JSON, sanitize as a string
                body = sanitizePayload(body);
            }
        }

        // Automatically attach Bearer token if it exists (from NextAuth)
        const session = await getSession();
        const tokenValue = (session as any)?.accessToken;

        console.log(`[API Request] ${options.method || 'GET'} ${endpoint}`, {
            hasToken: !!tokenValue,
            isFormData: body instanceof FormData
        });

        const isFormData = body instanceof FormData;

        const response = await fetch(endpoint, {
            ...options,
            body,
            headers: {
                ...(isFormData ? {} : { "Content-Type": "application/json" }),
                "Accept": "application/json",
                ...(tokenValue ? { "Authorization": `Bearer ${tokenValue}` } : {}),
                ...options.headers,
            },
        });

        console.log(`[API Response] ${response.status} ${response.statusText} from ${endpoint}`);

        const result = await response.json();

        if (!response.ok) {
            console.warn(`[API Response Error] ${response.status}:`, result);
            return {
                success: false,
                error: result.message || result.error || "An error occurred during the request",
            };
        }

        return {
            success: true,
            data: result,
            message: result.message,
        };
    } catch (error: any) {
        console.error("API Request Failure:", error);
        return {
            success: false,
            error: error.message || "Network error or server unreachable",
        };
    }
}
