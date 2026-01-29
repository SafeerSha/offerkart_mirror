"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { ChevronLeft, ChevronRight, Store } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Subheading, Text } from "@/components/shared/Typography";

interface FeaturedOffer {
  id: number;
  name: string;
  logo: string | StaticImageData;
}

interface FeaturedOffersProps {
  offers: FeaturedOffer[];
}

const FeaturedOffers = ({ offers }: FeaturedOffersProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 10; // Show 10 offers at a time

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(offers.length / itemsPerView));
  };


  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(offers.length / itemsPerView)) % Math.ceil(offers.length / itemsPerView));
  };

  const getVisibleOffers = () => {
    const start = currentIndex * itemsPerView;
    return offers.slice(start, start + itemsPerView);
  };

  return (
    <section className="py-16 bg-background relative">
      <div className="container mx-auto px-4">
        <div className="relative mb-8 flex items-center justify-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <Subheading className="text-3xl font-bold mb-0 text-center">Featured Shops</Subheading>
          <div className="absolute right-0 flex items-center gap-3">
            <PremiumButton
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="rounded-full border-orange-500/50 hover:border-orange-500 h-10 w-10 group"
            >
              <ChevronLeft className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
            </PremiumButton>
            <PremiumButton
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="rounded-full border-orange-500/50 hover:border-orange-500 h-10 w-10 group"
            >
              <ChevronRight className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
            </PremiumButton>
          </div>
        </div>
        <div className="relative">
          {/* Fading gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden">
            <div
              className="flex gap-6 transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / Math.ceil(offers.length / itemsPerView))}%)` }}
            >
              {offers.map((offer) => (
                <button
                  key={offer.id}
                  className="flex flex-col items-center group cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1 flex-shrink-0"
                  style={{ minWidth: '80px' }}
                  onClick={() => console.log(`Clicked ${offer.name}`)} // Placeholder for navigation
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary group-hover:shadow-lg transition-all duration-300 relative bg-muted/10">
                    <Image
                      src={offer.logo}
                      alt={offer.name}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300"
                    />
                  </div>
                  <Text className="text-sm text-center mt-2 font-medium group-hover:text-primary transition-colors duration-300">
                    {offer.name}
                  </Text>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FeaturedOffers;
