"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Text, PremiumCard, PremiumButton } from "@/components/shared";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import Link from "next/link";
import { Tag, ShoppingBag, MousePointerClick, ChevronRight } from "@/lib/icons";

export function DashboardSkeleton() {
    return (
        <main className="min-h-screen pt-20 lg:pt-22 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4">
                <Breadcrumbs items={[{ label: "Shop Dashboard" }]} />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 sm:mb-12">
                    <div>
                        <Heading className="text-3xl md:text-4xl lg:text-5xl mb-3">
                            Welcome <span className="text-gradient"></span>
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
                            className="rounded-full shadow-lg shadow-primary/20 w-full md:w-auto justify-center px-1 sm:px-3 md:px-4 py-1.5 md:py-2.5 h-auto text-[11px] sm:text-xs md:text-sm"
                        >
                            <span className="hidden sm:inline">Add Offer</span>
                            <span className="sm:hidden">Offer +</span>
                        </PremiumButton>

                        <PremiumButton
                            className="rounded-full shadow-lg shadow-primary/20 w-full md:w-auto justify-center px-1 sm:px-3 md:px-4 py-1.5 md:py-2.5 h-auto text-[11px] sm:text-xs md:text-sm"
                        >
                            <span className="hidden sm:inline">Add Product</span>
                            <span className="sm:hidden">Product +</span>
                        </PremiumButton>
                    </div>
                </div>

                {/* Quick Stats Skeleton */}
                <div className="mb-6 sm:mb-8">
                    {/* Mobile horizontal swipe skeleton */}
                    <div className="md:hidden">
                        <div className="flex items-center justify-between mb-3">
                            <Skeleton className="h-4 w-24 rounded-full" />
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
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
                                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate mb-1">Offers</h3>
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
                                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate mb-1">Products</h3>
                                            <div className="flex items-baseline gap-2">
                                                <div className="text-xl font-black text-gray-900 tracking-tight">0</div>
                                                <span className="text-[10px] text-gray-400 font-medium truncate">/ 0 paused</span>
                                            </div>
                                        </div>
                                    </div>
                                </PremiumCard>
                            </div>
                            <div className="w-[55vw] sm:w-[220px] flex-none shrink-0 snap-center">
                                <Link href="/shop-manager/analytics" className="block h-full cursor-pointer">
                                    <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 hover:shadow-md transition-all duration-300 rounded-2xl h-full">
                                        <div className="p-3.5 flex items-center gap-3 h-full">
                                            <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                                                <MousePointerClick className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate mb-0.5">Audience Engaged On</h3>
                                                <div className="flex items-center gap-3.5 sm:gap-5">
                                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                                        <Tag className="w-4 h-4 text-primary/70 shrink-0" />
                                                        <span className="text-lg font-black text-gray-900 tracking-tighter leading-none">0</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                                        <ShoppingBag className="w-4 h-4 text-primary/70 shrink-0" />
                                                        <span className="text-lg font-black text-gray-900 tracking-tighter leading-none">0</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </PremiumCard>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Desktop grid skeleton */}
                    <div className="hidden md:grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                        <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl">
                            <div className="p-4 flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate flex items-center gap-1 mb-1">Offers</h3>
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
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate mb-1">Products</h3>
                                    <div className="flex items-baseline gap-2">
                                        <div className="text-2xl font-black text-gray-900 tracking-tighter">0</div>
                                        <span className="text-[11px] text-gray-400 font-medium truncate mt-1">/ 0 paused</span>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>

                        <Link href="/shop-manager/analytics" className="block h-full cursor-pointer">
                            <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 hover:shadow-md transition-all duration-300 rounded-2xl h-full">
                                <div className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4 h-full">
                                    <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0 self-start sm:self-center mt-1 sm:mt-0">
                                        <MousePointerClick className="w-4 h-4 sm:w-6 sm:h-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate flex items-center gap-1 mb-0.5">Audience Engaged On</h3>
                                        <div className="flex items-center gap-3.5 sm:gap-5">
                                            <div className="flex items-center sm:items-end gap-1.5 sm:gap-2">
                                                <Tag className="w-4 h-4 sm:hidden text-primary/70 shrink-0" />
                                                <span className="text-lg sm:text-[24px] font-black text-gray-900 tracking-tighter leading-none">0</span>
                                                <span className="hidden sm:inline text-xs font-semibold text-gray-500">Offers</span>
                                            </div>
                                            <div className="flex items-center sm:items-end gap-1.5 sm:gap-2">
                                                <ShoppingBag className="w-4 h-4 sm:hidden text-primary/70 shrink-0" />
                                                <span className="text-lg sm:text-[24px] font-black text-gray-900 tracking-tighter leading-none">0</span>
                                                <span className="hidden sm:inline text-xs font-semibold text-gray-500">Products</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </PremiumCard>
                        </Link>
                    </div>
                </div>

                {/* Main Content Layout Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
                        <PremiumCard variant="glass" padding="md" className="rounded-3xl border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <Skeleton className="w-12 h-12 rounded-2xl" />
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-3.5 w-1/2" />
                                </div>
                            </div>
                            <Skeleton className="h-10 w-full rounded-xl" />
                        </PremiumCard>
                    </div>

                    <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex gap-4">
                                <Skeleton className="h-8 w-24 rounded-lg" />
                                <Skeleton className="h-8 w-24 rounded-lg" />
                                <Skeleton className="h-8 w-24 rounded-lg" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default DashboardSkeleton;
