export interface Product {
    id: number | string;
    name: string;
    shopName: string;
    price: number;
    originalPrice?: number;
    image: any; // Can be string or StaticImageData
    category: string;
    subcategory?: string[];
    rating: number;
    reviews?: number;
    discount?: string;
    description?: string;
    specifications?: { label: string; value: string }[];
    images?: any[];
}

export interface Offer {
    id: number | string;
    shopName: string;
    offerName: string;
    image: any;
    category: string;
    location: string;
    validUntil: string;
    discount: string;
    rating: number;
}
