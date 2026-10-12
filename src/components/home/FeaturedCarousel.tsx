"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { StaticImageData } from "next/image";
import { ChevronLeft, ChevronRight, Star, Store } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Subheading, Text } from "@/components/shared/Typography";
import { useTranslation } from "@/hooks/useTranslation";
import { useDistancePreference } from "@/hooks/useDistancePreference";
import { withinRadius, isAllLocation } from "@/lib/distance";

import { useLocationContext } from "@/context/LocationContext";
import { cn } from "@/lib/utils";
import { useFeaturedOffers } from "@/hooks/useApi";

interface FeaturedOffer {
  distanceKm?: number | null;
  id: number;
  name: string;
  offer: string;
  image: string | StaticImageData;
  badge: string;
  rating: number;
  shopLogo?: string | null;
}

interface FeaturedCarouselProps {
  offers: FeaturedOffer[];
}

const ShopLogoBadge = ({ src, name, size = "md" }: { src?: string | null; name: string; size?: "sm" | "md" }) => {
  const [error, setError] = useState(false);
  const sizeClasses = size === "sm" ? "w-5 h-5" : "w-6 h-6 sm:w-7 sm:h-7";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <div className={cn(sizeClasses, "rounded-md sm:rounded-lg overflow-hidden shrink-0 bg-white dark:bg-zinc-800 border border-white/40 flex items-center justify-center shadow-xs")}>
      {src && !error ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <Store className={cn(iconSize, "text-orange-500")} />
      )}
    </div>
  );
};

const FeaturedCarousel = ({ offers = [] }: FeaturedCarouselProps) => {
  const { t } = useTranslation("home");
  const router = useRouter();
  const { location: userLocation, hydrated } = useLocationContext();
  const { radius, locationReady } = useDistancePreference();

  const isAll = isAllLocation(userLocation.name);
  const hasLocation = isAll || (userLocation.latitude !== null && userLocation.longitude !== null);
  const { data: dynamicData } = useFeaturedOffers(
    isAll ? undefined : userLocation.latitude,
    isAll ? undefined : userLocation.longitude,
    radius,
    {
      enabled: hydrated && hasLocation
    }
  );

  const displayOffers: FeaturedOffer[] = useMemo(() => {
    if (hydrated && hasLocation && dynamicData && dynamicData.success) {
      return ((dynamicData.data || []) as FeaturedOffer[]).filter(offer => radius === null || (locationReady && withinRadius(offer.distanceKm, radius)));
    }
    return radius === null ? (offers || []) as FeaturedOffer[] : [];
  }, [hydrated, hasLocation, dynamicData, offers, radius, locationReady]);

  const isSingle = displayOffers.length === 1;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Dedicated Embla carousel for mobile (track-based: eliminates card overlapping/ghosting)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: displayOffers.length > 1,
    align: "center",
    skipSnaps: false,
    duration: 25,
  });

  // Sync embla slide index with currentIndex
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Reset index when displayOffers change
  useEffect(() => {
    setCurrentIndex(0);
    if (emblaApi) emblaApi.scrollTo(0, true);
  }, [displayOffers, emblaApi]);

  const nextSlide = useCallback(() => {
    if (displayOffers.length === 0) return;
    if (emblaApi && typeof window !== "undefined" && window.innerWidth < 1024) {
      emblaApi.scrollNext();
    } else {
      setCurrentIndex((prev) => (prev + 1) % displayOffers.length);
    }
  }, [displayOffers.length, emblaApi]);

  const prevSlide = useCallback(() => {
    if (displayOffers.length === 0) return;
    if (emblaApi && typeof window !== "undefined" && window.innerWidth < 1024) {
      emblaApi.scrollPrev();
    } else {
      setCurrentIndex((prev) => (prev - 1 + displayOffers.length) % displayOffers.length);
    }
  }, [displayOffers.length, emblaApi]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    if (emblaApi && typeof window !== "undefined" && window.innerWidth < 1024) {
      emblaApi.scrollTo(index);
    }
  };

  useEffect(() => {
    if (displayOffers.length <= 1) return;
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
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 border border-primary rounded-full" />
        <div className="absolute top-20 right-20 w-16 h-16 border border-secondary rounded-full" />
        <div className="absolute bottom-10 left-1/3 w-12 h-12 border border-accent rounded-full" />
      </div>

      <div className="container mx-auto px-3 sm:px-4 relative">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 shadow-sm shadow-orange-500/5">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 fill-orange-500" />
            </div>
            <div>
              <Subheading className="text-xl sm:text-3xl font-bold mb-0">
                {(() => {
                  const title = t("featuredOffers.title") || "Featured Offers";
                  const parts = title.split(" ");
                  if (parts.length <= 1) return <span className="text-orange-500">{title}</span>;
                  return (
                    <>
                      <span>{parts[0]}</span>{" "}
                      <span className="text-orange-500">{parts.slice(1).join(" ")}</span>
                    </>
                  );
                })()}
              </Subheading>
              <Text className="text-xs sm:text-sm mt-0.5 sm:mt-1 text-muted-foreground">{t("featuredOffers.subtitle")}</Text>
            </div>
          </div>

          {displayOffers.length > 1 && (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <PremiumButton
                variant="outline"
                size="icon"
                onClick={prevSlide}
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
                aria-label="Previous offer"
                className="rounded-full border-orange-500/40 hover:border-orange-500 hover:bg-orange-50 h-8 w-8 sm:h-10 sm:w-10 group cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 group-hover:scale-110 transition-transform" />
              </PremiumButton>
              <PremiumButton
                variant="outline"
                size="icon"
                onClick={nextSlide}
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
                aria-label="Next offer"
                className="rounded-full border-orange-500/40 hover:border-orange-500 hover:bg-orange-50 h-8 w-8 sm:h-10 sm:w-10 group cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 group-hover:scale-110 transition-transform" />
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
            {/* 1. Mobile View (Track-based: zero overlay lag, native butter-smooth touch swipes) */}
            <div
              className="block lg:hidden overflow-hidden"
              ref={isSingle ? undefined : emblaRef}
              onTouchStart={() => setIsAutoPlaying(false)}
              onTouchEnd={() => setIsAutoPlaying(true)}
            >
              <div className={cn("flex items-center py-2", isSingle ? "justify-center" : "-ml-3")}>
                {displayOffers.map((offer: FeaturedOffer, idx: number) => {
                  const isActive = idx === currentIndex || isSingle;
                  const imageSrc = typeof offer.image === 'string'
                    ? offer.image
                    : (offer.image as any)?.src || "";

                  return (
                    <button
                      key={offer.id || `mobile-offer-${idx}`}
                      className={cn(
                        "min-w-0 bg-transparent border-none p-0 cursor-pointer text-left",
                        isSingle
                          ? "shrink-0 basis-[82%] xs:basis-[76%] sm:basis-[64%] max-w-[380px]"
                          : "shrink-0 grow-0 basis-[82%] xs:basis-[76%] sm:basis-[64%] pl-3"
                      )}
                      onClick={() => {
                        if (!isActive) {
                          goToSlide(idx);
                        } else {
                          router.push(`/offer/${offer.id}`);
                        }
                      }}
                    >
                      <div
                        data-loader-text="Loading offer..."
                        className={cn(
                          "relative aspect-[1/1.414] w-full rounded-2xl overflow-hidden transition-all duration-300 ease-out bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800",
                          isActive
                            ? "scale-100 opacity-100 shadow-[0_12px_32px_rgba(0,0,0,0.12),0_4px_16px_rgba(249,115,22,0.12)] border-orange-500/30"
                            : "scale-[0.93] opacity-50 hover:opacity-75 shadow-md"
                        )}
                      >
                        <img
                          src={imageSrc}
                          alt={offer.name || "Featured Shop"}
                          className="w-full h-full object-contain block z-10 relative"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-20 pointer-events-none" />

                        <div className="absolute bottom-2.5 left-2.5 z-30 flex items-end gap-1.5 max-w-[90%]">
                          <ShopLogoBadge src={offer.shopLogo} name={offer.name} size="sm" />
                          <p className="capitalize font-bold text-white mb-0 text-xs truncate drop-shadow-sm leading-none pb-0.5">
                            {offer.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Desktop View (Original 3D Dual-Spotlight Coverflow) */}
            <div
              className="hidden lg:block relative h-[500px] md:h-[540px]"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              {/* Soft Ambient Backlight Stage */}
              <div className="absolute inset-x-16 top-8 bottom-6 bg-gradient-to-r from-orange-500/10 via-amber-500/15 to-orange-500/10 rounded-[3rem] blur-3xl pointer-events-none -z-10" />

              <div className="absolute inset-0 flex items-center justify-center">
                {displayOffers.map((offer: FeaturedOffer, idx: number) => {
                  const diff = getOfferOffset(idx);

                  const isPrimaryLeft = diff === 0;
                  const isPrimaryRight = diff === 1;
                  const isLeftWing = diff === -1;
                  const isRightWing = diff === 2;

                  let posClass = "";
                  if (isSingle) {
                    posClass = "aspect-[1/1.414] h-full translate-x-0 translate-y-0 z-30 opacity-100 scale-100 pointer-events-auto";
                  } else if (isPrimaryLeft) {
                    // Left spotlight
                    posClass = "aspect-[1/1.414] h-full -translate-x-[52.1%] translate-y-0 z-30 opacity-100 scale-100 pointer-events-auto";
                  } else if (isPrimaryRight) {
                    // Right spotlight
                    posClass = "aspect-[1/1.414] h-full translate-x-[52.1%] translate-y-0 z-30 opacity-100 scale-100 pointer-events-auto";
                  } else if (isLeftWing) {
                    // Left wing peek
                    posClass = "aspect-[1/1.414] h-[85%] -translate-x-[153.2%] translate-y-0 z-20 opacity-35 scale-90 pointer-events-auto";
                  } else if (isRightWing) {
                    // Right wing peek
                    posClass = "aspect-[1/1.414] h-[85%] translate-x-[153.2%] translate-y-0 z-20 opacity-35 scale-90 pointer-events-auto";
                  } else if (diff > 2) {
                    // Offscreen Right
                    posClass = "aspect-[1/1.414] h-[85%] translate-x-[243%] z-0 opacity-0 scale-75 pointer-events-none hidden";
                  } else {
                    // Offscreen Left (diff < -1)
                    posClass = "aspect-[1/1.414] h-[85%] -translate-x-[243%] z-0 opacity-0 scale-75 pointer-events-none hidden";
                  }

                  const isWing = isLeftWing || isRightWing;

                  return (
                    <div
                      key={offer.id || `desktop-offer-${idx}`}
                      className={cn(
                        "absolute transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
                        posClass
                      )}
                    >
                      <button
                        data-loader-text="Loading offer..."
                        className={cn(
                          "relative w-full h-full rounded-2xl overflow-hidden group transition-all duration-500 flex items-center justify-center p-0 cursor-pointer text-left bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800",
                          isWing
                            ? "shadow-md hover:shadow-lg opacity-75 hover:opacity-90"
                            : "shadow-[0_14px_40px_rgba(0,0,0,0.10),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_22px_50px_rgba(249,115,22,0.18)] hover:border-orange-500/40"
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

                        <div className="absolute bottom-3 left-3 sm:bottom-3.5 sm:left-3.5 z-30 flex items-end gap-2 max-w-[85%]">
                          <ShopLogoBadge src={offer.shopLogo} name={offer.name} size="md" />
                          <p className="capitalize font-bold text-white mb-0 group-hover:text-primary transition-colors text-xs md:text-sm truncate drop-shadow-sm leading-none pb-0.5">
                            {offer.name}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Slider Indicator Under Offers */}
            {displayOffers.length > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4 lg:mt-6 z-20">
                <div className="flex items-center gap-1 dark:bg-white/5 px-2 py-1.5 rounded-full border border-orange-500/20 shadow-xs">
                  {displayOffers.map((_, index) => {
                    const isActive = index === currentIndex;
                    return (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                          isActive
                            ? "w-5 bg-orange-500 shadow-sm"
                            : "w-2 bg-orange-500/30 hover:bg-orange-500/60"
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedCarousel;
