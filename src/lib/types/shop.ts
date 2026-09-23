export interface AddShopRequest {
    shop_name: string;
    latitude: string;
    longitude: string;
    state: string;
    district: string;
    city: string;
    pincode: string;
    address: string;
    phone: string;
    file?: File | null;
    is_active: string;
    website_url?: string;
}

export interface Shop {
    id: number;
    user_id: string;
    shop_name: string;
    logo_url: string | null;
    email: string | null;
    phone: string;
    latitude: number;
    longitude: number;
    state: string;
    district: string;
    city: string;
    pincode: string;
    address: string;
    description: string | null;
    licence_no: string | null;
    is_active: boolean;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
    industry?: string | number;
    website_url?: string | null;
}

export interface Shops {
    id: number;
    shop_name: string;
    logo_url: string | null;
}
