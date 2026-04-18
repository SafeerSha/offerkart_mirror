import { Suspense } from "react";
import { getPaginatedOffers, getFeaturedOffers } from "@/lib/api/offers";
import OffersClient from "@/components/offers/OffersClient";

// ISR: Revalidate every 5 minutes
export const revalidate = 300;

export default async function OffersPage() {
    // Fetch initial data on the server for ISR
    const [offersResult, featuredOffersResult] = await Promise.all([
        getPaginatedOffers(1, 8),
        getFeaturedOffers()
    ]);

    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50/50 pt-28 flex items-center justify-center">Loading...</div>}>
            <OffersClient
                initialOffers={offersResult.data}
                initialFeaturedShops={featuredOffersResult.success ? featuredOffersResult.data : []}
                hasMoreInitial={offersResult.hasMore}
            />
        </Suspense>
    );
}
