"use client";

import React, { useState } from "react";
import OfferCard from "../offer/OfferCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Offer } from "@/lib/types/offer";

import { useRouter } from "next/navigation";

interface OfferGridProps {
  isLoading?: boolean;
  offers: Offer[];
  className?: string;
  redirectToOffers?: boolean;
  buttonText?: string;
  columns?: 3 | 4 | 5;
  disablePagination?: boolean;
}

const OfferGrid = ({
  isLoading = false,
  offers,
  className,
  redirectToOffers = false,
  buttonText = "Load More Offers",
  columns = 3,
  disablePagination = false
}: OfferGridProps) => {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const visibleOffers = disablePagination ? offers : offers.slice(0, visibleCount);

  const handleLoadMore = () => {
    if (redirectToOffers) {
      router.push("/offers");
      return;
    }

    setIsLoadingMore(true);
    // Simulate API call
    setTimeout(() => {
      setVisibleCount(prev => prev + 12); // Load more at once
      setIsLoadingMore(false);
    }, 1200);
  };

  const hasMore = visibleCount < offers.length;

  const gridColsClass = 
    columns === 5
      ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : columns === 4
      ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3";

  if (isLoading) {
    return (
      <div className={cn(
        "grid gap-4 md:gap-6",
        gridColsClass,
        className
      )}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
            <div className="aspect-[4/3] bg-gray-200" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-gray-200 rounded-full w-2/3" />
              <div className="h-6 bg-gray-200 rounded-full w-full" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 bg-gray-200 rounded-full w-1/4" />
                <div className="h-4 bg-gray-200 rounded-full w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">No offers found</h3>
        <p className="text-gray-500 mt-2">Try adjusting your filters or search query.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className={cn(
        "grid gap-4 md:gap-6 auto-rows-fr",
        gridColsClass
      )}>
        {visibleOffers.map((offer, index) => {
          return (
            <div
              key={offer.id ?? offer.offerId ?? index}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
              style={{ animationDelay: `${(index % 6) * 0.1}s` }}
            >
              <div className="h-full">
                <OfferCard {...offer} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {!disablePagination && hasMore && (
        <div className="flex justify-center mt-12 pb-8">
          <PremiumButton
            variant="outline"
            className="px-10 h-14 rounded-2xl group border-gray-200 bg-white hover:border-orange-500 hover:text-orange-500 transition-all shadow-sm"
            isLoading={isLoadingMore}
            onClick={handleLoadMore}
          >
            {buttonText}
          </PremiumButton>
        </div>
      )}
    </div>
  );
};

export default OfferGrid;
