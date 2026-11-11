import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getTokenMock, revalidateTagMock, revalidatePathMock, getSessionMock, signOutMock } = vi.hoisted(() => ({
    getTokenMock: vi.fn(),
    revalidateTagMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    getSessionMock: vi.fn(),
    signOutMock: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({
    getToken: getTokenMock,
}));

vi.mock("next-auth/react", () => ({
    useSession: () => ({ data: null, status: "unauthenticated" }),
    getSession: getSessionMock,
    signOut: signOutMock,
    SessionProvider: ({ children }: { children: unknown }) => children,
}));

vi.mock("next/cache", () => ({
    revalidateTag: revalidateTagMock,
    revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/config.server", () => ({
    config: {
        api: { upstreamBaseUrl: "https://api.example.com" },
        auth: { secret: "test-secret" },
    },
}));

vi.mock("@/lib/config", () => ({
    config: {
        api: {
            upstreamBaseUrl: "https://api.example.com",
            proxyPrefix: "/api/backend",
        },
        site: { url: "http://localhost:3000" },
    },
}));

import { POST } from "@/app/api/backend/[...path]/route";
import {
    forgotPasswordApi,
    verifyResetOtpApi,
    resetPasswordApi,
} from "@/lib/api/user";

describe("Forgot Password API client & proxy public allowlist", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getTokenMock.mockResolvedValue(null);
    });

    it("calls forgot-password, verify-reset-otp, and reset-password as public endpoints without NextAuth session lookups", async () => {
        global.fetch = vi.fn().mockImplementation(async () =>
            new Response(JSON.stringify({ success: true, message: "OK" }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        );

        await forgotPasswordApi({ email: "  merchant@example.com  " });
        await verifyResetOtpApi({ email: " merchant@example.com ", otp: " 123456 " });
        await resetPasswordApi({
            email: "merchant@example.com",
            otp: "123456",
            new_password: "NewPassword1!",
        });

        expect(getSessionMock).not.toHaveBeenCalled();
        expect(signOutMock).not.toHaveBeenCalled();

        const calls = vi.mocked(global.fetch).mock.calls;
        expect(calls).toHaveLength(3);
        expect(calls[0][0]).toBe("https://api.example.com/auth/forgot-password");
        expect(calls[0][1]?.body).toBe(JSON.stringify({ email: "merchant@example.com" }));

        expect(calls[1][0]).toBe("https://api.example.com/auth/verify-reset-otp");
        expect(calls[1][1]?.body).toBe(JSON.stringify({ email: "merchant@example.com", otp: "123456" }));

        expect(calls[2][0]).toBe("https://api.example.com/auth/reset-password");
        expect(calls[2][1]?.body).toBe(
            JSON.stringify({
                email: "merchant@example.com",
                otp: "123456",
                new_password: "NewPassword1!",
            })
        );
    });

    it("does not trigger signOut if public reset endpoints return 401", async () => {
        global.fetch = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: false, message: "Invalid OTP" }), {
                status: 401,
                headers: { "content-type": "application/json" },
            })
        );

        const res = await verifyResetOtpApi({ email: "user@example.com", otp: "0000" });

        expect(res.success).toBe(false);
        expect(res.error).toBe("Invalid OTP");
        expect(signOutMock).not.toHaveBeenCalled();
    });

    it("allows unauthenticated proxy POST to forgot-password endpoints while blocking change-password", async () => {
        global.fetch = vi.fn().mockImplementation(async () =>
            new Response(JSON.stringify({ success: true, message: "OK" }), {
                status: 200,
                headers: { "content-type": "application/json" },
            })
        );

        for (const segments of [
            ["auth", "forgot-password"],
            ["auth", "verify-reset-otp"],
            ["auth", "reset-password"],
        ]) {
            const request = new NextRequest(`http://localhost/api/backend/${segments.join("/")}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: "user@example.com" }),
            });

            const response = await POST(request, {
                params: Promise.resolve({ path: segments }),
            });
            expect(response.status).toBe(200);
        }

        const protectedReq = new NextRequest("http://localhost/api/backend/auth/change-password", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ current_password: "a", new_password: "b" }),
        });

        const protectedRes = await POST(protectedReq, {
            params: Promise.resolve({ path: ["auth", "change-password"] }),
        });
        expect(protectedRes.status).toBe(401);
        expect(global.fetch).toHaveBeenCalledTimes(3);
    });
});

