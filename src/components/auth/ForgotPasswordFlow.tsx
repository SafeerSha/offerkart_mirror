"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Loader2,
    AlertCircle,
    Mail,
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    ForgotPasswordSchema,
    ForgotPasswordFormData,
    OTPVerificationSchema,
    OTPVerificationFormData,
    ResetPasswordSchema,
    ResetPasswordFormData,
} from "@/lib/types/auth";
import { unwrapApiEnvelope } from "@/lib/api/backendClient";
import {
    forgotPasswordApi,
    verifyResetOtpApi,
    resetPasswordApi,
} from "@/lib/api/user";
import { hasSuspiciousPattern } from "@/lib/security";

export type ForgotPasswordStep = "REQUEST" | "VERIFY" | "RESET";

interface ForgotPasswordFlowProps {
    variant?: "modal" | "page";
    onSuccess?: () => void;
    onStepChange?: (step: ForgotPasswordStep, email: string) => void;
    resetSignal?: number;
}

const RESEND_COOLDOWN_SECONDS = 30;

/** Extracts an optional reset token without relying on a single response nesting convention. */
function extractResetToken(data: unknown): string | undefined {
    if (!data || typeof data !== "object") return undefined;
    const unwrapped = unwrapApiEnvelope<Record<string, unknown>>(data);
    if (!unwrapped || typeof unwrapped !== "object") return undefined;

    for (const key of ["resetToken", "reset_token", "token"] as const) {
        const value = unwrapped[key];
        if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
        }
    }
    return undefined;
}

export function ForgotPasswordFlow({
    variant = "modal",
    onSuccess,
    onStepChange,
    resetSignal = 0,
}: ForgotPasswordFlowProps) {
    const [step, setStep] = useState<ForgotPasswordStep>("REQUEST");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [resetToken, setResetToken] = useState<string | undefined>(undefined);
    const [apiError, setApiError] = useState<string | null>(null);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register: registerRequest,
        handleSubmit: handleSubmitRequest,
        formState: { errors: errorsRequest, isValid: isValidRequest },
        reset: resetRequest,
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(ForgotPasswordSchema),
        mode: "onChange",
    });

    const {
        register: registerVerify,
        handleSubmit: handleSubmitVerify,
        formState: { errors: errorsVerify, isValid: isValidVerify },
        reset: resetVerify,
    } = useForm<OTPVerificationFormData>({
        resolver: zodResolver(OTPVerificationSchema),
        mode: "onChange",
    });

    const {
        register: registerReset,
        handleSubmit: handleSubmitReset,
        formState: { errors: errorsReset, isValid: isValidReset },
        reset: resetReset,
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(ResetPasswordSchema),
        mode: "onChange",
    });

    const resetAllState = () => {
        setStep("REQUEST");
        setEmail("");
        setOtp("");
        setResetToken(undefined);
        setApiError(null);
        setCooldown(0);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        resetRequest();
        resetVerify();
        resetReset();
    };

    useEffect(() => {
        if (resetSignal > 0) {
            resetAllState();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetSignal]);

    useEffect(() => {
        onStepChange?.(step, email);
    }, [step, email, onStepChange]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = window.setTimeout(() => setCooldown((prev) => prev - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [cooldown]);

    const onRequestSubmit = async (data: ForgotPasswordFormData) => {
        const cleanEmail = data.email.trim();
        if (hasSuspiciousPattern(cleanEmail)) {
            const msg = "Invalid characters detected in email address.";
            setApiError(msg);
            toast.error(msg);
            return;
        }

        setIsLoading(true);
        setApiError(null);
        try {
            const res = await forgotPasswordApi({ email: cleanEmail });
            if (!res.success) {
                const msg = res.error || res.message || "Failed to send reset code. Please try again.";
                setApiError(msg);
                toast.error(msg);
                return;
            }

            setEmail(cleanEmail);
            setOtp("");
            setResetToken(undefined);
            resetVerify();
            setCooldown(RESEND_COOLDOWN_SECONDS);
            toast.success(
                res.message || "If an account exists with that email, a verification code has been sent."
            );
            setStep("VERIFY");
        } catch {
            const msg = "Unable to send reset code right now. Please try again.";
            setApiError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!email || cooldown > 0 || isResending) return;

        setIsResending(true);
        setApiError(null);
        try {
            const res = await forgotPasswordApi({ email });
            if (!res.success) {
                const msg = res.error || res.message || "Failed to resend code. Please try again.";
                setApiError(msg);
                toast.error(msg);
                return;
            }

            setCooldown(RESEND_COOLDOWN_SECONDS);
            toast.success(res.message || `Verification code resent to ${email}`);
        } catch {
            const msg = "Failed to resend verification code. Please try again.";
            setApiError(msg);
            toast.error(msg);
        } finally {
            setIsResending(false);
        }
    };

    const onVerifySubmit = async (data: OTPVerificationFormData) => {
        const cleanOtp = data.otp.trim();
        if (hasSuspiciousPattern(cleanOtp)) {
            const msg = "Invalid verification code format.";
            setApiError(msg);
            toast.error(msg);
            return;
        }

        setIsLoading(true);
        setApiError(null);
        try {
            const res = await verifyResetOtpApi({ email, otp: cleanOtp });
            if (!res.success) {
                const msg = res.error || res.message || "Invalid or expired OTP. Please try again.";
                setApiError(msg);
                toast.error(msg);
                return;
            }

            const token = extractResetToken(res.data);
            setOtp(cleanOtp);
            setResetToken(token);
            toast.success(res.message || "OTP verified successfully.");
            setStep("RESET");
        } catch {
            const msg = "Verification failed. Please try again.";
            setApiError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const onResetSubmit = async (data: ResetPasswordFormData) => {
        setIsLoading(true);
        setApiError(null);
        try {
            const res = await resetPasswordApi({
                email,
                otp,
                new_password: data.new_password,
                ...(resetToken ? { resetToken } : {}),
            });

            if (!res.success) {
                const msg = res.error || res.message || "Failed to reset password. Please try again.";
                setApiError(msg);
                toast.error(msg);
                return;
            }

            toast.success(
                res.message || "Password reset successfully! You can now log in with your new password."
            );
            resetAllState();
            onSuccess?.();
        } catch {
            const msg = "Failed to reset password. Please try again.";
            setApiError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const inputSpacingClass = variant === "page" ? "h-12 bg-gray-50 border-gray-200 rounded-xl" : "";
    const submitButtonClass =
        variant === "page"
            ? "w-full h-12 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 mt-2"
            : "w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-11 font-medium mt-4";

    return (
        <div className="space-y-4">
            {apiError && (
                <div
                    role="alert"
                    className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2"
                >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{apiError}</span>
                </div>
            )}

            {step === "REQUEST" && (
                <form onSubmit={handleSubmitRequest(onRequestSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`reset-email-${variant}`}>Email Address</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <Input
                                id={`reset-email-${variant}`}
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                className={`pl-10 ${inputSpacingClass} ${errorsRequest.email ? "border-red-500" : ""}`}
                                {...registerRequest("email")}
                            />
                        </div>
                        {errorsRequest.email && (
                            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-4 h-4" />
                                {errorsRequest.email.message}
                            </p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        disabled={!isValidRequest || isLoading}
                        className={submitButtonClass}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Send Reset Code
                    </Button>
                </form>
            )}

            {step === "VERIFY" && (
                <form onSubmit={handleSubmitVerify(onVerifySubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`reset-otp-${variant}`}>One-Time Password (OTP)</Label>
                        <div className="relative">
                            <Input
                                id={`reset-otp-${variant}`}
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="Enter verification code"
                                maxLength={6}
                                className={`text-center tracking-widest text-lg font-mono ${inputSpacingClass} ${errorsVerify.otp ? "border-red-500" : ""}`}
                                {...registerVerify("otp")}
                            />
                        </div>
                        {errorsVerify.otp && (
                            <p className="text-sm text-red-500 flex items-center justify-center gap-1 mt-1">
                                <AlertCircle className="w-4 h-4" />
                                {errorsVerify.otp.message}
                            </p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        disabled={!isValidVerify || isLoading}
                        className={submitButtonClass}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Verify Code
                    </Button>

                    <div className="flex items-center justify-between pt-1 text-xs">
                        <button
                            type="button"
                            onClick={() => {
                                setStep("REQUEST");
                                setOtp("");
                                setResetToken(undefined);
                                setApiError(null);
                                resetVerify();
                            }}
                            className="text-slate-500 hover:text-orange-600 font-medium inline-flex items-center gap-1 cursor-pointer"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Change email
                        </button>

                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={cooldown > 0 || isResending}
                            className="text-orange-600 hover:text-orange-700 disabled:text-slate-400 font-medium inline-flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
                            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                        </button>
                    </div>
                </form>
            )}

            {step === "RESET" && (
                <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`new-password-${variant}`}>New Password</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <Input
                                id={`new-password-${variant}`}
                                type={showNewPassword ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className={`pl-10 pr-10 ${inputSpacingClass} ${errorsReset.new_password ? "border-red-500" : ""}`}
                                {...registerReset("new_password")}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                            >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errorsReset.new_password && (
                            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-4 h-4" />
                                {errorsReset.new_password.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`confirm-password-${variant}`}>Confirm Password</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <Input
                                id={`confirm-password-${variant}`}
                                type={showConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className={`pl-10 pr-10 ${inputSpacingClass} ${errorsReset.confirm_password ? "border-red-500" : ""}`}
                                {...registerReset("confirm_password")}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errorsReset.confirm_password && (
                            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-4 h-4" />
                                {errorsReset.confirm_password.message}
                            </p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        disabled={!isValidReset || isLoading}
                        className={submitButtonClass}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save New Password
                    </Button>
                </form>
            )}
        </div>
    );
}

