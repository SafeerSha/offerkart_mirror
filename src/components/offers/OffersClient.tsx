"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getPaginatedOffers } from "@/lib/api/offers";
import OfferGrid from "@/components/home/OfferGrid";
import FilterPanel from "@/components/home/FilterPanel";
import FeaturedShops from "@/components/home/FeaturedShops";
import { Loader2, Filter, SlidersHorizontal, AlertTriangle, Tag } from "lucide-react";
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
import { useInfiniteUserOffers, useIndustries } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { useLocationContext } from "@/context/LocationContext";

interface OffersClientProps {
    initialOffers: Offer[];
    initialFeaturedShops: any[];
    hasMoreInitial: boolean;
    initialTotalCount?: number;
}

interface UserCoordinates {
    latitude: number;
    longitude: number;
}

export default function OffersClient({
    initialOffers,
    initialFeaturedShops,
    hasMoreInitial,
    initialTotalCount
}: OffersClientProps) {
    const { t } = useTranslation("common");
    const router = useRouter();
    const searchParams = useSearchParams();
    const { location: globalLocation, hydrated } = useLocationContext();

    const sortOptions = [
        { value: "latest", label: t("catalog.sortLatest") },
        { value: "top", label: t("catalog.sortPopular") },
    ];
    const { data: industriesResponse } = useIndustries();
    const industries = industriesResponse?.success && industriesResponse.data ? industriesResponse.data : [];
    const industryNames = ["All", ...industries.map(ind => ind.name)];

    const initialShopId = searchParams.get("shopId") || undefined;
    const initialSort = searchParams.get("sort") || "latest";
    const initialSearch = searchParams.get("search") || undefined;

    const featuredShops: any[] = initialFeaturedShops || [];
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [userCoordinates, setUserCoordinates] = useState<UserCoordinates | null>(null);

    const [activeFilters, setActiveFilters] = useState<{
        industry: string;
        sort: string;
        shopId?: string;
        search?: string;
    }>({
        industry: "All",
        sort: initialSort,
        shopId: initialShopId || undefined,
        search: initialSearch
    });

    // Sync industry, sort, shopId, and search from URL if they change
    useEffect(() => {
        const industryIdParam = searchParams.get("industryId");
        const shopId = searchParams.get("shopId") || undefined;
        const sortParam = searchParams.get("sort") || "latest";
        const search = searchParams.get("search") || undefined;

        let resolvedIndustryName = "All";
        if (industryIdParam && industryIdParam !== "All") {
            const matched = industries.find(ind => String(ind.id) === String(industryIdParam));
            if (matched) {
                resolvedIndustryName = matched.name;
            } else {
                resolvedIndustryName = "All";
            }
        }

        setActiveFilters(prev => {
            let finalIndustry = resolvedIndustryName;
            if (industryIdParam && industryIdParam !== "All" && industries.length === 0) {
                finalIndustry = prev.industry;
            }

            const isIndustrySame = prev.industry === finalIndustry;
            const isShopIdSame = prev.shopId === shopId;
            const isSortSame = prev.sort === sortParam;
            const isSearchSame = prev.search === search;

            if (isIndustrySame && isShopIdSame && isSortSame && isSearchSame) {
                return prev;
            }
            return {
                industry: finalIndustry,
                shopId: shopId,
                sort: sortParam,
                search: search
            };
        });
    }, [searchParams, industries]);

    const handleIndustryChange = useCallback((industryName: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (industryName === "All") {
            params.delete("industryId");
        } else {
            const matched = industries.find(ind => ind.name === industryName);
            if (matched) {
                params.set("industryId", String(matched.id));
            } else {
                params.delete("industryId");
            }
        }
        router.push(`/offers?${params.toString()}`);
    }, [router, searchParams, industries]);

    const handleSortChange = useCallback((sort: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (sort === "latest") {
            params.delete("sort");
        } else {
            params.set("sort", sort);
        }
        router.push(`/offers?${params.toString()}`);
    }, [router, searchParams]);

    const handleClearFilters = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("industryId");
        params.delete("sort");
        params.delete("search");
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
    const activeIndustryObj = industries.find(ind => ind.name === activeFilters.industry);
    const activeIndustryId = activeIndustryObj ? activeIndustryObj.id : undefined;

    const queryFilters = {
        sort: activeFilters.sort,
        shopId: activeFilters.shopId,
        industry: activeIndustryId,
        search: activeFilters.search,
        latitude: globalLocation.latitude !== null ? globalLocation.latitude : (activeFilters.sort === "nearby" ? userCoordinates?.latitude : undefined),
        longitude: globalLocation.longitude !== null ? globalLocation.longitude : (activeFilters.sort === "nearby" ? userCoordinates?.longitude : undefined),
    };

    const isInitialState = !queryFilters.latitude && !queryFilters.longitude && activeFilters.industry === "All" && activeFilters.sort === "latest" && !activeFilters.search;

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        error
    } = useInfiniteUserOffers(12, queryFilters, {
        enabled: hydrated,
        initialData: (initialOffers.length > 0 && isInitialState)
            ? {
                pages: [{ data: initialOffers, page: 1, limit: 12, count: initialTotalCount ?? initialOffers.length, total: initialTotalCount ?? initialOffers.length, hasMore: hasMoreInitial }],
                pageParams: [1],
            }
            : undefined,
    });

    // Flatten pages into a single array
    const offers = data !== undefined ? data.pages.flatMap(page => page.data) : (isInitialState ? initialOffers : []);
    const totalCount = data?.pages?.[0]?.total ?? data?.pages?.[0]?.count ?? (isInitialState ? (initialTotalCount ?? initialOffers.length) : offers.length);
    // Avoid skeleton flicker when server-rendered initialOffers are already present
    const isLoading = isFetching && offers.length === 0;
    const hasMore = hasNextPage;

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1, rootMargin: "800px" }
        );

        const target = document.querySelector("#scroll-trigger");
        if (target) observer.observe(target);

        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="pt-37 lg:pt-22"></div>

            <main className="container mx-auto px-4 pt-2 pb-24 lg:pb-8">
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
                                    activeCategory={activeFilters.industry}
                                    activeSort={activeFilters.sort}
                                    onCategoryChange={handleIndustryChange}
                                    onSortChange={handleSortChange}
                                    onClearFilters={handleClearFilters}
                                    categoriesOverride={industryNames}
                                    hideSubcategories={true}
                                    categoryLabel="Industry"
                                    sortOptionsOverride={sortOptions}
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
                                        <SheetHeader className="mb-4">
                                            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                                                <Filter className="w-6 h-6 text-orange-500" />
                                                {t("catalog.filters")}
                                            </SheetTitle>
                                        </SheetHeader>
                                        <div className="pb-8">
                                            <FilterPanel
                                                variant="sidebar"
                                                activeCategory={activeFilters.industry}
                                                activeSort={activeFilters.sort}
                                                onCategoryChange={handleIndustryChange}
                                                onSortChange={handleSortChange}
                                                onClearFilters={handleClearFilters}
                                                categoriesOverride={industryNames}
                                                hideSubcategories={true}
                                                categoryLabel="Industry"
                                                sortOptionsOverride={sortOptions}
                                            />
                                        </div>
                                    </SheetContent>
                                </Sheet>

                                <div className="w-[1px] h-6 bg-orange-500/20" />

                                {/* Right: Sort Trigger (using DropdownMenu) */}
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <button className="h-full px-5 flex items-center gap-2 text-gray-800 font-bold hover:text-orange-500 active:scale-95 transition-all outline-none">
                                            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                            <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap truncate max-w-[100px] sm:max-w-[120px]" title={sortOptions.find(o => o.value === activeFilters.sort)?.label || t("catalog.sortBy")}>
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
                                <FeaturedShops
                                    shops={featuredShops}
                                    variant="minimal"
                                    activeShopId={activeFilters.shopId}
                                />
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
                            <div>
                                <div className="flex flex-col gap-0">
                                    <h3
                                        className="text-2xl font-bold text-gray-900 truncate max-w-full flex items-center gap-2"
                                        title={activeFilters.industry === "All" ? t("catalog.allOffers") : activeFilters.industry}
                                    >
                                        <Tag className="w-5 h-5 text-orange-500 shrink-0" />
                                        {activeFilters.industry === "All" ? t("catalog.allOffers") : activeFilters.industry + " Offers"}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-1">
                                        {activeFilters.shopId && (
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 shadow-sm animate-in fade-in duration-300 max-w-full">
                                                    <span className="truncate" title={`Shop: ${featuredShops.find((s: any) => String(s.id) === String(activeFilters.shopId))?.name || `Shop #${activeFilters.shopId}`}`}>
                                                        Shop: {featuredShops.find((s: any) => String(s.id) === String(activeFilters.shopId))?.name || `Shop #${activeFilters.shopId}`}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            const params = new URLSearchParams(searchParams.toString());
                                                            params.delete("shopId");
                                                            router.push(`/offers?${params.toString()}`);
                                                        }}
                                                        data-loader-text="Clearing filter..."
                                                        className="shrink-0 w-4 h-4 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                                                        title="Clear shop filter"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            </div>
                                        )}
                                        {activeFilters.search && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 shadow-sm animate-in fade-in duration-300 max-w-full">
                                                <span className="truncate" title={`Search: "${activeFilters.search}"`}>Search: "{activeFilters.search.length > 30 ? activeFilters.search.substring(0, 30) + '...' : activeFilters.search}"</span>
                                                <button
                                                    onClick={() => {
                                                        const params = new URLSearchParams(searchParams.toString());
                                                        params.delete("search");
                                                        router.push(`/offers?${params.toString()}`);
                                                    }}
                                                    data-loader-text="Clearing filter..."
                                                    className="shrink-0 w-4 h-4 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                                                    title="Clear search filter"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm mt-1">
                                    {t("catalog.showingVerifiedDeals").replace("{count}", totalCount.toString())}
                                    {` ${t("catalog.forYou")}`}
                                </p>


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
