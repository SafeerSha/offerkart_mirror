"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter, SlidersHorizontal, AlertTriangle } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import ProductGrid from "@/components/products/ProductGrid";
import FilterPanel from "@/components/home/FilterPanel";
import FeaturedOffers from "@/components/home/FeaturedOffers";
import { cn } from "@/lib/utils";
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
import { useTranslation } from "@/hooks/useTranslation";
import { getUserProducts } from "@/lib/api/products";
import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import { useUserProductsFiltered, useFeaturedOffers } from "@/hooks/useApi";
import { useLocationContext } from "@/context/LocationContext";

interface ProductsClientProps {
    initialProducts: any[];
    initialFeaturedShops?: any[];
}

export default function ProductsClient({ initialProducts = [], initialFeaturedShops = [] }: ProductsClientProps) {
    const { t } = useTranslation("common");
    const searchParams = useSearchParams();
    const router = useRouter();
    const { location: globalLocation, hydrated } = useLocationContext();

    const initialCategory = searchParams.get("category") || "All";
    const initialSubcategories = searchParams.getAll("subcategory") || [];
    const initialShopId = searchParams.get("shopId") || undefined;
    const initialSearch = searchParams.get("search") || undefined;
    const initialSort = searchParams.get("sort") || "newest";

    const { data: featuredOffersRes } = useFeaturedOffers();
    const featuredShops: any[] = (featuredOffersRes as any)?.success
        ? ((featuredOffersRes as any).data || [])
        : (initialFeaturedShops || []);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{
        search?: string;
        category: string;
        subcategory: string[];
        sort: string;
        shopId?: string;
    }>({
        search: initialSearch,
        category: initialCategory,
        subcategory: initialSubcategories,
        sort: initialSort,
        shopId: initialShopId || undefined
    });

    const isFirstRender = useRef(true);
    const { getCategoryId, resolveHierarchyById, categoryLookup } = useCategoryHierarchy();

    // Auto-fix URL if a subcategory was passed as the main category (e.g. from search results)
    useEffect(() => {
        if (activeFilters.category !== "All" && Object.keys(categoryLookup).length > 0) {
            const resolved = resolveHierarchyById(activeFilters.category);
            if (resolved.main && resolved.sub && resolved.sub === activeFilters.category) {
                const params = new URLSearchParams(searchParams.toString());
                params.set("category", resolved.main);
                params.delete("subcategory");
                params.append("subcategory", resolved.sub);
                router.replace(`/products?${params.toString()}`);
            }
        }
    }, [activeFilters.category, categoryLookup, resolveHierarchyById, router, searchParams]);

    const sortOptions = [
        { value: "newest", label: t("catalog.sortNewest") },
        { value: "top", label: t("catalog.sortPopular") },
        { value: "price_asc", label: t("catalog.sortPriceAsc") },
        { value: "price_desc", label: t("catalog.sortPriceDesc") },
    ];

    // Sync category, subcategories, sort, and shopId from URL if they change
    useEffect(() => {
        const search = searchParams.get("search") || undefined;
        const cat = searchParams.get("category") || "All";
        const shopId = searchParams.get("shopId") || undefined;
        const subs = searchParams.getAll("subcategory") || [];
        const sortParam = searchParams.get("sort") || "newest";
        setActiveFilters(prev => {
            const isSearchSame = prev.search === search;
            const isCategorySame = prev.category === cat;
            const isShopIdSame = prev.shopId === shopId;
            const isSubcategorySame = prev.subcategory.length === subs.length &&
                prev.subcategory.every((val, index) => val === subs[index]);
            const isSortSame = prev.sort === sortParam;

            if (isSearchSame && isCategorySame && isSubcategorySame && isShopIdSame && isSortSame) {
                return prev;
            }
            return {
                search,
                category: cat,
                subcategory: subs,
                shopId: shopId,
                sort: sortParam
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
        const params = new URLSearchParams(searchParams.toString());
        if (sort === "newest") {
            params.delete("sort");
        } else {
            params.set("sort", sort);
        }
        router.push(`/products?${params.toString()}`);
    }, [router, searchParams]);

    const handleClearFilters = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("category");
        params.delete("subcategory");
        params.delete("sort");
        router.push(`/products?${params.toString()}`);
    }, [router, searchParams]);

    let mainCatId: number | null = null;
    let subCatId: number | null = null;

    if (activeFilters.category !== "All") {
        mainCatId = getCategoryId(activeFilters.category);
        if (activeFilters.subcategory.length > 0) {
            subCatId = getCategoryId(activeFilters.category, activeFilters.subcategory[0]);
        }
    }

    const SORT_MAP: Record<string, string> = {
        newest: "newest",
        top: "newest", // Map top to newest to prevent 500 error from upstream backend
        price_asc: "price_asc",
        price_desc: "price_desc",
    };
    const mappedSort = SORT_MAP[activeFilters.sort] || "newest";

    const queryFilters = {
        search: activeFilters.search,
        categoryId: mainCatId ? String(mainCatId) : undefined,
        subcategoryId: subCatId ? String(subCatId) : undefined,
        shopId: activeFilters.shopId,
        sort: mappedSort,
        limit: 100,
        latitude: globalLocation.latitude !== null ? globalLocation.latitude : undefined,
        longitude: globalLocation.longitude !== null ? globalLocation.longitude : undefined,
    };

    const { data: productsData, isLoading: queryLoading, error, refetch } = useUserProductsFiltered(queryFilters, { enabled: hydrated });
    const filteredProducts = productsData || initialProducts || [];
    const isLoading = queryLoading && filteredProducts.length === 0;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="pt-40 lg:pt-28"></div>

            <main className="container mx-auto px-4 pt-2 pb-8 lg:py-8">
                <Breadcrumbs items={[{ label: t("nav.products") }]} />

                <div className="flex flex-col lg:flex-row gap-10">
                    <aside className="hidden lg:block w-60 flex-shrink-0">
                        <div className="sticky top-32">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Filter className="w-5 h-5 text-orange-500" />
                                {t("catalog.refineProducts")}
                            </h2>
                            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                                <FilterPanel
                                    variant="sidebar"
                                    activeCategory={activeFilters.category}
                                    activeSubcategory={activeFilters.subcategory}
                                    activeSort={activeFilters.sort}
                                    onCategoryChange={handleCategoryChange}
                                    onSubcategoryChange={handleSubcategoryChange}
                                    onSortChange={handleSortChange}
                                    onClearFilters={handleClearFilters}
                                    sortOptionsOverride={sortOptions}
                                />
                            </div>
                        </div>
                    </aside>

                    <div className="flex-1">
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
                                                {t("catalog.filtersDescProducts")}
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
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-1.5 bg-orange-500 rounded-full" />
                                <div>
                                    <h2 
                                        className="text-2xl font-bold text-gray-900 truncate max-w-full"
                                        title={activeFilters.category === "All" ? t("catalog.allProducts") : activeFilters.category}
                                    >
                                        {activeFilters.category === "All" ? t("catalog.allProducts") : activeFilters.category}
                                    </h2>
                                    <p className="text-sm text-gray-500 font-medium">
                                        {t("catalog.showingPremiumItems").replace("{count}", filteredProducts.length.toString())}
                                    </p>
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            {activeFilters.shopId && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 shadow-sm animate-in fade-in duration-300 max-w-full">
                                                    <span className="truncate" title={`Shop: ${featuredShops.find((s: any) => String(s.id) === String(activeFilters.shopId))?.name || `Shop #${activeFilters.shopId}`}`}>
                                                        Shop: {featuredShops.find((s: any) => String(s.id) === String(activeFilters.shopId))?.name || `Shop #${activeFilters.shopId}`}
                                                    </span>
                                                    <button 
                                                        onClick={() => {
                                                            const params = new URLSearchParams(searchParams.toString());
                                                            params.delete("shopId");
                                                            router.push(`/products?${params.toString()}`);
                                                        }}
                                                        className="shrink-0 w-4 h-4 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                                                        title="Clear shop filter"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            )}
                                            {activeFilters.search && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 shadow-sm animate-in fade-in duration-300 max-w-full">
                                                    <span className="truncate" title={`Search: "${activeFilters.search}"`}>Search: "{activeFilters.search.length > 30 ? activeFilters.search.substring(0, 30) + '...' : activeFilters.search}"</span>
                                                    <button 
                                                        onClick={() => {
                                                            const params = new URLSearchParams(searchParams.toString());
                                                            params.delete("search");
                                                            router.push(`/products?${params.toString()}`);
                                                        }}
                                                        className="shrink-0 w-4 h-4 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                                                        title="Clear search filter"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            )}
                                        </div>
                                </div>
                            </div>
                        </div>

                        {error && !isLoading && filteredProducts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                                    <AlertTriangle className="w-7 h-7 text-red-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Failed to load products.</p>
                                    <p className="text-xs text-gray-400">{error.message || "Check your connection and try again"}</p>
                                </div>
                                <button
                                    onClick={() => refetch()}
                                    className="px-5 py-2 rounded-full bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        <ProductGrid products={filteredProducts} isLoading={isLoading} />
                    </div>
                </div>
            </main>
        </div>
    );
}
