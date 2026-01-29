"use client";

import React, { useState } from "react";
import OfferCard from "../offer/OfferCard";
import { StaticImageData } from "next/image";
import { Subheading, Text } from "@/components/shared/Typography";
import { PremiumButton } from "@/components/shared/PremiumButton";

interface Offer {
  id: number;
  shopName: string;
  offerName: string;
  image: string | StaticImageData;
  category: string;
  location: string;
  validUntil: string;
  discount?: string;
}

interface OfferGridProps {
  isLoading?: boolean;
  offers: Offer[];
}

const OfferGrid = ({ isLoading = false, offers }: OfferGridProps) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoadingMore(false);
    }, 2000);
  };

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton-shimmer aspect-[4/3] rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Subheading className="text-2xl font-semibold">Discover Offers</Subheading>
            <Text className="text-sm mt-1">
              {offers.length} amazing deals near you
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {offers.map((offer, index) => {
            return (
              <div
                key={offer.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s`, aspectRatio: '4/5' }}
              >
                <div className="h-full">
                  <OfferCard {...offer} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More */}
        <div className="flex justify-center mt-12">
          <PremiumButton
            variant="outline"
            className="px-8 h-12 rounded-xl group"
            isLoading={isLoadingMore}
            onClick={handleLoadMore}
          >
            Load More Offers
          </PremiumButton>
        </div>
      </div>
    </section>
  );
};

export default OfferGrid;
