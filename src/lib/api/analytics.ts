import { backend } from "./backendClient";

export interface DashboardAnalyticsData {
    offerCount: number;
    standaloneOfferProductCount: number;
    offerViews: number;
    offerProductViews: number;
}

export interface OfferViewItem {
    offerId: number;
    offerTitle: string;
    views: number;
}

export interface ProductViewItem {
    offerProductId: number;
    displayName: string;
    offerId: number | null;
    offerTitle: string | null;
    imageUrl: string | null;
    offerPrice: number | null;
    views: number;
}

export interface ViewsAnalyticsResponse {
    data: OfferViewItem[] | ProductViewItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ViewsAnalyticsQuery {
    search?: string;
    page?: number;
    limit?: number;
}

export async function getDashboardAnalytics(shopId?: string | number) {
    return backend.get<DashboardAnalyticsData>("business/analytics/dashboard", {
        headers: shopId ? { shopId: String(shopId) } : undefined,
    });
}

export async function getOfferViewsAnalytics(shopId?: string | number, query: ViewsAnalyticsQuery = {}) {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    params.set("page", String(query.page || 1));
    params.set("limit", String(query.limit || 20));

    const qs = params.toString();
    return backend.get<ViewsAnalyticsResponse>(`business/analytics/offer-views?${qs}`, {
        headers: shopId ? { shopId: String(shopId) } : undefined,
    });
}

export async function getProductViewsAnalytics(shopId?: string | number, query: ViewsAnalyticsQuery = {}) {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    params.set("page", String(query.page || 1));
    params.set("limit", String(query.limit || 20));

    const qs = params.toString();
    return backend.get<ViewsAnalyticsResponse>(`business/analytics/offer-product-views?${qs}`, {
        headers: shopId ? { shopId: String(shopId) } : undefined,
    });
}
