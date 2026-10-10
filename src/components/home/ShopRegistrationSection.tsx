"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
    MoveRight,
    Store,
    PlayCircle,
    Phone,
    Mail,
    Send,
    MessageSquare,
    Headphones,
    CheckCircle2,
    Clock
} from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { Heading, Text, SectionTitle } from "@/components/shared/Typography";
import { OFFICIAL_PLATFORM_CONTACT } from "@/lib/tutorialData";

export default function ShopRegistrationSection() {
    const { data: session, status } = useSession();
    const isShopOwner = !!(session?.user as { business_name?: string } | undefined)?.business_name;
    const isLoading = status === "loading";

    if (isLoading) return null;

    return (
        <section
            id="business-growth-section"
            data-testid="business-growth-section"
            className="relative py-16 lg:py-20 overflow-hidden"
        >
            {/* Background with Image and Gradient Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/shop-registration-bg-light.png"
                    alt="Put your business in the spotlight"
                    fill
                    className="object-cover opacity-80"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/70 dark:from-black dark:via-black/90 dark:to-black/80" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40 dark:from-black/20 dark:to-black/40" />
            </div>

            <div className="container relative z-10 mx-auto px-4 max-w-7xl">
                <PremiumCard
                    variant="glass"
                    padding="none"
                    className="border-none shadow-none bg-transparent"
                >
                    {/* Inline Two-Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                        
                        {/* Left Column: Heading, Value Prop, CTAs & Metrics */}
                        <div className="lg:col-span-7 flex flex-col justify-center">
                            <SectionTitle className="flex items-center gap-2 mb-4">
                                <Store className="w-4 h-4" /> Business Growth
                            </SectionTitle>

                            <Heading className="text-3xl sm:text-4xl lg:text-5xl mb-5 leading-tight">
                                Ready to Put Your <span className="text-gradient">Business in the Spotlight</span>?
                            </Heading>

                            <Text className="text-base sm:text-lg mb-8 max-w-xl text-gray-600 dark:text-gray-300">
                                Join hundreds of elite local shops already connecting with a massive audience.
                                Amplify your reach, drive high-intent footfall, and build a powerful brand presence through our premier discovery network.
                            </Text>

                            {/* CTAs */}
                            <div className="flex flex-wrap items-center gap-3.5 mb-10">
                                <PremiumButton asChild size="lg" className="h-13 px-7 rounded-full shadow-xl shadow-primary/20">
                                    <Link
                                        href={isShopOwner ? "/shop-manager" : "/shop-registration"}
                                        data-testid="shop-onboarding-cta"
                                        className="flex items-center"
                                    >
                                        <Store className="mr-2 w-4 h-4" />
                                        <span>{isShopOwner ? "Manage your shop" : "Add your shop"}</span>
                                        <MoveRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </PremiumButton>

                                <PremiumButton
                                    asChild
                                    variant="outline"
                                    size="lg"
                                    className="h-13 px-7 rounded-full border-2 border-primary/20 hover:bg-primary/5 transition-all duration-300 shadow-sm"
                                >
                                    <Link
                                        href="/contact"
                                        id="showcase-tutorial-cta"
                                        data-testid="showcase-tutorial-cta"
                                        className="flex items-center"
                                    >
                                        <PlayCircle className="mr-2 w-4 h-4 text-primary" />
                                        <span>Platform Tutorial & Showcase</span>
                                    </Link>
                                </PremiumButton>
                            </div>

                            {/* Network Growth Metrics */}
                            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200/60 dark:border-white/10 max-w-lg">
                                <div>
                                    <div className="text-2xl sm:text-3xl font-bold text-gradient mb-0.5">500+</div>
                                    <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">Active Shops</Text>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-bold text-gradient mb-0.5">10k+</div>
                                    <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">Daily Users</Text>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-bold text-gradient mb-0.5">25%</div>
                                    <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">Avg. Growth</Text>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Optimized Inline Support Card */}
                        <div className="lg:col-span-5 w-full">
                            <div
                                id="business-growth-contact"
                                data-testid="business-growth-contact-channels"
                                className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-[#111]/95 backdrop-blur-xl border border-gray-200/90 dark:border-white/10 shadow-xl shadow-orange-500/5 ring-1 ring-black/[0.03] dark:ring-white/5"
                            >
                                {/* Card Header */}
                                <div className="flex items-center justify-between gap-2 mb-4 pb-3.5 border-b border-gray-100 dark:border-white/5">
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] font-semibold mb-1">
                                            <Headphones className="w-3 h-3" />
                                            <span>Official Platform Support</span>
                                        </div>
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug">
                                            Need Assistance Launching?
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-[11px] font-semibold shrink-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>{OFFICIAL_PLATFORM_CONTACT.responseTime}</span>
                                    </div>
                                </div>

                                {/* Compact 2x2 Communication Channels Grid */}
                                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                    {/* 1. Phone Support */}
                                    <a
                                        href={OFFICIAL_PLATFORM_CONTACT.channels[0].href}
                                        data-testid="contact-channel-phone"
                                        className="p-3 sm:p-3.5 rounded-2xl bg-gray-50/90 dark:bg-white/[0.03] hover:bg-orange-50/70 dark:hover:bg-white/[0.08] border border-gray-200/70 dark:border-white/10 transition-all duration-200 group flex flex-col justify-between"
                                        title="Call official merchant hotline"
                                    >
                                        <div>
                                            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-all duration-200 mb-2">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                Phone Hotline
                                            </div>
                                            <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                                                {OFFICIAL_PLATFORM_CONTACT.formattedPhone}
                                            </div>
                                        </div>
                                        <div className="pt-2 mt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                                            <span>Call Hotline</span>
                                            <MoveRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </a>

                                    {/* 2. Email Support */}
                                    <a
                                        href={OFFICIAL_PLATFORM_CONTACT.channels[1].href}
                                        data-testid="contact-channel-email"
                                        className="p-3 sm:p-3.5 rounded-2xl bg-gray-50/90 dark:bg-white/[0.03] hover:bg-blue-50/70 dark:hover:bg-white/[0.08] border border-gray-200/70 dark:border-white/10 transition-all duration-200 group flex flex-col justify-between"
                                        title="Email merchant support desk"
                                    >
                                        <div>
                                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center transition-all duration-200 mb-2">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                Official Email
                                            </div>
                                            <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                                                {OFFICIAL_PLATFORM_CONTACT.supportEmail}
                                            </div>
                                        </div>
                                        <div className="pt-2 mt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                            <span>Email Desk</span>
                                            <MoveRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </a>

                                    {/* 3. WhatsApp Merchant Support */}
                                    <a
                                        href={OFFICIAL_PLATFORM_CONTACT.channels[3].href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        data-testid="contact-channel-whatsapp"
                                        className="p-3 sm:p-3.5 rounded-2xl bg-gray-50/90 dark:bg-white/[0.03] hover:bg-emerald-50/70 dark:hover:bg-white/[0.08] border border-gray-200/70 dark:border-white/10 transition-all duration-200 group flex flex-col justify-between"
                                        title="Chat with support on WhatsApp"
                                    >
                                        <div>
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all duration-200 mb-2">
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                WhatsApp Chat
                                            </div>
                                            <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                                                Instant Messaging
                                            </div>
                                        </div>
                                        <div className="pt-2 mt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                            <span>WhatsApp Chat</span>
                                            <MoveRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </a>

                                    {/* 4. Dedicated Contact View */}
                                    <Link
                                        href="/contact#contact-form"
                                        data-testid="contact-channel-desk"
                                        className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20 border border-orange-500/30 transition-all duration-200 group flex flex-col justify-between"
                                        title="Open merchant contact view"
                                    >
                                        <div>
                                            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center transition-all duration-200 mb-2 shadow-md shadow-orange-500/20">
                                                <Send className="w-4 h-4" />
                                            </div>
                                            <div className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                                                Support Desk
                                            </div>
                                            <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                                                Inquiry Form
                                            </div>
                                        </div>
                                        <div className="pt-2 mt-2 border-t border-orange-500/20 flex items-center justify-between text-[11px] font-bold text-orange-600 dark:text-orange-400">
                                            <span>Open Contact Desk</span>
                                            <MoveRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </Link>
                                </div>

                                {/* Compact Card Footer */}
                                <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1 truncate">
                                        <Clock className="w-3 h-3 text-orange-500 shrink-0" />
                                        <span className="truncate">{OFFICIAL_PLATFORM_CONTACT.hours}</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 font-medium">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                        <span>Verified Desk</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </PremiumCard>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 right-0 w-1/3 h-full z-0 opacity-10 pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(circle_at_bottom_right,hsl(var(--color-primary))_0%,transparent_70%)]" />
            </div>
        </section>
    );
}
