"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { signIn, getSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { hasSuspiciousPattern } from "@/lib/security";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export default function LoginPage() {
    const { t } = useTranslation("login");
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Security check
        if (hasSuspiciousPattern(formData.email) || hasSuspiciousPattern(formData.password)) {
            toast.error(t("form.securityWarning"));
            return;
        }

        setIsLoading(true);
        try {
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                toast.error(result.error || t("form.invalidCredentials"));
            } else if (result?.ok) {
                const session = await getSession();
                toast.success(t("form.loginSuccess"));

                if ((session?.user as any)?.business_name) {
                    router.push("/shop-manager");
                } else {
                    router.push("/");
                }
                router.refresh();
            }
        } catch (error) {
            toast.error(t("form.networkError"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full flex">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-rose-500 relative overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-xl" />
                <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/10 rounded-full blur-lg" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
                            <span className="text-3xl font-bold">O</span>
                        </div>
                        <h1 className="text-5xl font-bold mb-4 leading-tight">
                            {t("decorative.welcome").split('\n')[0]}<br />
                            {t("decorative.welcome").split('\n')[1]}
                        </h1>
                        <p className="text-xl text-white/80 max-w-md">
                            {t("decorative.desc")}
                        </p>
                    </div>

                    <div className="space-y-4 mt-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold">1</span>
                            </div>
                            <span className="text-lg">{t("decorative.point1")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold">2</span>
                            </div>
                            <span className="text-lg">{t("decorative.point2")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold">3</span>
                            </div>
                            <span className="text-lg">{t("decorative.point3")}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white">
                {/* Back to Home */}
                <div className="p-6 lg:p-8 flex items-center justify-between">
                    <Breadcrumbs
                        items={[{ label: t("form.title") }]}
                    />
                    <LanguageSwitcher />
                </div>

                {/* Form Container */}
                <div className="flex-1 flex items-center justify-center px-6 lg:px-16 pb-12">
                    <div className="w-full max-w-md">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-8">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl mb-4">
                                <span className="text-2xl font-bold text-white">O</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">OfferNearU</h2>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("form.title")}</h2>
                            <p className="text-gray-600">
                                {t("form.subtitle")}
                            </p>
                        </div>

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
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-gray-700 font-medium">
                                        {t("form.passwordLabel")}
                                    </Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
                                    >
                                        {t("form.forgotPassword")}
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder={t("form.passwordPlaceholder")}
                                        className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl text-base"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    className="border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                />
                                <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                                    {t("form.rememberMe")}
                                </label>
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
                                        {t("form.submit")}
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>


                        <div className="mt-8 text-center text-sm">
                            <span className="text-gray-600">Don't have an account? </span>
                            <Link
                                href="/shop-registration"
                                className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                            >
                                Register your shop
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
