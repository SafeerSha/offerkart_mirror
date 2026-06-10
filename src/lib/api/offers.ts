import { Offer, OfferPayload, MarkedItem } from "../types/offer";
import { backend, BackendRequestOptions } from "./backendClient";
import { ENDPOINTS } from "./endpoints";
import { CACHE_TAGS } from "./cache-tags";
import { getUserOffersList, getUserOfferDetails } from "./userOffersService";

const DEFAULT_USER_OFFER_IMAGE = "/images/shop-registration-bg-light.png";
const DEFAULT_USER_OFFER_LIMIT = 8;
const MAX_PUBLIC_OFFER_PAGES = 20;

interface UserOfferApiItem {
    id: number;
    offerName: string;
    shopName: string;
    shopLogo: string | null;
    totalPosters: number;
    defaultPoster: string | null;
    daysLeft: number | null;
    distanceKm: number | null;
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
    const primaryImage = item.defaultPoster || item.shopLogo || DEFAULT_USER_OFFER_IMAGE;

    return {
        id: item.id,
        offerId: item.id,
        shopName: item.shopName,
        offerName: item.offerName,
        title: item.offerName,
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
        shopLogo: item.shopLogo,
        description: `${item.offerName} from ${item.shopName}`,
        isActive: true,
        status: "active",
        shopId: item.shopId,
    };
}

async function fetchUserOffersPage({
    page = 1,
    limit = DEFAULT_USER_OFFER_LIMIT,
    sort = "latest",
    shopId,
    latitude,
    longitude,
}: UserOfferQuery = {}, cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">): Promise<PaginatedOffersResult> {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
    });

    const normalizedShopId = normalizeOptionalQueryValue(shopId);
    if (normalizedShopId !== undefined) {
        params.set("shopId", normalizedShopId);
    }

    if (sort === "nearby" || sort === "nearest") {
        const normalizedLatitude = normalizeOptionalQueryValue(latitude);
        const normalizedLongitude = normalizeOptionalQueryValue(longitude);
        if (normalizedLatitude !== undefined) params.set("latitude", normalizedLatitude);
        if (normalizedLongitude !== undefined) params.set("longitude", normalizedLongitude);
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
        console.warn("Upstream user/offer request failed");
        return {
            success: false,
            data: [],
            page,
            limit,
            count: 0,
            hasMore: false,
            error: response?.error || "Failed to fetch offers",
        };
    }

    const result = response.data;
    
    // Support both wrapped (envelope) and unwrapped api data payloads
    const apiData = (result && typeof result === "object" && result.data && typeof result.data === "object" && !Array.isArray(result.data))
        ? result.data
        : result;

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
        const result = await fetchUserOffersPage({ page: 1, limit: 100 });
        if (result.success && result.data) {
            const shopsMap = new Map();
            for (const offer of result.data) {
                if (offer.shopName && !shopsMap.has(offer.shopName)) {
                    shopsMap.set(offer.shopName, {
                        id: offer.shopId || offer.id,
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
            next: { tags: [CACHE_TAGS.SHOPS] }
        });
        if (response && response.success && Array.isArray(response.data)) {
            return {
                success: true,
                data: response.data.map((shop: any) => ({
                    id: shop.id,
                    name: shop.shop_name,
                    logo: shop.logo_url || null
                }))
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
                        id: offer.shopId || offer.id,
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
                });
            }
        }

        return {
            id: String(bp.id),
            posterSrc: bp.imageUrl || "",
            type: "just_post",
            markedItems,
            title: bp.title || undefined,
        };
    });

    const primaryImage = posters[0]?.posterSrc || listingOffer?.image || DEFAULT_USER_OFFER_IMAGE;

    return {
        id: detail.id,
        offerId: detail.id,
        shopName: listingOffer?.shopName || "OfferKart",
        offerName: detail.title || listingOffer?.offerName || "Untitled Offer",
        title: detail.title || listingOffer?.offerName || "Untitled Offer",
        image: primaryImage,
        posterSrc: primaryImage,
        posters: posters,
        category: listingOffer?.category || "Offers",
        location: listingOffer?.location || formatDistance(listingOffer?.distanceKm),
        discount: listingOffer?.discount || formatDaysLeft(listingOffer?.daysLeft),
        validFrom: detail.validFrom || listingOffer?.validFrom || undefined,
        validTo: detail.validTo || listingOffer?.validTo || undefined,
        totalPosters: posters.length,
        numberOfPosters: posters.length,
        daysLeft: listingOffer?.daysLeft,
        distanceKm: listingOffer?.distanceKm,
        shopLogo: listingOffer?.shopLogo || null,
        description: detail.description || listingOffer?.description || `${detail.title || "Offer"} from ${listingOffer?.shopName || "OfferKart"}`,
        isActive: true,
        status: "active",
        shopId: listingOffer?.shopId,
    };
}

export async function getUserOfferById(
    id: string | number,
    cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">
) {
    let detailData: any = null;
    try {
        const response = await backend.get<any>(`${ENDPOINTS.USER_OFFER.BASE}/${id}`, {
            next: { tags: [CACHE_TAGS.OFFERS, CACHE_TAGS.OFFER(id)] },
            ...cacheOptions,
        });
        if (response && response.success && response.data) {
            detailData = response.data;
        }
    } catch (err) {
        console.warn(`Direct user offer lookup for ID ${id} failed:`, err);
    }

    const allOffersResult = await getAllUserOffers({ limit: 100 });
    const listingOffer = allOffersResult.data?.find((item) => String(item.id) === String(id) || String(item.offerId) === String(id)) || null;

    if (detailData) {
        // Support both wrapped (envelope) and unwrapped api data payloads
        const actualDetail = (detailData && typeof detailData === "object" && detailData.data && typeof detailData.data === "object" && !Array.isArray(detailData.data))
            ? detailData.data
            : detailData;
        return {
            success: true,
            data: mapUserOfferDetailToOffer(actualDetail, listingOffer),
        };
    }

    return {
        success: !!listingOffer,
        data: listingOffer,
        error: listingOffer ? undefined : "Offer not found",
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
