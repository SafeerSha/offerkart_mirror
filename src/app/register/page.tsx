import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import Image from "next/image";
import { Rocket, Sparkles, Heart } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
    return (
        <main className="min-h-screen w-full flex">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-rose-500 relative overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-xl" />
                <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/10 rounded-full blur-lg" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
                    <div className="mb-8">
                        <Image src="/logo_only.png" alt="Logo" width={40} height={40} className="object-contain drop-shadow-sm" />
                        <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
                            Join Our<br />Community
                        </h1>
                        <p className="text-lg xl:text-xl text-white/80 max-w-md">
                            Discover the best local offers, save your favorites, and never miss out on a great deal again.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-5 mt-8">
                        {[
                            { icon: Sparkles, title: "Exclusive Deals", desc: "Access to members-only discounts and promotions" },
                            { icon: Heart, title: "Save Favorites", desc: "Keep track of the shops and offers you love" },
                            { icon: Rocket, title: "Instant Notifications", desc: "Get alerted when new deals drop in your area" },
                        ].map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                                    <p className="text-sm text-white/70">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Registration Form */}
            <div className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white dark:bg-slate-950">
                {/* Back to Home */}
                <div className="p-6 lg:p-8 flex items-center justify-between">
                    <Breadcrumbs
                        items={[{ label: "Register" }]}
                    />
                    <LanguageSwitcher />
                </div>

                {/* Form Container */}
                <div className="flex-1 px-6 lg:px-12 xl:px-16 pb-12 overflow-y-auto flex items-center justify-center">
                    <div className="max-w-md mx-auto w-full">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-8">
                            <div className="flex items-center justify-center mb-4">
                                <Image src="/logo_only.png" alt="Logo" width={40} height={40} className="object-contain drop-shadow-sm" />
                                <Image src="/text_only.png" alt="OfferNearU" width={150} height={45} className="h-8 w-auto object-contain ml-2" />
                            </div>
                        </div>
                        
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create an Account</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Enter your details to join OfferNearU
                            </p>
                        </div>

                        <RegisterForm />

                        <div className="mt-8 text-center text-sm flex flex-col gap-2">
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
                                <Link
                                    href="/login"
                                    className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                                >
                                    Sign in
                                </Link>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Are you a business owner? </span>
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
            </div>
        </main>
    );
}
