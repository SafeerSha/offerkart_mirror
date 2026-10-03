"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { backend } from "@/lib/api/backendClient";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { getUserProfile, changePasswordApi } from "@/lib/api/user";
import { UserProfileFormData, UserProfileSchema, UserProfileResponse, PasswordChangeFormData, PasswordChangeSchema } from "@/lib/types/profile";

export async function getProfile() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        // Call the backend GET endpoint to get the latest profile
        const res = await getUserProfile({
            next: { tags: ["user-profile"] }
        });

        // Fallback to session data if backend is not ready or fails
        if (!res.success || !res.data) {
            console.warn("Failed to fetch profile from backend, falling back to session data.", res.error);
            const user = session.user as Record<string, unknown>;
            return {
                success: true,
                data: {
                    id: String(user.id || "1"),
                    full_name: String(user.name || user.full_name || ""),
                    email: String(user.email || ""),
                    phone: String(user.phone || ""),
                    role: typeof user.role === "number" ? user.role : undefined,
                    business_name: typeof user.business_name === "string" ? user.business_name : undefined,
                    shopId: typeof user.shopId === "string" ? user.shopId : undefined
                } as UserProfileResponse
            };
        }

        return res;
    } catch (error) {
        console.error("Error in getProfile action:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function updateProfile(data: UserProfileFormData) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const validation = UserProfileSchema.safeParse(data);
        if (!validation.success) {
            return { success: false, error: "Invalid data provided" };
        }

        const res = await backend.put(ENDPOINTS.USER.PROFILE, validation.data);

        // If backend is not ready, we will just mock a success response to allow UI testing
        if (!res.success && res.error?.includes("404")) {
            console.warn("Backend endpoint not found, mocking success response for updateProfile.");
            return { success: true, message: "Profile updated successfully (Mock)" };
        }

        return res;
    } catch (error) {
        console.error("Error in updateProfile action:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function changePassword(data: PasswordChangeFormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const validation = PasswordChangeSchema.safeParse(data);
        if (!validation.success) {
            return { success: false, error: "Invalid password data" };
        }

        const res = await changePasswordApi({
            current_password: validation.data.current_password,
            new_password: validation.data.new_password
        });

        return res;
    } catch (error) {
        console.error("Error in changePassword action:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}
