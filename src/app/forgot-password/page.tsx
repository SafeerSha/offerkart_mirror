"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

export default function ForgotPasswordPage() {
    const { t } = useTranslation("login");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Placeholder for actual reset logic
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setIsSubmitted(true);
            toast.success(t("forgotPassword.toastSuccess"));
        } catch (error) {
            toast.error(t("forgotPassword.toastError"));
        } finally {
            setIsLoading(false);
        }
    };

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
                            {t("forgotPassword.decorativeTitle").split('\n')[0]}<br />
                            {t("forgotPassword.decorativeTitle").split('\n')[1]}
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
                            { label: t("forgotPassword.pageTitle") }
                        ]}
                    />
                </div>

                <div className="flex-1 flex items-center justify-center px-6 lg:px-16 pb-12">
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("forgotPassword.title")}</h2>
                            <p className="text-gray-600">
                                {isSubmitted 
                                    ? t("forgotPassword.subtitleAfter") 
                                    : t("forgotPassword.subtitleBefore")}
                            </p>
                        </div>

                        {!isSubmitted ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700 font-medium">
                                        {t("form.emailLabel")}
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            className="pl-12 h-12 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl text-base"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {t("forgotPassword.sendLink")}
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-orange-800 text-sm">
                                    {t("forgotPassword.checkInbox").replace("{email}", email)}
                                </div>
                                <button
                                    onClick={() => setIsSubmitted(false)}
                                    className="text-orange-500 font-medium hover:text-orange-600 transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    {t("forgotPassword.tryAnother")}
                                </button>
                            </div>
                        )}

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
