import { backend } from "./backendClient";
import { RegisterShopRequest, LoginShopRequest, ResendOtpRequest, VerifyOtpRequest, OtpResponse } from "../types/auth";
import { ENDPOINTS } from "./endpoints";
import { AuthLoginData } from "../types/auth";
import { ShopVerificationPayload } from "../types/shop";

export async function registerShop(data: RegisterShopRequest) {
    return await backend.post(ENDPOINTS.AUTH.REGISTER, data);
}

export async function loginShop(data: LoginShopRequest) {
    return await backend.post<AuthLoginData>(ENDPOINTS.AUTH.LOGIN, data);
}

export async function resendEmailOtp(data: ResendOtpRequest) {
    return await backend.post<OtpResponse>(ENDPOINTS.AUTH.RESEND_EMAIL_OTP, data);
}

export async function verifyEmailOtp(data: VerifyOtpRequest) {
    return await backend.post<OtpResponse>(ENDPOINTS.AUTH.VERIFY_EMAIL_OTP, data);
}

export async function addShop(data: FormData | any) {
    return await backend.post(ENDPOINTS.SHOP.BASE, data);
}

export async function updateShop(shopId: string, data: FormData | any) {
    return await backend.put(ENDPOINTS.SHOP.DETAILS(shopId), data);
}

export async function getShops() {
    return await backend.get(ENDPOINTS.SHOP.BASE);
}

export async function getMyShops() {
    return await backend.get(ENDPOINTS.SHOP.MY_SHOPS);
}

export async function getShopDetails(shopId: string) {
    return await backend.get(ENDPOINTS.SHOP.DETAILS(shopId));
}

export async function submitShopVerification(data: ShopVerificationPayload | FormData, shopId?: string) {
    const query = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
    const headers: Record<string, string> = {};
    if (shopId) {
        headers.shopId = shopId;
        headers.shopid = shopId;
    }
    let body = data;
    if (shopId && !(data instanceof FormData) && typeof data === "object") {
        body = {
            ...data,
            shopId: Number(shopId) || shopId,
            shop_id: Number(shopId) || shopId
        };
    }
    return await backend.post(
        `${ENDPOINTS.SHOP.VERIFICATION}${query}`,
        body,
        { headers }
    );
}

export async function getShopVerification(shopId?: string) {
    return await backend.get(
        shopId ? `${ENDPOINTS.SHOP.VERIFICATION}?shopId=${encodeURIComponent(shopId)}` : ENDPOINTS.SHOP.VERIFICATION,
        shopId ? { headers: { shopId } } : undefined
    );
}
