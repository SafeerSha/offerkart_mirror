export interface AuthUser {
    id?: number | string;
    uid?: string;
    full_name?: string;
    email?: string | null;
    phone?: string | null;
    business_name?: string | null;
    shopId?: string;
    role?: number;
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
    user_type?: string;
}

export interface LoginShopRequest {
    email: string;
    password: string;
}

export interface ResendOtpRequest {
    email: string;
}

export interface VerifyOtpRequest {
    user_id: number;
    otp: number;
}

export interface OtpResponse {
    message?: string;
    success?: boolean;
    [key: string]: unknown;
}