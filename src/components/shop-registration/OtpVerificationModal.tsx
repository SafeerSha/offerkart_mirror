"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Mail, Phone, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { resendEmailOtp, verifyEmailOtp } from "@/lib/api/shop";

interface OtpVerificationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    email: string;
    phone: string;
    userId?: number;
    onVerified: () => void;
    isSubmitting: boolean;
}

function maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const masked = local.length > 2
        ? local[0] + "***" + local[local.length - 1]
        : local[0] + "***";
    return `${masked}@${domain}`;
}

function maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 4) return phone;
    return "****" + digits.slice(-4);
}

function mockVerifyOtp(otp: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (otp === "000000") {
                resolve({ success: false, message: "Invalid OTP. Please try again." });
            } else if (otp.length === 6) {
                resolve({ success: true, message: "Verified successfully!" });
            } else {
                resolve({ success: false, message: "Please enter a valid 6-digit OTP." });
            }
        }, 800);
    });
}

function OtpInput({
    length = 6,
    value,
    onChange,
    disabled,
}: {
    length?: number;
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, char: string) => {
        if (!/^\d*$/.test(char)) return;
        const newVal = value.split("");
        newVal[index] = char;
        const result = newVal.join("").slice(0, length);
        onChange(result);
        if (char && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
        onChange(pasted);
        const nextIndex = Math.min(pasted.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
    };

    return (
        <div className="flex gap-2 justify-center">
            {Array.from({ length }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ""}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className="w-10 h-12 text-center text-lg font-semibold border border-gray-200 rounded-xl bg-gray-50 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
            ))}
        </div>
    );
}

function ResendTimer({ onResend }: { onResend: () => Promise<void> }) {
    const [countdown, setCountdown] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (countdown <= 0) {
            setCanResend(true);
            return;
        }
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleResend = async () => {
        setIsResending(true);
        try {
            await onResend();
            setCountdown(30);
            setCanResend(false);
        } finally {
            setIsResending(false);
        }
    };

    return canResend ? (
        <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isResending ? (
                <div className="w-3 h-3 border-2 border-orange-600/30 border-t-orange-600 rounded-full animate-spin" />
            ) : (
                <RefreshCw className="w-3 h-3" />
            )}
            {isResending ? "Sending..." : "Resend OTP"}
        </button>
    ) : (
        <p className="text-xs text-gray-400">
            Resend in <span className="font-semibold text-gray-600">{countdown}s</span>
        </p>
    );
}

export default function OtpVerificationModal({
    open,
    onOpenChange,
    email,
    phone,
    userId,
    onVerified,
    isSubmitting,
}: OtpVerificationModalProps) {
    const [emailOtp, setEmailOtp] = useState("");
    const [phoneOtp, setPhoneOtp] = useState("");
    const [emailVerified, setEmailVerified] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        if (open) {
            setEmailOtp("");
            setPhoneOtp("");
            setEmailVerified(false);
            setPhoneVerified(false);
            setEmailError("");
            setPhoneError("");
            setIsVerifying(false);
        }
    }, [open]);

    const handleResendEmail = async () => {
        setEmailError("");
        try {
            const response = await resendEmailOtp({ email });
            if (!response.success) {
                setEmailError(response.error || "Failed to resend OTP. Please try again.");
            }
        } catch {
            setEmailError("Network error. Please try again.");
        }
    };

    const handleVerifyAndRegister = useCallback(async () => {
        setEmailError("");
        setPhoneError("");
        setIsVerifying(true);

        try {
            if (!emailVerified) {
                const emailResult = await verifyEmailOtp({ user_id: userId!, otp: Number(emailOtp) });
                if (!emailResult.success) {
                    setEmailError(emailResult.error || "Invalid OTP. Please try again.");
                    setIsVerifying(false);
                    return;
                }
                setEmailVerified(true);
            }

            if (!phoneVerified) {
                const phoneResult = await mockVerifyOtp(phoneOtp);
                if (!phoneResult.success) {
                    setPhoneError(phoneResult.message);
                    setIsVerifying(false);
                    return;
                }
                setPhoneVerified(true);
            }

            onVerified();
        } catch {
            setEmailError("Verification failed. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    }, [emailOtp, phoneOtp, emailVerified, phoneVerified, onVerified, userId]);

    const bothOtpsFilled = emailOtp.length === 6 && phoneOtp.length === 6;
    const bothVerified = emailVerified && phoneVerified;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-white">
                <div className="bg-orange-500 px-8 py-6 text-white">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-white">
                                    Verify Your Identity
                                </DialogTitle>
                                <DialogDescription className="text-white/80 text-sm mt-1">
                                    We&apos;ve sent verification codes to your email and phone
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-8 py-6 space-y-6 bg-white">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${emailVerified ? "bg-green-50" : "bg-orange-50"}`}>
                                    {emailVerified
                                        ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        : <Mail className="w-4 h-4 text-orange-600" />
                                    }
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Email Verification</p>
                                    <p className="text-xs text-gray-500">{maskEmail(email)}</p>
                                </div>
                            </div>
                            {emailVerified ? (
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Verified ✓</span>
                            ) : (
                                <ResendTimer onResend={handleResendEmail} />
                            )}
                        </div>
                        {!emailVerified && (
                            <OtpInput
                                value={emailOtp}
                                onChange={(val) => { setEmailOtp(val); setEmailError(""); }}
                                disabled={emailVerified}
                            />
                        )}
                        {emailError && (
                            <p className="text-xs text-red-500 flex items-center gap-1 justify-center">
                                <AlertCircle className="w-3 h-3" /> {emailError}
                            </p>
                        )}
                    </div>

                    <div className="border-t border-gray-100" />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${phoneVerified ? "bg-green-50" : "bg-orange-50"}`}>
                                    {phoneVerified
                                        ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        : <Phone className="w-4 h-4 text-orange-600" />
                                    }
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Phone Verification</p>
                                    <p className="text-xs text-gray-500">{maskPhone(phone)}</p>
                                </div>
                            </div>
                            {phoneVerified ? (
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Verified âœ“</span>
                            ) : (
                                <ResendTimer onResend={async () => setPhoneError("")} />
                            )}
                        </div>
                        {!phoneVerified && (
                            <OtpInput
                                value={phoneOtp}
                                onChange={(val) => { setPhoneOtp(val); setPhoneError(""); }}
                                disabled={phoneVerified}
                            />
                        )}
                        {phoneError && (
                            <p className="text-xs text-red-500 flex items-center gap-1 justify-center">
                                <AlertCircle className="w-3 h-3" /> {phoneError}
                            </p>
                        )}
                    </div>
                </div>

                <div className="px-8 pb-6 bg-white">
                    <button
                        type="button"
                        onClick={handleVerifyAndRegister}
                        disabled={!bothOtpsFilled || isVerifying || isSubmitting}
                        className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isVerifying || isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : bothVerified ? (
                            <>
                                Completing Registration...
                                <ArrowRight className="w-5 h-5" />
                            </>
                        ) : (
                            <>
                                Verify & Register
                                <ShieldCheck className="w-5 h-5" />
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-gray-400 text-center mt-3">
                        By verifying, you confirm that you own these contact details
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
