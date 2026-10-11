import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
    BasicProfileSchema, 
    RequestNewContactOtpSchema, 
    VerifyCurrentOtpSchema, 
    VerifyNewContactOtpSchema 
} from "@/lib/types/profile";
import { 
    updateProfile, 
    requestCurrentContactOtp, 
    verifyCurrentContactOtp, 
    requestNewContactOtp, 
    verifyNewContactOtp 
} from "@/app/profile/actions";
import * as userApi from "@/lib/api/user";
import { getServerSession } from "next-auth/next";

vi.mock("next-auth/next", () => ({
    getServerSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock("@/lib/api/user", () => ({
    getUserProfile: vi.fn(),
    changePasswordApi: vi.fn(),
    updateBasicProfileApi: vi.fn(),
    requestCurrentContactOtpApi: vi.fn(),
    verifyCurrentContactOtpApi: vi.fn(),
    requestNewContactOtpApi: vi.fn(),
    verifyNewContactOtpApi: vi.fn(),
}));

describe("Profile Types and Schemas", () => {
    describe("BasicProfileSchema", () => {
        it("accepts valid full_name and business_name", () => {
            const valid = { full_name: "John Doe", business_name: "Acme Store" };
            const result = BasicProfileSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it("accepts optional/empty business_name", () => {
            const valid = { full_name: "Jane Smith", business_name: "" };
            const result = BasicProfileSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it("rejects names with fewer than 2 characters", () => {
            const invalid = { full_name: "J" };
            const result = BasicProfileSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe("RequestNewContactOtpSchema", () => {
        it("validates EMAIL contact type with valid email", () => {
            const valid = { type: "EMAIL", newValue: "hello@offersnearu.com" };
            const result = RequestNewContactOtpSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it("rejects EMAIL contact type with invalid email", () => {
            const invalid = { type: "EMAIL", newValue: "not-an-email" };
            const result = RequestNewContactOtpSchema.safeParse(invalid);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0]?.message).toContain("valid email address");
            }
        });

        it("validates PHONE contact type with valid phone number", () => {
            const valid = { type: "PHONE", newValue: "+919876543210" };
            const result = RequestNewContactOtpSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it("rejects PHONE contact type with non-numeric chars", () => {
            const invalid = { type: "PHONE", newValue: "123-abc-7890" };
            const result = RequestNewContactOtpSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe("VerifyCurrentOtpSchema and VerifyNewContactOtpSchema", () => {
        it("validates 6-digit OTP", () => {
            const valid = { otp: "882351" };
            expect(VerifyCurrentOtpSchema.safeParse(valid).success).toBe(true);
        });

        it("rejects OTP shorter than 4 digits", () => {
            const invalid = { otp: "12" };
            expect(VerifyCurrentOtpSchema.safeParse(invalid).success).toBe(false);
        });
    });
});

describe("Profile Server Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("updateProfile", () => {
        it("returns Unauthorized when user is not logged in", async () => {
            vi.mocked(getServerSession).mockResolvedValueOnce(null);
            const result = await updateProfile({ full_name: "Test User" });
            expect(result.success).toBe(false);
            expect(result.error).toBe("Unauthorized");
        });

        it("calls updateBasicProfileApi with correct payload when authenticated", async () => {
            vi.mocked(getServerSession).mockResolvedValueOnce({
                user: { id: "1", name: "Old Name" }
            });
            vi.mocked(userApi.updateBasicProfileApi).mockResolvedValueOnce({
                success: true,
                data: { message: "Profile updated successfully" }
            } as any);

            const result = await updateProfile({
                full_name: "New Name",
                business_name: "New Store"
            });

            expect(result.success).toBe(true);
            expect(userApi.updateBasicProfileApi).toHaveBeenCalledWith({
                full_name: "New Name",
                business_name: "New Store"
            });
        });

        it("validates data and returns error for invalid input", async () => {
            vi.mocked(getServerSession).mockResolvedValueOnce({
                user: { id: "1" }
            });

            const result = await updateProfile({ full_name: "X" });
            expect(result.success).toBe(false);
            expect(result.error).toContain("at least 2 characters");
            expect(userApi.updateBasicProfileApi).not.toHaveBeenCalled();
        });
    });

    describe("Contact Change Actions", () => {
        it("requestCurrentContactOtp calls API when authenticated", async () => {
            vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: "1" } });
            vi.mocked(userApi.requestCurrentContactOtpApi).mockResolvedValueOnce({
                success: true,
                data: { message: "OTP sent" }
            } as any);

            const result = await requestCurrentContactOtp();
            expect(result.success).toBe(true);
            expect(userApi.requestCurrentContactOtpApi).toHaveBeenCalledTimes(1);
        });

        it("verifyCurrentContactOtp validates OTP and calls API", async () => {
            vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: "1" } });
            vi.mocked(userApi.verifyCurrentContactOtpApi).mockResolvedValueOnce({
                success: true,
                data: { message: "OTP verified" }
            } as any);

            const result = await verifyCurrentContactOtp({ otp: "882351" });
            expect(result.success).toBe(true);
            expect(userApi.verifyCurrentContactOtpApi).toHaveBeenCalledWith({ otp: "882351" });
        });

        it("requestNewContactOtp sends validated new email", async () => {
            vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: "1" } });
            vi.mocked(userApi.requestNewContactOtpApi).mockResolvedValueOnce({
                success: true,
                data: { message: "OTP sent to new email" }
            } as any);

            const result = await requestNewContactOtp({
                type: "EMAIL",
                newValue: "new@example.com"
            });
            expect(result.success).toBe(true);
            expect(userApi.requestNewContactOtpApi).toHaveBeenCalledWith({
                type: "EMAIL",
                newValue: "new@example.com"
            });
        });

        it("verifyNewContactOtp validates and completes contact update", async () => {
            vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: "1" } });
            vi.mocked(userApi.verifyNewContactOtpApi).mockResolvedValueOnce({
                success: true,
                data: { message: "Contact updated" }
            } as any);

            const result = await verifyNewContactOtp({
                type: "EMAIL",
                otp: "321305"
            });
            expect(result.success).toBe(true);
            expect(userApi.verifyNewContactOtpApi).toHaveBeenCalledWith({
                type: "EMAIL",
                otp: "321305"
            });
        });
    });
});
