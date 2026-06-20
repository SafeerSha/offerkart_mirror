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
    order?: number;
    markedItems?: MarkedItem[];
    // Legacy fields
    title?: string;
    file?: File;
    previewUrl?: string;
    uploadPromise?: Promise<string>;
}

export interface Offer {
    // New Listing format fields
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
    
    // Core fields used in creation/editing
    description?: string;
    isFeatured?: boolean;
    batchId?: string;
    status?: OfferStatus | string;
    isActive: boolean;
    validFrom?: string;
    validTo?: string;
    
    // Branch info (legacy/creation)
    branchIds?: (number | string)[];
    branchNames?: string[];
    branchName?: string;
    branchCity?: string;
    
    // Metadata
    createdAt?: string;
    lastEdited?: string;
    
    // Posters
    posters?: Poster[];
    
    // Legacy/optional fields
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
