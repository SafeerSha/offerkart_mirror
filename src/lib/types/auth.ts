export interface AuthUser {
    id?: number | string;
    uid?: string;
    full_name?: string;
    email?: string | null;
    phone?: string | null;
    business_name?: string | null;
    shopId?: string;
    role?: number;
    isEmailNotVerified?: boolean;
    isPhoneNotVerified?: boolean;
}

export interface AuthLoginResponse {
    success?: boolean;
    status?: string;
    message?: string;
    token?: string | null;
    data?: AuthLoginData;
    error?: string;
}

export interface AuthLoginData {
    id?: number | string;
    uid?: string;
    full_name?: string;
    email?: string | null;
    phone?: string | null;
    business_name?: string | null;
    shopId?: string;
    role?: number;
    isEmailNotVerified?: boolean;
    isPhoneNotVerified?: boolean;
    token?: string | null;
    data?: AuthLoginData;
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
    user_id: number | string;
    otp: number | string;
}

export interface OtpResponse {
    message?: string;
    success?: boolean;
    [key: string]: unknown;
}