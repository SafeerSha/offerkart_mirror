"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <main className="min-h-screen pt-40 lg:pt-32 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4">
                {/* Breadcrumb */}
                <Skeleton className="h-3.5 w-28 mb-8 rounded-full" />

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2.5">
                        <Skeleton className="h-9 w-56 rounded-2xl" />
                        <Skeleton className="h-4 w-80 rounded-lg" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-20 rounded-full" />
                        <Skeleton className="h-9 w-24 rounded-full" />
                        <Skeleton className="h-9 w-28 rounded-full" />
                    </div>
                </div>

                {/* ── Stat Cards (desktop) ── */}
                {/* Mirrors: PremiumCard > div.p-4.flex.items-center.gap-3 > icon-box + (label row + number row) */}
                <div className="hidden md:grid grid-cols-2 xl:grid-cols-5 gap-4 mb-12">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="rounded-2xl border border-gray-100 bg-white/60 backdrop-blur-sm overflow-hidden">
                            <div className="p-4 flex items-center gap-3">
                                {/* Icon box */}
                                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                                <div className="flex-1 min-w-0 space-y-2">
                                    {/* Label + badge row */}
                                    <div className="flex items-center justify-between gap-2">
                                        <Skeleton className="h-2.5 w-14 rounded" />
                                        <Skeleton className="h-4 w-10 rounded-lg" />
                                    </div>
                                    {/* Number + sub-text */}
                                    <div className="flex items-baseline gap-2">
                                        <Skeleton className="h-7 w-8 rounded" />
                                        <Skeleton className="h-2.5 w-16 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Stat Cards (mobile horizontal scroll) ── */}
                <div className="flex gap-4 overflow-hidden mb-12 md:hidden">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-[85vw] sm:w-[240px] flex-none rounded-2xl border border-gray-100 bg-white/60 shrink-0">
                            <div className="p-3.5 flex items-center gap-3">
                                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <Skeleton className="h-2.5 w-12 rounded" />
                                        <Skeleton className="h-3.5 w-10 rounded-lg" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <Skeleton className="h-6 w-7 rounded" />
                                        <Skeleton className="h-2.5 w-14 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
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
