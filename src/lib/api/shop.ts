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

/**
 * Convert a ShopVerificationPayload into multipart FormData
 * so the backend's @fastify/multipart parser can accept it.
 */
function toVerificationFormData(payload: ShopVerificationPayload): FormData {
    const fd = new FormData();

    fd.append("latitude", String(payload.latitude));
    fd.append("longitude", String(payload.longitude));
    fd.append("gpsAccuracyMeters", String(payload.gpsAccuracyMeters));
    fd.append("personName", payload.personName);
    fd.append("relationshipType", payload.relationshipType);
    fd.append("documentType", payload.documentType);
    fd.append("documentNumber", payload.documentNumber);
    fd.append("documentFile", payload.documentFile);

    if (payload.authorizationFile) {
        fd.append("authorizationFile", payload.authorizationFile);
    }

    if (payload.shopId !== undefined) {
        fd.append("shopId", String(payload.shopId));
    }
    if (payload.shop_id !== undefined) {
        fd.append("shop_id", String(payload.shop_id));
    }

    // Send images array as a JSON string field — the backend can parse
    // a single "images" field containing the full array.
    fd.append("images", JSON.stringify(payload.images));

    return fd;
}

export async function submitShopVerification(data: ShopVerificationPayload | FormData, shopId?: string) {
    const query = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
    const headers: Record<string, string> = {};
    if (shopId) {
        headers.shopId = shopId;
        headers.shopid = shopId;
    }

    let body: FormData;
    if (data instanceof FormData) {
        body = data;
    } else {
        // Inject shopId into the payload before converting
        const enriched: ShopVerificationPayload = shopId
            ? { ...data, shopId: Number(shopId) || shopId, shop_id: Number(shopId) || shopId }
            : data;
        body = toVerificationFormData(enriched);
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
