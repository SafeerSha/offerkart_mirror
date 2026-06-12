import { getPaginatedOffers, getFeaturedOffers } from "@/lib/api/offers";
import OffersClient from "@/components/offers/OffersClient";
import { CACHE_TAGS } from "@/lib/api/cache-tags";

export default async function OffersLoader({ searchParams }: {
    searchParams?: Promise<{ shopId?: string }> | { shopId?: string };
}) {
    const resolvedParams = searchParams
        ? ("then" in searchParams ? await searchParams : searchParams)
        : {};
    const shopId = resolvedParams?.shopId ? String(resolvedParams.shopId) : undefined;

    const [offersResult, featuredOffersResult] = await Promise.all([
        getPaginatedOffers(1, 8, { shopId }, { next: { tags: [CACHE_TAGS.OFFERS] } }),
        getFeaturedOffers()
    ]);

    return (
        <OffersClient
            initialOffers={offersResult.data}
            initialFeaturedShops={featuredOffersResult.success ? featuredOffersResult.data : []}
            hasMoreInitial={offersResult.hasMore}
        />
    );
}
