import { NextRequest, NextResponse } from "next/server";
import { getUserProductSimilar } from "@/lib/api/products";

/**
 * GET /api/user/offer/products/[id]/similar
 * Returns similar products for the given product ID, optionally based on latitude/longitude.
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

        const result = await getUserProductSimilar(id, { latitude, longitude });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || "Failed to fetch similar products" },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (error: any) {
        console.error("API error in /api/user/offer/products/[id]/similar:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch similar products" },
            { status: 500 }
        );
    }
}
