import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { config } from "@/lib/config.server";
import { CACHE_TAGS } from "@/lib/api/cache-tags";
import { checkRateLimit } from "@/lib/api/rate-limiter";


const UPSTREAM_API_BASE_URL = config.api.upstreamBaseUrl;

const PUBLIC_PATHS = new Set([
    "business/auth/login",
    "business/auth/register",
]);

function isPublicPath(pathname: string) {
    return pathname.startsWith("user/") || PUBLIC_PATHS.has(pathname);
}

function extractEntityId(upstreamPath: string) {
    const parts = upstreamPath.split("/");
    const reservedSegments = new Set(["business", "offer", "product", "offerproduct", "shop", "inactivate"]);
    return parts.find((part) => part && !reservedSegments.has(part));
}

function filterRequestHeaders(request: NextRequest) {
    const headers = new Headers();
    const shopId = request.headers.get("shopId");

    // Forward all headers except sensitive ones that should not be proxied
    request.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (!['host', 'cookie', 'authorization', 'content-length'].includes(lowerKey)) {
            headers.set(key, value);
        }
    });

    // Ensure shopId is forwarded if present
    if (shopId) {
        headers.set("shopId", shopId);
    }

    return headers;
}

async function readRequestBody(request: NextRequest) {
    const method = request.method.toUpperCase();
    if (method === "GET" || method === "HEAD") {
        return undefined;
    }

    const contentType = request.headers.get("content-type") || "";

    if (
        contentType.includes("application/json") ||
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.startsWith("text/")
    ) {
        return await request.text();
    }

    return await request.arrayBuffer();
}

async function handleProxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    // 1. Check Rate Limit based on IP
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success, limit, remaining, reset } = await checkRateLimit(ip);

    if (!success) {
        return new NextResponse("Too Many Requests", {
            status: 429,
            headers: {
                "X-RateLimit-Limit": limit.toString(),
                "X-RateLimit-Remaining": remaining.toString(),
                "X-RateLimit-Reset": reset.toString(),
            },
        });
    }

    const { path } = await context.params;
    const upstreamPath = path.join("/");
    const upstreamUrl = new URL(`${UPSTREAM_API_BASE_URL}/${upstreamPath}`);
    upstreamUrl.search = request.nextUrl.search;

    const body = await readRequestBody(request);
    const headers = filterRequestHeaders(request);

    if (!isPublicPath(upstreamPath)) {
        const token = await getToken({ req: request, secret: config.auth.secret });
        let accessToken = typeof token?.accessToken === "string" ? token.accessToken : null;

        if (!accessToken) {
            const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
            if (authHeader && authHeader.startsWith("Bearer ")) {
                accessToken = authHeader.substring(7);
            }
        }

        if (!accessToken) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { 
                    status: 401,
                    headers: { "WWW-Authenticate": "Bearer realm=\"api\"" }
                }
            );
        }

        headers.set("authorization", `Bearer ${accessToken}`);
    }

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
        method: request.method,
        headers,
        body,
        cache: "no-store",
    });

    const responseHeaders = new Headers();
    const responseContentType = upstreamResponse.headers.get("content-type");

    if (responseContentType) {
        responseHeaders.set("content-type", responseContentType);
    }

    // Automate dynamic on-demand ISR revalidations on successful merchant mutations
    if (upstreamResponse.ok && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase())) {
        try {
            const { revalidateTag } = await import("next/cache");
            
            if (upstreamPath.startsWith("business/product") || upstreamPath.startsWith("business/offerproduct")) {
                revalidateTag(CACHE_TAGS.PRODUCTS, "max");

                const id = extractEntityId(upstreamPath);
                if (id) {
                    revalidateTag(CACHE_TAGS.PRODUCT(id), "max");
                }
            } else if (upstreamPath.startsWith("business/offer")) {
                revalidateTag(CACHE_TAGS.HOME, "max");
                revalidateTag(CACHE_TAGS.OFFERS, "max");

                const id = extractEntityId(upstreamPath);
                if (id) {
                    revalidateTag(CACHE_TAGS.OFFER(id), "max");
                }
            } else if (upstreamPath.startsWith("business/shop")) {
                revalidateTag(CACHE_TAGS.HOME, "max");
                revalidateTag(CACHE_TAGS.SHOPS, "max");
            }
        } catch (revalError) {
            console.error("Dynamic tag revalidation failed inside proxy:", revalError);
        }
    }

    return new NextResponse(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
    });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, context);
}
