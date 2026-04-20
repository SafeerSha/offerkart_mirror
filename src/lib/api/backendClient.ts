import { config } from "../config";
import { z } from "zod";
import { ApiResponse } from "../types/api";
import { sanitizePayload } from "../security";


const IS_SERVER = typeof window === "undefined";
const BACKEND_PROXY_PREFIX = config.api.proxyPrefix;
const UPSTREAM_API_BASE_URL = config.api.upstreamBaseUrl;


/**
 * Centralized Backend Client
 * 
 * Automatically handles:
 * - Environment specific base URLs (Proxy on client, direct on server)
 * - Session/Token attachment (Server-side)
 * - Relative path prefixing
 * - Payload sanitization
 * - Global 401 handling
 */
export const backend = {
    async request<T>(
        path: string,
        options: RequestInit = {},
        schema?: z.ZodSchema<T>
    ): Promise<ApiResponse<T>> {

        try {
            // 1. Sanitize Body
            let body = options.body;
            if (typeof body === "string") {
                try {
                    const parsed = JSON.parse(body);
                    body = JSON.stringify(sanitizePayload(parsed));
                } catch (e) {
                    body = sanitizePayload(body);
                }
            }

            // 2. Resolve URL
            // Ensure path doesn't start with a slash to avoid double slashes
            const cleanPath = path.startsWith("/") ? path.slice(1) : path;
            const url = IS_SERVER
                ? `${UPSTREAM_API_BASE_URL}/${cleanPath}`
                : `${BACKEND_PROXY_PREFIX}/${cleanPath}`;

            // 3. Prepare Headers
            const headers = new Headers(options.headers || {});
            const isFormData = body instanceof FormData;

            if (!isFormData && body && !headers.has("Content-Type")) {
                headers.set("Content-Type", "application/json");
            }
            if (!headers.has("Accept")) {
                headers.set("Accept", "application/json");
            }

            // 4. Handle Server-Side Authentication
            if (IS_SERVER) {
                // On the server, we need to manually fetch the session and attach the token
                // We import these dynamically to avoid bundling server-only code in the client
                const { getServerSession } = await import("next-auth/next");
                const { authOptions } = await import("@/lib/auth");
                
                let session = null;
                try {
                    // Wrap in try-catch to avoid "Dynamic server usage" errors during static build
                    session = await getServerSession(authOptions);
                } catch (error) {
                    // Silently fail during build/static generation phase
                }

                if (session) {
                    const accessToken = (session as any)?.accessToken;
                    if (accessToken && !headers.has("Authorization")) {
                        headers.set("Authorization", `Bearer ${accessToken}`);
                    }
                    
                    const shopId = (session as any)?.shopId;
                    if (shopId && !headers.has("shopId")) {
                        headers.set("shopId", shopId);
                    }
                }
            }
            // Note: On the client, we rely on http-only cookies sent to our local proxy route
            // which handles its own session verification.

            // 5. Execute Fetch
            const response = await fetch(url, {
                ...options,
                body,
                headers,
            });

            // 6. Handle Global Intercepts by Status (e.g. 401)
            // We do this BEFORE parsing JSON to handle empty 401 bodies
            if (response.status === 401 && !IS_SERVER) {
                const { signOut } = await import("next-auth/react");
                signOut({ callbackUrl: "/login" });
                return {
                    success: false,
                    error: "Session expired. Redirecting to login...",
                };
            }

            // 7. Safe Body Extraction
            let result: any = {};
            const contentType = response.headers.get("content-type") || "";
            
            if (response.status !== 204 && contentType.includes("application/json")) {
                const text = await response.text();
                if (text) {
                    try {
                        result = JSON.parse(text);
                    } catch (e) {
                        console.error("[API JSON Parse Error]:", e, "Raw text:", text);
                        return {
                            success: false,
                            error: "Received an invalid JSON response from the server.",
                        };
                    }
                }
            }

            // 8. Handle non-OK statuses
            if (!response.ok) {
                return {
                    success: false,
                    error: result.message || result.error || `Request failed with status ${response.status}`,
                };
            }

            // 9. Validate with Zod if schema provided
            if (schema) {
                const validation = schema.safeParse(result);
                if (!validation.success) {
                    console.warn(`[API Validation Warning] ${path}:`, validation.error.format());
                    // In strict mode or production we might want to fail, but for now we just log
                }
            }

            return {
                success: true,
                data: result,
                message: result.message,
            };


        } catch (error: any) {
            console.error("Backend Request Failure:", error);
            return {
                success: false,
                error: error.message || "Network error or server unreachable",
            };
        }
    },

    get<T>(path: string, options?: Omit<RequestInit, "method">) {
        return this.request<T>(path, { ...options, method: "GET" });
    },

    post<T>(path: string, body?: any, options?: Omit<RequestInit, "method" | "body">) {
        return this.request<T>(path, { ...options, method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) });
    },

    put<T>(path: string, body?: any, options?: Omit<RequestInit, "method" | "body">) {
        return this.request<T>(path, { ...options, method: "PUT", body: body instanceof FormData ? body : JSON.stringify(body) });
    },

    patch<T>(path: string, body?: any, options?: Omit<RequestInit, "method" | "body">) {
        return this.request<T>(path, { ...options, method: "PATCH", body: body instanceof FormData ? body : JSON.stringify(body) });
    },

    delete<T>(path: string, options?: Omit<RequestInit, "method">) {
        return this.request<T>(path, { ...options, method: "DELETE" });
    },
};
