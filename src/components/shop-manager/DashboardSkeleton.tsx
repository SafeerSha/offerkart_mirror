"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Heading, Text, PremiumButton, PremiumCard } from "@/components/shared";
import { Tag, ShoppingBag, MousePointer2, Package, ChevronRight } from "@/lib/icons";

export function DashboardSkeleton() {
    const { data: session } = useSession();
    const router = useRouter();
    const user = session?.user as any;

    return (
        <main className="min-h-screen pt-20 lg:pt-22 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4">
                <Breadcrumbs items={[{ label: "Shop Dashboard" }]} />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 sm:mb-12">
                    <div>
                        <Heading className="text-3xl md:text-4xl lg:text-5xl mb-3">
                            Welcome <span className="text-gradient">{user?.business_name || user?.name || ""}</span>
                        </Heading>
                        <Text className="max-w-2xl opacity-80">
                            Manage your shop, list new offers, offer products and track your business performance all in one place.
                        </Text>
                    </div>
                    <div className="grid grid-cols-3 md:flex md:flex-wrap lg:flex-nowrap items-center gap-2 md:gap-3 w-full md:w-auto">
                        <PremiumButton variant="outline" asChild className="rounded-full w-full md:w-auto justify-center px-1 sm:px-3 md:px-4 py-1.5 md:py-2.5 h-auto text-[11px] sm:text-xs md:text-sm">
                            <Link href="/">
                                <span className="hidden sm:inline">Go Home</span>
                                <span className="sm:hidden">Home</span>
                            </Link>
                        </PremiumButton>

                        <PremiumButton
                            onClick={() => router.push("/shop-manager/create-offer?source=dashboard")}
                            className="rounded-full shadow-lg shadow-primary/20 w-full md:w-auto justify-center px-1 sm:px-3 md:px-4 py-1.5 md:py-2.5 h-auto text-[11px] sm:text-xs md:text-sm"
                        >
                            <span className="hidden sm:inline">Add Offer</span>
                            <span className="sm:hidden">Offer +</span>
                        </PremiumButton>

                        <PremiumButton
                            onClick={() => router.push("/shop-manager/products/add")}
                            className="rounded-full shadow-lg shadow-primary/20 w-full md:w-auto justify-center px-1 sm:px-3 md:px-4 py-1.5 md:py-2.5 h-auto text-[11px] sm:text-xs md:text-sm"
                        >
                            <span className="hidden sm:inline">Add Product</span>
                            <span className="sm:hidden">Product +</span>
                        </PremiumButton>
                    </div>
                </div>

                {/* ── Quick Stats Cards (desktop & mobile) ── */}
                <div className="mb-6 sm:mb-8">
                    {/* Mobile scroll view */}
                    <div className="md:hidden">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-700">Quick Stats</h3>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span>Swipe to view</span>
                                <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
                            </div>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-1">
                            <div className="w-[46vw] sm:w-[240px] flex-none shrink-0 snap-center">
                                <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl">
                                    <div className="p-3.5 flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                                            <Tag className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate flex items-center gap-1">
                                                    <Tag className="w-3 h-3 shrink-0" />
                                                    Offers
                                                </h3>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <div className="text-xl font-black text-gray-900 tracking-tight">0</div>
                                                <span className="text-[10px] text-gray-400 font-medium truncate">/ 0 paused</span>
                                            </div>
                                        </div>
                                    </div>
                                </PremiumCard>
                            </div>
                            <div className="w-[46vw] sm:w-[240px] flex-none shrink-0 snap-center">
                                <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl">
                                    <div className="p-3.5 flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                                            <ShoppingBag className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">Products</h3>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <div className="text-xl font-black text-gray-900 tracking-tight">0</div>
                                                <span className="text-[10px] text-gray-400 font-medium truncate">/ 0 paused</span>
                                            </div>
                                        </div>
                                    </div>
                                </PremiumCard>
                            </div>
                            <div className="w-[55vw] sm:w-[220px] flex-none shrink-0 snap-center">
                                <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl h-full">
                                    <div className="p-3.5 flex items-center gap-3 h-full">
                                        <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                                            <MousePointer2 className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate mb-1">Audience Engaged On</h3>
                                            <div className="flex items-center w-full">
                                                <div className="flex-1 flex items-center gap-1.5">
                                                    <Tag className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                                    <span className="text-lg font-black text-gray-900 tracking-tighter leading-none">0</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-end gap-1.5">
                                                    <Package className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                                    <span className="text-lg font-black text-gray-900 tracking-tighter leading-none">0</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </PremiumCard>
                            </div>
                        </div>
                    </div>

                    {/* Desktop grid view */}
                    <div className="hidden md:grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                        <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl">
                            <div className="p-4 flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate flex items-center gap-1">Offers</h3>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <div className="text-2xl font-black text-gray-900 tracking-tighter">0</div>
                                        <span className="text-[11px] text-gray-400 font-medium truncate mt-1">/ 0 paused</span>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>

                        <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl">
                            <div className="p-4 flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">Products</h3>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <div className="text-2xl font-black text-gray-900 tracking-tighter">0</div>
                                        <span className="text-[11px] text-gray-400 font-medium truncate mt-1">/ 0 paused</span>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>

                        <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl h-full">
                            <div className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4 h-full">
                                <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0 self-start sm:self-center mt-1 sm:mt-0">
                                    <MousePointer2 className="w-4 h-4 sm:w-6 sm:h-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <h3 className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate flex items-center gap-1 mb-1">
                                            Audience Engaged On
                                        </h3>
                                    </div>
                                    <div className="flex items-center w-full">
                                        <div className="flex-1 flex items-end justify-start gap-1.5 sm:gap-2">
                                            <Tag className="md:hidden w-3.5 h-3.5 sm:w-4 h-4 text-primary/70 shrink-0" />
                                            <span className="text-lg sm:text-[24px] font-black text-gray-900 tracking-tighter leading-none">0</span>
                                            <span className="hidden md:inline text-xs font-semibold text-gray-500">Offers</span>
                                        </div>
                                        <div className="flex-1 flex items-end justify-end sm:justify-center gap-1.5 sm:gap-2">
                                            <Package className="md:hidden w-3.5 h-3.5 sm:w-4 h-4 text-primary/70 shrink-0" />
                                            <span className="text-lg sm:text-[24px] font-black text-gray-900 tracking-tighter leading-none">0</span>
                                            <span className="hidden md:inline text-xs font-semibold text-gray-500">Products</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>
                    </div>
                </div>

                {/* ── Main grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── Tabs / Offers panel (col-span-2) ── */}
                    <div className="lg:col-span-2 space-y-6 order-1">
                        <div className="rounded-2xl border border-gray-100 bg-white/60 backdrop-blur-sm overflow-hidden">
                            {/* Tab bar header */}
                            <div className="p-4 pb-0 border-b border-gray-100">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className="flex gap-1 p-1 rounded-xl bg-primary/5">
                                        <Skeleton className="h-8 w-20 rounded-lg" />
                                        <Skeleton className="h-8 w-24 rounded-lg" />
                                    </div>
                                </div>
                            </div>

                            {/* Offer card list — mirrors: grid.grid-cols-1.sm:grid-cols-2 > each offer card */}
                            <div className="p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        /* Mirrors: div.group.relative.flex.items-start.gap-3.p-3.rounded-xl.bg-gray-50/50.border */
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                            {/* Poster thumbnail — w-16 h-16 rounded-lg */}
                                            <Skeleton className="w-16 h-16 rounded-lg shrink-0" />

                                            {/* Text block */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center self-stretch py-0.5 space-y-1.5">
                                                {/* Title */}
                                                <Skeleton className="h-3 w-3/4 rounded" />
                                                {/* Type badge */}
                                                <Skeleton className="h-2.5 w-12 rounded" />
                                                {/* Date + branch chips */}
                                                <div className="flex gap-1">
                                                    <Skeleton className="h-4 w-16 rounded" />
                                                    <Skeleton className="h-4 w-14 rounded" />
                                                </div>
                                            </div>

                                            {/* Right actions col — toggle + time + buttons */}
                                            <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-0.5 gap-1">
                                                <Skeleton className="h-5 w-10 rounded-full" />
                                                <Skeleton className="h-2.5 w-10 rounded" />
                                                <div className="hidden sm:flex gap-1">
                                                    <Skeleton className="h-6 w-6 rounded-lg" />
                                                    <Skeleton className="h-6 w-6 rounded-lg" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Sidebar (col-span-1) ── */}
                    <div className="space-y-6 order-2">

                        {/* Shop Profile card — mirrors: PremiumCard > banner-div.h-16 + px-5.pb-5.-mt-8 > avatar + name + city + stats-grid + buttons */}
                        <div className="rounded-2xl border border-gray-100 bg-white/60 backdrop-blur-sm overflow-hidden">
                            {/* Banner */}
                            <div className="h-16 bg-gray-100/60" />
                            <div className="px-5 pb-5 -mt-8 relative z-10">
                                <div className="flex flex-col items-center text-center">
                                    {/* Avatar — w-16 h-16 rounded-2xl ring-4 ring-white */}
                                    <div className="ring-4 ring-white rounded-2xl">
                                        <Skeleton className="w-16 h-16 rounded-2xl" />
                                    </div>
                                    {/* Shop name */}
                                    <Skeleton className="h-5 w-36 mt-3 rounded-lg" />
                                    {/* City row with icon */}
                                    <Skeleton className="h-3 w-20 mt-2 rounded" />

                                    {/* Stats row — grid-cols-2 with offers / products */}
                                    <div className="grid grid-cols-2 gap-4 w-full mt-4 py-2.5 border-y border-gray-100">
                                        {[1, 2].map((j) => (
                                            <div key={j} className="text-center space-y-1.5">
                                                <Skeleton className="h-3.5 w-6 mx-auto rounded" />
                                                <Skeleton className="h-2 w-10 mx-auto rounded" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action buttons — grid-cols-2 */}
                                    <div className="grid grid-cols-2 gap-2 w-full mt-4">
                                        <Skeleton className="h-10 rounded-xl" />
                                        <Skeleton className="h-10 rounded-xl" />
                                    </div>
                                    {/* Logout button */}
                                    <Skeleton className="h-10 w-full mt-2 rounded-xl" />
                                </div>
                            </div>
                        </div>

                        {/* Quick Utilities card — mirrors: p-5 > SectionTitle + grid-cols-3 of ActionButtons */}
                        <div className="rounded-2xl border border-gray-100 bg-white/60 backdrop-blur-sm overflow-hidden">
                            <div className="p-5">
                                <Skeleton className="h-2.5 w-24 mb-4 rounded" />
                                <div className="grid grid-cols-3 gap-2.5">
                                    {[1, 2, 3].map((j) => (
                                        /* Mirrors: ActionButton variant="grid" — flex-col.items-center.p-4.rounded-2xl.bg-gray-50/50.border */
                                        <div key={j} className="flex flex-col items-center p-4 rounded-2xl bg-gray-50/50 border border-gray-100 gap-2">
                                            <Skeleton className="w-8 h-8 rounded-lg" />
                                            <Skeleton className="h-2.5 w-12 rounded" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}
