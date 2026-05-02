export interface Product {
    id: number | string;
    name: string;
    shopName: string;
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
}
