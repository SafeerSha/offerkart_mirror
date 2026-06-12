import { NextResponse } from "next/server";
import { getAllUserOffers } from "@/lib/api/offers";

/**
 * GET /api/user/offer/ids
 * Returns a lightweight ordered list of all offer IDs for client-side prev/next navigation.
 */
export async function GET() {
    try {
        const result = await getAllUserOffers({ limit: 200 });
        const ids = result.success && Array.isArray(result.data)
            ? result.data.map((o) => o.id)
            : [];

        return NextResponse.json({ success: true, ids });
    } catch (error: any) {
        console.error("API error in /api/user/offer/ids:", error);
        return NextResponse.json(
            { success: false, ids: [], error: error.message || "Failed to fetch offer IDs" },
            { status: 500 }
        );
    }
}
