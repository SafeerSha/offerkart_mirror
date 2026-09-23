"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Mail, Lock, ShieldCheck, KeyRound, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    ForgotPasswordSchema,
    ForgotPasswordFormData,
    OTPVerificationSchema,
    OTPVerificationFormData,
    ResetPasswordSchema,
    ResetPasswordFormData
} from "@/lib/types/auth";
import { backend } from "@/lib/api/backendClient";
import { ENDPOINTS } from "@/lib/api/endpoints";

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = "REQUEST" | "VERIFY" | "RESET";

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
    const [step, setStep] = useState<Step>("REQUEST");
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");

    // Form for Step 1: Request Reset
    const {
        register: registerRequest,
        handleSubmit: handleSubmitRequest,
        formState: { errors: errorsRequest, isValid: isValidRequest },
        reset: resetRequest
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(ForgotPasswordSchema),
        mode: "onChange",
    });

    // Form for Step 2: Verify OTP
    const {
        register: registerVerify,
        handleSubmit: handleSubmitVerify,
        formState: { errors: errorsVerify, isValid: isValidVerify },
        reset: resetVerify
    } = useForm<OTPVerificationFormData>({
        resolver: zodResolver(OTPVerificationSchema),
        mode: "onChange",
    });

    // Form for Step 3: Reset Password
    const {
        register: registerReset,
        handleSubmit: handleSubmitReset,
        formState: { errors: errorsReset, isValid: isValidReset },
        reset: resetReset
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(ResetPasswordSchema),
        mode: "onChange",
    });

    const handleClose = () => {
        setStep("REQUEST");
        resetRequest();
        resetVerify();
        resetReset();
        setEmail("");
        setOtp("");
        onClose();
    };

    const onRequestSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        try {
            setEmail(data.email);
            // Mock API Call - replace with real endpoint later
            // const res = await backend.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email: data.email });
            
            // Simulating API latency
            await new Promise((resolve) => setTimeout(resolve, 1000));
            
            toast.success("If an account exists with that email, a password reset link will be sent shortly.");
            setStep("VERIFY");
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const onVerifySubmit = async (data: OTPVerificationFormData) => {
        setIsLoading(true);
        try {
            setOtp(data.otp);
            // Mock API Call - replace with real endpoint later
            // const res = await backend.post(ENDPOINTS.AUTH.VERIFY_RESET_OTP, { email, otp: data.otp });
            
            // Simulating API latency
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Simulating validation for mock
            if (data.otp === "1234") {
                toast.success("OTP verified successfully.");
                setStep("RESET");
            } else {
                toast.error("Invalid or expired OTP. Please try again. (Hint: use 1234)");
            }
        } catch (error) {
            toast.error("Verification failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const onResetSubmit = async (data: ResetPasswordFormData) => {
        setIsLoading(true);
        try {
            // Mock API Call - replace with real endpoint later
            // const res = await backend.post(ENDPOINTS.AUTH.RESET_PASSWORD, { email, otp, new_password: data.new_password });
            
            // Simulating API latency
            await new Promise((resolve) => setTimeout(resolve, 1000));

            toast.success("Password reset successfully! You can now log in with your new password.");
            handleClose();
        } catch (error) {
            toast.error("Failed to reset password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-3xl border-slate-100 dark:border-slate-800 p-0 overflow-hidden">
                <div className="p-8">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-500 rounded-full mb-4 mx-auto">
                            {step === "REQUEST" && <Mail className="w-6 h-6" />}
                            {step === "VERIFY" && <ShieldCheck className="w-6 h-6" />}
                            {step === "RESET" && <KeyRound className="w-6 h-6" />}
                        </div>
                        <DialogTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
                            {step === "REQUEST" && "Forgot Password?"}
                            {step === "VERIFY" && "Verify OTP"}
                            {step === "RESET" && "Set New Password"}
                        </DialogTitle>
                        <DialogDescription className="text-center text-slate-500 dark:text-slate-400 mt-2">
                            {step === "REQUEST" && "Enter your email address and we'll send you instructions to reset your password."}
                            {step === "VERIFY" && `Enter the 4-digit code sent to ${email}`}
                            {step === "RESET" && "Your new password must be at least 6 characters long."}
                        </DialogDescription>
                    </DialogHeader>

                    {step === "REQUEST" && (
                        <form onSubmit={handleSubmitRequest(onRequestSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">Email Address</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        className={`pl-10 ${errorsRequest.email ? 'border-red-500' : ''}`}
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
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-11 font-medium mt-4"
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Send Reset Link
                            </Button>
                        </form>
                    )}

                    {step === "VERIFY" && (
                        <form onSubmit={handleSubmitVerify(onVerifySubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">One-Time Password (OTP)</Label>
                                <div className="relative">
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="Enter code"
                                        maxLength={6}
                                        className={`text-center tracking-widest text-lg font-mono ${errorsVerify.otp ? 'border-red-500' : ''}`}
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
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-11 font-medium mt-4"
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Verify Code
                            </Button>
                        </form>
                    )}

                    {step === "RESET" && (
                        <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new_password">New Password</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <Input
                                        id="new_password"
                                        type="password"
                                        placeholder="••••••••"
                                        className={`pl-10 ${errorsReset.new_password ? 'border-red-500' : ''}`}
                                        {...registerReset("new_password")}
                                    />
                                </div>
                                {errorsReset.new_password && (
                                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errorsReset.new_password.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm_password">Confirm Password</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <Input
                                        id="confirm_password"
                                        type="password"
                                        placeholder="••••••••"
                                        className={`pl-10 ${errorsReset.confirm_password ? 'border-red-500' : ''}`}
                                        {...registerReset("confirm_password")}
                                    />
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
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-11 font-medium mt-4"
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save New Password
                            </Button>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
