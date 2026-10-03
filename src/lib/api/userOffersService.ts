import { backend, unwrapApiEnvelope } from "./backendClient";
import { ENDPOINTS } from "./endpoints";
import { CACHE_TAGS } from "./cache-tags";
import { z } from "zod";
import { SearchResponse } from "../types/search";
import { Product, PaginatedResponse } from "../types";
import { SocialLinksQuery, PaginatedSocialLinksResult, OfferSocialLink } from "../types/socialLinks";

// Map shop names to a stable mock shopId (1-indexed based on their index in ALL_OFFERS or predefined)
export function getShopIdFromShopName(shopName: string): number {
    const name = shopName.toLowerCase();
    if (name.includes("coffee")) return 1;
    if (name.includes("bella")) return 2;
    if (name.includes("zen spa")) return 3;
    if (name.includes("bistro")) return 4;
    if (name.includes("bakery")) return 5;
    if (name.includes("tech haven")) return 6;
    if (name.includes("fitlife")) return 7;
    if (name.includes("royal jewels")) return 8;
    if (name.includes("seafood")) return 9;
    if (name.includes("style hub")) return 10;
    if (name.includes("gadget world")) return 11;
    if (name.includes("sweet delights")) return 12;
    if (name.includes("elite fitness")) return 13;
    if (name.includes("gemstone")) return 14;
    if (name.includes("urban spa")) return 15;
    if (name.includes("fresh mart")) return 16;
    if (name.includes("factory")) return 17;
    if (name.includes("power gym")) return 18;
    if (name.includes("diamond dreams")) return 19;
    if (name.includes("bliss spa")) return 20;
    
    // Hash-based fallback to guarantee a consistent number
    let hash = 0;
    for (let i = 0; i < shopName.length; i++) {
        hash = shopName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 20) + 1;
}

// Stable mock coordinates in Mumbai area
const MOCK_SHOP_COORDINATES: Record<number, { lat: number; lng: number }> = {
    1: { lat: 19.0760, lng: 72.8777 }, // Artisan Coffee House
    2: { lat: 19.0820, lng: 72.8820 }, // Bella Boutique
    3: { lat: 19.0950, lng: 72.8900 }, // Zen Spa & Wellness
    4: { lat: 19.0700, lng: 72.8700 }, // The Grand Bistro
    5: { lat: 19.0550, lng: 72.8600 }, // Fresh Bakery
    6: { lat: 19.1200, lng: 72.9100 }, // Tech Haven
    7: { lat: 19.0300, lng: 72.8500 }, // FitLife Gym
    8: { lat: 19.1000, lng: 72.8300 }, // Royal Jewels
};

export function getShopCoords(shopId: number) {
    if (MOCK_SHOP_COORDINATES[shopId]) return MOCK_SHOP_COORDINATES[shopId];
    return {
        lat: 19.0760 + (shopId * 0.005) % 0.1,
        lng: 72.8777 + (shopId * 0.007) % 0.1
    };
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

export async function getUserOffersList(query: {
    shopId?: string;
    page?: number;
    limit?: number;
    latitude?: number;
    longitude?: number;
    radius?: number | null;
    sort?: string;
}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 12;
    const sort = query.sort || "latest";
    const shopId = query.shopId;
    const latitude = query.latitude;
    const longitude = query.longitude;
    const radius = query.radius;

    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
    });
    if (shopId) params.set("shopId", shopId);
    if (latitude !== undefined) params.set("latitude", String(latitude));
    if (longitude !== undefined) params.set("longitude", String(longitude));
    if (radius !== undefined && radius !== null && Number(radius) > 0) {
        params.set("radius", String(radius));
    }

    const response = await backend.get<any>(`${ENDPOINTS.USER_OFFER.BASE}?${params.toString()}`, {
        next: { tags: [CACHE_TAGS.OFFERS] },
    });

    if (!response.success || !response.data) {
        return {
            success: false,
            page,
            limit,
            sort,
            count: 0,
            data: [],
            error: response.error || "Failed to fetch offers",
        };
    }

    return response;
}

export async function getUserShopDetails(
    id: string | number,
    cacheOptions?: { next?: { tags?: string[]; revalidate?: number | false } }
) {
    const response = await backend.get<any>(ENDPOINTS.USER_OFFER.SHOP(id), {
        next: { tags: [CACHE_TAGS.SHOPS, CACHE_TAGS.OFFERS], revalidate: 300 },
        ...cacheOptions,
    });

    if (!response.success || !response.data) {
        return {
            success: false,
            data: null,
            error: "Shop not found",
            originalResponse: response
        };
    }

    const unwrapped = unwrapApiEnvelope(response.data);
    const shopData = unwrapped && typeof unwrapped === "object" && "data" in unwrapped && unwrapped.data
        ? unwrapped.data
        : unwrapped;

    return {
        ...response,
        data: shopData,
    };
}

export async function getUserOfferDetails(id: string | number) {
    const response = await backend.get<any>(ENDPOINTS.USER_OFFER.DETAILS(id), {
        next: { tags: [CACHE_TAGS.OFFERS, CACHE_TAGS.OFFER(String(id))] },
    });

    if (!response.success || !response.data) {
        return {
            success: false,
            error: "Offer not found",
        };
    }

    return response;
}

export async function getUserOfferProducts(query: {
    search?: string;
    categoryId?: string;
    subcategoryId?: string;
    shopId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
    latitude?: number;
    longitude?: number;
    radius?: number | null;
}): Promise<PaginatedResponse<Product>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const sort = query.sort || "newest";
    const { search, categoryId, subcategoryId, shopId, minPrice, maxPrice, latitude, longitude, radius } = query;

    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
    });
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (subcategoryId) params.set("subcategoryId", subcategoryId);
    if (shopId) params.set("shopId", shopId);
    if (minPrice !== undefined) params.set("minPrice", String(minPrice));
    if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice));
    if (latitude !== undefined) params.set("latitude", String(latitude));
    if (longitude !== undefined) params.set("longitude", String(longitude));
    if (radius !== undefined && radius !== null && Number(radius) > 0) {
        params.set("radius", String(radius));
    }

    const response = await backend.get<any>(`${ENDPOINTS.USER_OFFER.PRODUCTS}?${params.toString()}`, {
        next: { tags: [CACHE_TAGS.OFFERS, CACHE_TAGS.PRODUCTS] },
    });

    if (!response.success || !response.data) {
        return {
            success: false,
            data: {
                data: [],
                pagination: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
            },
            error: response.error || "Failed to fetch products",
        };
    }

    return response as PaginatedResponse<Product>;
}



const searchSchema = z.object({
    products: z.array(z.object({
        name: z.string(), category: z.string(), categoryId: z.number().optional(),
        totalOfferProducts: z.number(), shopCount: z.number(), minPrice: z.number().optional(),
    })).default([]),
    offers: z.array(z.object({
        offerId: z.number(), offerName: z.string(),
        shopName: z.string().optional(), shopId: z.number().optional(),
    })).default([]),
    shops: z.array(z.object({
        shopId: z.number().int().positive(),
        shopName: z.string().trim().min(1),
        logo: z.string().nullable().optional().transform(value => {
            if (!value) return null;
            try {
                const url = new URL(value);
                return ["https:", "http:"].includes(url.protocol) ? value : null;
            } catch { return null; }
        }),
        distance: z.number().nonnegative().nullable().optional().default(null),
    })).default([]),
});

export async function getGlobalSearch(
    search: string,
    latitude?: number | null,
    longitude?: number | null,
    radius?: number | null
): Promise<SearchResponse> {
    const empty = { products: [], offers: [], shops: [] };
    if (search.trim().length < 3) return { success: true, data: empty };
    const params = new URLSearchParams({ search: search.trim() });
    if (latitude != null) params.set("latitude", String(latitude));
    if (longitude != null) params.set("longitude", String(longitude));
    if (radius != null && Number(radius) > 0) params.set("radius", String(radius));
    try {
        const response = await backend.get<unknown>(`user/offer/search?${params.toString()}`);
        if (!response.success) return { success: false, message: "Search failed", data: empty };
        let data: unknown = response.data;
        for (let depth = 0; depth < 4 && data && typeof data === "object" && "data" in data; depth++) {
            if ("success" in data && data.success === false) throw new Error("Search rejected");
            data = data.data;
        }
        if (data && typeof data === "object" && "success" in data && data.success === false) {
            throw new Error("Search rejected");
        }
        if (!data || typeof data !== "object" || !("products" in data || "offers" in data || "shops" in data)) {
            throw new Error("Invalid search response");
        }
        const parsed = searchSchema.safeParse(data);
        if (parsed.success) return { success: true, data: parsed.data };
    } catch {
        // Return a distinct failure state, never a misleading no-match result.
    }
    return { success: false, message: "Search failed. Please try again.", data: empty };
}
/**
 * Fetch public offer social links (Promo / Ads page)
 * Corresponds to: GET https://offersnearu.vercel.app/api/user/offer/sociallinks
 */
export async function getUserOfferSocialLinks(
    query: SocialLinksQuery = {},
    cacheOptions?: { next?: { tags?: string[]; revalidate?: number | false } }
): Promise<PaginatedSocialLinksResult> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 8;
    const sort = query.sort || "latest";

    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
    });

    if (query.latitude !== undefined && query.latitude !== null && query.latitude !== "") {
        params.set("latitude", String(query.latitude));
    }
    if (query.longitude !== undefined && query.longitude !== null && query.longitude !== "") {
        params.set("longitude", String(query.longitude));
    }
    if (query.industryId !== undefined && query.industryId !== null && query.industryId !== "") {
        params.set("industryId", String(query.industryId));
    }
    if (query.radius !== undefined && query.radius !== null && query.radius !== "") {
        params.set("radius", String(query.radius));
    }

    try {
        const response = await backend.get<any>(
            `${ENDPOINTS.USER_OFFER.SOCIAL_LINKS}?${params.toString()}`,
            {
                next: { tags: [CACHE_TAGS.OFFERS] },
                ...cacheOptions,
            }
        );

        if (!response.success || !response.data) {
            return {
                success: false,
                data: [],
                page,
                limit,
                total: 0,
                totalPages: 0,
                hasMore: false,
                sort,
                error: response.error || "Failed to fetch social links",
            };
        }

        const apiData = unwrapApiEnvelope(response.data);
        const actualData = apiData && typeof apiData === "object" && "data" in apiData && apiData.data
            ? apiData.data
            : apiData;

        const items: OfferSocialLink[] = Array.isArray(actualData?.data)
            ? actualData.data
            : (Array.isArray(actualData) ? actualData : []);

        const pagination = actualData?.pagination || apiData?.pagination || {};
        const total = typeof pagination.total === "number" ? pagination.total : items.length;
        const totalPages = typeof pagination.totalPages === "number"
            ? pagination.totalPages
            : (total > 0 ? Math.ceil(total / limit) : 1);
        const currentPage = typeof pagination.page === "number" ? pagination.page : page;

        return {
            success: true,
            data: items,
            page: currentPage,
            limit,
            total,
            totalPages,
            hasMore: currentPage < totalPages,
            sort: actualData?.sort || sort,
        };
    } catch (error) {
        console.error("getUserOfferSocialLinks error:", error);
        return {
            success: false,
            data: [],
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasMore: false,
            sort,
            error: error instanceof Error ? error.message : "Failed to fetch social links",
        };
    }
}
