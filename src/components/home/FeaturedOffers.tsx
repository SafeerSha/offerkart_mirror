"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { ChevronLeft, ChevronRight, Store, Plus } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Subheading, Text } from "@/components/shared/Typography";
import { cn } from "@/lib/utils";

interface FeaturedOffer {
  id: number;
  name: string;
  logo: string | StaticImageData;
}

interface FeaturedOffersProps {
  offers: FeaturedOffer[];
  variant?: "full" | "minimal";
}

const FeaturedOffers = ({ offers, variant = "full" }: FeaturedOffersProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 10; // Show 10 offers at a time

  const nextSlide = () => {
    const totalItems = variant === "minimal"
      ? (offers.length > 15 ? 16 : offers.length)
      : offers.length;
    const maxIndex = Math.ceil(totalItems / itemsPerView) - 1;
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };


  const prevSlide = () => {
    const totalItems = variant === "minimal"
      ? (offers.length > 15 ? 16 : offers.length)
      : offers.length;
    const maxIndex = Math.ceil(totalItems / itemsPerView) - 1;
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const getVisibleOffers = () => {
    const start = currentIndex * itemsPerView;
    return offers.slice(start, start + itemsPerView);
  };

  return (
    <section className={cn(
      "bg-background relative",
      variant === "full" ? "py-16" : "py-8"
    )}>
      {/* Scrollbar Hide Utility */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="container mx-auto px-4">
        {variant === "full" && (
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 px-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-sm shadow-primary/5">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <div>
                <Subheading className="text-2xl sm:text-3xl font-bold mb-0">Featured Shops</Subheading>
                <Text className="text-xs sm:text-sm text-muted-foreground mt-0.5">Explore premium local businesses near you</Text>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <PremiumButton
                variant="outline"
                size="icon"
                onClick={prevSlide}
                className="rounded-full border-primary/20 hover:border-primary/50 h-10 w-10 group bg-white/50 backdrop-blur-sm shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              </PremiumButton>
              <PremiumButton
                variant="outline"
                size="icon"
                onClick={nextSlide}
                className="rounded-full border-primary/20 hover:border-primary/50 h-10 w-10 group bg-white/50 backdrop-blur-sm shadow-sm"
              >
                <ChevronRight className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              </PremiumButton>
            </div>
          </div>
        )}
        <div className="relative">
          {/* Fading gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="relative group/slider">
            {/* Sliding buttons for minimal variant */}
            {variant === "minimal" && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white backdrop-blur-md shadow-lg border border-primary/20 text-primary transition-all duration-300 hover:bg-primary hover:text-white hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white backdrop-blur-md shadow-lg border border-primary/20 text-primary transition-all duration-300 hover:bg-primary hover:text-white hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            <div className="overflow-hidden">
              <div
                className={cn(
                  "flex transition-transform duration-500 ease-in-out",
                  variant === "full" ? "gap-6" : "gap-5 sm:gap-8 overflow-hidden scrollbar-hide pb-4 px-2"
                )}
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {offers.slice(0, variant === "minimal" && offers.length > 15 ? 15 : 16).map((offer) => (
                  <button
                    key={offer.id}
                    className="flex flex-col items-center group cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1 flex-shrink-0"
                    style={{ minWidth: variant === "full" ? '80px' : '64px' }}
                    onClick={() => console.log(`Clicked ${offer.name}`)} // Placeholder for navigation
                  >
                    <div className={cn(
                      "rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary group-hover:shadow-lg transition-all duration-300 relative bg-muted/10",
                      variant === "full" ? "w-20 h-20" : "w-14 h-14 sm:w-16 sm:h-16"
                    )}>
                      <Image
                        src={offer.logo}
                        alt={offer.name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300"
                      />
                    </div>
                    {variant === "full" && (
                      <Text className="text-center mt-2 font-medium group-hover:text-primary transition-colors duration-300 text-sm">
                        {offer.name}
                      </Text>
                    )}
                  </button>
                ))}

                {variant === "minimal" && offers.length > 15 && (
                  <button
                    className="flex flex-col items-center group cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1 flex-shrink-0"
                    style={{ minWidth: '64px' }}
                    onClick={() => console.log("Show more shops")}
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-primary/30 group-hover:border-primary bg-primary/5 flex items-center justify-center transition-all duration-300 group-hover:shadow-md">
                      <Plus className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedOffers;
