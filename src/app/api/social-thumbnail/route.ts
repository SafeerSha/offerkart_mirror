import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const postId = searchParams.get("postId");
    const platform = (searchParams.get("platform") || "instagram").toLowerCase();
    const size = searchParams.get("size") || "l";

    if (!postId && !searchParams.get("url")) {
        return NextResponse.json({ error: "Missing postId or url parameter" }, { status: 400 });
    }

    let targetPostId = postId;
    if (!targetPostId) {
        const rawUrl = searchParams.get("url") || "";
        const match = rawUrl.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
        targetPostId = match ? match[1] : null;
    }

    if (!targetPostId) {
        return NextResponse.json({ error: "Invalid Instagram post ID" }, { status: 400 });
    }

    if (platform === "instagram") {
        try {
            const instagramMediaUrl = `https://www.instagram.com/p/${targetPostId}/media/?size=${size}`;
            
            const response = await fetch(instagramMediaUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                },
                redirect: "follow",
            });

            if (!response.ok) {
                return NextResponse.json(
                    { error: `Failed to fetch thumbnail: ${response.statusText}` },
                    { status: response.status }
                );
            }

            const contentType = response.headers.get("content-type") || "image/jpeg";
            if (!contentType.startsWith("image/")) {
                return NextResponse.json(
                    { error: "Upstream response is not an image" },
                    { status: 502 }
                );
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            return new NextResponse(buffer, {
                status: 200,
                headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        } catch (error: any) {
            console.error("[social-thumbnail] Error fetching Instagram thumbnail:", error);
            return NextResponse.json(
                { error: error?.message || "Internal server error" },
                { status: 500 }
            );
        }
    }

    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
}
