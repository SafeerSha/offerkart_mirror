import { NextRequest, NextResponse } from "next/server";
import { getUserOfferDetails } from "@/lib/api/userOffersService";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const result = await getUserOfferDetails(id);

        if (!result.success) {
            return NextResponse.json(result, { status: 404 });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("API error in /api/user/offer/[id]:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch offer details" },
            { status: 500 }
        );
    }
}
