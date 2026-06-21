import { NextRequest, NextResponse } from "next/server";
import { getGlobalSearch } from "@/lib/api/userOffersService";
import { SearchResponse } from "@/lib/types/search";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search") || "";

        const result: SearchResponse = await getGlobalSearch(search);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("API error in /api/user/offer/search:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to search offers and products" },
            { status: 500 }
        );
    }
}
