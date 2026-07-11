"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image, { StaticImageData } from "next/image";
import { ChevronLeft, ChevronRight, Zap, Rocket } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Subheading, Text } from "@/components/shared/Typography";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocationContext } from "@/context/LocationContext";
import { Search } from "lucide-react";

interface FeaturedShop {
  id: number;
  name: string;
  offer: string;
  image: string | StaticImageData;
  badge: string;
  rating: number;
}

interface FeaturedCarouselProps {
  shops: FeaturedShop[];
}

const FeaturedCarousel = ({ shops = [] }: FeaturedCarouselProps) => {
  const { t } = useTranslation("home");
  const { location: userLocation } = useLocationContext();

  const displayShops = useMemo(() => {
    return shops || [];
  }, [shops]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    if (displayShops.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % displayShops.length);
  }, [displayShops.length]);

  const prevSlide = () => {
    if (displayShops.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + displayShops.length) % displayShops.length);
  };

  useEffect(() => {
    if (displayShops.length === 0) return;
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, displayShops.length]);

  const getVisibleSlides = () => {
    if (displayShops.length === 0) return [];
    const slides = [];
    for (let i = -1; i <= 2; i++) {
      const index = (currentIndex + i + displayShops.length) % displayShops.length;
      slides.push({ ...displayShops[index], position: i });
    }
    return slides;
  };

  if (displayShops.length === 0) {
    return (
      <section className="py-2 overflow-hidden relative">
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <Subheading className="text-3xl font-bold mb-0">
                {t("featuredOffers.title")}
              </Subheading>
              <Text className="text-sm mt-1">{t("featuredOffers.subtitle")}</Text>
            </div>
          </div>
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No featured offers found</h3>
            <p className="text-sm text-slate-500 mt-1">Try to change your location preferences</p>
          </div>
        </div>
      </section>
    );
  }



  return (
    <section className="py-2 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 border border-primary rounded-full" />
        <div className="absolute top-20 right-20 w-16 h-16 border border-secondary rounded-full" />
        <div className="absolute bottom-10 left-1/3 w-12 h-12 border border-accent rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <Subheading className="sm:text-3xl font-bold mb-0">
                {t("featuredOffers.title")}
              </Subheading>
              <Text className="text-sm mt-1">{t("featuredOffers.subtitle")}</Text>
            </div>
          </div>

          {displayShops.length > 1 && (
            <div className="flex items-center gap-3 shrink-0">
              {/* Progress Bar */}
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-linear"
                    style={{ width: `${((currentIndex + 1) / displayShops.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground min-w-[3ch]">
                  {currentIndex + 1}/{displayShops.length}
                </span>
              </div>

              <PremiumButton
                variant="outline"
                size="icon"
                onClick={prevSlide}
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
                className="rounded-full border-orange-500/50 hover:border-orange-500 h-9 w-9 sm:h-10 sm:w-10 group"
              >
                <ChevronLeft className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
              </PremiumButton>
              <PremiumButton
                variant="outline"
                size="icon"
                onClick={nextSlide}
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
                className="rounded-full border-orange-500/50 hover:border-orange-500 h-9 w-9 sm:h-10 sm:w-10 group"
              >
                <ChevronRight className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
              </PremiumButton>
            </div>
          )}
        </div>

        {displayShops.length === 0 ? (
          <div className="h-72 md:h-80 flex items-center justify-center rounded-2xl border border-dashed border-muted bg-muted/30">
            <Text className="text-muted-foreground">{t("featuredOffers.empty") || "No featured shops available right now."}</Text>
          </div>
        ) : (
          <>

            <div
              className="relative h-72 md:h-80"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {getVisibleSlides().map((offer) => (
                  <div
                    key={`${offer.id}-${offer.position}`}
                    className={`absolute transition-all duration-700 ease-out ${offer.position === 0
                      ? "w-full md:w-[60%] h-full z-30 opacity-100 scale-100"
                      : offer.position === -1
                        ? "w-full md:w-[40%] h-full md:h-[85%] -translate-x-4 -translate-y-2 md:-translate-x-[85%] md:translate-y-0 z-20 opacity-80 md:opacity-60 scale-95"
                        : offer.position === 1
                          ? "w-full md:w-[40%] h-full md:h-[85%] translate-x-4 -translate-y-2 md:translate-x-[85%] md:translate-y-0 z-10 opacity-60 md:opacity-60 scale-90"
                          : offer.position === 2
                            ? "w-full md:w-[40%] h-full md:h-[85%] translate-x-8 -translate-y-4 md:translate-x-[170%] md:translate-y-0 z-5 opacity-40 md:opacity-0 scale-85 hidden md:block"
                            : "opacity-0 scale-90"
                      }`}
                  >
                    <div className="relative h-full card-futuristic card-glow group cursor-pointer overflow-hidden !bg-white dark:!bg-[#1c2018]">
                      {/* Animated Border */}
                      <div className="absolute inset-0 rounded-2xl border border-primary/20 group-hover:border-primary/40 transition-colors duration-300" />
                      <div className="absolute inset-1 rounded-xl border border-primary/10 group-hover:border-primary/30 transition-colors duration-300" />

                      <div className="absolute inset-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-950/40">
                        <Image
                          src={offer.image || "/images/shop-registration-bg-light.png"}
                          alt={offer.name || "Featured Shop"}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent group-hover:from-black/70" />

                        {/* Floating Particles Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-primary rounded-full animate-ping" />
                          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-secondary rounded-full animate-ping delay-300" />
                          <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-accent rounded-full animate-ping delay-700" />
                        </div>
                      </div>

                      <div className="absolute top-4 left-4">
                        <span className="badge-futuristic">
                          <Rocket className="w-3 h-3 mr-1" />
                          {offer.badge}
                        </span>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <p className="text uppercase font-bold text-white mb-0 group-hover:text-primary transition-colors">
                          {offer.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            {shops.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {shops.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                      ? "w-8 bg-primary"
                      : "bg-muted hover:bg-muted-foreground/50"
                      }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedCarousel;
