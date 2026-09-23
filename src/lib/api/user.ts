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
