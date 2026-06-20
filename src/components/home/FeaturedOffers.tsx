"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { ChevronLeft, ChevronRight, Store, Plus } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Subheading, Text } from "@/components/shared/Typography";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { InstantTooltip } from "@/components/shared/InstantTooltip";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 10; // Show 10 offers at a time

  const navVisibilityClass = offers.length <= 4
    ? "hidden"
    : offers.length <= 10
      ? "lg:hidden"
      : "";

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

  const handleShopClick = (shopId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeShopId !== undefined && String(shopId) === String(activeShopId)) {
      params.delete("shopId");
    } else {
      params.set("shopId", String(shopId));
    }
    router.push(`/offers?${params.toString()}`);
  };

  return (
    <section className={cn(
      "bg-background relative",
      variant === "full" ? "py-8" : "py-2 lg:py-4"
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
      <div className="container mx-auto">
        {variant === "full" && (
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 px-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-sm shadow-primary/5">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <div>
                <Subheading className="text-2xl sm:text-3xl font-bold mb-0">{t("featuredShops.title")}</Subheading>
                {/* <Text className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t("featuredShops.subtitle")}</Text> */}
              </div>
            </div>

            <div className={cn("flex items-center gap-3", navVisibilityClass)}>
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
        <div className="relative z-20">
          {/* Fading gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="relative group/slider z-30">
            {/* Sliding buttons for minimal variant */}
            {variant === "minimal" && (
              <>
                <button
                  onClick={prevSlide}
                  className={cn(
                    "absolute -left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white backdrop-blur-md shadow-lg border border-primary/20 text-primary transition-all duration-300 hover:bg-primary hover:text-white hover:scale-110 active:scale-95",
                    navVisibilityClass
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className={cn(
                    "absolute -right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white backdrop-blur-md shadow-lg border border-primary/20 text-primary transition-all duration-300 hover:bg-primary hover:text-white hover:scale-110 active:scale-95",
                    navVisibilityClass
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            <div className="overflow-hidden pt-4 pb-12 -mt-4 -mb-12 px-2">
              <div
                className={cn(
                  "flex transition-transform duration-500 ease-in-out",
                  variant === "full" ? "gap-6" : "gap-5 sm:gap-8 overflow-visible scrollbar-hide pb-4 px-2"
                )}
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {offers.slice(0, variant === "minimal" && offers.length > 15 ? 15 : 16).map((offer) => {
                  const isActive = activeShopId !== undefined && String(offer.id) === String(activeShopId);
                  return (
                    <button
                      key={offer.id}
                      className="relative flex flex-col items-center group cursor-pointer transition-all duration-300 flex-shrink-0"
                      style={{ minWidth: variant === "full" ? '80px' : '64px' }}
                      onClick={() => handleShopClick(offer.id)}
                    >
                      <div className={cn(
                        "rounded-full overflow-hidden border-2 transition-all duration-300 relative bg-muted/10",
                        isActive
                          ? "border-orange-500 ring-4 ring-orange-500/20 shadow-md"
                          : "border-primary/20 group-hover:border-primary group-hover:shadow-lg",
                        variant === "full" ? "w-20 h-20" : "w-14 h-14 sm:w-16 sm:h-16"
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

                      {/* Instant custom tooltip with pointing arrow */}
                      <InstantTooltip content={offer.name} />
                    </button>
                  );
                })}

                {variant === "minimal" && offers.length > 15 && (
                  <button
                    className="relative flex flex-col items-center group cursor-pointer transition-all duration-300 flex-shrink-0"
                    style={{ minWidth: '64px' }}
                    onClick={() => { }}
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-primary/30 group-hover:border-primary bg-primary/5 flex items-center justify-center transition-all duration-300 group-hover:shadow-md">
                      <Plus className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    {/* Instant custom tooltip for View All */}
                    <InstantTooltip content="View All" />
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
