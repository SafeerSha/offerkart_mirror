"use client";

import { useState } from "react";
import { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Heart, Tag, Image } from "lucide-react";
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
  const isUrgent = typeof daysLeft === "number" && daysLeft <= 3;

  return (
    <PremiumCard
      variant="default"
      padding="none"
      className="group cursor-pointer h-full flex flex-col border border-slate-100 dark:border-slate-800 overflow-hidden hover:border-orange-500/40 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] transition-all duration-500 rounded-t-xl rounded-b-3xl mx-auto w-full max-w-full !bg-white dark:!bg-[#1c2018] hover:-translate-y-2"
      onClick={() => router.push(`/offer/${primaryId}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div
        className="relative flex-1 overflow-hidden bg-white dark:bg-slate-950/40 min-h-[180px] sm:min-h-[280px] w-full border-b border-gray-100/50 dark:border-slate-800/30"
        style={{ aspectRatio: "1 / 1.4142" }}
      >
        <MarkedPoster
          src={posterSrc}
          alt={shopName || offerDisplayName}
          markedItems={posters?.[0]?.markedItems || []}
          className={cn("w-full h-full transition-transform duration-1000 ease-out", isHovered ? "scale-110" : "scale-100")}
          showNames={false}
          onAspectRatioChange={setAspectRatio}
          bgClassName="bg-white dark:bg-slate-950/40 shadow-sm"
        />

        {/* Overlays */}
        <div className={`absolute inset-0 transition-all duration-500 bg-black/10 ${isHovered ? "opacity-100" : "opacity-0"}`} />

        {/* Top Actions/Badges */}
        <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-2 items-start">
          </div>

          {/* <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all pointer-events-auto border border-white/20 dark:border-white/10",
              isFavorite
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 border-rose-400/30"
                : "bg-black/10 dark:bg-white/10 text-white hover:bg-black/20 dark:hover:bg-white/20"
            )}
          >
            <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5 transition-transform", isFavorite && "fill-current scale-110")} />
          </button> */}
        </div>

        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
          <span className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/90 dark:bg-slate-900/90 text-orange-600 dark:text-orange-400 shadow-xl backdrop-blur-md border border-white/40 dark:border-white/10 transform hover:scale-105 transition-transform duration-300">
            View Details
          </span>
        </div>
      </div>

      {/* Content Info with white background */}
      <div className="bg-white dark:bg-[#1c2018] px-3 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 flex justify-between items-end gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-slate-500 dark:text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1 truncate">
            {shopName || "OfferKart"}
          </p>
          <h4 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-slate-800 leading-snug group-hover:text-orange-500 transition-colors">
            {offerDisplayName}
          </h4>
          {discount && (
            <div className="mt-1 flex">
              <span className={cn(
                "inline-flex items-start py-1 text-red-600 dark:text-red-400  text-[8px] sm:text-xs",
              )}>
                {discount}
              </span>
            </div>
          )}
        </div>
        {postersCount > 0 && (
          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-600 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]">
            <Image className="w-3.5 h-3.5 mr-0.5" />
            <span>{postersCount}</span>
          </span>
        )}
      </div>
    </PremiumCard>
  );
};

// Helper for class names since I used 'cn' in the component but didn't import/declare it locally and it might not be available globally in the same way as in some templates
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default OfferCard;
