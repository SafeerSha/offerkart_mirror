export interface Product {
    id: number | string;
    name: string;
    shopName: string;
    shopId?: number | string | null;
    distanceKm?: number | null;
    price: number;
    originalPrice?: number;
    image: any; // Can be string or StaticImageData
    category: string;
    subcategory?: string | string[];
    rating: number;
    reviews?: number;
    discount?: string;
    description?: string;
    specifications?: { label: string; value: string }[];
    images?: any[];
    validFrom?: string;
    validTo?: string;
    branchIds?: string[];
    status?: string;
    parentCategoryId?: number | null;
    categoryId?: number | string;
    subcategoryId?: number | string | null;
    isHighlighted?: boolean;
    isFavourite?: boolean;
    isFavorite?: boolean;
    isActive?: boolean;
    categoryObject?: any;
    offerId?: number | string | null;
    daysLeft?: number | string | null;
    shopLogo?: string | null;
    availableBranches?: {
        id: number | string;
        branch_name: string;
        address?: string;
        phone?: string;
        latitude?: number;
        longitude?: number;
    }[];
}

export interface OfferProductPayload {
    displayName: string;
    displayDescription: string;
    imageUrl: string;
    categoryId: number;
    originalPrice: number;
    offerPrice: number;
    currencyId: number;
    branchIds: number[];
    isHighlighted: boolean;
    validFrom?: string;
    validTo?: string;
}
