"use client";

import { useState, useCallback, useMemo } from "react";
import { Filter } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import ProductGrid from "@/components/products/ProductGrid";
import FilterPanel from "@/components/home/FilterPanel";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface ProductsClientProps {
    initialProducts: any[];
}

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
    const [products] = useState<any[]>(initialProducts);
    const [isLoading] = useState(false);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{
        category: string;
        subcategory: string[];
        sort: string;
    }>({
        category: "All",
        subcategory: [],
        sort: "latest"
    });

    const handleCategoryChange = useCallback((category: string) => {
        setActiveFilters(prev => ({ ...prev, category, subcategory: [] }));
    }, []);

    const handleSubcategoryChange = useCallback((subcategory: string[]) => {
        setActiveFilters(prev => ({ ...prev, subcategory }));
    }, []);

    const handleSortChange = useCallback((sort: string) => {
        setActiveFilters(prev => ({ ...prev, sort }));
    }, []);

    const filteredProducts = useMemo(() => {
        let result = [...products];

        if (activeFilters.category !== "All") {
            result = result.filter(p => p.category === activeFilters.category);
        }

        if (activeFilters.subcategory.length > 0) {
            result = result.filter(p =>
                p.subcategory?.some((sub: string) => activeFilters.subcategory.includes(sub))
            );
        }

        result.sort((a, b) => {
            if (activeFilters.sort === "latest") return b.id - a.id;
            if (activeFilters.sort === "popular") return (b.rating || 0) - (a.rating || 0);
            return 0;
        });

        return result;
    }, [products, activeFilters]);

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="pt-28"></div>

            <main className="container mx-auto px-4 py-8">
                <Breadcrumbs items={[{ label: "Products" }]} />

                <div className="flex flex-col lg:flex-row gap-10">
                    <aside className="hidden lg:block w-72 flex-shrink-0">
                        <div className="sticky top-32">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Filter className="w-5 h-5 text-orange-500" />
                                Refine Products
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
                                            Refine the product list by choosing your preferred categories.
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

                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-1.5 bg-orange-500 rounded-full" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {activeFilters.category === "All" ? "All Products" : activeFilters.category}
                                    </h2>
                                    <p className="text-sm text-gray-500 font-medium">
                                        Showing {filteredProducts.length} premium items
                                    </p>
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
