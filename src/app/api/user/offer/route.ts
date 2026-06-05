import { NextRequest, NextResponse } from "next/server";
import { getUserOffersList } from "@/lib/api/userOffersService";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const shopId = searchParams.get("shopId") || undefined;
        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("limit")) || 8;
        const lat = searchParams.get("latitude");
        const lng = searchParams.get("longitude");
        const sort = searchParams.get("sort") || "latest";

        const latitude = lat ? Number(lat) : undefined;
        const longitude = lng ? Number(lng) : undefined;

        const result = await getUserOffersList({
            shopId,
            page,
            limit,
            latitude,
            longitude,
            sort
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("API error in /api/user/offer:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch offers" },
            { status: 500 }
        );
    }
}
