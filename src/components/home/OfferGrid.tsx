"use client";

import OfferCard from "../offer/OfferCard"; // Corrected import path
import { Loader2 } from "lucide-react";
import { StaticImageData } from "next/image";

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
            <h2 className="font-serif text-2xl font-semibold">Discover Offers</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {offers.length} amazing deals near you
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {offers.map((offer, index) => {
            const cardStyles = [
              "aspect-[4/3]",
              "aspect-[3/4]",
              "aspect-[5/4]",
              "aspect-[4/5]"
            ];
            const randomStyle = cardStyles[index % cardStyles.length];

            return (
              <div
                key={offer.id}
                className={`animate-fade-up`}
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
          <button className="px-8 py-3 rounded-xl border-2 border-primary text-primary font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center gap-2">
            Load More Offers
            <Loader2 className="w-4 h-4 animate-spin hidden" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default OfferGrid;

