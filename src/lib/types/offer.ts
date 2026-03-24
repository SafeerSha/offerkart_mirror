// Types for Offers in the Shop Manager

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
    mainCategory: string;
    subcategories: string[];
}

export interface Poster {
    id?: string;
    posterSrc: string;
    type: "just_post" | "marked_poster" | "unclassified";
    order?: number;
    markedItems?: MarkedItem[];
    // Legacy fields
    title?: string;
    file?: File;
    previewUrl?: string;
    uploadPromise?: Promise<string>;
}

export interface Offer {
    // Core fields
    batchId: string;
    title: string;
    status: "active" | "paused";
    isActive: boolean;
    validFrom: string;
    validTo: string;
    
    // Branch info
    branchIds: (number | string)[];
    branchNames?: string[];
    branchCity?: string;
    
    // Metadata
    createdAt?: string;
    lastEdited?: string;
    
    // Posters
    posters: Poster[];
    
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
}

export interface OfferPayload {
    title: string;
    status: "active" | "paused";
    isActive: boolean;
    validFrom: string;
    validTo: string;
    branchIds: (number | string)[];
    posters: Poster[];
}
