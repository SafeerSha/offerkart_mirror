export interface AuthUser {
    id?: number | string;
    uid?: string;
    full_name?: string;
    email?: string | null;
    phone?: string | null;
    business_name?: string | null;
    shopId?: string;
}

export interface AuthLoginResponse {
    status?: string;
    token?: string;
    data?: AuthLoginData;
}

export interface AuthLoginData {
    token?: string;
    [key: string]: unknown;
}

export interface AuthSession {
    user: AuthUser & {
        accessToken?: string;
        shopId?: string;
    };
    shopId?: string;
}

export interface RegisterShopRequest {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    business_name?: string;
}

export interface LoginShopRequest {
    email: string;
    password: string;
}