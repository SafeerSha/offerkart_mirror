export interface SearchProductItem {
    name: string;
    category?: string | null;
    categoryId?: number | null;
    totalOfferProducts?: number | null;
    shopCount?: number | null;
    minPrice?: number | null;
    distance?: number | null;
}

export interface SearchOfferItem {
    offerId: number;
    offerName: string;
    shopName?: string | null;
    shopId?: number | null;
    distance?: number | null;
}

export interface SearchResultData {
    products: SearchProductItem[];
    offers: SearchOfferItem[];
    shops: SearchShopItem[];
}

export interface SearchShopItem {
    shopId: number;
    shopName: string;
    logo: string | null;
    distance: number | null;
}

export interface SearchResponse {
    success: boolean;
    message?: string;
    data: SearchResultData;
}
