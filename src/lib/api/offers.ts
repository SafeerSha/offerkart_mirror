import { Offer, OfferPayload, MarkedItem } from "../types/offer";
import { Shops } from "../types/shop";
import { backend, BackendRequestOptions, unwrapApiEnvelope } from "./backendClient";
import { ENDPOINTS } from "./endpoints";
import { CACHE_TAGS } from "./cache-tags";
import { getUserOffersList, getUserOfferDetails } from "./userOffersService";

const DEFAULT_USER_OFFER_IMAGE = "/images/shop-registration-bg-light.png";
const DEFAULT_USER_OFFER_LIMIT = 12;
const MAX_PUBLIC_OFFER_PAGES = 20;

interface UserOfferApiItem {
    id: number;
    offerName?: string;
    title?: string;
    shopName?: string;
    shop_name?: string;
    shopLogo?: string | null;
    logo_url?: string | null;
    totalPosters?: number;
    defaultPoster?: string | null;
    image?: string | null;
    daysLeft?: number | null;
    distanceKm?: number | null;
    shopId?: number;
}

interface UserOfferApiResponse {
    data: UserOfferApiItem[];
    sort?: string;
    page?: number;
    limit?: number;
    count?: number;
    pagination?: {
        page?: number;
        limit?: number;
        count?: number;
        totalPages?: number;
    };
}

interface UserOfferQuery {
    page?: number;
    limit?: number;
    sort?: string;
    shopId?: string;
    latitude?: number | null;
    longitude?: number | null;
    industry?: number | string | null;
    search?: string;
}

interface PaginatedOffersResult {
    success: boolean;
    data: Offer[];
    page: number;
    limit: number;
    count: number;
    totalPages: number;
    hasMore: boolean;
    error?: string;
}

function normalizeOptionalQueryValue(value?: number | string | null) {
    if (value === undefined || value === null || value === "") return undefined;
    return String(value);
}

function formatDistance(distanceKm: number | null | undefined) {
    if (distanceKm === null || distanceKm === undefined || typeof distanceKm !== "number" || Number.isNaN(distanceKm)) {
        return "Location unavailable";
    }

    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m away`;
    }

    return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;
}

function formatDaysLeft(daysLeft: number | null | undefined) {
    if (daysLeft === null || daysLeft === undefined || Number.isNaN(daysLeft)) {
        return undefined;
    }

    if (daysLeft <= 0) {
        return "Ends today";
    }

    return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
}

function mapUserOfferToOffer(item: UserOfferApiItem): Offer {
    let primaryImage = item.defaultPoster || item.image || item.logo_url || item.shopLogo;
    if (!primaryImage || primaryImage === DEFAULT_USER_OFFER_IMAGE) {
        const shopLower = ((item.shopName || item.shop_name) || "").toLowerCase();
        if (shopLower.includes("coffee")) {
            primaryImage = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop";
        } else if (shopLower.includes("boutique") || shopLower.includes("bella")) {
            primaryImage = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop";
        } else if (shopLower.includes("spa") || shopLower.includes("wellness")) {
            primaryImage = "https://images.unsplash.com/photo-1544161515-4ae6ce6fe858?q=80&w=800&auto=format&fit=crop";
        } else if (shopLower.includes("bistro") || shopLower.includes("grand")) {
            primaryImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop";
        } else if (shopLower.includes("bakery") || shopLower.includes("sweet")) {
            primaryImage = "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop";
        } else if (shopLower.includes("tech") || shopLower.includes("gadget")) {
            primaryImage = "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=800&auto=format&fit=crop";
        } else if (shopLower.includes("gym") || shopLower.includes("fitlife") || shopLower.includes("fitness")) {
            primaryImage = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop";
        } else if (shopLower.includes("jewel") || shopLower.includes("diamond")) {
            primaryImage = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop";
        } else {
            const fallbackImages = [
                "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop", // shopping
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop", // clothing
                "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop", // pizza
                "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop", // bakery
                "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=800&auto=format&fit=crop", // tech
                "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop", // gym
                "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop", // jewelry
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop", // restaurant
            ];
            let hash = 0;
            const str = (item.shopName || item.shop_name) || String(item.id) || "shop";
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            const index = Math.abs(hash) % fallbackImages.length;
            primaryImage = fallbackImages[index];
        }
    }

    return {
        id: item.id,
        offerId: item.id,
        shopName: item.shopName || item.shop_name,
        offerName: item.offerName || item.title,
        title: item.offerName || item.title,
        image: primaryImage,
        posterSrc: primaryImage,
        posters: (item as any).posters || (primaryImage
            ? [
                {
                    id: `poster-${item.id}`,
                    posterSrc: primaryImage,
                    type: "just_post",
                    markedItems: [],
                },
            ]
            : []),
        category: "Offers",
        location: formatDistance(item.distanceKm),
        discount: formatDaysLeft(item.daysLeft),
        validFrom: (item as any).validFrom || undefined,
        validTo: (item as any).validTo || undefined,
        totalPosters: item.totalPosters,
        numberOfPosters: item.totalPosters,
        daysLeft: item.daysLeft,
        distanceKm: item.distanceKm,
        shopLogo: item.shopLogo || item.logo_url,
        description: `${item.offerName || item.title} from ${item.shopName || item.shop_name}`,
        isActive: true,
        status: "active",
        shopId: (item as any).shop?.id || item.shopId || (item as any).shop_id,
    };
}

async function fetchUserOffersPage({
    page = 1,
    limit = DEFAULT_USER_OFFER_LIMIT,
    sort = "latest",
    shopId,
    latitude,
    longitude,
    industry,
    search,
}: UserOfferQuery = {}, cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">): Promise<PaginatedOffersResult> {
    // Map frontend "popular" sort to upstream "top" sort
    const backendSort = sort === "popular" ? "top" : sort;
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: backendSort,
    });

    const normalizedShopId = normalizeOptionalQueryValue(shopId);
    if (normalizedShopId !== undefined) {
        params.set("shopId", normalizedShopId);
    }

    const normalizedLatitude = normalizeOptionalQueryValue(latitude);
    const normalizedLongitude = normalizeOptionalQueryValue(longitude);
    if (normalizedLatitude !== undefined) params.set("latitude", normalizedLatitude);
    if (normalizedLongitude !== undefined) params.set("longitude", normalizedLongitude);

    const normalizedIndustryId = normalizeOptionalQueryValue(industry);
    if (normalizedIndustryId !== undefined) {
        params.set("industryId", normalizedIndustryId);
    }

    const normalizedSearch = normalizeOptionalQueryValue(search);
    if (normalizedSearch !== undefined) {
        params.set("search", normalizedSearch);
    }

    let response: any;
    try {
        response = await backend.get<UserOfferApiResponse>(`${ENDPOINTS.USER_OFFER.BASE}?${params.toString()}`, {
            next: { tags: [CACHE_TAGS.OFFERS] },
            ...cacheOptions,
        });
    } catch (e) {
        console.error("fetchUserOffersPage backend call failed:", e);
        response = { success: false };
    }

    if (!response || !response.success || !response.data) {
        return {
            success: false,
            data: [],
            page,
            limit,
            count: 0,
            totalPages: 0,
            hasMore: false,
        };
    }

    const result = response.data;
    
    // Unwrap doubly-nested API envelope if present
    const apiData = unwrapApiEnvelope(result);

    const offersArray = Array.isArray(apiData.data) ? apiData.data : [];
    const mappedOffers = offersArray.map(mapUserOfferToOffer);
    
    // Extract pagination info from the nested pagination object if present
    const pagination = apiData.pagination || {};
    const pageNum = pagination.page || apiData.page || page;
    const limitNum = pagination.limit || apiData.limit || limit;
    const totalCount = typeof pagination.count === "number"
        ? pagination.count
        : (typeof apiData.count === "number" ? apiData.count : mappedOffers.length);

    const totalPages = typeof pagination.totalPages === "number"
        ? pagination.totalPages
        : Math.ceil(totalCount / limitNum);

    return {
        success: true,
        data: mappedOffers,
        page: pageNum,
        limit: limitNum,
        count: totalCount,
        totalPages: totalPages,
        hasMore: pageNum < totalPages,
    };
}

export async function createOffer(payload: OfferPayload, shopId: string) {
    return backend.post<Offer>(ENDPOINTS.OFFER.BASE, payload, {
        headers: { shopId },
    });
}

export async function updateOffer(id: string, payload: OfferPayload, shopId: string) {
    return backend.put<Offer>(ENDPOINTS.OFFER.DETAILS(id), payload, {
        headers: { shopId },
    });
}

export async function deleteOffer(id: string, shopId?: string) {
    return backend.delete<void>(ENDPOINTS.OFFER.DETAILS(id), {
        headers: shopId ? { shopId } : {},
    });
}

export async function getFeaturedOffers(
    latitude?: number | null,
    longitude?: number | null,
    cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">
) {
    try {
        const params = new URLSearchParams();
        if (latitude !== undefined && latitude !== null) {
            params.set("latitude", String(latitude));
        }
        if (longitude !== undefined && longitude !== null) {
            params.set("longitude", String(longitude));
        }
        const queryString = params.toString() ? `?${params.toString()}` : "";
        const response = await backend.get<any>(`${ENDPOINTS.USER_OFFER.FEATURED}${queryString}`, {
            next: { tags: [CACHE_TAGS.OFFERS, CACHE_TAGS.HOME], revalidate: 60 },
            ...cacheOptions,
        });

        if (response && response.success && response.data) {
            const apiData = response.data;
            const unwrapped = unwrapApiEnvelope(apiData);
            const offersArray = Array.isArray(unwrapped.data) ? unwrapped.data : (Array.isArray(unwrapped) ? unwrapped : []);

            const hasFilters = (latitude !== undefined && latitude !== null) || (longitude !== undefined && longitude !== null);
            if (offersArray.length > 0 || hasFilters) {
                return {
                    success: true,
                    data: offersArray.map((item: any) => ({
                        id: item.id,
                        name: item.shop_name || item.shopName || "Unknown Shop",
                        offer: item.title || item.offerName || "",
                        image: item.defaultPoster || item.image || DEFAULT_USER_OFFER_IMAGE,
                        shopLogo: item.logo_url || item.logoUrl || item.shop_logo || item.shopLogo || item.shop_logo_url || item.shopLogoUrl || item.logo || item.shop?.logo_url || item.shop?.logoUrl || item.shop?.logo || item.shop?.shop_logo || (item.shops && item.shops[0]?.logo_url) || null,
                        badge: "Featured",
                        rating: 4.5
                     }))
                };
            }
        }
    } catch (e) {
        console.error("Failed to fetch featured offers from new API:", e);
    }

    try {
        const offersResult = await fetchUserOffersPage({ page: 1, limit: 100 }, cacheOptions);
        const offers = (offersResult && offersResult.success && Array.isArray(offersResult.data))
            ? offersResult.data
            : [];

        if (offers.length > 0) {
            const shopsMap = new Map();
            for (const offer of offers) {
                if (offer.shopName && !shopsMap.has(offer.shopName)) {
                    shopsMap.set(offer.shopName, {
                        id: (offer as any).shop?.id || offer.shopId || (offer as any).shop_id || offer.id,
                        name: offer.shopName,
                        offer: offer.offerName,
                        image: offer.image || DEFAULT_USER_OFFER_IMAGE,
                        shopLogo: (offer as any).logo_url || (offer as any).logoUrl || (offer as any).shopLogo || (offer as any).shop_logo || (offer as any).shop_logo_url || (offer as any).shopLogoUrl || (offer as any).logo || (offer as any).shop?.logo_url || (offer as any).shop?.logoUrl || (offer as any).shop?.logo || (offer as any).shop?.shop_logo || null,
                        badge: "Featured",
                        rating: 4.5
                    });
                }
            }
            return {
                success: true,
                data: Array.from(shopsMap.values()).slice(0, 10),
            };
        }
    } catch (e) {
        console.error("Failed to fetch featured offers fallback:", e);
    }
    return {
        success: true,
        data: [],
    };
}

export async function getFeaturedShops(
    latitude?: number | null,
    longitude?: number | null,
    industryId?: number | string | null,
    cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">
): Promise<{ success: boolean; data: any[] }> {
    try {
        const params = new URLSearchParams();
        if (latitude !== undefined && latitude !== null) {
            params.set("latitude", String(latitude));
        }
        if (longitude !== undefined && longitude !== null) {
            params.set("longitude", String(longitude));
        }
        if (industryId !== undefined && industryId !== null && industryId !== "") {
            params.set("industryId", String(industryId));
        }
        const queryString = params.toString() ? `?${params.toString()}` : "";
        const response = await backend.get<any>(`${ENDPOINTS.USER_OFFER.SHOPS}${queryString}`, {
            next: { tags: [CACHE_TAGS.OFFERS, CACHE_TAGS.HOME], revalidate: 60 },
            ...cacheOptions,
        });
        if (response && response.success && response.data) {
            const apiData = response.data;
            const unwrapped = unwrapApiEnvelope(apiData);
            const shopsArray = Array.isArray(unwrapped.data) ? unwrapped.data : (Array.isArray(unwrapped) ? unwrapped : []);

            const hasFilters = (latitude !== undefined && latitude !== null) || (longitude !== undefined && longitude !== null) || (industryId !== undefined && industryId !== null && industryId !== "All");
            if (shopsArray.length > 0 || hasFilters) {
                return {
                    success: true,
                    data: shopsArray.map((shop: any) => {
                        return {
                            id: shop.id,
                            name: shop.shop_name,
                            logo: shop.logo_url || null
                        };
                    })
                };
            }
        }
    } catch (e) {
        console.error("Failed to fetch featured shops from API:", e);
    }

    try {
        const result = await fetchUserOffersPage({ page: 1, limit: 100 });
        if (result.success && result.data) {
            const offersMap = new Map();
            for (const offer of result.data) {
                if (offer.shopName && !offersMap.has(offer.shopName)) {
                    offersMap.set(offer.shopName, {
                        id: (offer as any).shop?.id || offer.shopId || (offer as any).shop_id || offer.id,
                        name: offer.shopName,
                        logo: offer.shopLogo || offer.image || DEFAULT_USER_OFFER_IMAGE
                    });
                }
            }
            return {
                success: true,
                data: Array.from(offersMap.values()).slice(0, 10),
            };
        }
    } catch (e) {
        console.error("Failed to fetch featured shops fallback:", e);
    }
    return {
        success: true,
        data: [],
    };
}

export interface BusinessOffersQuery {
    search?: string;
    page?: number;
    limit?: number;
    status?: "active" | "inactive" | string;
}

export async function getAllOffers(shopId?: string, query: BusinessOffersQuery = {}) {
    const params = new URLSearchParams();
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    if (query.search) params.set("search", query.search);
    if (query.status) params.set("status", query.status);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    return backend.get<any>(`${ENDPOINTS.OFFER.BASE}${queryString}`, {
        headers: shopId ? { shopId } : {},
    });
}

export async function getPaginatedOffers(
    page: number = 1,
    limit: number = DEFAULT_USER_OFFER_LIMIT,
    query: Omit<UserOfferQuery, "page" | "limit"> = {},
    cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">
) {
    return fetchUserOffersPage({
        page,
        limit,
        ...query,
    }, cacheOptions);
}

export async function getAllUserOffers(query: Omit<UserOfferQuery, "page"> = {}) {
    const limit = query.limit ?? 100;
    const allOffers: Offer[] = [];
    let page = 1;
    let hasMore = true;
    let error: string | undefined;

    while (hasMore && page <= MAX_PUBLIC_OFFER_PAGES) {
        const result = await fetchUserOffersPage({
            ...query,
            page,
            limit,
        });

        if (!result.success) {
            error = result.error;
            break;
        }

        allOffers.push(...result.data);
        hasMore = result.hasMore;
        page += 1;
    }

    return {
        success: !error || allOffers.length > 0,
        data: allOffers,
        error: error && allOffers.length === 0 ? error : undefined,
    };
}

function mapUserOfferDetailToOffer(detail: any, listingOffer?: Offer | null): Offer {
    const posters = (detail.posters || []).map((bp: any) => {
        const products = bp.products || [];
        const markedItems: MarkedItem[] = [];

        for (const prod of products) {
            const areas = prod.areas || [];
            for (const area of areas) {
                markedItems.push({
                    id: String(prod.id),
                    name: prod.displayName || "Product",
                    description: prod.displayDescription || "",
                    productImage: prod.imageUrl || "",
                    currency: "₹",
                    oldPrice: prod.originalPrice || prod.offerPrice || 0,
                    offerPrice: prod.offerPrice || 0,
                    x: area.xPercent ?? 0,
                    y: area.yPercent ?? 0,
                    width: area.widthPercent ?? 0,
                    height: area.heightPercent ?? 0,
                    mainCategory: prod.mainCategory || prod.main_category || prod.category || "",
                    subcategories: prod.subcategories || (typeof prod.subcategory === "string" ? [prod.subcategory] : (prod.subcategory?.name ? [prod.subcategory.name] : (prod.category?.level === 2 && prod.category?.name ? [prod.category.name] : []))),
                });
            }
        }

        return {
            id: String(bp.id),
            posterSrc: bp.imageUrl || bp.posterSrc || bp.image_url || bp.image || "",
            type: "just_post",
            markedItems,
            title: bp.title || undefined,
        };
    });

    const primaryImage = posters[0]?.posterSrc || detail.image_url || detail.imageUrl || detail.image || detail.posterSrc || listingOffer?.image || DEFAULT_USER_OFFER_IMAGE;
    
    // Fallback: If no posters were returned but we have an image, create one poster so it renders properly
    if (posters.length === 0 && primaryImage !== DEFAULT_USER_OFFER_IMAGE) {
        posters.push({
            id: String(detail.id),
            posterSrc: primaryImage,
            type: "just_post",
            markedItems: [],
            title: detail.title || detail.offerName || undefined,
        });
    }

    const branchNames = (detail.offerBranches || []).map((ob: any) => ob.branch_name);
    const offerName = detail.title || detail.offerName || listingOffer?.offerName || "Untitled Offer";
    const shopName = detail.shop_name || detail.shopName || detail.shop?.name || listingOffer?.shopName || "OfferNearU";

    return {
        id: detail.id,
        offerId: detail.id,
        shopName: shopName,
        offerName: offerName,
        title: offerName,
        image: primaryImage,
        posterSrc: primaryImage,
        posters: posters,
        category: detail.category || listingOffer?.category || "Offers",
        location: detail.location || listingOffer?.location || formatDistance(listingOffer?.distanceKm),
        discount: detail.discount || listingOffer?.discount || formatDaysLeft(listingOffer?.daysLeft),
        validFrom: detail.validFrom || listingOffer?.validFrom || undefined,
        validTo: detail.validTo || listingOffer?.validTo || undefined,
        totalPosters: posters.length > 0 ? posters.length : 1,
        numberOfPosters: posters.length > 0 ? posters.length : 1,
        daysLeft: listingOffer?.daysLeft,
        distanceKm: listingOffer?.distanceKm,
        shopLogo: listingOffer?.shopLogo || null,
        description: detail.description || listingOffer?.description || `${detail.title || "Offer"} from ${listingOffer?.shopName || "OfferNearU"}`,
        isActive: true,
        status: "active",
        shopId: listingOffer?.shopId,
        branchNames: branchNames,
        branchName: branchNames[0] || undefined,
        socialLinks: detail.socialLinks || detail.social_links || listingOffer?.socialLinks || null,
    };
}

export async function getUserOfferById(
    id: string | number,
    cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">
) {
    const [detailResponse, listingResult] = await Promise.all([
        backend.get<any>(ENDPOINTS.USER_OFFER.DETAILS(id), {
            next: { tags: [CACHE_TAGS.OFFERS, CACHE_TAGS.OFFER(id)] },
            ...cacheOptions,
        }).catch((err) => {
            console.warn(`Direct user offer lookup for ID ${id} failed:`, err);
            return null;
        }),
        fetchUserOffersPage({ page: 1, limit: 100 }).catch((err) => {
            console.warn(`Listing fetch for offer ID ${id} failed:`, err);
            return { success: false, data: [], page: 1, limit: 100, count: 0, totalPages: 0, hasMore: false } as PaginatedOffersResult;
        }),
    ]);

    // Find matching listing offer for enrichment
    const listingOffer = listingResult.data?.find(
        (item) => String(item.id) === String(id) || String(item.offerId) === String(id)
    ) || null;

    // Primary path: use the detail endpoint response enriched with listing data
    if (detailResponse && detailResponse.success && detailResponse.data) {
        const detailData = detailResponse.data;
        let actualDetail = unwrapApiEnvelope(detailData);
        // If after unwrapping we still have { success, data: {...} }, extract .data
        if (
            actualDetail &&
            typeof actualDetail === "object" &&
            !Array.isArray(actualDetail) &&
            "data" in actualDetail &&
            actualDetail.data &&
            typeof actualDetail.data === "object" &&
            !Array.isArray(actualDetail.data)
        ) {
            actualDetail = actualDetail.data;
        }
        return {
            success: true,
            data: mapUserOfferDetailToOffer(actualDetail, listingOffer),
        };
    }

    // Fallback: if the detail endpoint failed but we found the offer in the listing
    if (listingOffer) {
        return {
            success: true,
            data: listingOffer,
        };
    }

    return {
        success: false,
        data: null,
        error: "Offer not found",
    };
}

export async function getOfferById(id: string, shopId?: string) {
    return backend.get<Offer>(ENDPOINTS.OFFER.DETAILS(id), {
        headers: shopId ? { shopId } : {},
    });
}

export async function toggleOfferStatus(id: string, shopId: string) {
    return backend.patch<Offer>(ENDPOINTS.OFFER.INACTIVATE(id), null, {
        headers: { shopId },
    });
}

export async function getUserOfferSimilar(
    id: string | number,
    query: { latitude?: number | null; longitude?: number | null } = {},
    cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">
) {
    const params = new URLSearchParams();
    const normalizedLatitude = normalizeOptionalQueryValue(query.latitude);
    const normalizedLongitude = normalizeOptionalQueryValue(query.longitude);
    if (normalizedLatitude !== undefined) params.set("latitude", normalizedLatitude);
    if (normalizedLongitude !== undefined) params.set("longitude", normalizedLongitude);

    const response = await backend.get<any>(
        `${ENDPOINTS.USER_OFFER.SIMILAR(id)}?${params.toString()}`,
        {
            next: { tags: [CACHE_TAGS.OFFERS, CACHE_TAGS.OFFER(id)] },
            ...cacheOptions,
        }
    );

    if (!response.success || !response.data) {
        return {
            success: false,
            data: [],
            error: response.error || "Failed to fetch similar offers",
        };
    }

    const apiData = unwrapApiEnvelope(response.data);
    const offersArray = Array.isArray(apiData) ? apiData : (Array.isArray(apiData.data) ? apiData.data : []);
    const mappedOffers = offersArray.map(mapUserOfferToOffer);

    return {
        success: true,
        data: mappedOffers,
    };
}

