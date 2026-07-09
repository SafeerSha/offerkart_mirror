import { Offer, OfferPayload, MarkedItem } from "../types/offer";
import { Shops } from "../types/shop";
import { backend, BackendRequestOptions, unwrapApiEnvelope } from "./backendClient";
import { ENDPOINTS } from "./endpoints";
import { CACHE_TAGS } from "./cache-tags";
import { getUserOffersList, getUserOfferDetails } from "./userOffersService";

const DEFAULT_USER_OFFER_IMAGE = "/images/shop-registration-bg-light.png";
const DEFAULT_USER_OFFER_LIMIT = 8;
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
    success: boolean;
    page: number;
    limit: number;
    sort: string;
    count: number;
    data: UserOfferApiItem[];
    message?: string;
}

interface UserOfferQuery {
    page?: number;
    limit?: number;
    sort?: string;
    shopId?: string;
    latitude?: number | null;
    longitude?: number | null;
    industry?: number | string | null;
}

interface PaginatedOffersResult {
    success: boolean;
    data: Offer[];
    page: number;
    limit: number;
    count: number;
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
        params.set("industry", normalizedIndustryId);
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
        console.warn("Upstream user/offer request failed. Falling back to local mock data.");
        const { ALL_OFFERS } = await import("./mockData");
        
        let filtered = ALL_OFFERS;
        if (shopId) {
            filtered = filtered.filter((o: any) => String(o.shopId || o.shop_id || "") === String(shopId));
        }
        if (industry && industry !== "All") {
            filtered = filtered.filter((o: any) => String(o.category || "") === String(industry));
        }

        const start = (page - 1) * limit;
        const slice = filtered.slice(start, start + limit);
        const mappedOffers = slice.map((o: any) => mapUserOfferToOffer(o));

        return {
            success: true,
            data: mappedOffers,
            page,
            limit,
            count: filtered.length,
            hasMore: start + limit < filtered.length,
        };
    }

    const result = response.data;
    
    // Unwrap doubly-nested API envelope if present
    const apiData = unwrapApiEnvelope(result);

    const offersArray = Array.isArray(apiData.data) ? apiData.data : [];
    const mappedOffers = offersArray.map(mapUserOfferToOffer);
    const totalCount = typeof apiData.count === "number" ? apiData.count : mappedOffers.length;

    return {
        success: true,
        data: mappedOffers,
        page: apiData.page || page,
        limit: apiData.limit || limit,
        count: totalCount,
        hasMore: (apiData.page || page) * (apiData.limit || limit) < totalCount,
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

export async function getFeaturedShops() {
    try {
        const offersResult = await fetchUserOffersPage({ page: 1, limit: 100 });
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
        console.error("Failed to fetch featured shops:", e);
    }
    return {
        success: true,
        data: [],
    };
}

export async function getFeaturedOffers() {
    try {
        const response = await backend.get<any>(ENDPOINTS.USER_OFFER.SHOPS, {
            cache: "no-store",
            next: { revalidate: 0 }
        });
        if (response && response.success && response.data) {
            const apiData = response.data;
            const shops: Shops[] = Array.isArray(apiData.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);
            return {
                success: true,
                data: shops.map((shop) => {
                    let logoUrl = shop.logo_url;
                    if (!logoUrl) {
                        const fallbackLogos = [
                            "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?q=80&w=200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&auto=format&fit=crop",
                            "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=200&auto=format&fit=crop",
                        ];
                        let hash = 0;
                        const str = shop.shop_name || String(shop.id) || "shop";
                        for (let i = 0; i < str.length; i++) {
                            hash = str.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        const index = Math.abs(hash) % fallbackLogos.length;
                        logoUrl = fallbackLogos[index];
                    }
                    return {
                        id: shop.id,
                        name: shop.shop_name,
                        logo: logoUrl
                    };
                })
            };
        }
    } catch (e) {
        console.error("Failed to fetch shops from API:", e);
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
        console.error("Failed to fetch featured offers fallback:", e);
    }
    return {
        success: true,
        data: [],
    };
}

export async function getAllOffers(shopId?: string) {
    return backend.get<Offer[]>(ENDPOINTS.OFFER.BASE, {
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
    const shopName = detail.shop_name || detail.shopName || detail.shop?.name || listingOffer?.shopName || "OfferKart";

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
        description: detail.description || listingOffer?.description || `${detail.title || "Offer"} from ${listingOffer?.shopName || "OfferKart"}`,
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
            return { success: false, data: [], page: 1, limit: 100, count: 0, hasMore: false } as PaginatedOffersResult;
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

    // Mock Fallback: if both failed, look up in ALL_OFFERS mock data
    const { ALL_OFFERS } = await import("./mockData");
    const mockOffer = ALL_OFFERS.find(item => String(item.id) === String(id));
    if (mockOffer) {
        console.warn(`Upstream user/offer detail request for ID ${id} failed. Falling back to local mock data.`);
        return {
            success: true,
            data: mapUserOfferDetailToOffer(mockOffer),
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
