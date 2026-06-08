import ShopRegistrationForm from "@/components/shop-registration/ShopRegistrationForm";
import Link from "next/link";
import { Rocket, BarChart3, Gem, Store } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export default function ShopRegistrationPage() {
    return (
        <main className="min-h-screen w-full flex">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-orange-500 via-orange-600 to-rose-500 relative overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-xl" />
                <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/10 rounded-full blur-lg" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
                            <Store className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
                            Put Your Business<br />in the Spotlight
                        </h1>
                        <p className="text-lg xl:text-xl text-white/80 max-w-md">
                            Amplify your business's reach and connect with thousands of ready-to-buy local shoppers.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-5 mt-8">
                        {[
                            { icon: Rocket, title: "Fast Listing", desc: "Get your offers live in less than 24 hours" },
                            { icon: BarChart3, title: "Insightful Data", desc: "Detailed analytics on how your offers perform" },
                            { icon: Gem, title: "Premium Support", desc: "Dedicated account manager for your business" },
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
            <div className="w-full lg:w-3/5 flex flex-col min-h-screen bg-white">
                {/* Back to Home */}
                <div className="p-6 lg:p-8 flex items-center justify-between">
                    <Breadcrumbs
                        items={[{ label: "Shop Registration" }]}
                    />
                    <LanguageSwitcher />
                </div>

                {/* Form Container */}
                <div className="flex-1 px-6 lg:px-12 xl:px-16 pb-12 overflow-y-auto">
                    <div className="max-w-2xl mx-auto">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-8">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl mb-4">
                                <Store className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Register Your Shop</h2>
                        </div>


                        <ShopRegistrationForm />

                        <div className="mt-8 text-center text-sm">
                            <span className="text-gray-600">Already have an account? </span>
                            <Link
                                href="/login"
                                className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                            >
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
