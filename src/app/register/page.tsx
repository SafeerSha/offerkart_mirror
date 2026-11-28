import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import Image from "next/image";
import { Rocket, Sparkles, Heart, Lock, ShieldCheck } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
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
                            Join Our<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-orange-500">
                                Community
                            </span>
                        </h1>
                        <p className="text-base xl:text-lg text-[#faf5ee]/75 max-w-md leading-relaxed">
                            Discover the best local offers, save your favorites, and never miss out on a great deal again.
                        </p>

                        {/* Features */}
                        <div className="grid grid-cols-1 gap-3 mt-8 max-w-md">
                            {[
                                { icon: Sparkles, title: "Exclusive Deals", desc: "Access to members-only discounts and promotions" },
                                { icon: Heart, title: "Save Favorites", desc: "Keep track of the shops and offers you love" },
                                { icon: Rocket, title: "Instant Notifications", desc: "Get alerted when new deals drop in your area" },
                            ].map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-3.5 px-4 py-3.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/20 border border-orange-400/30 flex items-center justify-center shrink-0">
                                        <feature.icon className="w-4 h-4 text-amber-300" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-white">{feature.title}</h3>
                                        <p className="text-xs text-[#faf5ee]/70 mt-0.5">{feature.desc}</p>
                                    </div>
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
                        items={[{ label: "Register" }]}
                    />
                    <LanguageSwitcher />
                </div>

                {/* Form Container */}
                <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-12 pb-8 overflow-y-auto">
                    <div className="w-full max-w-[430px] rounded-[26px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-stone-200/90 dark:border-slate-800 shadow-[0_24px_60px_-20px_rgba(29,23,18,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] p-6 sm:p-9">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-6">
                            <div className="flex items-center justify-center">
                                <Image src="/logo_only.png" alt="Logo" width={36} height={36} className="object-contain drop-shadow-sm" />
                                <Image src="/text_only.png" alt="OfferNearU" width={140} height={42} className="h-7 w-auto object-contain ml-2" />
                            </div>
                        </div>

                        <div className="mb-6 text-center lg:text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1712] dark:text-white mb-1.5">
                                Create an Account
                            </h2>
                            <p className="text-sm text-stone-600 dark:text-slate-400">
                                Enter your details to join OfferNearU
                            </p>
                        </div>

                        <RegisterForm />

                        <div className="mt-2 pt-2 border-t border-stone-200/80 dark:border-slate-800 text-center text-sm flex flex-col gap-2">
                            <div>
                                <span className="text-stone-600 dark:text-slate-400">Already have an account? </span>
                                <Link
                                    href="/login"
                                    className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 transition-colors"
                                >
                                    Sign in
                                </Link>
                            </div>
                            <div>
                                <span className="text-stone-600 dark:text-slate-400">Are you a business owner? </span>
                                <Link
                                    href="/shop-registration"
                                    className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 transition-colors"
                                >
                                    Register your shop
                                </Link>
                            </div>
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
        </main>
    );
}
