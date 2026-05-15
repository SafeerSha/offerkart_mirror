import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { config } from "@/lib/config";


const UPSTREAM_API_BASE_URL = config.api.upstreamBaseUrl;

const PUBLIC_PATHS = new Set([
    "business/auth/login",
    "business/auth/register",
]);

function isPublicPath(pathname: string) {
    return pathname.startsWith("user/") || PUBLIC_PATHS.has(pathname);
}

function filterRequestHeaders(request: NextRequest, hasBody: boolean) {
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
    const { path } = await context.params;
    const upstreamPath = path.join("/");
    const upstreamUrl = new URL(`${UPSTREAM_API_BASE_URL}/${upstreamPath}`);
    upstreamUrl.search = request.nextUrl.search;

    const body = await readRequestBody(request);
    const headers = filterRequestHeaders(request, body !== undefined);

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
