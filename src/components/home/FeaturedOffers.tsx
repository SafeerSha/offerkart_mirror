"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image, { StaticImageData } from "next/image";
import { ChevronLeft, ChevronRight, Store, Plus } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Subheading } from "@/components/shared/Typography";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

import { useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLocationContext } from "@/context/LocationContext";
import { Search } from "lucide-react";

interface FeaturedOffer {
  id: number;
  name: string;
  logo: string | StaticImageData;
}

interface FeaturedOffersProps {
  offers: FeaturedOffer[];
  variant?: "full" | "minimal";
  activeShopId?: string | number;
}

const FeaturedOffers = ({ offers, variant = "full", activeShopId }: FeaturedOffersProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { t } = useTranslation("home");

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [showNav, setShowNav] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowNav(scrollWidth > clientWidth);
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, offers]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleShopClick = (shopId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeShopId !== undefined && String(shopId) === String(activeShopId)) {
      params.delete("shopId");
    } else {
      params.set("shopId", String(shopId));
    }

    // If we are on the home page, redirect to the offers page with the shopId filter
    const targetPath = pathname === "/" ? "/offers" : pathname;
    router.push(`${targetPath}?${params.toString()}`);
  };

  const { location: userLocation } = useLocationContext();

  const filteredOffers = useMemo(() => {
    return offers || [];
  }, [offers]);

  const displayOffers = filteredOffers.slice(0, variant === "minimal" && filteredOffers.length > 15 ? 15 : 16);

  if (displayOffers.length === 0) {
    return (
      <section className={cn("bg-background relative py-8", variant === "minimal" && "py-2")}>
        <div className="container px-4 mx-auto">
          {variant === "full" && (
            <div className="flex sm:flex-row items-center justify-between mb-4 gap-1">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-sm shadow-primary/5">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <Subheading className="text-xl md:text-2xl font-bold mb-0">
                    Featured Shops
                  </Subheading>
                  <p className="text-xs text-muted-foreground mt-1">Handpicked premium shops just for you</p>
                </div>
              </div>
            </div>
          )}
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No featured shops found</h3>
            <p className="text-sm text-slate-500 mt-1">Try to change your location preferences</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <TooltipProvider>
      <section className={cn(
        "bg-background relative",
        variant === "full" ? "py-8" : "pt-1 pb-3"
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
        <div className={cn("mx-auto", variant === "full" && "container px-4")}>
          {variant === "full" && (
            <div className="flex sm:flex-row items-center justify-between mb-4 gap-1">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-sm shadow-primary/5">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <Subheading className="text-2xl sm:text-3xl font-bold mb-0">{t("featuredShops.title")}</Subheading>
                </div>
              </div>

              {showNav && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scroll('left')}
                    disabled={!canScrollLeft}
                    className="flex items-center justify-center h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-white text-orange-500 shadow-sm shadow-orange-500/20 border border-orange-500 transition-all duration-300 hover:bg-orange-50 hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-5 h-5 lg:w-4 lg:h-4 -ml-0.5" />
                  </button>
                  <button
                    onClick={() => scroll('right')}
                    disabled={!canScrollRight}
                    className="flex items-center justify-center h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-white text-orange-500 shadow-sm shadow-orange-500/20 border border-orange-500 transition-all duration-300 hover:bg-orange-50 hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-5 h-5 lg:w-4 lg:h-4 -mr-0.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile swipe hint (Top Right Above Section) */}
          {showNav && (
            <div className={cn("flex justify-end lg:hidden mb-1.5", variant === "minimal" ? "pr-2" : "hidden")}>
              <span className="text-[10px] text-gray-500 font-bold tracking-widest flex items-center gap-1">
                Swipe for more <ChevronRight className="w-3 h-3 -ml-0.5 text-primary/70" />
              </span>
            </div>
          )}

          <div className={cn(
            "relative z-20 border border-orange-500/25 bg-orange-500/[0.02] rounded-2xl shadow-sm",
            variant === "minimal" ? "shadow-[0_2px_12px_rgba(249,115,22,0.04)] border-orange-500/30" : "border-orange-500/20"
          )}>
            {/* Fading gradients */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none rounded-l-3xl" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none rounded-r-3xl" />

            <div className="relative group/slider z-30">
              {/* Sliding buttons for minimal variant only (Desktop only) */}
              {showNav && (
                <>
                  <button
                    onClick={() => scroll('left')}
                    disabled={!canScrollLeft}
                    className={cn(
                      "hidden lg:flex absolute -left-4 top-[calc(50%-24px)] -translate-y-1/2 z-40 p-2 rounded-full bg-white text-orange-500 shadow-sm shadow-orange-500/20 border border-orange-500 transition-all duration-300 hover:bg-orange-50 hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none",
                      variant === "full" ? "hidden" : ""
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scroll('right')}
                    disabled={!canScrollRight}
                    className={cn(
                      "hidden lg:flex absolute -right-4 top-[calc(50%-24px)] -translate-y-1/2 z-40 p-2 rounded-full bg-white text-orange-500 shadow-sm shadow-orange-500/20 border border-orange-500 transition-all duration-300 hover:bg-orange-50 hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none",
                      variant === "full" ? "hidden" : ""
                    )}
                  >
                    <ChevronRight className="w-5 h-5 lg:w-4 lg:h-4" />
                  </button>
                </>
              )}

              <div className={cn(
                "overflow-hidden relative z-0",
                variant === "full" ? "pt-0 pb-5 -mt-0 -mb-10" : "pt-0 pb-6 -mt-0 -mb-12"
              )}>
                <div
                  ref={scrollRef}
                  onScroll={checkScroll}
                  className={cn(
                    "flex gap-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth relative",
                    variant === "full" ? "pt-2 pb-8 px-3" : "pt-2 pb-8 px-3"
                  )}
                >
                  {displayOffers.map((offer) => {
                    const isActive = activeShopId !== undefined && String(offer.id) === String(activeShopId);
                    return (
                      <Tooltip key={offer.id} delayDuration={100}>
                        <TooltipTrigger asChild>
                          <button
                            className="relative flex flex-col items-center group cursor-pointer transition-all duration-300 flex-shrink-0 snap-start"
                            onClick={() => handleShopClick(offer.id)}
                          >
                            <div className={cn(
                              "rounded-2xl overflow-hidden border-2 transition-all duration-300 relative bg-muted/10",
                              isActive
                                ? "border-orange-500 scale-105 shadow-md shadow-orange-500/20"
                                : "border-primary/10 group-hover:border-primary group-hover:shadow-lg group-hover:scale-105",
                              variant === "full"
                                ? "w-[12.5vw] h-[12.5vw] min-w-[40px] min-h-[40px] max-w-[80px] max-h-[80px] sm:w-16 sm:h-16 lg:w-20 lg:h-20"
                                : "w-[12.5vw] h-[12.5vw] min-w-[40px] min-h-[40px] max-w-[56px] max-h-[56px] sm:w-12 sm:h-12 lg:w-14 lg:h-14"
                            )}>
                              {offer.logo ? (
                                <Image
                                  src={offer.logo}
                                  alt={offer.name}
                                  fill
                                  unoptimized
                                  className="object-cover transition-transform duration-300"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                                  <Store className="w-1/2 h-1/2" />
                                </div>
                              )}
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          sideOffset={8}
                          className="bg-slate-900 border-0 text-white text-[10px] font-bold rounded-lg shadow-md px-2.5 py-1 z-50 overflow-visible"
                        >
                          {offer.name}
                          {/* Pointing arrow */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-b-slate-900" />
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}

                  {variant === "minimal" && offers.length > 15 && (
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <button
                          className="relative flex flex-col items-center group cursor-pointer transition-all duration-300 flex-shrink-0 snap-start"
                          onClick={() => { }}
                        >
                          <div className={cn(
                            "rounded-2xl border-2 border-dashed border-primary/30 group-hover:border-primary bg-primary/5 flex items-center justify-center transition-all duration-300 group-hover:shadow-md",
                            "w-[12.5vw] h-[12.5vw] min-w-[40px] min-h-[40px] max-w-[56px] max-h-[56px] sm:w-12 sm:h-12 lg:w-14 lg:h-14"
                          )}>
                            <Plus className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        sideOffset={8}
                        className="bg-slate-900 border-0 text-white text-[10px] font-bold rounded-lg shadow-md px-2.5 py-1 z-50 overflow-visible"
                      >
                        View All
                        {/* Pointing arrow */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-b-slate-900" />
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
};

export default FeaturedOffers;
