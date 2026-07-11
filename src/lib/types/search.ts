export interface SearchProductItem {
    name: string;
    category: string;
    categoryId?: number;
    totalOfferProducts: number;
    shopCount: number;
    minPrice?: number;
}

export interface SearchOfferItem {
    offerId: number;
    offerName: string;
    shopName?: string;
    shopId?: number;
}

export interface SearchResultData {
    products: SearchProductItem[];
    offers: SearchOfferItem[];
}

export interface SearchResponse {
    success: boolean;
    message?: string;
    data: SearchResultData;
}
