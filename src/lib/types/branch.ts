export interface Branch {
    id: number;
    shop_id: number;
    branch_name: string;
    email: string | null;
    phone: string;
    latitude: number;
    longitude: number;
    state: string;
    district: string;
    city: string;
    pincode: string;
    address: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AddBranchRequest {
    branch_name: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
    is_active: boolean;
}
