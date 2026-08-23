"use client";

import React from "react";

export function DashboardSkeleton() {
    return (
        <main className="min-h-screen pt-20 lg:pt-22 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4">
                {/* Breadcrumbs Skeleton */}
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-3.5 w-14 bg-gray-200/80 rounded animate-pulse" />
                    <span className="text-gray-300 text-xs">/</span>
                    <div className="h-3.5 w-28 bg-gray-200/80 rounded animate-pulse" />
                </div>

                {/* Header Section Skeleton */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 sm:mb-12">
                    <div className="space-y-2.5 flex-1">
                        <div className="h-10 sm:h-12 w-64 sm:w-80 md:w-96 bg-gray-200/80 rounded-2xl animate-pulse" />
                        <div className="h-4 w-full max-w-xl bg-gray-200/60 rounded-lg animate-pulse" />
                        <div className="h-4 w-3/4 max-w-md bg-gray-200/50 rounded-lg animate-pulse hidden sm:block" />
                    </div>
                    <div className="grid grid-cols-3 md:flex md:flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto shrink-0">
                        <div className="h-9 sm:h-10 w-full md:w-24 bg-gray-200/80 rounded-full animate-pulse" />
                        <div className="h-9 sm:h-10 w-full md:w-28 bg-gray-200/80 rounded-full animate-pulse" />
                        <div className="h-9 sm:h-10 w-full md:w-28 bg-orange-500/20 rounded-full animate-pulse" />
                    </div>
                </div>

                {/* Quick Stats Grid Skeleton */}
                <div className="mb-6 sm:mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Stat Card 1: Offers */}
                        <div className="rounded-2xl border border-gray-100/90 bg-white/80 backdrop-blur-md p-4 flex items-center gap-3.5 shadow-sm">
                            <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                                <div className="w-5 h-5 bg-orange-500/30 rounded-md animate-pulse" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                                <div className="h-3 w-16 bg-gray-200/80 rounded animate-pulse" />
                                <div className="flex items-baseline gap-2">
                                    <div className="h-6 w-10 bg-gray-300/80 rounded-md animate-pulse" />
                                    <div className="h-3 w-16 bg-gray-200/60 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>

                        {/* Stat Card 2: Products */}
                        <div className="rounded-2xl border border-gray-100/90 bg-white/80 backdrop-blur-md p-4 flex items-center gap-3.5 shadow-sm">
                            <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                                <div className="w-5 h-5 bg-orange-500/30 rounded-md animate-pulse" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                                <div className="h-3 w-18 bg-gray-200/80 rounded animate-pulse" />
                                <div className="flex items-baseline gap-2">
                                    <div className="h-6 w-10 bg-gray-300/80 rounded-md animate-pulse" />
                                    <div className="h-3 w-16 bg-gray-200/60 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>

                        {/* Stat Card 3: Views Analytics */}
                        <div className="rounded-2xl border border-gray-100/90 bg-white/80 backdrop-blur-md p-4 flex items-center gap-3.5 shadow-sm sm:col-span-2 md:col-span-1">
                            <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                                <div className="w-5 h-5 bg-orange-500/30 rounded-md animate-pulse" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                                <div className="h-3 w-14 bg-gray-200/80 rounded animate-pulse" />
                                <div className="flex items-center gap-3">
                                    <div className="flex items-baseline gap-1">
                                        <div className="h-6 w-8 bg-gray-300/80 rounded-md animate-pulse" />
                                        <div className="h-2.5 w-8 bg-gray-200/60 rounded animate-pulse" />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <div className="h-6 w-8 bg-gray-300/80 rounded-md animate-pulse" />
                                        <div className="h-2.5 w-8 bg-gray-200/60 rounded animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (2 cols on Desktop, Order-1): Tabs and Offer/Product Items */}
                    <div className="lg:col-span-2 space-y-6 order-1">
                        <div className="overflow-hidden rounded-3xl border border-gray-100/90 bg-white/80 backdrop-blur-md shadow-sm">
                            {/* Tabs Bar Header */}
                            <div className="p-4 pb-3 border-b border-orange-500/10">
                                <div className="flex items-center gap-2">
                                    <div className="h-9 w-24 rounded-lg bg-orange-500/80 animate-pulse" />
                                    <div className="h-9 w-24 rounded-lg bg-gray-100 animate-pulse" />
                                    <div className="h-9 w-24 rounded-lg bg-gray-100 animate-pulse" />
                                </div>
                            </div>

                            {/* Offer Cards (2-column layout matching OffersTab) */}
                            <div className="p-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {[...Array(6)].map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100/90 shadow-sm animate-pulse"
                                        >
                                            {/* Poster Thumbnail */}
                                            <div className="w-16 h-16 rounded-lg bg-gray-200/80 shrink-0 relative overflow-hidden" />
                                            {/* Info */}
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div className="flex items-center justify-between gap-1">
                                                    <div className="h-4 w-3/5 bg-gray-300/80 rounded" />
                                                    <div className="h-3.5 w-12 bg-green-100 rounded-full" />
                                                </div>
                                                <div className="h-3 w-4/5 bg-gray-200/60 rounded" />
                                                <div className="flex items-center gap-2 pt-0.5">
                                                    <div className="h-3 w-14 bg-gray-200/60 rounded" />
                                                    <div className="h-3 w-10 bg-orange-100 rounded" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (1 col on Desktop, Order-2): Shop Profile Spotlight & Utilities */}
                    <div className="lg:col-span-1 space-y-6 order-2">
                        {/* Shop Spotlight Card */}
                        <div className="overflow-hidden rounded-3xl border border-gray-100/90 bg-white/80 backdrop-blur-md shadow-sm">
                            {/* Orange header ribbon */}
                            <div className="h-16 bg-orange-500/[0.08] relative">
                                <div className="absolute top-3 right-3">
                                    <div className="h-5 w-14 bg-gray-200/80 rounded-full animate-pulse" />
                                </div>
                            </div>
                            <div className="px-5 pb-5 -mt-8 relative z-10">
                                <div className="flex flex-col items-center text-center">
                                    {/* Elevated Logo */}
                                    <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-xl ring-4 ring-white">
                                        <div className="w-full h-full rounded-xl bg-orange-500/10 flex items-center justify-center animate-pulse">
                                            <div className="w-7 h-7 bg-orange-500/20 rounded-lg" />
                                        </div>
                                    </div>
                                    <div className="mt-3 w-full flex flex-col items-center space-y-1.5">
                                        <div className="h-5 w-36 bg-gray-300/80 rounded-lg animate-pulse" />
                                        <div className="h-3.5 w-24 bg-gray-200/60 rounded animate-pulse" />
                                    </div>

                                    {/* 3-Column Stats Divider */}
                                    <div className="grid grid-cols-3 gap-2 w-full mt-4 py-2.5 border-y border-orange-500/10">
                                        <div className="text-center space-y-1">
                                            <div className="h-4 w-6 mx-auto bg-gray-300/80 rounded animate-pulse" />
                                            <div className="h-2.5 w-10 mx-auto bg-gray-200/60 rounded animate-pulse" />
                                        </div>
                                        <div className="text-center border-x border-orange-500/10 space-y-1">
                                            <div className="h-4 w-6 mx-auto bg-gray-300/80 rounded animate-pulse" />
                                            <div className="h-2.5 w-12 mx-auto bg-gray-200/60 rounded animate-pulse" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <div className="h-4 w-6 mx-auto bg-gray-300/80 rounded animate-pulse" />
                                            <div className="h-2.5 w-12 mx-auto bg-gray-200/60 rounded animate-pulse" />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-2 w-full mt-4">
                                        <div className="h-9 w-full rounded-xl bg-orange-500/10 animate-pulse" />
                                        <div className="h-9 w-full rounded-xl bg-orange-500/10 animate-pulse" />
                                    </div>
                                    <div className="h-9 w-full rounded-xl bg-rose-50/70 mt-2 border border-rose-100 animate-pulse" />
                                </div>
                            </div>
                        </div>

                        {/* Quick Utilities Card */}
                        <div className="overflow-hidden rounded-3xl border border-gray-100/90 bg-white/80 backdrop-blur-md p-5 shadow-sm">
                            <div className="h-3 w-28 bg-gray-200/80 rounded mb-4 animate-pulse" />
                            <div className="grid grid-cols-3 gap-2.5">
                                <div className="h-16 rounded-xl bg-gray-100/80 animate-pulse" />
                                <div className="h-16 rounded-xl bg-gray-100/80 animate-pulse" />
                                <div className="h-16 rounded-xl bg-gray-100/80 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default DashboardSkeleton;
