import { getPaginatedOffers, getFeaturedShops } from "@/lib/api/offers";
import OffersClient from "@/components/offers/OffersClient";
import { CACHE_TAGS } from "@/lib/api/cache-tags";

export default async function OffersLoader({ searchParams }: {
    searchParams?: Promise<{ shopId?: string; industryId?: string; sort?: string; search?: string }> | { shopId?: string; industryId?: string; sort?: string; search?: string };
}) {
    const resolvedParams = searchParams
        ? ("then" in searchParams ? await searchParams : searchParams)
        : {};
    const shopId = resolvedParams?.shopId ? String(resolvedParams.shopId) : undefined;
    const industryIdParam = resolvedParams?.industryId ? String(resolvedParams.industryId) : undefined;
    const sort = resolvedParams?.sort ? String(resolvedParams.sort) : "latest";
    const search = resolvedParams?.search ? String(resolvedParams.search) : undefined;

    let industryId: number | undefined;
    if (industryIdParam && industryIdParam !== "All") {
        const parsed = Number(industryIdParam);
        if (!isNaN(parsed)) {
            industryId = parsed;
        }
    }

    const [offersResult, featuredShopsResult] = await Promise.all([
        getPaginatedOffers(1, 12, { shopId, industry: industryId, sort, search }, { next: { tags: [CACHE_TAGS.OFFERS] } }),
        getFeaturedShops()
    ]);
    return (
        <OffersClient
            initialOffers={offersResult.data}
            initialFeaturedShops={featuredShopsResult.success ? featuredShopsResult.data : []}
            hasMoreInitial={offersResult.hasMore}
        />
    );
}
