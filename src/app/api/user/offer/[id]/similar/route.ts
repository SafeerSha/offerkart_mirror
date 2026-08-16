import { NextRequest, NextResponse } from "next/server";
import { getUserOfferSimilar } from "@/lib/api/offers";

/**
 * GET /api/user/offer/[id]/similar
 * Returns similar offers for the given offer ID, optionally based on latitude/longitude.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const searchParams = request.nextUrl.searchParams;
        const lat = searchParams.get("latitude");
        const lng = searchParams.get("longitude");

        const latitude = lat ? Number(lat) : null;
        const longitude = lng ? Number(lng) : null;

        const result = await getUserOfferSimilar(id, { latitude, longitude });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || "Failed to fetch similar offers" },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (error: any) {
        console.error("API error in /api/user/offer/[id]/similar:", error);
        const isProd = process.env.NODE_ENV === "production";
        return NextResponse.json(
            { success: false, error: isProd ? "Failed to fetch similar offers" : (error?.message || "Failed to fetch similar offers") },
            { status: 500 }
        );
    }
}

