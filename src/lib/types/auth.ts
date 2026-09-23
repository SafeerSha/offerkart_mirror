import { z } from "zod";

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

export const UserRegistrationSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
});

export type UserRegistrationFormData = z.infer<typeof UserRegistrationSchema>;

export const ForgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

export const OTPVerificationSchema = z.object({
    otp: z.string().min(4, "OTP must be at least 4 digits").max(6, "OTP must be at most 6 digits"),
});

export type OTPVerificationFormData = z.infer<typeof OTPVerificationSchema>;

export const ResetPasswordSchema = z.object({
    new_password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
});

export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;