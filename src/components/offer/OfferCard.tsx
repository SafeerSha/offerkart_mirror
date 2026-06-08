"use client";

import { useState } from "react";
import { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Heart, Tag } from "lucide-react";
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
  category,
  location,
  validFrom,
  validTo,
  discount,
  branchName,
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

  return (
    <PremiumCard
      variant="premium"
      padding="none"
      className="group cursor-pointer h-full flex flex-col border-none overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 rounded-2xl mx-auto w-full max-w-full bg-white"
      onClick={() => router.push(`/offer/${primaryId}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div 
        className="relative flex-1 overflow-hidden bg-gray-100 min-h-[180px] sm:min-h-[280px] w-full"
        style={{ aspectRatio: "1 / 1.4142" }}
      >
        <MarkedPoster
          src={posterSrc}
          alt={shopName || offerDisplayName}
          markedItems={posters?.[0]?.markedItems || []}
          className={cn("w-full h-full transition-transform duration-1000 ease-out", isHovered ? "scale-110" : "scale-100")}
          showNames={false}
          onAspectRatioChange={setAspectRatio}
        />

        {/* Overlays */}
        <div className={`absolute inset-0 transition-all duration-500 bg-black/20 ${isHovered ? "opacity-100" : "opacity-0"}`} />

        {/* Top Actions/Badges */}
        <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-2 items-start">
            {discount && (
              <span className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-orange-500 text-white shadow-lg shadow-orange-500/20 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {discount}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all pointer-events-auto",
              isFavorite
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                : "bg-white/20 text-white hover:bg-white/40"
            )}
          >
            <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5 transition-transform", isFavorite && "fill-current scale-110")} />
          </button>
        </div>

        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
          <span className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/95 text-orange-600 shadow-xl backdrop-blur-md border border-white/20 transform hover:scale-105 transition-transform duration-300">
            View Details
          </span>
        </div>
      </div>

      {/* Content Info with white background */}
      <div className="bg-white px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4 border-t border-gray-50 flex justify-between items-end gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 line-clamp-1">
            {shopName || "OfferKart"}
          </p>
          <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 line-clamp-1 leading-snug group-hover:text-orange-600 transition-colors">
            {offerDisplayName}
          </h4>
        </div>
        {postersCount > 0 && (
          <span className="shrink-0 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100">
            {postersCount} {postersCount === 1 ? "Poster" : "Posters"}
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
