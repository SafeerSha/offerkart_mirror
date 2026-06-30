"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getPaginatedOffers } from "@/lib/api/offers";
import OfferGrid from "@/components/home/OfferGrid";
import FilterPanel from "@/components/home/FilterPanel";
import FeaturedOffers from "@/components/home/FeaturedOffers";
import { Loader2, Filter, SlidersHorizontal, AlertTriangle } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Offer } from "@/lib/types/offer";
import { useTranslation } from "@/hooks/useTranslation";
import { useInfiniteUserOffers } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

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
    const { t } = useTranslation("common");
    const router = useRouter();
    const searchParams = useSearchParams();

    const sortOptions = [
        { value: "latest", label: t("catalog.sortLatest") },
        { value: "popular", label: t("catalog.sortPopular") },
        { value: "nearby", label: t("catalog.sortNearby") },
        { value: "discount", label: t("catalog.sortDiscount") },
    ];
    const initialCategory = searchParams.get("category") || "All";
    const initialShopId = searchParams.get("shopId") || undefined;
    const initialSubcategories = searchParams.getAll("subcategory") || [];

    const featuredShops = initialFeaturedShops;
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [userCoordinates, setUserCoordinates] = useState<UserCoordinates | null>(null);

    const [activeFilters, setActiveFilters] = useState<{
        category: string;
        subcategory: string[];
        sort: string;
        shopId?: string;
    }>({
        category: initialCategory,
        subcategory: initialSubcategories,
        sort: "latest",
        shopId: initialShopId || undefined
    });

    // Sync category, subcategories, and shopId from URL if they change
    useEffect(() => {
        const cat = searchParams.get("category") || "All";
        const shopId = searchParams.get("shopId") || undefined;
        const subs = searchParams.getAll("subcategory") || [];
        setActiveFilters(prev => {
            const isCategorySame = prev.category === cat;
            const isShopIdSame = prev.shopId === shopId;
            const isSubcategorySame = prev.subcategory.length === subs.length &&
                prev.subcategory.every((val, index) => val === subs[index]);

            if (isCategorySame && isSubcategorySame && isShopIdSame) {
                return prev;
            }
            return {
                ...prev,
                category: cat,
                subcategory: subs,
                shopId: shopId
            };
        });
    }, [searchParams]);



    const handleCategoryChange = useCallback((category: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (category === "All") {
            params.delete("category");
        } else {
            params.set("category", category);
        }
        params.delete("subcategory"); // Clear subcategory when category changes
        router.push(`/products?${params.toString()}`);
    }, [router, searchParams]);

    const handleSubcategoryChange = useCallback((subcategory: string[]) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("subcategory");
        subcategory.forEach(sub => params.append("subcategory", sub));
        router.push(`/products?${params.toString()}`);
    }, [router, searchParams]);

    const handleSortChange = useCallback((sort: string) => {
        setActiveFilters(prev => ({ ...prev, sort }));
    }, []);

    const handleClearFilters = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("category");
        params.delete("subcategory");
        setActiveFilters(prev => ({ ...prev, sort: "latest" }));
        router.push(`/offers?${params.toString()}`);
    }, [router, searchParams]);

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

    useEffect(() => {
        if (activeFilters.sort === "nearby") {
            getUserCoordinates();
        }
    }, [activeFilters.sort, getUserCoordinates]);

    // Use React Query for infinite scrolling offers
    // Include coordinates if sort is nearby, otherwise pass nulls to avoid triggering backend geolocation logic
    const queryFilters = {
        ...activeFilters,
        latitude: activeFilters.sort === "nearby" ? userCoordinates?.latitude : undefined,
        longitude: activeFilters.sort === "nearby" ? userCoordinates?.longitude : undefined,
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        status,
        error
    } = useInfiniteUserOffers(8, queryFilters);

    // Flatten pages into a single array
    const offers = data?.pages.flatMap(page => page.data) || initialOffers;
    const isLoading = status === "pending";
    const hasMore = hasNextPage;

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1, rootMargin: "100px" }
        );

        const target = document.querySelector("#scroll-trigger");
        if (target) observer.observe(target);

        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="pt-40 lg:pt-28"></div>

            <main className="container mx-auto px-4 pt-2 pb-8 lg:py-8">
                <Breadcrumbs items={[{ label: t("nav.offers") }]} />

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Left Sidebar - Desktop */}
                    <aside className="hidden lg:block w-60 flex-shrink-0">
                        <div className="sticky top-32">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Filter className="w-5 h-5 text-orange-500" />
                                {t("catalog.refineResults")}
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
                                    onClearFilters={handleClearFilters}
                                />
                            </div>
                        </div>
                    </aside>

                    <div className="flex-1 w-full overflow-hidden">
                        {/* Mobile Filter Button */}
                        <div className="lg:hidden">
                            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 h-12 bg-white/90 backdrop-blur-md border border-orange-500/20 rounded-full flex items-center shadow-lg shadow-orange-500/10 transition-all duration-300">
                                {/* Left: Filter Trigger */}
                                <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                                    <SheetTrigger asChild>
                                        <button className="h-full px-5 flex items-center gap-2 text-gray-800 font-bold hover:text-orange-500 active:scale-95 transition-all">
                                            <Filter className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                            <span className="text-[11px] font-black uppercase tracking-wider">{t("catalog.filters")}</span>
                                        </button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-[300px] border-r-0 bg-white">
                                        <SheetHeader className="mb-8">
                                            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                                                <Filter className="w-6 h-6 text-orange-500" />
                                                {t("catalog.filters")}
                                            </SheetTitle>
                                            <SheetDescription>
                                                {t("catalog.filtersDescOffers")}
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
                                                onClearFilters={handleClearFilters}
                                            />
                                        </div>
                                    </SheetContent>
                                </Sheet>

                                <div className="w-[1px] h-6 bg-orange-500/20" />

                                {/* Right: Sort Trigger (using DropdownMenu) */}
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <button className="h-full px-5 flex items-center gap-2 text-gray-800 font-bold hover:text-orange-500 active:scale-95 transition-all outline-none">
                                            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />
                                            <span className="text-[11px] font-black uppercase tracking-wider">
                                                {sortOptions.find(o => o.value === activeFilters.sort)?.label || t("catalog.sortBy")}
                                            </span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-md border border-orange-500/10 rounded-2xl p-1.5 shadow-2xl w-48 mb-2">
                                        {sortOptions.map((option) => (
                                            <DropdownMenuItem
                                                key={option.value}
                                                onClick={() => handleSortChange(option.value)}
                                                className={cn(
                                                    "rounded-xl cursor-pointer py-2 px-3 text-xs font-semibold transition-all duration-200",
                                                    activeFilters.sort === option.value
                                                        ? "bg-orange-50 text-orange-600"
                                                        : "hover:bg-orange-50/50"
                                                )}
                                            >
                                                {option.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {featuredShops.length > 0 && (
                            <div className="mb-1">
                                <FeaturedOffers
                                    offers={featuredShops}
                                    variant="minimal"
                                    activeShopId={activeFilters.shopId}
                                />
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    {(activeFilters.category !== "All" || activeFilters.subcategory.length > 0) && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                                            <span>/</span>
                                            <span className="text-gray-900">{activeFilters.category === "All" ? t("catalog.all") : activeFilters.category}</span>
                                            {activeFilters.subcategory.length > 0 && (
                                                <>
                                                    <span>/</span>
                                                    <span className="text-gray-900 line-clamp-1">{activeFilters.subcategory.join(", ")}</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <h3 
                                    className="text-2xl font-bold text-gray-900 truncate max-w-full"
                                    title={`${activeFilters.category === "All" ? t("catalog.allOffers") : activeFilters.category}${activeFilters.subcategory.length > 0 ? " — " + activeFilters.subcategory.join(", ") : ""}`}
                                >
                                    {activeFilters.category === "All" ? t("catalog.allOffers") : activeFilters.category}
                                    {activeFilters.subcategory.length > 0 && (
                                        <span className="text-gray-400 font-medium">
                                            {" — "}{activeFilters.subcategory.join(", ")}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    {t("catalog.showingVerifiedDeals").replace("{count}", offers.length.toString())}
                                    {activeFilters.subcategory.length > 0 ? t("catalog.inSelectedCategories") : t("catalog.forYou")}
                                </p>

                                {activeFilters.shopId && (
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 shadow-sm animate-in fade-in duration-300 max-w-full">
                                            <span className="truncate" title={`Shop: ${featuredShops.find(s => String(s.id) === String(activeFilters.shopId))?.name || `Shop #${activeFilters.shopId}`}`}>
                                                Shop: {featuredShops.find(s => String(s.id) === String(activeFilters.shopId))?.name || `Shop #${activeFilters.shopId}`}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const params = new URLSearchParams(searchParams.toString());
                                                    params.delete("shopId");
                                                    router.push(`/offers?${params.toString()}`);
                                                }}
                                                className="shrink-0 w-4 h-4 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                                                title="Clear shop filter"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <OfferGrid isLoading={isLoading} offers={offers} disablePagination={true} columns={5} />

                        {error && !isLoading && offers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                                    <AlertTriangle className="w-7 h-7 text-red-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Failed to load offers.</p>
                                    <p className="text-xs text-gray-400">{error.message || "Check your connection and try again"}</p>
                                </div>
                                <button
                                    onClick={() => fetchNextPage()}
                                    className="px-5 py-2 rounded-full bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        <div id="scroll-trigger" className="w-full py-12 flex items-center justify-center">
                            {isFetchingNextPage && (
                                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-2 border-orange-100 border-t-orange-500 animate-spin" />
                                        <Loader2 className="w-5 h-5 text-orange-500 absolute inset-0 m-auto animate-pulse" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 animate-pulse">
                                        {t("catalog.discoveringMoreDeals")}
                                    </p>
                                </div>
                            )}
                            {!hasMore && !isLoading && offers.length > 0 && (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-500 text-sm font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                        {t("catalog.caughtUpDeals")}
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
