import { describe, it, expect } from "vitest";
import type { AuthLoginResponse, AuthLoginData } from "@/lib/types/auth";

describe("Login unverified account flow", () => {
    it("correctly identifies unverified email or phone in login response", () => {
        const unverifiedResponse: AuthLoginResponse = {
            success: false,
            message: "Account verification is pending",
            data: {
                id: "13",
                full_name: "Sheba Biriyani",
                phone: "4564564569",
                email: "sheba@gmail.com",
                business_name: "Sheba Biriyani",
                role: 2,
                isEmailNotVerified: true,
                isPhoneNotVerified: true,
                token: null,
            },
        };

        const resData = unverifiedResponse.data;
        const isEmailUnverified = Boolean(resData?.isEmailNotVerified);
        const isPhoneUnverified = Boolean(resData?.isPhoneNotVerified);
        const isUnverified = isEmailUnverified || isPhoneUnverified;

        expect(isUnverified).toBe(true);
        expect(resData?.id).toBe("13");
        expect(resData?.email).toBe("sheba@gmail.com");
        expect(resData?.token).toBeNull();
    });

    it("correctly handles verified login response", () => {
        const verifiedResponse: AuthLoginResponse = {
            success: true,
            data: {
                id: "13",
                full_name: "Sheba Biriyani",
                email: "sheba@gmail.com",
                token: "valid-jwt-token",
            },
        };

        const resData = verifiedResponse.data;
        const isEmailUnverified = Boolean(resData?.isEmailNotVerified);
        const isPhoneUnverified = Boolean(resData?.isPhoneNotVerified);

        expect(isEmailUnverified).toBe(false);
        expect(isPhoneUnverified).toBe(false);
        expect(resData?.token).toBe("valid-jwt-token");
    });
});
