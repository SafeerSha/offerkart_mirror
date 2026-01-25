"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <h2 className="font-serif text-3xl font-bold text-primary text-center mb-6">Featured Offers</h2>
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
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary group-hover:shadow-lg transition-all duration-300 relative">
                    <Image
                      src={offer.logo}
                      alt={offer.name}
                      fill
                      className="object-cover transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm text-center mt-2 font-medium group-hover:text-primary transition-colors duration-300">{offer.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/50 hover:from-primary hover:to-secondary hover:text-primary-foreground hover:border-primary hover:scale-110 transition-all duration-300 z-20 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/50 hover:from-primary hover:to-secondary hover:text-primary-foreground hover:border-primary hover:scale-110 transition-all duration-300 z-20 shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedOffers;
