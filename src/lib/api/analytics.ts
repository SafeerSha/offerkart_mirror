import { backend } from "./backendClient";

export interface DashboardAnalyticsData {
    offerCount: number;
    standaloneOfferProductCount: number;
    offerViews: number;
    offerProductViews: number;
}

export async function getDashboardAnalytics(shopId?: string | number) {
    return backend.get<DashboardAnalyticsData>("business/analytics/dashboard", {
        headers: shopId ? { shopId: String(shopId) } : undefined,
    });
}
