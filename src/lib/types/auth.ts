export interface User {
    id: string;
    full_name: string;
    email: string;
    business_name: string;
}

export interface RegisterShopRequest {
    full_name: string;
    business_name: string;
    email: string;
    phone: string;
    password: string;
}

export interface LoginShopRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    status: string;
    data: User & { token: string };
    message?: string;
}
