"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Heading, Text } from "@/components/shared/Typography";
import FilterPanel from "./FilterPanel";
import OfferGrid from "./OfferGrid";
import { Offer } from "@/lib/types/offer";

interface FilterableOffersProps {
    initialOffers: Offer[];
    buttonText: string;
}

export default function FilterableOffers({ initialOffers = [], buttonText }: FilterableOffersProps) {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState("All");
    const [activeSubcategory, setActiveSubcategory] = useState<string[]>([]);
    const [activeSort, setActiveSort] = useState("latest");

    // Filter offers client-side
    const filteredOffers = useMemo(() => {
        let result = [...initialOffers];

        // 1. Category Filter
        if (activeCategory !== "All") {
            result = result.filter(o => {
                const offerCat = o.category || "";
                return offerCat.toLowerCase() === activeCategory.toLowerCase();
            });
        }

        // 2. Subcategory Filter
        if (activeSubcategory.length > 0) {
            result = result.filter(o => {
                const offerSub = (o as any).subcategory || "";
                return activeSubcategory.some(sub => sub.toLowerCase() === offerSub.toLowerCase());
            });
        }

        // 3. Sort
        if (activeSort === "popular" || activeSort === "top") {
            result.sort((a, b) => {
                const ratingA = (a as any).rating || 0;
                const ratingB = (b as any).rating || 0;
                return ratingB - ratingA;
            });
        } else if (activeSort === "discount") {
            result.sort((a, b) => Number(b.id || b.offerId || 0) - Number(a.id || a.offerId || 0));
        } else {
            result.sort((a, b) => Number(b.id || b.offerId || 0) - Number(a.id || a.offerId || 0));
        }

        return result;
    }, [initialOffers, activeCategory, activeSubcategory, activeSort]);

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 text-xs font-bold uppercase tracking-[0.15em] mb-4 border border-orange-500/15 animate-fade-in">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Exclusive Offers</span>
                    </div>
                    <Heading className="text-3xl md:text-5xl font-extrabold tracking-tight">
                        Latest <span className="text-gradient">Offers</span>
                    </Heading>
                    <Text className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl">
                        Find the best deals and promotions from top local shops near you.
                    </Text>
                </div>

                <PremiumButton
                    variant="outline"
                    onClick={() => router.push("/offers")}
                    className="rounded-2xl px-6 h-12 bg-white hover:bg-slate-50 border-slate-200 hover:border-orange-500 text-slate-800 hover:text-orange-600 transition-all font-semibold flex items-center shrink-0 self-start md:self-end"
                    rightIcon={ArrowRight}
                >
                    {buttonText}
                </PremiumButton>
            </div>
            {/* 
            <FilterPanel
                activeCategory={activeCategory}
                activeSubcategory={activeSubcategory}
                activeSort={activeSort}
                onCategoryChange={setActiveCategory}
                onSubcategoryChange={setActiveSubcategory}
                onSortChange={setActiveSort}
            /> */}

            <OfferGrid
                offers={filteredOffers}
                redirectToOffers={true}
                buttonText={buttonText}
                columns={6}
            />
        </div>
    );
}
