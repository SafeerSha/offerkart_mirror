"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { backend } from "@/lib/api/backendClient";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { revalidatePath, revalidateTag } from "next/cache";
import { 
    getUserProfile, 
    changePasswordApi, 
    updateBasicProfileApi,
    requestCurrentContactOtpApi,
    verifyCurrentContactOtpApi,
    requestNewContactOtpApi,
    verifyNewContactOtpApi
} from "@/lib/api/user";
import { 
    BasicProfileFormData, 
    BasicProfileSchema, 
    UserProfileResponse, 
    PasswordChangeFormData, 
    PasswordChangeSchema,
    VerifyCurrentOtpFormData,
    VerifyCurrentOtpSchema,
    RequestNewContactOtpFormData,
    RequestNewContactOtpSchema,
    VerifyNewContactOtpFormData,
    VerifyNewContactOtpSchema
} from "@/lib/types/profile";

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

/**
 * Updates basic user profile details (full_name, business_name)
 * Directly calls PATCH /api/auth/user/profile
 */
export async function updateProfile(data: { full_name: string; business_name?: string }) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const validation = BasicProfileSchema.safeParse(data);
        if (!validation.success) {
            const firstError = validation.error.issues[0]?.message || "Invalid data provided";
            return { success: false, error: firstError };
        }

        const res = await updateBasicProfileApi({
            full_name: validation.data.full_name,
            business_name: validation.data.business_name || "",
        });

        if (res.success) {
            try {
                revalidateTag("user-profile", "max");
                revalidatePath("/profile");
            } catch (err) {
                // Revalidation errors shouldn't fail the request
                console.warn("Tag revalidation warning:", err);
            }
            return { 
                success: true, 
                message: (res.data as Record<string, unknown>)?.message as string || "Profile updated successfully!",
                data: res.data 
            };
        }

        return { 
            success: false, 
            error: res.error || "Failed to update profile." 
        };
    } catch (error) {
        console.error("Error in updateProfile action:", error);
        return { success: false, error: "An unexpected error occurred while updating profile" };
    }
}

/**
 * Contact Change Step 1: Request OTP on current registered contact
 */
export async function requestCurrentContactOtp() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const res = await requestCurrentContactOtpApi();
        return res;
    } catch (error) {
        console.error("Error in requestCurrentContactOtp action:", error);
        return { success: false, error: "Failed to request verification code" };
    }
}

/**
 * Contact Change Step 2: Verify OTP for current contact
 */
export async function verifyCurrentContactOtp(data: VerifyCurrentOtpFormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const validation = VerifyCurrentOtpSchema.safeParse(data);
        if (!validation.success) {
            return { success: false, error: validation.error.issues[0]?.message || "Invalid OTP code" };
        }

        const res = await verifyCurrentContactOtpApi({ otp: validation.data.otp });
        return res;
    } catch (error) {
        console.error("Error in verifyCurrentContactOtp action:", error);
        return { success: false, error: "Failed to verify verification code" };
    }
}

/**
 * Contact Change Step 3: Request OTP for new contact (EMAIL or PHONE)
 */
export async function requestNewContactOtp(data: RequestNewContactOtpFormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const validation = RequestNewContactOtpSchema.safeParse(data);
        if (!validation.success) {
            return { success: false, error: validation.error.issues[0]?.message || "Invalid contact input" };
        }

        const res = await requestNewContactOtpApi({
            type: validation.data.type,
            newValue: validation.data.newValue,
        });
        return res;
    } catch (error) {
        console.error("Error in requestNewContactOtp action:", error);
        return { success: false, error: "Failed to request code for new contact" };
    }
}

/**
 * Contact Change Step 4: Verify OTP for new contact & finalize change
 */
export async function verifyNewContactOtp(data: VerifyNewContactOtpFormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const validation = VerifyNewContactOtpSchema.safeParse(data);
        if (!validation.success) {
            return { success: false, error: validation.error.issues[0]?.message || "Invalid OTP code" };
        }

        const res = await verifyNewContactOtpApi({
            type: validation.data.type,
            otp: validation.data.otp,
        });

        if (res.success) {
            try {
                revalidateTag("user-profile", "max");
                revalidatePath("/profile");
            } catch (err) {
                console.warn("Tag revalidation warning:", err);
            }
        }

        return res;
    } catch (error) {
        console.error("Error in verifyNewContactOtp action:", error);
        return { success: false, error: "Failed to finalize contact update" };
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
