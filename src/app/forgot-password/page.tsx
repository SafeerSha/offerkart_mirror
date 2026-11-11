"use client";

export const dynamic = "force-dynamic";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { useTranslation } from "@/hooks/useTranslation";
import { ForgotPasswordFlow, type ForgotPasswordStep } from "@/components/auth/ForgotPasswordFlow";

export default function ForgotPasswordPage() {
    const { t } = useTranslation("login");
    const router = useRouter();
    const [step, setStep] = useState<ForgotPasswordStep>("REQUEST");
    const [email, setEmail] = useState("");

    const handleStepChange = useCallback((nextStep: ForgotPasswordStep, nextEmail: string) => {
        setStep(nextStep);
        setEmail(nextEmail);
    }, []);

    return (
        <main className="min-h-screen w-full flex">
            {/* Left Panel - Decorative (Matching Login) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-rose-500 relative overflow-hidden">
                <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-xl" />
                <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-2xl" />

                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
                            <span className="text-3xl font-bold">O</span>
                        </div>
                        <h1 className="text-5xl font-bold mb-4 leading-tight">
                            {t("forgotPassword.decorativeTitle").split("\n")[0]}<br />
                            {t("forgotPassword.decorativeTitle").split("\n")[1]}
                        </h1>
                        <p className="text-xl text-white/80 max-w-md">
                            {t("forgotPassword.decorativeDesc")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white">
                <div className="p-6 lg:p-8">
                    <Breadcrumbs
                        items={[
                            { label: t("form.title"), href: "/login" },
                            { label: t("forgotPassword.pageTitle") },
                        ]}
                    />
                </div>

                <div className="flex-1 flex items-center justify-center px-6 lg:px-16 pb-12">
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                {step === "REQUEST" && t("forgotPassword.title")}
                                {step === "VERIFY" && "Verify OTP"}
                                {step === "RESET" && "Set New Password"}
                            </h2>
                            <p className="text-gray-600">
                                {step === "REQUEST" && t("forgotPassword.subtitleBefore")}
                                {step === "VERIFY" && `Enter the verification code sent to ${email}.`}
                                {step === "RESET" && "Choose a strong new password (at least 6 characters)."}
                            </p>
                        </div>

                        <ForgotPasswordFlow
                            variant="page"
                            onStepChange={handleStepChange}
                            onSuccess={() => router.push("/login")}
                        />

                        <div className="mt-8 text-center text-sm">
                            <Link
                                href="/login"
                                className="font-semibold text-gray-600 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {t("forgotPassword.backToLogin")}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
