"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getPaginatedOffers } from "@/lib/api/offers";
import OfferGrid from "@/components/home/OfferGrid";
import FilterPanel from "@/components/home/FilterPanel";
import FeaturedOffers from "@/components/home/FeaturedOffers";
import { Loader2, Filter } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Offer } from "@/lib/types/offer";

interface OffersClientProps {
    initialOffers: Offer[];
    initialFeaturedShops: any[];
    hasMoreInitial: boolean;
}

interface UserCoordinates {
    latitude: number;
    longitude: number;
}

export default function OffersClient({
    initialOffers,
    initialFeaturedShops,
    hasMoreInitial
}: OffersClientProps) {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get("category") || "All";

    const [offers, setOffers] = useState<Offer[]>(initialOffers);
    const featuredShops = initialFeaturedShops;
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(hasMoreInitial);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [userCoordinates, setUserCoordinates] = useState<UserCoordinates | null>(null);

    const [activeFilters, setActiveFilters] = useState<{
        category: string;
        subcategory: string[];
        sort: string;
    }>({
        category: initialCategory,
        subcategory: [],
        sort: "latest"
    });

    // Sync category from URL if it changes
    useEffect(() => {
        const cat = searchParams.get("category");
        if (cat) {
            setActiveFilters(prev => ({ ...prev, category: cat, subcategory: [] }));
        }
    }, [searchParams]);

    const handleCategoryChange = useCallback((category: string) => {
        setActiveFilters(prev => ({ ...prev, category, subcategory: [] }));
        setPage(1);
        setOffers([]);
        setHasMore(true);
    }, []);

    const handleSubcategoryChange = useCallback((subcategory: string[]) => {
        setActiveFilters(prev => ({ ...prev, subcategory }));
        setPage(1);
        setOffers([]);
        setHasMore(true);
    }, []);

    const handleSortChange = useCallback((sort: string) => {
        setActiveFilters(prev => ({ ...prev, sort }));
        setPage(1);
        setOffers([]);
        setHasMore(true);
    }, []);

    const getUserCoordinates = useCallback(async () => {
        if (userCoordinates) {
            return userCoordinates;
        }

        if (typeof window === "undefined" || !("geolocation" in navigator)) {
            return null;
        }

        return new Promise<UserCoordinates | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coordinates = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                    setUserCoordinates(coordinates);
                    resolve(coordinates);
                },
                (error) => {
                    console.warn("Unable to resolve user location for nearby offers:", error);
                    resolve(null);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000,
                }
            );
        });
    }, [userCoordinates]);

    const fetchMoreOffers = useCallback(async (isInitial: boolean = false) => {
        if (!hasMore && !isInitial) return;

        const targetPage = isInitial ? 1 : page + 1;

        if (isInitial) setIsLoading(true);
        else setIsFetchingNextPage(true);

        try {
            const coordinates = activeFilters.sort === "nearby"
                ? await getUserCoordinates()
                : null;

            const result = await getPaginatedOffers(targetPage, 8, {
                sort: activeFilters.sort,
                latitude: coordinates?.latitude,
                longitude: coordinates?.longitude,
            });

            if (!result.success) {
                throw new Error(result.error || "Failed to load offers");
            }

            let processedData = result.data;
            const supportsCategoryFilter = processedData.some((offer) => offer.category && offer.category !== "Offers");
            const supportsSubcategoryFilter = processedData.some((offer) => Boolean((offer as any).subcategory));

            if (activeFilters.category !== "All" && supportsCategoryFilter) {
                processedData = processedData.filter(o => o.category === activeFilters.category);
            }
            if (activeFilters.subcategory.length > 0 && supportsSubcategoryFilter) {
                processedData = processedData.filter(o => activeFilters.subcategory.includes((o as any).subcategory || ""));
            }

            setOffers(prev => isInitial ? processedData : [...prev, ...processedData]);
            setHasMore(result.hasMore);
            setPage(targetPage);
        } catch (error) {
            console.error("Failed to fetch offers:", error);
        } finally {
            setIsLoading(false);
            setIsFetchingNextPage(false);
        }
    }, [page, hasMore, activeFilters, getUserCoordinates]);

    // Initial fetch when filters change (ignoring the first mountain of initialOffers)
    useEffect(() => {
        // Skip calling if it's the very first mount AND filters match default
        if (activeFilters.category === "All" && activeFilters.subcategory.length === 0 && page === 1 && offers.length === initialOffers.length) {
            return;
        }
        fetchMoreOffers(true);
    }, [activeFilters]);

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isFetchingNextPage && !isLoading) {
                    fetchMoreOffers();
                }
            },
            { threshold: 0.1, rootMargin: "100px" }
        );

        const target = document.querySelector("#scroll-trigger");
        if (target) observer.observe(target);

        return () => observer.disconnect();
    }, [fetchMoreOffers, hasMore, isFetchingNextPage, isLoading]);

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="pt-28"></div>

            <main className="container mx-auto px-4 py-8">
                <Breadcrumbs items={[{ label: "Offers" }]} />

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Left Sidebar - Desktop */}
                    <aside className="hidden lg:block w-72 flex-shrink-0">
                        <div className="sticky top-32">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Filter className="w-5 h-5 text-orange-500" />
                                Refine Results
                            </h2>
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <FilterPanel
                                    variant="sidebar"
                                    activeCategory={activeFilters.category}
                                    activeSubcategory={activeFilters.subcategory}
                                    activeSort={activeFilters.sort}
                                    onCategoryChange={handleCategoryChange}
                                    onSubcategoryChange={handleSubcategoryChange}
                                    onSortChange={handleSortChange}
                                />
                            </div>
                        </div>
                    </aside>

                    <div className="flex-1 w-full overflow-hidden">
                        {/* Mobile Filter Button */}
                        <div className="lg:hidden mb-8">
                            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                                <SheetTrigger asChild>
                                    <button className="w-full h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                                        <Filter className="w-4 h-4" />
                                        Filters & Sorting
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[300px] border-r-0 bg-white">
                                    <SheetHeader className="mb-8">
                                        <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                                            <Filter className="w-6 h-6 text-orange-500" />
                                            Filters
                                        </SheetTitle>
                                        <SheetDescription>
                                            Refine the results by choosing your preferred categories and sorting options.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="pb-8">
                                        <FilterPanel
                                            variant="sidebar"
                                            activeCategory={activeFilters.category}
                                            activeSubcategory={activeFilters.subcategory}
                                            activeSort={activeFilters.sort}
                                            onCategoryChange={handleCategoryChange}
                                            onSubcategoryChange={handleSubcategoryChange}
                                            onSortChange={handleSortChange}
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {featuredShops.length > 0 && (
                            <div className="mb-3">
                                <FeaturedOffers offers={featuredShops} variant="minimal" />
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                                        Offers & Deals
                                    </span>
                                    {(activeFilters.category !== "All" || activeFilters.subcategory.length > 0) && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                                            <span>/</span>
                                            <span className="text-gray-900">{activeFilters.category}</span>
                                            {activeFilters.subcategory.length > 0 && (
                                                <>
                                                    <span>/</span>
                                                    <span className="text-gray-900 line-clamp-1">{activeFilters.subcategory.join(", ")}</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {activeFilters.category === "All" ? "Latest Highlights" : activeFilters.category}
                                    {activeFilters.subcategory.length > 0 && (
                                        <span className="text-gray-400 font-medium">
                                            {" — "}{activeFilters.subcategory.join(", ")}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    Showing verified amazing deals
                                    {activeFilters.subcategory.length > 0 ? " in selected categories" : " for you"}
                                </p>
                            </div>
                        </div>

                        <OfferGrid isLoading={isLoading} offers={offers} disablePagination={true} />

                        <div id="scroll-trigger" className="w-full py-12 flex items-center justify-center">
                            {isFetchingNextPage && (
                                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-2 border-orange-100 border-t-orange-500 animate-spin" />
                                        <Loader2 className="w-5 h-5 text-orange-500 absolute inset-0 m-auto animate-pulse" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 animate-pulse">
                                        Discovering more amazing deals...
                                    </p>
                                </div>
                            )}
                            {!hasMore && !isLoading && offers.length > 0 && (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-500 text-sm font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                        You've caught up with all current deals
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <div className="py-20" />
        </div>
    );
}
