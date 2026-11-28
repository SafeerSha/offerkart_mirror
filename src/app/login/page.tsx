"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
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
import { loginShop, resendEmailOtp } from "@/lib/api/shop";
import OtpVerificationModal from "@/components/shop-registration/OtpVerificationModal";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { MorphingButton } from "@/components/ui/morphing-button";

export default function LoginPage() {
    const { t } = useTranslation("login");
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [unverifiedUser, setUnverifiedUser] = useState<{
        id?: number | string;
        email: string;
        phone?: string;
    } | null>(null);

    const handleOtpVerified = async () => {
        setShowOtpModal(false);
        toast.success("Account verified successfully! Logging you in...");
        setIsLoading(true);
        try {
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.ok) {
                const session = await getSession();
                toast.success(t("form.loginSuccess"));

                if ((session?.user as { business_name?: string } | undefined)?.business_name) {
                    router.push("/shop-manager");
                } else {
                    router.push("/");
                }
                router.refresh();
            } else {
                toast.success("Verification complete! Please click Sign In to proceed.");
            }
        } catch {
            toast.success("Verification complete! Please sign in.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Security check
        if (hasSuspiciousPattern(formData.email) || hasSuspiciousPattern(formData.password)) {
            toast.error(t("form.securityWarning"));
            return;
        }

        setIsLoading(true);
        try {
            // First check the login credentials & verification state via direct API
            const loginRes = await loginShop({
                email: formData.email,
                password: formData.password,
            });

            const resData = loginRes.data as Record<string, unknown> | undefined;
            const nestedData = resData?.data && typeof resData.data === "object"
                ? (resData.data as Record<string, unknown>)
                : resData;

            const isEmailUnverified = Boolean(nestedData?.isEmailNotVerified);
            // const isPhoneUnverified = Boolean(nestedData?.isPhoneNotVerified); // Disabled pending OTP implementation
            const isUnverified = isEmailUnverified; // || isPhoneUnverified;

            if (isUnverified) {
                const targetEmail = (nestedData?.email as string) || formData.email;
                const targetId = (nestedData?.id as string | number | undefined);
                const targetPhone = (nestedData?.phone as string) || undefined;

                setUnverifiedUser({
                    id: targetId,
                    email: targetEmail,
                    phone: targetPhone,
                });

                // Show toast indicating account is not verified
                toast.error(loginRes.message || "Your account is not verified. Please complete OTP verification.");

                // Trigger OTP resend API
                try {
                    const resendRes = await resendEmailOtp({ email: targetEmail });
                    if (resendRes.success) {
                        toast.info("Verification OTP has been sent to your email.");
                    }
                } catch (resendError) {
                    console.error("Resend OTP error:", resendError);
                }

                // Show the OTP verification modal
                setShowOtpModal(true);
                return;
            }

            if (!loginRes.success) {
                toast.error(loginRes.error || loginRes.message || t("form.invalidCredentials"));
                return;
            }

            // If account is valid & verified, proceed with NextAuth sign in session creation
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

                if ((session?.user as { business_name?: string } | undefined)?.business_name) {
                    router.push("/shop-manager");
                } else {
                    router.push("/");
                }
                router.refresh();
            }
        } catch (error) {
            console.error("Login submission error:", error);
            toast.error(t("form.networkError"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full flex bg-[#faf5ee] dark:bg-slate-950">
            {/* Left Panel - Espresso Editorial Showcase */}
            <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-[#1d1712] via-[#2a1e15] to-[#19130e] relative overflow-hidden">
                {/* Subtle Dot Matrix & Warm Ambient Glows */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(rgba(250, 245, 238, 0.35) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />
                <div aria-hidden="true" className="absolute -top-28 -right-24 w-[420px] h-[420px] bg-orange-500/25 rounded-full blur-[110px] pointer-events-none" />
                <div aria-hidden="true" className="absolute -bottom-32 -left-20 w-[380px] h-[380px] bg-amber-400/15 rounded-full blur-[110px] pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between w-full px-12 xl:px-16 py-11 text-[#faf5ee]">
                    {/* Real Brand Logo Lockup */}
                    <div className="inline-flex items-center gap-2.5 bg-white/95 px-3.5 py-2 rounded-xl w-fit shadow-lg shadow-black/20">
                        <Image src="/logo_only.png" alt="OfferNearU Logo" width={32} height={32} className="object-contain" />
                        <Image src="/text_only.png" alt="OfferNearU" width={130} height={36} className="h-6 w-auto object-contain" />
                    </div>

                    <div className="my-auto py-8">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-300 mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                            </span>
                            <span>Live Neighborhood Deals</span>
                        </div>

                        <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-[1.1] tracking-tight text-white">
                            {t("decorative.welcome").split('\n')[0]}<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-orange-500">
                                {t("decorative.welcome").split('\n')[1]}
                            </span>
                        </h1>
                        <p className="text-base xl:text-lg text-[#faf5ee]/75 max-w-md leading-relaxed">
                            {t("decorative.desc")}
                        </p>

                        <div className="grid grid-cols-1 gap-3 mt-8 max-w-md">
                            {[t("decorative.point1"), t("decorative.point2"), t("decorative.point3")].map((point, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/20 border border-orange-400/30 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-bold text-amber-300">0{idx + 1}</span>
                                    </div>
                                    <span className="text-sm font-medium text-[#faf5ee]/90">{point}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-5 border-t border-white/10 text-xs text-[#faf5ee]/70">
                        <span><strong className="text-white">✓</strong> Verified Local Shops</span>
                        <span>•</span>
                        <span><strong className="text-white">24/7</strong> Live Neighborhood Flyers</span>
                    </div>
                </div>
            </div>

            {/* Right Panel - Warm Alabaster & Glassmorphic Auth Card */}
            <div className="w-full lg:w-[48%] relative flex flex-col min-h-screen bg-[#faf5ee] dark:bg-slate-950 overflow-hidden">
                <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12] pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(rgba(120, 100, 80, 0.22) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />

                {/* Top Navigation */}
                <div className="relative z-30 p-5 sm:p-6 lg:px-10 lg:py-7 flex items-center justify-between">
                    <Breadcrumbs
                        items={[{ label: t("form.title") }]}
                    />
                    <LanguageSwitcher />
                </div>

                {/* Form Container */}
                <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-12 pb-8">
                    <div className="w-full max-w-[430px] rounded-[26px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-stone-200/90 dark:border-slate-800 shadow-[0_24px_60px_-20px_rgba(29,23,18,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] p-6 sm:p-9">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-6">
                            <div className="flex items-center justify-center">
                                <Image src="/logo_only.png" alt="Logo" width={36} height={36} className="object-contain drop-shadow-sm" />
                                <Image src="/text_only.png" alt="OfferNearU" width={140} height={42} className="h-7 w-auto object-contain ml-2" />
                            </div>
                        </div>

                        <div className="mb-7 text-center lg:text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1712] dark:text-white mb-1.5">
                                {t("form.title")}
                            </h2>
                            <p className="text-sm text-stone-600 dark:text-slate-400">
                                {t("form.subtitle")}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-stone-800 dark:text-slate-200 font-medium text-sm">
                                    {t("form.emailLabel")}
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-stone-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        className="pl-11 h-12 bg-[#fcfaf7] dark:bg-slate-950 border-stone-200/90 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-xl text-sm sm:text-base transition-all"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-stone-800 dark:text-slate-200 font-medium text-sm">
                                        {t("form.passwordLabel")}
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotModal(true)}
                                        className="text-xs sm:text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 transition-colors cursor-pointer"
                                    >
                                        {t("form.forgotPassword")}
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-stone-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder={t("form.passwordPlaceholder")}
                                        className="pl-11 pr-12 h-12 bg-[#fcfaf7] dark:bg-slate-950 border-stone-200/90 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-xl text-sm sm:text-base transition-all"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-0.5">
                                <Checkbox
                                    id="remember"
                                    className="border-stone-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                />
                                <label htmlFor="remember" className="text-sm text-stone-600 dark:text-slate-400 cursor-pointer">
                                    {t("form.rememberMe")}
                                </label>
                            </div>

                            <MorphingButton
                                type="submit"
                                isLoading={isLoading}
                                className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all"
                            >
                                <span>{t("form.submit")}</span>
                                <ArrowRight className="w-5 h-5" />
                            </MorphingButton>
                        </form>

                        <div className="mt-6 pt-5 border-t border-stone-200/80 dark:border-slate-800 text-center text-sm">
                            <span className="text-stone-600 dark:text-slate-400">Don&apos;t have an account? </span>
                            <Link
                                href="/register"
                                className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 transition-colors"
                            >
                                Sign up
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Trust Strip */}
                <div className="relative z-10 pb-6 px-4 flex items-center justify-center gap-4 text-[11px] font-medium text-stone-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-orange-500" />
                        Encrypted Session
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        OTP Verified Accounts
                    </span>
                </div>
            </div>

            <OtpVerificationModal
                open={showOtpModal}
                onOpenChange={setShowOtpModal}
                email={unverifiedUser?.email || formData.email}
                userId={unverifiedUser?.id}
                onVerified={handleOtpVerified}
                isSubmitting={isLoading}
            />

            <ForgotPasswordModal 
                isOpen={showForgotModal} 
                onClose={() => setShowForgotModal(false)} 
            />
        </main>
    );
}
