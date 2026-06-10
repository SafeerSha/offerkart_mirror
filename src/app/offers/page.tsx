import { Suspense } from "react";
import { getPaginatedOffers, getFeaturedOffers } from "@/lib/api/offers";
import OffersClient from "@/components/offers/OffersClient";
import { CACHE_TAGS } from "@/lib/api/cache-tags";

export const revalidate = false;

export default async function OffersPage(props: {
    searchParams?: Promise<{ shopId?: string }> | { shopId?: string };
}) {
    const resolvedParams = props.searchParams
        ? ("then" in props.searchParams ? await props.searchParams : props.searchParams)
        : {};
    const shopId = resolvedParams?.shopId ? String(resolvedParams.shopId) : undefined;

    const [offersResult, featuredOffersResult] = await Promise.all([
        getPaginatedOffers(1, 8, { shopId }, { next: { tags: [CACHE_TAGS.OFFERS] } }),
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
