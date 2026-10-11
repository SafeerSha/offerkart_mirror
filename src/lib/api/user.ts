import { backend } from "./backendClient";
import { ENDPOINTS } from "./endpoints";
import { UserProfileResponse } from "../types/profile";

export interface ChangePasswordRequest {
    current_password: string;
    new_password: string;
}

/**
 * Fetch authenticated user profile data
 * Corresponds to: GET https://offersnearu.vercel.app/api/auth/user
 */
export async function getUserProfile(cacheOptions?: { next?: { tags?: string[] } }) {
    return await backend.get<UserProfileResponse>(ENDPOINTS.AUTH.USER, {
        next: cacheOptions?.next ?? { tags: ["user-profile"] }
    });
}

/**
 * Change / update user password
 * Corresponds to: POST https://offersnearu.vercel.app/api/auth/change-password
 */
export async function changePasswordApi(data: ChangePasswordRequest) {
    return await backend.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        current_password: data.current_password,
        new_password: data.new_password,
    });
}

/**
 * Update user basic profile information (full_name, business_name)
 * Corresponds to: PATCH https://offersnearu.vercel.app/api/auth/user/profile
 */
export async function updateBasicProfileApi(data: { full_name: string; business_name?: string }) {
    return await backend.patch(ENDPOINTS.AUTH.USER_PROFILE, data);
}

/**
 * Step 1: Request OTP on current registered contact
 * Corresponds to: GET https://offersnearu.vercel.app/api/auth/user/contact-change/request-current-otp
 */
export async function requestCurrentContactOtpApi() {
    return await backend.get(ENDPOINTS.AUTH.CONTACT_CHANGE.REQUEST_CURRENT_OTP);
}

/**
 * Step 2: Verify OTP for current contact
 * Corresponds to: POST https://offersnearu.vercel.app/api/auth/user/contact-change/verify-current-otp
 */
export async function verifyCurrentContactOtpApi(data: { otp: string }) {
    return await backend.post(ENDPOINTS.AUTH.CONTACT_CHANGE.VERIFY_CURRENT_OTP, data);
}

/**
 * Step 3: Request OTP for new contact (EMAIL or PHONE)
 * Corresponds to: POST https://offersnearu.vercel.app/api/auth/user/contact-change/request-new-otp
 */
export async function requestNewContactOtpApi(data: { type: "EMAIL" | "PHONE"; newValue: string }) {
    return await backend.post(ENDPOINTS.AUTH.CONTACT_CHANGE.REQUEST_NEW_OTP, data);
}

/**
 * Step 4: Verify OTP for new contact & finalize change
 * Corresponds to: POST https://offersnearu.vercel.app/api/auth/user/contact-change/verify-new-otp
 */
export async function verifyNewContactOtpApi(data: { type: "EMAIL" | "PHONE"; otp: string }) {
    return await backend.post(ENDPOINTS.AUTH.CONTACT_CHANGE.VERIFY_NEW_OTP, data);
}

