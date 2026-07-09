import { getPaginatedOffers, getFeaturedOffers } from "@/lib/api/offers";
import OffersClient from "@/components/offers/OffersClient";
import { CACHE_TAGS } from "@/lib/api/cache-tags";

export default async function OffersLoader({ searchParams }: {
    searchParams?: Promise<{ shopId?: string; industryId?: string; sort?: string }> | { shopId?: string; industryId?: string; sort?: string };
}) {
    const resolvedParams = searchParams
        ? ("then" in searchParams ? await searchParams : searchParams)
        : {};
    const shopId = resolvedParams?.shopId ? String(resolvedParams.shopId) : undefined;
    const industryIdParam = resolvedParams?.industryId ? String(resolvedParams.industryId) : undefined;
    const sort = resolvedParams?.sort ? String(resolvedParams.sort) : "latest";

    let industryId: number | undefined;
    if (industryIdParam && industryIdParam !== "All") {
        const parsed = Number(industryIdParam);
        if (!isNaN(parsed)) {
            industryId = parsed;
        }
    }

    const [offersResult, featuredOffersResult] = await Promise.all([
        getPaginatedOffers(1, 8, { shopId, industry: industryId, sort }, { next: { tags: [CACHE_TAGS.OFFERS] } }),
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
