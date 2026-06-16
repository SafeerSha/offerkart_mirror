export default function OffersPageSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="pt-48 lg:pt-28" />

            <main className="container mx-auto px-4 py-8">
                {/* Breadcrumbs Skeleton */}
                <nav className="flex mb-6">
                    <ol className="flex items-center gap-2">
                        <li className="flex items-center gap-1.5">
                            <div className="w-3.5 h-3.5 rounded bg-gray-200 animate-pulse" />
                            <div className="hidden sm:block w-10 h-3 rounded-full bg-gray-200 animate-pulse" />
                        </li>
                        <li className="flex items-center">
                            <div className="w-3.5 h-3.5 text-gray-200 animate-pulse">›</div>
                        </li>
                        <li>
                            <div className="w-14 h-3 rounded-full bg-orange-100 animate-pulse" />
                        </li>
                    </ol>
                </nav>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Left Sidebar Skeleton — Desktop */}
                    <aside className="hidden lg:block w-72 flex-shrink-0">
                        <div className="sticky top-32">
                            {/* Sidebar Title */}
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-5 h-5 rounded bg-orange-100 animate-pulse" />
                                <div className="w-28 h-5 rounded-full bg-gray-200 animate-pulse" />
                            </div>
                            {/* Sidebar Panel */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                                {/* Sort Options */}
                                <div className="space-y-3">
                                    <div className="w-16 h-3 rounded-full bg-gray-200 animate-pulse" />
                                    {[...Array(4)].map((_, i) => (
                                        <div key={`sort-${i}`} className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full bg-gray-100 animate-pulse" />
                                            <div
                                                className="h-3.5 rounded-full bg-gray-100 animate-pulse"
                                                style={{ width: `${60 + i * 15}px`, animationDelay: `${i * 0.1}s` }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-gray-100" />
                                {/* Category Options */}
                                <div className="space-y-3">
                                    <div className="w-20 h-3 rounded-full bg-gray-200 animate-pulse" />
                                    {[...Array(5)].map((_, i) => (
                                        <div key={`cat-${i}`} className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-gray-100 animate-pulse" />
                                            <div
                                                className="h-3.5 rounded-full bg-gray-100 animate-pulse"
                                                style={{ width: `${50 + i * 20}px`, animationDelay: `${i * 0.12}s` }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Mobile Filter Button Skeleton */}
                    <div className="lg:hidden mb-8 w-full">
                        <div className="w-full h-12 bg-white border border-gray-200 rounded-xl animate-pulse" />
                    </div>

                    <div className="flex-1 w-full overflow-hidden">
                        {/* Featured Shops Row Skeleton */}
                        <div className="mb-3">
                            <section className="bg-background relative py-8">
                                <div className="container mx-auto px-4">
                                    <div className="relative">
                                        <div className="flex gap-5 sm:gap-8 overflow-hidden pb-4 px-2">
                                            {[...Array(8)].map((_, i) => (
                                                <div
                                                    key={`shop-${i}`}
                                                    className="flex flex-col items-center flex-shrink-0"
                                                    style={{ minWidth: '64px' }}
                                                >
                                                    <div
                                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 animate-pulse"
                                                        style={{ animationDelay: `${i * 0.08}s` }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Section Header Skeleton */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-24 h-3 rounded-full bg-orange-100 animate-pulse" />
                                </div>
                                <div className="w-48 h-7 rounded-full bg-gray-200 animate-pulse mb-1" />
                                <div className="w-56 h-4 rounded-full bg-gray-100 animate-pulse mt-1" />
                            </div>
                        </div>

                        {/* Offer Cards Grid Skeleton */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 md:gap-2 auto-rows-fr">
                            {[...Array(8)].map((_, i) => (
                                <div
                                    key={`card-${i}`}
                                    className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm animate-pulse"
                                    style={{ animationDelay: `${i * 0.07}s` }}
                                >
                                    {/* Image Placeholder */}
                                    <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skeleton-shimmer" />
                                    </div>
                                    {/* Card Content */}
                                    <div className="p-4 sm:p-5 space-y-3">
                                        {/* Shop name */}
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-gray-200" />
                                            <div className="h-3 bg-gray-200 rounded-full w-20" />
                                        </div>
                                        {/* Offer title */}
                                        <div className="h-4 bg-gray-200 rounded-full w-full" />
                                        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
                                        {/* Footer */}
                                        <div className="flex justify-between items-center pt-2">
                                            <div className="h-3 bg-gray-100 rounded-full w-16" />
                                            <div className="h-3 bg-gray-100 rounded-full w-14" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <div className="py-20" />

            {/* Shimmer animation */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .skeleton-shimmer {
                    animation: shimmer 1.8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
