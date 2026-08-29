import { config } from "../config";
import { z } from "zod";
import { ApiResponse } from "../types/api";
import { sanitizePayload } from "../security";

const IS_SERVER = typeof window === "undefined";
const BACKEND_PROXY_PREFIX = config.api.proxyPrefix;
const UPSTREAM_API_BASE_URL = config.api.upstreamBaseUrl;

const PUBLIC_PREFIXES = ["user/offer", "user/analytics", "business/category"];
const PUBLIC_PATHS = new Set([
    "auth/login",
    "auth/register",
    "auth/resend-email-otp",
    "auth/verify-email-otp",
    "business/industry",
]);

function isPublicPath(pathname: string) {
    return PUBLIC_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix + "/") || pathname.startsWith(prefix + "?")) || PUBLIC_PATHS.has(pathname);
}

type NextCacheOptions = { tags?: string[]; revalidate?: number | false };
export type BackendRequestOptions = RequestInit & {
    tags?: string[];
    revalidate?: number | false;
    next?: NextCacheOptions;
};

function coerceAccessToken(session: Record<string, unknown> | null | undefined): string | undefined {
    const maybe = session?.user;
    if (maybe && typeof maybe === "object" && "accessToken" in maybe) {
        return (maybe as { accessToken?: string }).accessToken;
    }
    return session?.accessToken as string | undefined;
}

function coerceShopId(session: Record<string, unknown> | null | undefined): string | undefined {
    return session?.shopId as string | undefined;
}


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
        options: BackendRequestOptions = {},
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
            const isPublic = isPublicPath(cleanPath);
            
            // For server-side OR public paths on client-side, hit upstream directly.
            // Only use the Next.js proxy for authenticated client-side requests.
            const url = (IS_SERVER || isPublic)
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

            // 4. Handle Server-Side and Client-Side Authentication
            if (!isPublicPath(cleanPath)) {
                if (IS_SERVER) {
                    // On the server, we need to manually fetch the session and attach the token
                    // We import these dynamically to avoid bundling server-only code in the client
                    const { getServerSession } = await import("next-auth/next");
                    const { authOptions } = await import("@/lib/auth");
                    
                    let session: Record<string, unknown> | null = null;
                    try {
                        // Wrap in try-catch to avoid "Dynamic server usage" errors during static build
                        const serverSession = await getServerSession(authOptions);
                        session = serverSession as Record<string, unknown> | null;
                    } catch (error) {
                        // Silently fail during build/static generation phase
                    }

                    if (session) {
                        const accessToken = coerceAccessToken(session);
                        if (accessToken && !headers.has("Authorization")) {
                            headers.set("Authorization", `Bearer ${accessToken}`);
                        }
                        
                        const shopId = coerceShopId(session);
                        if (shopId && !headers.has("shopId")) {
                            headers.set("shopId", shopId);
                        }
                    }
                } else {
                    // On the client, we retrieve the token from the NextAuth session
                    try {
                        const { getSession } = await import("next-auth/react");
                        const session = await getSession();
                        if (session) {
                            const accessToken = coerceAccessToken(session as unknown as Record<string, unknown>);
                            if (accessToken && !headers.has("Authorization")) {
                                headers.set("Authorization", `Bearer ${accessToken}`);
                            }
                            
                            const shopId = coerceShopId(session as unknown as Record<string, unknown>);
                            if (shopId && !headers.has("shopId")) {
                                headers.set("shopId", shopId);
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching client session in backend client:", error);
                    }
                }
            }

            // 5. Execute Fetch
            // Normalize Next.js cache options and pass them through on the server only.
            const { next: nextCacheOptions, tags, revalidate, ...restOptions } = options;
            const normalizedNextCacheOptions = nextCacheOptions ?? ((tags || revalidate !== undefined)
                ? { tags, revalidate }
                : undefined);
            const fetchOptions: RequestInit & { next?: NextCacheOptions } = {
                ...restOptions,
                body,
                headers,
            };
            if (IS_SERVER && normalizedNextCacheOptions) {
                fetchOptions.next = normalizedNextCacheOptions;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            // 6. Handle Global Intercepts by Status (e.g. 401)
            // We do this BEFORE parsing JSON to handle empty 401 bodies
            if (response.status === 401 && !IS_SERVER && !isPublicPath(cleanPath)) {
                const { signOut } = await import("next-auth/react");
                signOut({ callbackUrl: "/login" });
                return {
                    success: false,
                    error: "Session expired. Redirecting to login...",
                };
            }

            // 7. Safe Body Extraction
            let result: unknown = {};
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
                if (result && typeof result === "object" && !Array.isArray(result)) {
                    const obj = result as Record<string, unknown>;
                    return {
                        success: false,
                        error: (obj.message as string) || (obj.error as string) || `Request failed with status ${response.status}`,
                        message: (obj.message as string) || undefined,
                        data: (obj.data !== undefined ? obj.data : obj) as T,
                    };
                }
                return {
                    success: false,
                    error: `Request failed with status ${response.status}`,
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

            const isPayloadSuccess = (result && typeof result === "object" && "success" in result)
                ? Boolean((result as Record<string, unknown>).success)
                : true;

            const resData = (result && typeof result === "object" && "data" in result)
                ? (result as Record<string, unknown>).data
                : result;

            return {
                success: isPayloadSuccess,
                data: (resData !== undefined ? resData : result) as T,
                message: result && typeof result === "object" && !Array.isArray(result) ? (result as Record<string, unknown>).message as string | undefined : undefined,
                error: !isPayloadSuccess && result && typeof result === "object"
                    ? ((result as Record<string, unknown>).message as string || (result as Record<string, unknown>).error as string)
                    : undefined,
            };

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Network error or server unreachable";

            const isNetworkFailure = error instanceof TypeError &&
                (error.message === "Failed to fetch" ||
                 error.message.includes("NetworkError") ||
                 error.message.includes("fetch"));

            if (!isNetworkFailure) {
                console.error("Backend Request Failure:", error);
            }

            return {
                success: false,
                error: message,
            };
        }
    },

    get<T>(path: string, options?: Omit<BackendRequestOptions, "method">) {
        return this.request<T>(path, { ...options, method: "GET" });
    },

    post<T>(path: string, body?: unknown, options?: Omit<BackendRequestOptions, "method" | "body">) {
        return this.request<T>(path, { ...options, method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) });
    },

    put<T>(path: string, body?: unknown, options?: Omit<BackendRequestOptions, "method" | "body">) {
        return this.request<T>(path, { ...options, method: "PUT", body: body instanceof FormData ? body : JSON.stringify(body) });
    },

    patch<T>(path: string, body?: unknown, options?: Omit<BackendRequestOptions, "method" | "body">) {
        return this.request<T>(path, { ...options, method: "PATCH", body: body instanceof FormData ? body : JSON.stringify(body) });
    },

    delete<T>(path: string, options?: Omit<BackendRequestOptions, "method">) {
        return this.request<T>(path, { ...options, method: "DELETE" });
    },
};

/**
 * Utility to unwrap doubly-nested API envelopes.
 * 
 * Many backend responses come wrapped as:
 *   { success: true, data: { success: true, data: { ...actual data } } }
 * 
 * This function peels one layer if it detects a nested envelope, returning
 * the innermost data object. Safe to call on already-unwrapped data.
 */
export function unwrapApiEnvelope<T = any>(data: unknown): T {
    if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        "data" in data &&
        typeof (data as Record<string, unknown>).data === "object" &&
        (data as Record<string, unknown>).data !== null &&
        !Array.isArray((data as Record<string, unknown>).data)
    ) {
        // Check if the inner object looks like another API envelope (has success/data)
        const inner = (data as Record<string, unknown>).data as Record<string, unknown>;
        if ("success" in inner || "data" in inner) {
            return inner as T;
        }
    }
    return data as T;
}
