"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Subheading, Text } from "@/components/shared/Typography";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocationContext } from "@/context/LocationContext";
import { cn } from "@/lib/utils";
import { useFeaturedOffers } from "@/hooks/useApi";

interface FeaturedOffer {
  id: number;
  name: string;
  offer: string;
  image: string | StaticImageData;
  badge: string;
  rating: number;
}

interface FeaturedCarouselProps {
  offers: FeaturedOffer[];
}

const FeaturedCarousel = ({ offers = [] }: FeaturedCarouselProps) => {
  const { t } = useTranslation("home");
  const router = useRouter();
  const { location: userLocation, hydrated } = useLocationContext();

  const hasLocation = userLocation.latitude !== null && userLocation.longitude !== null;
  const { data: dynamicData } = useFeaturedOffers(
    userLocation.latitude,
    userLocation.longitude,
    {
      enabled: hydrated && hasLocation
    }
  );

  const displayOffers: FeaturedOffer[] = useMemo(() => {
    if (hydrated && hasLocation && dynamicData && dynamicData.success) {
      return (dynamicData.data || []) as FeaturedOffer[];
    }
    return (offers || []) as FeaturedOffer[];
  }, [hydrated, hasLocation, dynamicData, offers]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Reset index when displayOffers change to avoid out of bounds
  useEffect(() => {
    setCurrentIndex(0);
  }, [displayOffers]);

  const nextSlide = useCallback(() => {
    if (displayOffers.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % displayOffers.length);
  }, [displayOffers.length]);

  const prevSlide = () => {
    if (displayOffers.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + displayOffers.length) % displayOffers.length);
  };

  useEffect(() => {
    if (displayOffers.length === 0) return;
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, displayOffers.length]);

  const getOfferOffset = (index: number) => {
    const total = displayOffers.length;
    if (total <= 1) return 0;
    if (total === 2) {
      return (index - currentIndex + total) % total;
    }
    let diff = index - currentIndex;
    while (diff > Math.floor(total / 2)) diff -= total;
    while (diff < -Math.floor((total - 1) / 2)) diff += total;
    return diff;
  };

  if (displayOffers.length === 0) {
    return null;
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
              <Star className="w-6 h-6 text-primary fill-primary/20" />
            </div>
            <div>
              <Subheading className="sm:text-3xl font-bold mb-0">
                {t("featuredOffers.title")}
              </Subheading>
              <Text className="text-sm mt-1">{t("featuredOffers.subtitle")}</Text>
            </div>
          </div>

          {displayOffers.length > 1 && (
            <div className="flex items-center gap-3 shrink-0">
              {/* Progress Bar */}
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                    style={{ width: `${((currentIndex + 1) / displayOffers.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground min-w-[3ch]">
                  {currentIndex + 1}/{displayOffers.length}
                </span>
              </div>

              <PremiumButton
                variant="outline"
                size="icon"
                onClick={prevSlide}
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
                className="rounded-full border-orange-500/50 hover:border-orange-500 h-9 w-9 sm:h-10 sm:w-10 group cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
              </PremiumButton>
              <PremiumButton
                variant="outline"
                size="icon"
                onClick={nextSlide}
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
                className="rounded-full border-orange-500/50 hover:border-orange-500 h-9 w-9 sm:h-10 sm:w-10 group cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
              </PremiumButton>
            </div>
          )}
        </div>

        {displayOffers.length === 0 ? (
          <div className="h-[450px] sm:h-[500px] md:h-[550px] flex items-center justify-center rounded-2xl border border-dashed border-muted bg-muted/30">
            <Text className="text-muted-foreground">{t("featuredOffers.empty") || "No featured offers available right now."}</Text>
          </div>
        ) : (
          <>
            <div
              className="relative h-[450px] sm:h-[500px] md:h-[540px]"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {displayOffers.map((offer: FeaturedOffer, idx: number) => {
                  const isSingle = displayOffers.length === 1;
                  const diff = getOfferOffset(idx);

                  const isPrimaryLeft = diff === 0;
                  const isPrimaryRight = diff === 1;
                  const isLeftWing = diff === -1;
                  const isRightWing = diff === 2;

                  let posClass = "";
                  if (isSingle) {
                    posClass = "aspect-[1/1.414] h-full translate-x-0 translate-y-0 z-30 opacity-100 scale-100 pointer-events-auto";
                  } else if (isPrimaryLeft) {
                    // Mobile: single centered spotlight | Desktop: left spotlight
                    posClass = "aspect-[1/1.414] h-full translate-x-0 translate-y-0 lg:-translate-x-[51%] lg:translate-y-0 z-30 opacity-100 scale-100 pointer-events-auto";
                  } else if (isPrimaryRight) {
                    // Mobile: right peek | Desktop: right spotlight
                    posClass = "aspect-[1/1.414] h-[85%] lg:h-full translate-x-4 -translate-y-2 lg:translate-x-[51%] lg:translate-y-0 z-20 lg:z-30 opacity-60 lg:opacity-100 scale-90 lg:scale-100 pointer-events-auto";
                  } else if (isLeftWing) {
                    // Mobile: left peek | Desktop: left wing peek
                    posClass = "aspect-[1/1.414] h-[85%] -translate-x-4 -translate-y-2 lg:-translate-x-[152%] lg:translate-y-0 z-10 lg:z-20 opacity-60 lg:opacity-35 scale-95 lg:scale-90 pointer-events-auto";
                  } else if (isRightWing) {
                    // Mobile: hidden | Desktop: right wing peek
                    posClass = "aspect-[1/1.414] h-[85%] translate-x-8 -translate-y-4 lg:translate-x-[152%] lg:translate-y-0 z-10 lg:z-20 opacity-0 lg:opacity-35 scale-85 lg:scale-90 hidden lg:block pointer-events-auto";
                  } else if (diff > 2) {
                    // Offscreen Right
                    posClass = "aspect-[1/1.414] h-[85%] translate-x-16 lg:translate-x-[240%] z-0 opacity-0 scale-75 pointer-events-none hidden lg:block";
                  } else {
                    // Offscreen Left (diff < -1)
                    posClass = "aspect-[1/1.414] h-[85%] -translate-x-16 lg:-translate-x-[240%] z-0 opacity-0 scale-75 pointer-events-none hidden lg:block";
                  }

                  const isWing = isLeftWing || isRightWing;

                  return (
                    <div
                      key={offer.id || `offer-${idx}`}
                      className={cn(
                        "absolute transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
                        posClass
                      )}
                    >
                      <div
                        className={cn(
                          "relative w-full h-full rounded-2xl overflow-hidden shadow-2xl group cursor-pointer border border-primary/20 group-hover:border-primary/50 transition-all duration-300 bg-black flex items-center justify-center",
                          isWing && "cursor-pointer hover:border-primary/60"
                        )}
                        onClick={() => {
                          if (isLeftWing) {
                            prevSlide();
                          } else if (isRightWing) {
                            nextSlide();
                          } else {
                            router.push(`/offer/${offer.id}`);
                          }
                        }}
                      >
                        {/* Ambient Blur Background inside the A4 card */}
                        <div className="absolute inset-0 select-none pointer-events-none overflow-hidden">
                          <img
                            src={typeof offer.image === 'string' ? offer.image : (offer.image as any)?.src || ""}
                            alt=""
                            className="w-full h-full object-cover blur-xl scale-110 opacity-30"
                          />
                        </div>
                        <img
                          src={typeof offer.image === 'string' ? offer.image : (offer.image as any)?.src || ""}
                          alt={offer.name || "Featured Shop"}
                          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 block z-10 relative"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent group-hover:from-black/70 z-20 pointer-events-none" />

                        {/* Floating Particles Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 pointer-events-none">
                          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-primary rounded-full animate-ping" />
                          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-secondary rounded-full animate-ping delay-300" />
                          <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-accent rounded-full animate-ping delay-700" />
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-6 z-30">
                          <p className="text uppercase font-bold text-white mb-0 group-hover:text-primary transition-colors text-xs md:text-sm truncate">
                            {offer.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dots Indicator */}
            {offers.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {offers.map((_, index) => (
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
