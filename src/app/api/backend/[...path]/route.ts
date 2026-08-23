import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { revalidateTag, revalidatePath } from "next/cache";
import { config } from "@/lib/config.server";
import { CACHE_TAGS } from "@/lib/api/cache-tags";
import { checkRateLimit } from "@/lib/api/rate-limiter";

const UPSTREAM_API_BASE_URL = config.api.upstreamBaseUrl;

const PUBLIC_PREFIXES = ["user/offer", "user/analytics", "business/category"];
const PUBLIC_PATHS = new Set([
    "auth/login",
    "auth/register",
    "auth/resend-email-otp",
    "auth/verify-email-otp",
    "business/industry",
]);

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/avif",
];

const IMAGE_MAGIC_SIGNATURES: { mime: string; bytes: number[] }[] = [
  { mime: "image/jpeg", bytes: [0xFF, 0xD8, 0xFF] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
  { mime: "image/bmp", bytes: [0x42, 0x4D] },
];

interface FilePart {
  contentType: string;
  data: Buffer;
}

function extractMultipartFileData(buffer: Buffer, boundary: string): FilePart[] {
  const parts: FilePart[] = [];
  const boundaryBytes = Buffer.from(`--${boundary}`);

  let searchStart = 0;
  while (searchStart < buffer.length) {
    const boundaryIdx = buffer.indexOf(boundaryBytes, searchStart);
    if (boundaryIdx === -1) break;

    if (
      boundaryIdx + boundaryBytes.length < buffer.length &&
      buffer[boundaryIdx + boundaryBytes.length] === 0x2D &&
      buffer[boundaryIdx + boundaryBytes.length + 1] === 0x2D
    ) {
      break;
    }

    const headersEndIdx = buffer.indexOf("\r\n\r\n", boundaryIdx);
    if (headersEndIdx === -1) break;

    const nextBoundaryIdx = buffer.indexOf(boundaryBytes, headersEndIdx);
    if (nextBoundaryIdx === -1) break;

    const headersSection = buffer.slice(boundaryIdx, headersEndIdx).toString("utf8");
    const contentTypeMatch = headersSection.match(/Content-Type:\s*([^\r\n]+)/i);
    const partContentType = contentTypeMatch ? contentTypeMatch[1].trim() : "application/octet-stream";

    const dataStart = headersEndIdx + 4;
    const dataEnd = nextBoundaryIdx > dataStart ? nextBoundaryIdx - 2 : nextBoundaryIdx;
    const fileData = buffer.slice(dataStart, dataEnd);

    if (fileData.length > 0) {
      parts.push({ contentType: partContentType, data: fileData });
    }

    searchStart = nextBoundaryIdx;
  }

  return parts;
}

function hasImageMagicBytes(data: Buffer, declaredType: string): boolean {
  const baseType = declaredType.split(";")[0].trim().toLowerCase();

  if (data.length < 4) return baseType.startsWith("image/");

  if (baseType === "image/jpeg" || baseType === "image/jpg") {
    return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }

  if (baseType === "image/png") {
    return (
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47 &&
      data[4] === 0x0d &&
      data[5] === 0x0a &&
      data[6] === 0x1a &&
      data[7] === 0x0a
    );
  }

  if (baseType === "image/gif") {
    return (
      (data[0] === 0x47 &&
        data[1] === 0x49 &&
        data[2] === 0x46 &&
        data[3] === 0x38 &&
        data[4] === 0x37 &&
        data[5] === 0x61) ||
      (data[0] === 0x47 &&
        data[1] === 0x49 &&
        data[2] === 0x46 &&
        data[3] === 0x38 &&
        data[4] === 0x39 &&
        data[5] === 0x61)
    );
  }

  if (baseType === "image/webp") {
    return (
      data.length >= 12 &&
      data[0] === 0x52 &&
      data[1] === 0x49 &&
      data[2] === 0x46 &&
      data[3] === 0x46 &&
      data[8] === 0x57 &&
      data[9] === 0x45 &&
      data[10] === 0x42 &&
      data[11] === 0x50
    );
  }

  if (baseType === "image/bmp") {
    return data[0] === 0x42 && data[1] === 0x4d;
  }

  if (baseType === "image/svg+xml") {
    const text = data.toString("utf8", 0, Math.min(data.length, 100)).trim().toLowerCase();
    return text.startsWith("<?xml") || text.startsWith("<svg");
  }

  if (baseType === "image/avif" || baseType === "image/heif" || baseType === "image/heic") {
    return (
      data.length >= 12 &&
      data[4] === 0x66 &&
      data[5] === 0x74 &&
      data[6] === 0x79 &&
      data[7] === 0x70
    );
  }

  return baseType.startsWith("image/");
}

function validateImageUpload(contentType: string, body: ArrayBuffer | string | undefined): boolean {
  if (!body) return false;

  const buffer = typeof body === "string" ? Buffer.from(body) : Buffer.from(new Uint8Array(body));
  if (buffer.length === 0) return false;

  if (!contentType.includes("multipart/form-data")) {
    return false;
  }

  const boundaryMatch = contentType.match(/boundary=([^;]+)/);
  if (!boundaryMatch) return false;

  const boundary = boundaryMatch[1].trim().replace(/^"|"$/g, "");
  if (!boundary) return false;

  const fileParts = extractMultipartFileData(buffer, boundary);

  if (fileParts.length === 0) return false;

  for (const part of fileParts) {
    if (!hasImageMagicBytes(part.data, part.contentType)) {
      return false;
    }
  }

  return true;
}

function isPublicPath(pathname: string) {
    return PUBLIC_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix + "/") || pathname.startsWith(prefix + "?")) || PUBLIC_PATHS.has(pathname);
}

function extractEntityId(upstreamPath: string) {
    const parts = upstreamPath.split("/");
    const reservedSegments = new Set(["business", "offer", "product", "offerproduct", "shop", "inactivate"]);
    return parts.find((part) => part && !reservedSegments.has(part));
}

const DISALLOWED_HEADERS = new Set([
    'host',
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'cookie',
    'authorization',
    'content-length',
]);

function filterRequestHeaders(request: NextRequest) {
    const headers = new Headers();
    request.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (!DISALLOWED_HEADERS.has(lowerKey)) {
            headers.set(key, value);
        }
    });
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
    try {
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

        if (
          upstreamPath === "business/image/upload" &&
          ["POST", "PUT", "PATCH"].includes(request.method.toUpperCase())
        ) {
          const requestContentType = request.headers.get("content-type") || "";

          if (!body || Buffer.byteLength(body) > MAX_UPLOAD_BYTES) {
            return NextResponse.json(
              { error: "Upload exceeds maximum allowed size" },
              { status: 413 }
            );
          }

          if (!validateImageUpload(requestContentType, body)) {
            return NextResponse.json(
              { error: "Only valid image files are allowed" },
              { status: 415 }
            );
          }
        }

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

            // Security: Always override shopId from the JWT token, if present.
            const tokenShopId = (token as any)?.shopId ?? (token?.user as any)?.shopId;
            if (tokenShopId) {
                headers.set("shopId", String(tokenShopId));
            }
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
                if (upstreamPath.startsWith("business/product") || upstreamPath.startsWith("business/offerproduct")) {
                    revalidateTag(CACHE_TAGS.PRODUCTS, "max");
                    revalidatePath("/products");
                    revalidatePath("/");

                    const id = extractEntityId(upstreamPath);
                    if (id) {
                        revalidateTag(CACHE_TAGS.PRODUCT(id), "max");
                    }
                } else if (upstreamPath.startsWith("business/offer")) {
                    revalidateTag(CACHE_TAGS.HOME, "max");
                    revalidateTag(CACHE_TAGS.OFFERS, "max");
                    revalidateTag(CACHE_TAGS.PRODUCTS, "max");
                    revalidatePath("/offers");
                    revalidatePath("/products");
                    revalidatePath("/");

                    const id = extractEntityId(upstreamPath);
                    if (id) {
                        revalidateTag(CACHE_TAGS.OFFER(id), "max");
                    }
                } else if (upstreamPath.startsWith("business/shop")) {
                    revalidateTag(CACHE_TAGS.HOME, "max");
                    revalidateTag(CACHE_TAGS.SHOPS, "max");
                    revalidatePath("/");
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
    } catch (error) {
        console.error("Backend proxy error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: error instanceof Error ? error.message : "Proxy request failed" },
            { status: 500 }
        );
    }
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
