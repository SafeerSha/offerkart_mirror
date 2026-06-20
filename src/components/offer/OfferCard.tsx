"use client";

import { useState } from "react";
import { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Heart, Tag, Image as ImageIcon, Store } from "lucide-react";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { MarkedPoster } from "@/components/shared/MarkedPoster";
import { Poster } from "@/lib/types/offer";
import { useTranslation } from "@/hooks/useTranslation";

interface OfferCardProps {
  id?: number | string;
  offerId?: number;
  shopName?: string;
  offerName?: string;
  title?: string;
  image?: string | StaticImageData;
  posters?: Poster[];
  category?: string;
  location?: string;
  validFrom?: string;
  validTo?: string;
  discount?: string;
  branchName?: string;
  daysLeft?: number | null;
  totalPosters?: number;
  shopLogo?: string | null;
}

const OfferCard = ({
  id,
  offerId,
  shopName,
  offerName,
  title,
  image,
  discount,
  daysLeft,
  posters,
  totalPosters,
  shopLogo,
}: OfferCardProps) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const offerDisplayName = offerName || title || t("catalog.untitledOffer");
  const primaryId = id ?? offerId ?? 0;
  const posterSrc = posters?.[0]?.posterSrc || (typeof image === "string" ? image : image?.src) || "/images/shop-registration-bg-light.png";
  const postersCount = posters?.length || totalPosters || 0;
  debugger;
  // Calculate total offers count from marked items
  const totalOffersCount = posters?.reduce((acc, p) => acc + (p.markedItems?.length || 0), 0) || 0;

  const isUrgent = typeof daysLeft === "number" && daysLeft <= 3;
  const getDaysLeftText = () => {
    if (typeof daysLeft !== "number") return null;
    if (daysLeft <= 0) return t("catalog.endsToday");
    if (daysLeft === 1) return t("catalog.dayLeft");
    return t("catalog.daysLeft").replace("{count}", String(daysLeft));
  };
  const daysLeftText = getDaysLeftText();
  const showDiscount = discount && !discount.toLowerCase().includes("left") && !discount.includes("ബാക്കിയുണ്ട്");

  return (
    <PremiumCard
      variant="default"
      padding="none"
      className="group cursor-pointer h-full flex flex-col border border-slate-100 dark:border-slate-800 overflow-hidden hover:border-orange-500/40 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] transition-all duration-500 rounded-t-xl rounded-b-xl mx-auto w-full max-w-full !bg-white dark:!bg-[#1c2018]"
      onClick={() => router.push(`/offer/${primaryId}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div
        className="relative flex-1 overflow-hidden rounded-t-xl bg-white dark:bg-slate-950/40 min-h-[180px] sm:min-h-[280px] w-full border-b border-gray-100/50 dark:border-slate-800/30"
        style={{ aspectRatio: "1 / 1.4142" }}
      >
        <MarkedPoster
          src={posterSrc}
          alt={shopName || offerDisplayName}
          markedItems={posters?.[0]?.markedItems || []}
          className="w-full h-full"
          showNames={false}
          onAspectRatioChange={setAspectRatio}
          bgClassName="bg-white dark:bg-slate-950/40 shadow-sm"
        />

        {/* Subtle top overlay gradient for badge readability */}
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />

        {daysLeftText && (
          <div className="absolute top-0 left-0 z-20 pointer-events-none">
            <span className={cn(
              "px-3 py-1 rounded-tl-xl rounded-br-xl text-[9px] sm:text-[8px] font-black tracking-wider flex items-center shadow-sm backdrop-blur-md border-b border-r shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]",
              isUrgent
                ? "bg-red-500/15 dark:bg-red-500/25 text-slate-800 dark:text-slate-200 border-red-500/30 dark:border-red-500/20"
                : "bg-white/30 dark:bg-black/30 text-slate-800 dark:text-slate-200 border-white/40 dark:border-white/15"
            )}>
              <span>{daysLeftText}</span>
            </span>
          </div>
        )}

        {/* Flat Shop Logo Corner */}
        <div className="absolute bottom-0 right-0 w-11 h-11 sm:w-14 sm:h-14 rounded-tl-2xl bg-white dark:bg-[#1c2018] p-1 border-t border-l border-slate-100 dark:border-slate-800/60 z-20 flex items-center justify-center overflow-hidden transition-transform duration-500">
          {shopLogo ? (
            <img
              src={shopLogo}
              alt={shopName || "Shop Logo"}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          )}
        </div>

        <div className={`absolute inset-0 transition-all duration-500 bg-black/10 ${isHovered ? "opacity-100" : "opacity-0"}`} />

        {/* Top Actions/Badges */}
        <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-2 items-start">
          </div>
        </div>

        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
          <span className="px-4 py-2 rounded-full text-[8px] sm:text-xs font-bold  tracking-wider bg-white/90 dark:bg-slate-900/90 text-orange-600 dark:text-orange-400 shadow-xl backdrop-blur-md border border-white/40 dark:border-white/10 transform hover:scale-105 transition-transform duration-300">
            View Details
          </span>
        </div>
      </div>

      {/* Content Info with white background */}
      <div className="bg-white dark:bg-[#1c2018] px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3 flex flex-col items-start gap-1">
        <h4 className="w-full text-sm sm:text-base md:text-md font-bold text-slate-800 dark:text-slate-800 leading-snug group-hover:text-orange-500 transition-colors truncate">
          {offerDisplayName}
        </h4>

        <div className="w-full flex items-end justify-between gap-2">
          <div className="flex flex-col min-w-0 flex-1">
            <p className="w-full text-slate-500 dark:text-slate-500 text-[8px] sm:text-xs font-semibold tracking-wider truncate">
              {shopName || "OfferKart"}
            </p>
            {showDiscount && (
              <span className={cn(
                "inline-flex items-start text-red-600 dark:text-red-400 text-[8px] sm:text-xs mt-0.5",
              )}>
                {discount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {totalOffersCount > 0 && (
              <span className="flex items-center gap-1 text-[9px] sm:text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/15">
                <Tag className="w-3 h-3 text-orange-500" />
                <span>{totalOffersCount} {totalOffersCount === 1 ? 'Offer' : 'Offers'}</span>
              </span>
            )}

            {postersCount > 0 && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] sm:text-xs font-medium text-orange-500/80 dark:text-orange-400/80 transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400">
                <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="flex items-center gap-1">
                  <span className="text-[9px] sm:text-[11px]">{postersCount}</span><span className="text-[8px] sm:text-[10px] tracking-wider opacity-80">{postersCount === 1 ? 'Page' : 'Pages'}</span>
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </PremiumCard>
  );
};

// Helper for class names
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default OfferCard;
