import { NextRequest, NextResponse } from "next/server";
import { getUserOfferById } from "@/lib/api/offers";

/**
 * GET /api/user/offer/[id]
 * Returns the full enriched offer detail (with listing metadata merged in).
 * This is the same data that the server-side page.tsx uses, returned as JSON
 * so the client can navigate between offers without a page reload.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        // getUserOfferById merges detail + listing data (shopName, category, location, etc.)
        const result = await getUserOfferById(id);

        if (!result.success || !result.data) {
            return NextResponse.json(
                { success: false, error: "Offer not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (error: any) {
        console.error("API error in /api/user/offer/[id]:", error);
        const isProd = process.env.NODE_ENV === "production";
        return NextResponse.json(
            { success: false, error: isProd ? "Failed to fetch offer details" : (error?.message || "Failed to fetch offer details") },
            { status: 500 }
        );
    }
}

