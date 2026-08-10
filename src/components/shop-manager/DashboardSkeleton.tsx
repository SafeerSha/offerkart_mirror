"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { PremiumCard } from "@/components/shared";

export function DashboardSkeleton() {
    return (
        <main className="min-h-screen pt-20 lg:pt-22 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4">
                {/* Breadcrumb Skeleton */}
                <div className="mb-4">
                    <Skeleton className="h-4 w-32 rounded-md" />
                </div>

                {/* Header Section Skeleton */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 sm:mb-12">
                    <div className="space-y-3 flex-1">
                        <Skeleton className="h-9 sm:h-11 md:h-12 w-64 sm:w-80 md:w-96 rounded-2xl" />
                        <Skeleton className="h-4 w-full max-w-xl rounded-lg" />
                        <Skeleton className="h-4 w-3/4 max-w-md rounded-lg" />
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <Skeleton className="h-9 sm:h-10 w-24 sm:w-28 rounded-full" />
                        <Skeleton className="h-9 sm:h-10 w-28 sm:w-32 rounded-full" />
                        <Skeleton className="h-9 sm:h-10 w-28 sm:w-32 rounded-full" />
                    </div>
                </div>

                {/* Quick Stats Skeleton Cards */}
                <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <PremiumCard
                            key={i}
                            variant="glass"
                            padding="none"
                            className="overflow-hidden rounded-2xl border border-gray-100/80"
                        >
                            <div className="p-4 flex items-center gap-4">
                                <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                                <div className="space-y-2 flex-1 min-w-0">
                                    <Skeleton className="h-3 w-20 rounded" />
                                    <div className="flex items-baseline gap-2">
                                        <Skeleton className="h-7 w-16 rounded-lg" />
                                        <Skeleton className="h-3.5 w-20 rounded" />
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>
                    ))}
                </div>

                {/* Main Content Layout Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Sidebar Skeleton Card */}
                    <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
                        <PremiumCard variant="glass" padding="md" className="rounded-3xl border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-5 w-3/4 rounded-lg" />
                                    <Skeleton className="h-3.5 w-1/2 rounded" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Skeleton className="h-10 w-full rounded-xl" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        </PremiumCard>
                    </div>

                    {/* Right Main Tabs & Content Skeleton */}
                    <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
                        {/* Tabs Bar Skeleton */}
                        <div className="flex items-center justify-between border-b border-gray-100/80 pb-3">
                            <div className="flex gap-3 sm:gap-4">
                                <Skeleton className="h-9 w-24 rounded-xl" />
                                <Skeleton className="h-9 w-24 rounded-xl" />
                                <Skeleton className="h-9 w-24 rounded-xl" />
                            </div>
                        </div>

                        {/* List Cards Skeleton */}
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <PremiumCard
                                    key={i}
                                    variant="glass"
                                    padding="md"
                                    className="rounded-2xl border border-gray-100/80"
                                >
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <Skeleton className="w-full sm:w-28 h-28 rounded-xl shrink-0" />
                                        <div className="space-y-2.5 flex-1 w-full">
                                            <div className="flex items-center justify-between gap-2">
                                                <Skeleton className="h-5 w-1/2 rounded-lg" />
                                                <Skeleton className="h-6 w-16 rounded-full" />
                                            </div>
                                            <Skeleton className="h-4 w-3/4 rounded" />
                                            <div className="flex items-center gap-3 pt-2">
                                                <Skeleton className="h-4 w-20 rounded" />
                                                <Skeleton className="h-4 w-24 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                </PremiumCard>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default DashboardSkeleton;
