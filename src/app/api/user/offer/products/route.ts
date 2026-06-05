import { NextRequest, NextResponse } from "next/server";
import { getUserOfferProducts } from "@/lib/api/userOffersService";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search") || undefined;
        const categoryId = searchParams.get("categoryId") || undefined;
        const shopId = searchParams.get("shopId") || undefined;
        const minPriceStr = searchParams.get("minPrice");
        const maxPriceStr = searchParams.get("maxPrice");
        const sort = searchParams.get("sort") || "newest";
        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("limit")) || 20;

        const minPrice = minPriceStr ? Number(minPriceStr) : undefined;
        const maxPrice = maxPriceStr ? Number(maxPriceStr) : undefined;

        const result = await getUserOfferProducts({
            search,
            categoryId,
            shopId,
            minPrice,
            maxPrice,
            sort,
            page,
            limit
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("API error in /api/user/offer/products:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch products" },
            { status: 500 }
        );
    }
}
