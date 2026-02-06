"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StaticImageData } from "next/image";
import { getAllOffers } from "@/lib/api/offers";
import OfferGrid from "@/components/home/OfferGrid";
import FilterPanel from "@/components/home/FilterPanel";
import Link from "next/link";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Filter } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

interface Offer {
    id: number;
    shopName: string;
    offerName: string;
    image: string | StaticImageData;
    category: string;
    location: string;
    validUntil: string;
    discount?: string;
    rating?: number;
}

function OffersContent() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get("category") || "All";

    const [offers, setOffers] = useState<Offer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
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

    // Stable Change Handlers
    const handleCategoryChange = useCallback((category: string) => {
        setActiveFilters(prev => ({ ...prev, category, subcategory: [] }));
    }, []);

    const handleSubcategoryChange = useCallback((subcategory: string[]) => {
        setActiveFilters(prev => ({ ...prev, subcategory }));
    }, []);

    const handleSortChange = useCallback((sort: string) => {
        setActiveFilters(prev => ({ ...prev, sort }));
    }, []);

    useEffect(() => {
        async function fetchOffers() {
            try {
                const data = await getAllOffers();
                setOffers(data);
            } catch (error) {
                console.error("Failed to fetch offers:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchOffers();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="pt-28"></div> {/* Spacing for the fixed header */}

            <main className="container mx-auto px-4 py-8">
                <Breadcrumbs
                    items={[{ label: "Offers" }]}
                />

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

                    {/* Content Section */}
                    <div className="flex-1">
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

                        {/* Grid Header */}
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

                        {/* Grid Content */}
                        <OfferGrid isLoading={isLoading} offers={offers} />
                    </div>
                </div>
            </main>

            {/* Bottom Spacer */}
            <div className="py-20" />
        </div>
    );
}

export default function OffersPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50/50 pt-28 flex items-center justify-center">Loading...</div>}>
            <OffersContent />
        </Suspense>
    );
}