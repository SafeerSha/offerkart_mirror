"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter } from "lucide-react";
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
import { useTranslation } from "@/hooks/useTranslation";
import { getUserProducts } from "@/lib/api/products";
import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";

interface ProductsClientProps {
    initialProducts: any[];
    initialFeaturedShops?: any[];
}

export default function ProductsClient({ initialProducts = [], initialFeaturedShops = [] }: ProductsClientProps) {
    const { t } = useTranslation("common");
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialCategory = searchParams.get("category") || "All";
    const initialSubcategories = searchParams.getAll("subcategory") || [];
    const initialShopId = searchParams.get("shopId") || undefined;

    const [products, setProducts] = useState<any[]>(initialProducts || []);
    const [isLoading, setIsLoading] = useState(false);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
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

    const isFirstRender = useRef(true);
    const { getCategoryId } = useCategoryHierarchy();

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

    const fetchFilteredProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            let mainCatId: number | null = null;
            let subCatId: number | null = null;

            if (activeFilters.category !== "All") {
                mainCatId = getCategoryId(activeFilters.category);
                if (activeFilters.subcategory.length > 0) {
                    subCatId = getCategoryId(activeFilters.category, activeFilters.subcategory[0]);
                }
            }

            const mappedSort = activeFilters.sort === "latest" ? "newest" : "newest";

            const res = await getUserProducts({
                categoryId: mainCatId ? String(mainCatId) : undefined,
                subcategoryId: subCatId ? String(subCatId) : undefined,
                shopId: activeFilters.shopId,
                sort: mappedSort,
                limit: 100
            });

            if (res && res.success && res.data && res.data.data) {
                setProducts(res.data.data);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeFilters, getCategoryId]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            // If the initial filter is not "All" or if we have a shopId, we must fetch filtered products immediately on mount
            if (activeFilters.category === "All" && activeFilters.subcategory.length === 0 && !activeFilters.shopId) {
                return;
            }
        }
        fetchFilteredProducts();
    }, [activeFilters, fetchFilteredProducts]);

    console.log("ProductsClient render products:", products, "isArray:", Array.isArray(products));
    const filteredProducts = products || [];

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="pt-40 lg:pt-28"></div>

            <main className="container mx-auto px-4 pt-2 pb-8 lg:py-8">
                <Breadcrumbs items={[{ label: t("nav.products") }]} />

                <div className="flex flex-col lg:flex-row gap-10">
                    <aside className="hidden lg:block w-72 flex-shrink-0">
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
                                />
                            </div>
                        </div>
                    </aside>

                    <div className="flex-1">
                        <div className="lg:hidden mb-4">
                            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                                <SheetTrigger asChild>
                                    <button className="w-full h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                                        <Filter className="w-4 h-4" />
                                        {t("catalog.filtersSorting")}
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
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {initialFeaturedShops.length > 0 && (
                            <div className="mb-1">
                                <FeaturedOffers 
                                    offers={initialFeaturedShops} 
                                    variant="minimal" 
                                    activeShopId={activeFilters.shopId}
                                />
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-1.5 bg-orange-500 rounded-full" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {activeFilters.category === "All" ? t("catalog.allProducts") : activeFilters.category}
                                    </h2>
                                    <p className="text-sm text-gray-500 font-medium">
                                        {t("catalog.showingPremiumItems").replace("{count}", filteredProducts.length.toString())}
                                    </p>
                                    {activeFilters.shopId && (
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 shadow-sm animate-in fade-in duration-300">
                                                <span>Shop: {initialFeaturedShops.find(s => String(s.id) === String(activeFilters.shopId))?.name || `Shop #${activeFilters.shopId}`}</span>
                                                <button 
                                                    onClick={() => {
                                                        const params = new URLSearchParams(searchParams.toString());
                                                        params.delete("shopId");
                                                        router.push(`/products?${params.toString()}`);
                                                    }}
                                                    className="w-4 h-4 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                                                    title="Clear shop filter"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <ProductGrid products={filteredProducts} isLoading={isLoading} />
                    </div>
                </div>
            </main>
        </div>
    );
}
