"use client";

import { useCallback, useState } from "react";
import { Mail, ShieldCheck, KeyRound } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ForgotPasswordFlow, type ForgotPasswordStep } from "./ForgotPasswordFlow";

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
    const [step, setStep] = useState<ForgotPasswordStep>("REQUEST");
    const [email, setEmail] = useState("");
    const [resetSignal, setResetSignal] = useState(0);

    const handleStepChange = useCallback((nextStep: ForgotPasswordStep, nextEmail: string) => {
        setStep(nextStep);
        setEmail(nextEmail);
    }, []);

    const handleClose = useCallback(() => {
        setResetSignal((prev) => prev + 1);
        setStep("REQUEST");
        setEmail("");
        onClose();
    }, [onClose]);

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
                            {step === "REQUEST" && "Enter your email address and we'll send you a verification code to reset your password."}
                            {step === "VERIFY" && `Enter the verification code sent to ${email}`}
                            {step === "RESET" && "Your new password must be at least 6 characters long."}
                        </DialogDescription>
                    </DialogHeader>

                    <ForgotPasswordFlow
                        variant="modal"
                        resetSignal={resetSignal}
                        onStepChange={handleStepChange}
                        onSuccess={handleClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
