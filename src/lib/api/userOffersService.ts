import { ALL_OFFERS, ALL_PRODUCTS, FEATURED_OFFERS } from "./mockData";
import { config } from "@/lib/config";

const UPSTREAM_API_BASE_URL = config.api.upstreamBaseUrl;

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

function getDaysLeft(validToStr?: string): number | null {
    if (!validToStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const toDate = new Date(validToStr);
    toDate.setHours(0, 0, 0, 0);
    const diffTime = toDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
}

export function getMockUserOffers(query: {
    shopId?: string;
    page: number;
    limit: number;
    latitude?: number;
    longitude?: number;
    sort: string;
}) {
    const { shopId, page, limit, latitude, longitude, sort } = query;
    let filtered = ALL_OFFERS.map((item: any) => {
        const featuredOffer = FEATURED_OFFERS.find(fo => fo.name.toLowerCase() === item.shopName.toLowerCase());
        const shopLogo = featuredOffer ? featuredOffer.logo : null;
        const daysLeft = getDaysLeft(item.validTo);
        const shopIdMapped = getShopIdFromShopName(item.shopName);
        
        let distanceKm: number | null = null;
        if (latitude !== undefined && longitude !== undefined) {
            const shopCoords = getShopCoords(shopIdMapped);
            distanceKm = calculateDistance(latitude, longitude, shopCoords.lat, shopCoords.lng);
        }

        const primaryImage = typeof item.image === "object" && item.image ? (item.image as any).src : item.image;

        return {
            id: item.id,
            offerName: item.offerName,
            shopName: item.shopName,
            shopLogo,
            totalPosters: item.posters?.length || 1,
            defaultPoster: primaryImage || null,
            daysLeft,
            distanceKm,
            rating: item.rating || 4.5,
            shopId: shopIdMapped,
            // Keep full posters for detail view
            posters: item.posters ? item.posters.map((p: any) => {
                const posterImg = typeof p.posterSrc === "object" && p.posterSrc ? (p.posterSrc as any).src : p.posterSrc;
                return {
                    ...p,
                    posterSrc: posterImg
                };
            }) : undefined
        };
    });

    // Filter by shopId
    if (shopId) {
        filtered = filtered.filter(item => item.shopId === Number(shopId));
    }

    // Sort
    if (sort === "top") {
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if ((sort === "nearest" || sort === "nearby") && latitude !== undefined && longitude !== undefined) {
        filtered.sort((a, b) => {
            if (a.distanceKm === null) return 1;
            if (b.distanceKm === null) return -1;
            return a.distanceKm - b.distanceKm;
        });
    } else {
        // default: latest (by id desc)
        filtered.sort((a, b) => b.id - a.id);
    }

    const total = filtered.length;
    const sliced = filtered.slice((page - 1) * limit, page * limit);

    return {
        success: true,
        page,
        limit,
        sort,
        count: total,
        data: sliced
    };
}

export function getMockUserOfferDetails(id: string | number) {
    const offerId = Number(id);
    const offer = ALL_OFFERS.find(item => item.id === offerId);
    if (!offer) {
        return {
            success: false,
            error: "Offer not found"
        };
    }

    const featuredOffer = FEATURED_OFFERS.find(fo => fo.name.toLowerCase() === offer.shopName.toLowerCase());
    const shopLogo = featuredOffer ? featuredOffer.logo : null;
    const daysLeft = getDaysLeft(offer.validTo);
    const shopIdMapped = getShopIdFromShopName(offer.shopName);
    const primaryImage = typeof offer.image === "object" && offer.image ? (offer.image as any).src : offer.image;

    const mappedPosters = offer.posters ? offer.posters.map((p: any) => {
        const posterImg = typeof p.posterSrc === "object" && p.posterSrc ? (p.posterSrc as any).src : p.posterSrc;
        return {
            ...p,
            posterSrc: posterImg
        };
    }) : [
        {
            id: `poster-${offer.id}`,
            posterSrc: primaryImage,
            type: "just_post",
            markedItems: [],
        }
    ];

    const detailItem = {
        id: offer.id,
        offerName: offer.offerName,
        shopName: offer.shopName,
        shopLogo,
        totalPosters: mappedPosters.length,
        defaultPoster: primaryImage || null,
        daysLeft,
        distanceKm: null,
        rating: offer.rating || 4.5,
        shopId: shopIdMapped,
        posters: mappedPosters,
        validFrom: offer.validFrom,
        validTo: offer.validTo,
        discount: offer.discount
    };

    return {
        success: true,
        data: detailItem
    };
}

export function getMockUserProducts(query: {
    search?: string;
    categoryId?: string;
    subcategoryId?: string;
    shopId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort: string;
    page: number;
    limit: number;
}) {
    const { search, categoryId, subcategoryId, shopId, minPrice, maxPrice, sort, page, limit } = query;
    let filtered = ALL_PRODUCTS.map((item: any) => {
        const shopIdMapped = getShopIdFromShopName(item.shopName);
        return {
            id: Number(item.id),
            displayName: item.name,
            displayDescription: item.description || "",
            imageUrl: item.image,
            offerPrice: item.price,
            originalPrice: item.originalPrice || item.price,
            categoryId: Number(categoryId) || 1,
            shopId: shopIdMapped,
            rating: item.rating || 4.5,
            reviews: item.reviews || 0
        };
    });

    // 1. Search
    if (search) {
        const term = search.toLowerCase();
        filtered = filtered.filter(item => 
            item.displayName.toLowerCase().includes(term) || 
            item.displayDescription.toLowerCase().includes(term)
        );
    }

    // 2. CategoryId
    if (categoryId) {
        filtered = filtered.filter(item => item.categoryId === Number(categoryId));
    }

    // 2.5. SubcategoryId
    if (subcategoryId) {
        filtered = filtered.filter(item => (item as any).subcategoryId === Number(subcategoryId));
    }

    // 3. ShopId
    if (shopId) {
        filtered = filtered.filter(item => item.shopId === Number(shopId));
    }

    // 4. Min/Max Price
    if (minPrice !== undefined) {
        filtered = filtered.filter(item => item.offerPrice >= minPrice);
    }
    if (maxPrice !== undefined) {
        filtered = filtered.filter(item => item.offerPrice <= maxPrice);
    }

    // 5. Sort: newest | price_asc | price_desc | expiring_soon
    if (sort === "price_asc") {
        filtered.sort((a, b) => a.offerPrice - b.offerPrice);
    } else if (sort === "price_desc") {
        filtered.sort((a, b) => b.offerPrice - a.offerPrice);
    } else if (sort === "expiring_soon") {
        filtered.sort((a, b) => a.id - b.id);
    } else {
        filtered.sort((a, b) => b.id - a.id);
    }

    const total = filtered.length;
    const sliced = filtered.slice((page - 1) * limit, page * limit);

    return {
        success: true,
        data: {
            data: sliced,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
    };
}

export async function getUserOffersList(query: {
    shopId?: string;
    page?: number;
    limit?: number;
    latitude?: number;
    longitude?: number;
    sort?: string;
}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 8;
    const sort = query.sort || "latest";
    const shopId = query.shopId;
    const latitude = query.latitude;
    const longitude = query.longitude;

    try {
        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
            sort,
        });
        if (shopId) params.set("shopId", shopId);
        if (latitude !== undefined) params.set("latitude", String(latitude));
        if (longitude !== undefined) params.set("longitude", String(longitude));

        const upstreamUrl = `${UPSTREAM_API_BASE_URL}/user/offer?${params.toString()}`;
        const res = await fetch(upstreamUrl, { cache: "no-store" });
        if (res.ok) {
            const json = await res.json();
            const offersArray = json && json.success && (
                Array.isArray(json.data) 
                    ? json.data 
                    : (json.data && Array.isArray(json.data.data) ? json.data.data : null)
            );
            if (offersArray && offersArray.length > 0) {
                return json;
            }
        }
    } catch (e) {
        console.error("Upstream user/offer request failed:", e);
    }

    return {
        success: false,
        page,
        limit,
        sort,
        count: 0,
        data: []
    };
}

export async function getUserOfferDetails(id: string | number) {
    try {
        const upstreamUrl = `${UPSTREAM_API_BASE_URL}/user/offer/${id}`;
        const res = await fetch(upstreamUrl, { cache: "no-store" });
        if (res.ok) {
            const json = await res.json();
            if (json && json.success && json.data) {
                return json;
            }
        }
    } catch (e) {
        console.error(`Upstream user/offer/${id} request failed:`, e);
    }

    return {
        success: false,
        error: "Offer not found"
    };
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
}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const sort = query.sort || "newest";
    const { search, categoryId, subcategoryId, shopId, minPrice, maxPrice } = query;

    try {
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

        const upstreamUrl = `${UPSTREAM_API_BASE_URL}/user/offer/products?${params.toString()}`;
        const res = await fetch(upstreamUrl, { cache: "no-store" });
        if (res.ok) {
            const json = await res.json();
            if (json && json.success && json.data) {
                return json;
            }
        }
    } catch (e) {
        console.error("Upstream user/offer/products request failed:", e);
    }

    return {
        success: false,
        data: {
            data: [],
            pagination: {
                total: 0,
                page,
                limit,
                totalPages: 0
            }
        }
    };
}
