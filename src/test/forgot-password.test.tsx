import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

const {
    forgotPasswordApiMock,
    verifyResetOtpApiMock,
    resetPasswordApiMock,
} = vi.hoisted(() => ({
    forgotPasswordApiMock: vi.fn(),
    verifyResetOtpApiMock: vi.fn(),
    resetPasswordApiMock: vi.fn(),
}));

vi.mock("@/lib/api/user", () => ({
    forgotPasswordApi: forgotPasswordApiMock,
    verifyResetOtpApi: verifyResetOtpApiMock,
    resetPasswordApi: resetPasswordApiMock,
}));

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";

afterEach(() => {
    cleanup();
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe("ForgotPasswordFlow API binding", () => {
    it("completes the 3-step flow and forwards optional resetToken from OTP verification", async () => {
        forgotPasswordApiMock.mockResolvedValue({
            success: true,
            message: "Reset code sent",
        });
        verifyResetOtpApiMock.mockResolvedValue({
            success: true,
            message: "OTP verified",
            data: { resetToken: "rtok-123" },
        });
        resetPasswordApiMock.mockResolvedValue({
            success: true,
            message: "Password updated",
        });

        const onSuccess = vi.fn();
        render(<ForgotPasswordFlow variant="modal" onSuccess={onSuccess} />);

        // Step 1: Request OTP
        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: "merchant@example.com" },
        });
        await waitFor(() => {
            const btn = screen.getByRole("button", { name: /send reset code/i }) as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });
        fireEvent.click(screen.getByRole("button", { name: /send reset code/i }));

        await waitFor(() => {
            expect(forgotPasswordApiMock).toHaveBeenCalledWith({ email: "merchant@example.com" });
            expect(screen.getByLabelText(/one-time password/i)).toBeTruthy();
        });

        // Step 2: Verify OTP
        fireEvent.change(screen.getByLabelText(/one-time password/i), {
            target: { value: "482910" },
        });
        await waitFor(() => {
            const btn = screen.getByRole("button", { name: /verify code/i }) as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });
        fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

        await waitFor(() => {
            expect(verifyResetOtpApiMock).toHaveBeenCalledWith({
                email: "merchant@example.com",
                otp: "482910",
            });
            expect(screen.getByLabelText(/^new password$/i)).toBeTruthy();
        });

        // Step 3: Set New Password
        fireEvent.change(screen.getByLabelText(/^new password$/i), {
            target: { value: "StrongPass123!" },
        });
        fireEvent.change(screen.getByLabelText(/^confirm password$/i), {
            target: { value: "StrongPass123!" },
        });
        await waitFor(() => {
            const btn = screen.getByRole("button", { name: /save new password/i }) as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });
        fireEvent.click(screen.getByRole("button", { name: /save new password/i }));

        await waitFor(() => {
            expect(resetPasswordApiMock).toHaveBeenCalledWith({
                email: "merchant@example.com",
                otp: "482910",
                new_password: "StrongPass123!",
                resetToken: "rtok-123",
            });
            expect(onSuccess).toHaveBeenCalledTimes(1);
        });
    });

    it("omits resetToken when OTP verify response does not include one", async () => {
        forgotPasswordApiMock.mockResolvedValue({ success: true });
        verifyResetOtpApiMock.mockResolvedValue({ success: true, data: {} });
        resetPasswordApiMock.mockResolvedValue({ success: true });

        const onSuccess = vi.fn();
        render(<ForgotPasswordFlow variant="page" onSuccess={onSuccess} />);

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: "user@example.com" },
        });
        await waitFor(() => {
            const btn = screen.getByRole("button", { name: /send reset code/i }) as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });
        fireEvent.click(screen.getByRole("button", { name: /send reset code/i }));

        await waitFor(() => expect(screen.getByLabelText(/one-time password/i)).toBeTruthy());
        fireEvent.change(screen.getByLabelText(/one-time password/i), {
            target: { value: "1234" },
        });
        await waitFor(() => {
            const btn = screen.getByRole("button", { name: /verify code/i }) as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });
        fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

        await waitFor(() => expect(screen.getByLabelText(/^new password$/i)).toBeTruthy());
        fireEvent.change(screen.getByLabelText(/^new password$/i), {
            target: { value: "NewPass99" },
        });
        fireEvent.change(screen.getByLabelText(/^confirm password$/i), {
            target: { value: "NewPass99" },
        });
        await waitFor(() => {
            const btn = screen.getByRole("button", { name: /save new password/i }) as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });
        fireEvent.click(screen.getByRole("button", { name: /save new password/i }));

        await waitFor(() => {
            expect(resetPasswordApiMock).toHaveBeenCalledWith({
                email: "user@example.com",
                otp: "1234",
                new_password: "NewPass99",
            });
            expect(onSuccess).toHaveBeenCalledTimes(1);
        });
    });

    it("does not advance steps and surfaces errors when OTP verification fails", async () => {
        forgotPasswordApiMock.mockResolvedValue({ success: true });
        verifyResetOtpApiMock.mockResolvedValue({
            success: false,
            error: "Invalid or expired OTP",
        });

        render(<ForgotPasswordFlow variant="modal" />);

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: "user@example.com" },
        });
        await waitFor(() => {
            const btn = screen.getByRole("button", { name: /send reset code/i }) as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });
        fireEvent.click(screen.getByRole("button", { name: /send reset code/i }));

        await waitFor(() => expect(screen.getByLabelText(/one-time password/i)).toBeTruthy());
        fireEvent.change(screen.getByLabelText(/one-time password/i), {
            target: { value: "9999" },
        });
        await waitFor(() => {
            const btn = screen.getByRole("button", { name: /verify code/i }) as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });
        fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

        await waitFor(() => {
            expect(screen.getByRole("alert").textContent).toContain("Invalid or expired OTP");
        });
        expect(screen.queryByLabelText(/^new password$/i)).toBeNull();
    });

    it("does not advance steps when forgot-password request returns failure", async () => {
        forgotPasswordApiMock.mockResolvedValue({
            success: false,
            error: "Too many reset attempts. Try again later.",
        });

        render(<ForgotPasswordFlow variant="page" />);

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: "user@example.com" },
        });
        await waitFor(() => {
            const btn = screen.getByRole("button", { name: /send reset code/i }) as HTMLButtonElement;
            expect(btn.disabled).toBe(false);
        });
        fireEvent.click(screen.getByRole("button", { name: /send reset code/i }));

        await waitFor(() => {
            expect(screen.getByRole("alert").textContent).toContain(
                "Too many reset attempts. Try again later."
            );
        });
        expect(screen.queryByLabelText(/one-time password/i)).toBeNull();
    });
});
