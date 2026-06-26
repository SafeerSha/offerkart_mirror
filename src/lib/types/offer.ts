import { OfferStatus, PosterType } from "./enums";

export interface MarkedItem {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    description: string;
    productImage: string;
    currency: string;
    oldPrice: number;
    offerPrice: number;
    subcategoryId?: number;
    mainCategory?: string;
    subcategories?: string[];
}

export interface Poster {
    id?: string;
    posterSrc: string;
    type: PosterType;
    displayOrder?: number;
    markedItems?: MarkedItem[];
    title?: string;
    file?: File;
    previewUrl?: string;
    uploadPromise?: Promise<string>;
}

export interface Offer {
    offerId?: number;
    title?: string;
    postedAt?: number | string;
    numberOfPosters?: number;
    totalPosters?: number;
    daysLeft?: number | null;
    distanceKm?: number | null;
    shopLogo?: string | null;
    branches?: {
        id: number;
        branchName: string;
    }[];
    
    description?: string;
    isFeatured?: boolean;
    batchId?: string;
    status?: OfferStatus | string;
    isActive: boolean;
    validFrom?: string;
    validTo?: string;
    
    branchIds?: (number | string)[];
    branchNames?: string[];
    branchName?: string;
    branchCity?: string;
    
    createdAt?: string;
    lastEdited?: string;
    
    posters?: Poster[];
    
    id?: number | string;
    shopName?: string;
    offerName?: string;
    image?: any;
    category?: string;
    location?: string;
    discount?: string;
    rating?: number;
    posterSrc?: string;
    shopId?: number;
}

export interface OfferPayload {
    title: string;
    description?: string;
    isActive: boolean;
    isFeatured?: boolean;
    validFrom: string;
    validTo: string;
    branchIds: (number | string)[];
    posters: Poster[];
}
