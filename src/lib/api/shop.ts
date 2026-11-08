import { backend } from "./backendClient";
import { RegisterShopRequest, LoginShopRequest, ResendOtpRequest, VerifyOtpRequest, OtpResponse } from "../types/auth";
import { ENDPOINTS } from "./endpoints";
import { AuthLoginData } from "../types/auth";
import { ShopVerificationPayload, ShopVerificationResponseData } from "../types/shop";

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
 * matching the backend's Fastify multipart parser expectations:
 * - documentFile: binary File
 * - images: multiple binary Files
 * - imageMetadata: JSON stringified array of [{ category, latitude, longitude, accuracyMeters, capturedAt }]
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

    if (payload.documentFile) {
        if (payload.documentFile instanceof File) {
            fd.append("documentFile", payload.documentFile, payload.documentFile.name);
        } else {
            fd.append("documentFile", String(payload.documentFile));
        }
    }

    if (payload.authorizationFile) {
        if (payload.authorizationFile instanceof File) {
            fd.append("authorizationFile", payload.authorizationFile, payload.authorizationFile.name);
        } else {
            fd.append("authorizationFile", String(payload.authorizationFile));
        }
    }

    if (payload.shopId !== undefined) {
        fd.append("shopId", String(payload.shopId));
    }
    if (payload.shop_id !== undefined) {
        fd.append("shop_id", String(payload.shop_id));
    }

    // Backend requires imageMetadata as JSON array of { category, latitude, longitude, accuracyMeters, capturedAt }
    if (Array.isArray(payload.images)) {
        const metadataList = payload.images.map((img) => ({
            category: img.category,
            latitude: Number((img.location?.latitude ?? payload.latitude).toFixed(6)),
            longitude: Number((img.location?.longitude ?? payload.longitude).toFixed(6)),
            accuracyMeters: Math.round(img.location?.accuracyMeters ?? payload.gpsAccuracyMeters ?? 12),
            capturedAt: img.location?.capturedAt ?? new Date().toISOString()
        }));
        fd.append("imageMetadata", JSON.stringify(metadataList));

        // Append actual File objects if present
        for (const img of payload.images) {
            if ((img as any).file instanceof File) {
                const f = (img as any).file as File;
                fd.append("images", f, f.name);
            }
        }
    }

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
    const query = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
    const headers: Record<string, string> = {};
    if (shopId) {
        headers.shopId = shopId;
        headers.shopid = shopId;
    }
    return await backend.get<ShopVerificationResponseData>(
        `${ENDPOINTS.SHOP.VERIFICATION}${query}`,
        shopId ? { headers } : undefined
    );
}
