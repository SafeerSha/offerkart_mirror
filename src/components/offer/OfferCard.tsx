"use client";

import { DistanceBadge } from "@/components/shared/DistanceControl";
import { useState, useEffect } from "react";
import { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Heart, Tag, Image as ImageIcon, Store } from "lucide-react";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { MarkedPoster } from "@/components/shared/MarkedPoster";
import { Poster } from "@/lib/types/offer";
import { useTranslation } from "@/hooks/useTranslation";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { isItemInFavorites } from "@/lib/api/favorites";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface OfferCardProps {
  distanceKm?: number | string | null;
  kilometer?: number | string | null;
  distance?: number | string | null;
  distance_km?: number | string | null;
  id?: number | string;
  offerId?: number | string;
  shopName?: string;
  shop_name?: string;
  offerName?: string;
  title?: string;
  image?: string | StaticImageData;
  posterSrc?: string;
  defaultPoster?: string;
  poster_url?: string;
  posters?: Poster[];
  category?: string;
  location?: string;
  validFrom?: string;
  validTo?: string;
  discount?: string;
  branchName?: string;
  daysLeft?: number | string | null;
  totalPosters?: number | string;
  shopLogo?: string | null;
  logo_url?: string | null;
  isFavourite?: boolean;
  isFavorite?: boolean;
  [key: string]: any;
}

const OfferCard = ({
  id,
  offerId,
  shopName,
  shop_name,
  offerName,
  title,
  image,
  posterSrc: propPosterSrc,
  defaultPoster,
  poster_url,
  discount,
  daysLeft,
  validTo,
  posters,
  totalPosters,
  shopLogo,
  logo_url,
  distanceKm,
  kilometer,
  distance,
  distance_km,
  isFavourite: propIsFavourite,
  isFavorite: propIsFavorite,
  ...rest
}: OfferCardProps) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const { data: session } = useSession();
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const primaryId = id ?? offerId ?? (rest as any).offer_id ?? 0;
  
  const isFavoritedFromSource = (Array.isArray(favorites) && isItemInFavorites(favorites, primaryId, 'OFFER')) || Boolean(propIsFavourite ?? propIsFavorite);
  const [isFavorite, setIsFavorite] = useState(isFavoritedFromSource);

  useEffect(() => {
    setIsFavorite(isFavoritedFromSource);
  }, [isFavoritedFromSource]);

  const handleFavoriteClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      toast.warning("Authentication required", {
        description: "Please login to save favorites.",
      });
      router.push("/login");
      return;
    }

    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);

    toggleFavorite.mutate(
      { itemId: primaryId, type: 'OFFER' },
      {
        onError: () => {
          setIsFavorite(!nextFavorite);
        }
      }
    );
  };
  const offerDisplayName = offerName || title || (rest as any).offer_title || (rest as any).name || t("catalog.untitledOffer");
  const resolvedShopName = shopName || shop_name || (rest as any).shop?.shop_name || (rest as any).shop?.business_name || (rest as any).shop?.name || "";
  const resolvedDistance = distanceKm ?? kilometer ?? distance ?? distance_km ?? (rest as any).kilometer ?? (rest as any).distance_km ?? (rest as any).shop?.kilometer ?? null;
  const posterSrc =
    posters?.[0]?.posterSrc ||
    (typeof image === "string" ? image : image?.src) ||
    propPosterSrc ||
    defaultPoster ||
    poster_url ||
    (rest as any).poster ||
    (rest as any).default_poster ||
    "/images/shop-registration-bg-light.png";
  const postersCount = Number(totalPosters) || (posters && posters.length) || ((rest as any).total_posters ? Number((rest as any).total_posters) : 0);
  const resolvedShopLogo =
    shopLogo ||
    logo_url ||
    (rest as any).shop?.logo_url ||
    (rest as any).shop?.logo ||
    null;
  // Calculate total offers count from marked items
  const totalOffersCount = posters?.reduce((acc, p) => acc + (p.markedItems?.length || 0), 0) || 0;

  // Safely parse daysLeft (number, string, or fallback calculation from validTo)
  const rawDaysLeft = daysLeft ?? (rest as any).days_left ?? (rest as any).daysLeft;
  const parsedDaysLeft: number | null = (() => {
    if (rawDaysLeft !== undefined && rawDaysLeft !== null && rawDaysLeft !== "") {
      const num = Number(rawDaysLeft);
      if (!Number.isNaN(num)) return num;
    }
    const validToStr = validTo || (rest as any).valid_to;
    if (validToStr) {
      const end = new Date(validToStr).getTime();
      const now = Date.now();
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      if (!Number.isNaN(diffDays)) return diffDays;
    }
    return null;
  })();

  const isUrgent = parsedDaysLeft !== null && parsedDaysLeft <= 3;
  const isExpiringSoon = parsedDaysLeft !== null && parsedDaysLeft > 3 && parsedDaysLeft <= 7;

  const getDaysLeftText = () => {
    if (parsedDaysLeft === null) return null;
    if (parsedDaysLeft <= 0) return t("catalog.endsToday") || "Ends today";
    if (parsedDaysLeft === 1) return t("catalog.dayLeft") || "1 day left";
    const template = t("catalog.daysLeft");
    return template && template.includes("{count}")
      ? template.replace("{count}", String(parsedDaysLeft))
      : `${parsedDaysLeft} days left`;
  };
  const daysLeftText = getDaysLeftText();
  const showDiscount = discount && !discount.toLowerCase().includes("left") && !discount.includes("ബാക്കിയുണ്ട്");

  return (
    <PremiumCard
      data-navigate-card="true"
      variant="default"
      padding="none"
      className="group cursor-pointer h-full flex flex-col border border-slate-100 dark:border-slate-800 overflow-hidden hover:border-orange-500/40 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] transition-all duration-500 rounded-t-xl rounded-b-xl mx-auto w-full max-w-full !bg-white dark:!bg-[#1c2018]"
      onClick={(e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest("button, [role='button'], a, [data-prevent-card-nav]")) {
          return;
        }
        router.push(`/offer/${primaryId}`);
      }}
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
          alt={resolvedShopName || offerDisplayName}
          markedItems={posters?.[0]?.markedItems || []}
          className="w-full h-full"
          showNames={false}
          onAspectRatioChange={setAspectRatio}
          bgClassName="bg-white dark:bg-slate-950/40 shadow-sm"
        />

        {/* Subtle top overlay gradient for badge readability */}
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />

        {/* Days Left Floating Badge */}
        {daysLeftText && (
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-20 pointer-events-none">
            <span
              className={cn(
                "inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold tracking-tight shadow-lg backdrop-blur-md border transition-all",
                isUrgent
                  ? "bg-rose-600/90 text-white border-rose-400/40 shadow-rose-950/20"
                  : isExpiringSoon
                  ? "bg-amber-500/90 text-white border-amber-300/40 shadow-amber-950/20"
                  : "bg-slate-900/80 dark:bg-black/80 text-white border-white/20 shadow-black/30"
              )}
            >
              <Clock
                className={cn(
                  "w-3 h-3 shrink-0",
                  isUrgent ? "text-white animate-pulse" : isExpiringSoon ? "text-amber-100" : "text-orange-400"
                )}
              />
              <span>{daysLeftText}</span>
            </span>
          </div>
        )}

        {/* Flat Shop Logo Corner */}
        <div className="absolute bottom-0 right-0 w-11 h-11 sm:w-14 sm:h-14 rounded-tl-2xl bg-white dark:bg-[#1c2018] p-1 border-t border-l border-slate-100 dark:border-slate-800/60 z-20 flex items-center justify-center overflow-hidden transition-transform duration-500">
          {resolvedShopLogo ? (
            <img
              src={resolvedShopLogo}
              alt={resolvedShopName || "Shop Logo"}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          )}
        </div>

        <div className={`absolute inset-0 transition-all duration-500 bg-black/10 pointer-events-none ${isHovered ? "opacity-100" : "opacity-0"}`} />

        {/* Top Actions/Badges */}
        <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex justify-end items-start pointer-events-none z-30">
          <button
            type="button"
            data-prevent-card-nav="true"
            onClick={handleFavoriteClick}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            disabled={toggleFavorite.isPending}
            className={cn(
              "p-1 rounded-full flex items-center justify-center transition-all pointer-events-auto group/fav cursor-pointer focus:outline-none",
              toggleFavorite.isPending && "opacity-70 cursor-not-allowed"
            )}
            title={isFavorite ? "Remove from favorites" : "Save to favorites"}
            aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
          >
            <Heart
              className={cn(
                "w-5 h-5 sm:w-5.5 sm:h-5.5 transition-all duration-300 stroke-[2] active:scale-90 group-hover/fav:scale-110",
                isFavorite
                  ? "fill-orange-500 stroke-orange-500 drop-shadow-[0_2px_8px_rgba(249,115,22,0.45)] scale-105"
                  : "fill-black/20 stroke-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.6)] group-hover/fav:fill-black/35",
                toggleFavorite.isPending && "animate-pulse"
              )}
            />
          </button>
        </div>

        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500 pointer-events-none",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <span className="px-4 py-2 rounded-full text-[8px] sm:text-xs font-bold  tracking-wider bg-white/90 dark:bg-slate-900/90 text-orange-600 dark:text-orange-400 shadow-xl backdrop-blur-md border border-white/40 dark:border-white/10 transform hover:scale-105 transition-transform duration-300">
            View Details
          </span>
        </div>
      </div>

      {/* Content Info with white background */}
      <div className="bg-white dark:bg-[#1c2018] px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3 flex flex-col items-start gap-1">
        <h4 className="w-full text-sm sm:text-base md:text-md font-bold text-slate-800 dark:text-slate-100 leading-snug group-hover:text-orange-500 transition-colors truncate">
          {offerDisplayName}
        </h4>

        <div className="w-full flex items-end justify-between gap-2">
          <div className="flex flex-col min-w-0 flex-1">
            <p className="w-full text-slate-500 dark:text-slate-400 text-[10px] font-semibold tracking-wider truncate">
              {resolvedShopName || "OfferNearU"}
            </p>
            <DistanceBadge distance={resolvedDistance} />
            {/* {showDiscount && (
              <span className={cn(
                "inline-flex items-start text-red-600 dark:text-red-400 text-[8px] sm:text-xs mt-0.5",
              )}>
                {discount}
              </span>
            )} */}
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
                <ImageIcon className="w-3 h-3" />
                <span className="flex items-center gap-1">
                  <span className="text-[9px] sm:text-[10px]">{postersCount}</span><span className="text-[8px] sm:text-[9px] tracking-wider">{postersCount === 1 ? 'Page' : 'Pages'}</span>
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
