import { FEATURED_SHOPS, FEATURED_OFFERS } from "./mockData";
import { Offer, OfferPayload } from "../types/offer";
import { backend } from "./backendClient";
import { ENDPOINTS } from "./endpoints";

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

function formatDistance(distanceKm: number | null) {
    if (distanceKm === null || Number.isNaN(distanceKm)) {
        return "Location unavailable";
    }

    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m away`;
    }

    return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;
}

function formatDaysLeft(daysLeft: number | null) {
    if (daysLeft === null || Number.isNaN(daysLeft)) {
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
        posters: primaryImage
            ? [
                {
                    id: `poster-${item.id}`,
                    posterSrc: primaryImage,
                    type: "just_post",
                    markedItems: [],
                },
            ]
            : [],
        category: "Offers",
        location: formatDistance(item.distanceKm),
        discount: formatDaysLeft(item.daysLeft),
        validFrom: undefined,
        validTo: undefined,
        totalPosters: item.totalPosters,
        numberOfPosters: item.totalPosters,
        daysLeft: item.daysLeft,
        distanceKm: item.distanceKm,
        shopLogo: item.shopLogo,
        description: `${item.offerName} from ${item.shopName}`,
        isActive: true,
        status: "active",
    };
}

async function fetchUserOffersPage({
    page = 1,
    limit = DEFAULT_USER_OFFER_LIMIT,
    sort = "latest",
    shopId,
    latitude,
    longitude,
}: UserOfferQuery = {}): Promise<PaginatedOffersResult> {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
    });

    const normalizedShopId = normalizeOptionalQueryValue(shopId);
    if (normalizedShopId !== undefined) {
        params.set("shopId", normalizedShopId);
    }

    if (sort === "nearby") {
        const normalizedLatitude = normalizeOptionalQueryValue(latitude);
        const normalizedLongitude = normalizeOptionalQueryValue(longitude);

        if (normalizedLatitude !== undefined) {
            params.set("latitude", normalizedLatitude);
        }
        if (normalizedLongitude !== undefined) {
            params.set("longitude", normalizedLongitude);
        }
    }

    const response = await backend.get<UserOfferApiResponse>(`${ENDPOINTS.USER_OFFER.BASE}?${params.toString()}`);

    if (!response.success || !response.data) {
        return {
            success: false,
            data: [],
            page,
            limit,
            count: 0,
            hasMore: false,
            error: response.error || "Failed to load offers",
        };
    }

    const result = response.data;
    const mappedOffers = result.data.map(mapUserOfferToOffer);
    const totalCount = typeof result.count === "number" ? result.count : mappedOffers.length;

    return {
        success: true,
        data: mappedOffers,
        page: result.page,
        limit: result.limit,
        count: totalCount,
        hasMore: result.page * result.limit < totalCount,
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
    return {
        success: true,
        data: FEATURED_SHOPS,
    };
}

export async function getFeaturedOffers() {
    return {
        success: true,
        data: FEATURED_OFFERS,
    };
}

export async function getAllOffers(shopId?: string) {
    return backend.get<Offer[]>(ENDPOINTS.OFFER.BASE, {
        headers: shopId ? { shopId } : {},
    });
}

export async function getPaginatedOffers(page: number = 1, limit: number = DEFAULT_USER_OFFER_LIMIT, query: Omit<UserOfferQuery, "page" | "limit"> = {}) {
    return fetchUserOffersPage({
        page,
        limit,
        ...query,
    });
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
        success: !error,
        data: allOffers,
        error,
    };
}

export async function getUserOfferById(id: string | number) {
    const allOffersResult = await getAllUserOffers({ limit: 100 });

    if (!allOffersResult.success) {
        return {
            success: false,
            data: null,
            error: allOffersResult.error,
        };
    }

    const offer = allOffersResult.data.find((item) => String(item.id) === String(id)) || null;

    return {
        success: !!offer,
        data: offer,
        error: offer ? undefined : "Offer not found",
    };
}

export async function getOfferById(id: string) {
    return backend.get<Offer>(ENDPOINTS.OFFER.DETAILS(id));
}

export async function toggleOfferStatus(id: string, shopId: string) {
    return backend.patch<Offer>(ENDPOINTS.OFFER.INACTIVATE(id), null, {
        headers: { shopId },
    });
}
