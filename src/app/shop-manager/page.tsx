"use client";

import { Heading, Text, SectionTitle } from "@/components/shared/Typography";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import {
    LayoutDashboard,
    Package,
    Tag,
    Settings,
    Plus,
    BarChart3,
    MousePointer2,
    Store,
    Home,
    LogOut
} from "lucide-react";
import Link from "next/link";
import { useRegistration } from "@/hooks/useRegistration";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function ShopManagerPage() {
    const { setRegistrationStatus } = useRegistration();

    const handleLogout = () => {
        setRegistrationStatus(false);
        window.location.href = "/";
    };

    return (
        <main className="min-h-screen pt-24 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4">
                <Breadcrumbs
                    items={[{ label: "Shop Dashboard" }]}
                />
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <LayoutDashboard className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Shop Manager</span>
                        </div>
                        <Heading className="text-3xl md:text-4xl lg:text-5xl mb-3">
                            Welcome back to your <span className="text-gradient">Dashboard</span>
                        </Heading>
                        <Text className="max-w-2xl opacity-80">
                            Manage your shop, list new offers, and track your business performance all in one place.
                        </Text>
                    </div>
                    <div className="flex items-center gap-3">
                        <PremiumButton variant="outline" asChild className="rounded-full" leftIcon={Home}>
                            <Link href="/">Go Home</Link>
                        </PremiumButton>
                        <PremiumButton asChild className="rounded-full shadow-lg shadow-primary/20" leftIcon={Plus}>
                            <Link href="/shop-manager/create-offer">Add New Offer</Link>
                        </PremiumButton>
                        <PremiumButton asChild className="rounded-full shadow-lg shadow-primary/20" leftIcon={Plus}>
                            <Link href="/shop-manager/create-offer">Add Product</Link>
                        </PremiumButton>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard
                        icon={Package}
                        label="Active Offers"
                        value="12"
                        trend="+3 this week"
                    />
                    <StatCard
                        icon={BarChart3}
                        label="Total Views"
                        value="1.2k"
                        trend="+15% vs last month"
                    />
                    <StatCard
                        icon={MousePointer2}
                        label="Audience Engagement"
                        value="48"
                        trend="8 new today"
                    />
                    <StatCard
                        icon={Tag}
                        label="Conversion Rate"
                        value="4.8%"
                        trend="+0.5%"
                    />
                </div>

                {/* Main Content Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Quick Links & Actions - Shows first on mobile */}
                    <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
                        <PremiumCard variant="glass" padding="none">
                            <div className="p-6">
                                <SectionTitle>Quick Actions</SectionTitle>
                                <div className="grid grid-cols-1 gap-3">
                                    <ActionButton icon={Settings} label="Shop Settings" href="/shop-manager/shop-settings" />
                                    <ActionButton icon={Store} label="View Public Profile" />
                                    <ActionButton icon={Package} label="Inventory Manager" />
                                    <div className="pt-3 mt-3 border-t border-primary/10">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/20 hover:border-rose-500/40 hover:from-rose-500/20 hover:to-orange-500/20 transition-all w-full text-left group cursor-pointer"
                                        >
                                            <LogOut className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                                            <span className="font-medium bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">Logout</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>

                        <PremiumCard className="bg-primary/5 border-primary/20">
                            <div className="p-6">
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-primary" />
                                    Pro Tip
                                </h4>
                                <Text className="text-sm leading-relaxed">
                                    Keep your offers fresh! Updating your deals weekly signals to customers that your shop is active, leading to higher trust and repeat visits.
                                </Text>
                            </div>
                        </PremiumCard>
                    </div>

                    {/* Recent Offers - Shows second on mobile */}
                    <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
                        <PremiumCard variant="glass" className="overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <SectionTitle className="mb-0">Recent Offers</SectionTitle>
                                    <Link href="#" className="text-sm font-medium text-primary hover:underline">View All</Link>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-background/40 border border-primary/5 flex items-center justify-between group hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Store className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg">Seasonal Clearance Sale</h4>
                                                <p className="text-sm opacity-60">Posted 2 days ago • Active</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-primary">50% OFF</div>
                                            <span className="text-xs uppercase tracking-widest opacity-40">Discount</span>
                                        </div>
                                    </div>
                                    {/* Placeholder for more items */}
                                    {[1, 2].map((i) => (
                                        <div key={i} className="p-4 rounded-xl border border-dashed border-primary/10 opacity-40 flex items-center justify-center">
                                            <span className="text-sm">Additional offers will appear here</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PremiumCard>
                    </div>
                </div>
            </div>
        </main>
    );
}

function StatCard({ icon: Icon, label, value, trend }: { icon: any, label: string, value: string, trend: string }) {
    return (
        <PremiumCard variant="glass" className="group hover:border-primary/30 transition-all duration-300">
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                        {trend}
                    </span>
                </div>
                <h3 className="text-sm font-medium opacity-60 mb-1">{label}</h3>
                <div className="text-3xl font-bold text-gradient">{value}</div>
            </div>
        </PremiumCard>
    );
}

function ActionButton({ icon: Icon, label, href }: { icon: any, label: string, href?: string }) {
    const content = (
        <>
            <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-medium">{label}</span>
        </>
    );

    if (href) {
        return (
            <Link href={href} className="flex items-center gap-3 p-4 rounded-xl bg-background/40 border border-primary/5 hover:border-primary/30 hover:bg-primary/5 transition-all w-full text-left group">
                {content}
            </Link>
        );
    }

    return (
        <button className="flex items-center gap-3 p-4 rounded-xl bg-background/40 border border-primary/5 hover:border-primary/30 hover:bg-primary/5 transition-all w-full text-left group">
            {content}
        </button>
    );
}
