"use client";

import { DistanceBadge } from "@/components/shared/DistanceControl";
import { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Star, Heart, IndianRupee, ShoppingBag, ArrowRight, Clock } from "lucide-react";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { isItemInFavorites } from "@/lib/api/favorites";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface ProductCardProps {
    distanceKm?: number | string | null;
    kilometer?: number | string | null;
    distance?: number | string | null;
    distance_km?: number | string | null;
    id: number;
    name?: string;
    displayName?: string;
    shopName?: string;
    shop_name?: string;
    price?: number;
    offerPrice?: number;
    offer_price?: number;
    originalPrice?: number;
    original_price?: number;
    image?: string | StaticImageData | null;
    imageUrl?: string | null;
    image_url?: string | null;
    product_image?: string | null;
    category?: string;
    subcategory?: string;
    rating?: number;
    reviews?: number;
    discount?: string;
    savingPercentage?: number;
    daysLeft?: number | string | null;
    validTo?: string | null;
    clickEnable?: boolean;
    [key: string]: any;
}

const ProductCard = ({
    id,
    name,
    displayName,
    shopName,
    shop_name,
    price,
    offerPrice,
    offer_price,
    originalPrice,
    original_price,
    image,
    imageUrl,
    image_url,
    product_image,
    category,
    subcategory,
    rating = 4.5,
    reviews = 0,
    discount,
    savingPercentage,
    daysLeft,
    validTo,
    distanceKm,
    kilometer,
    distance,
    distance_km,
    clickEnable = true,
    ...rest
}: ProductCardProps) => {
    const { t } = useTranslation("common");
    const router = useRouter();
    const { resolveHierarchyById } = useCategoryHierarchy();
    const [isHovered, setIsHovered] = useState(false);

    const { data: session } = useSession();
    const { data: favorites } = useFavorites();
    const toggleFavorite = useToggleFavorite();

    // Resilient field fallbacks
    const resolvedName = name || displayName || (rest as any).title || (rest as any).product_name || (rest as any).productName || "Product";
    const resolvedPrice = price !== undefined ? price : (offerPrice !== undefined ? offerPrice : (offer_price !== undefined ? offer_price : 0));
    const resolvedOriginalPrice = originalPrice !== undefined ? originalPrice : (original_price !== undefined ? original_price : undefined);
    const resolvedImage = image || imageUrl || image_url || product_image || (Array.isArray((rest as any).images) && (rest as any).images[0]) || null;
    const resolvedShopName = shopName || shop_name || (rest as any).shop?.business_name || (rest as any).shop?.shop_name || (rest as any).shop?.name || "";
    const resolvedDistance = distanceKm ?? kilometer ?? distance ?? distance_km ?? (rest as any).kilometer ?? (rest as any).distance_km ?? (rest as any).shop?.kilometer ?? null;

    const isFavoritedFromSource = (Array.isArray(favorites) && isItemInFavorites(favorites, id, 'OFFER_PRODUCT')) || Boolean(rest.isFavourite ?? rest.isFavorite);
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
            { itemId: id, type: 'OFFER_PRODUCT' },
            {
                onError: () => {
                    setIsFavorite(!nextFavorite);
                }
            }
        );
    };

    const resolvedCategory = resolveHierarchyById(category || "Product");
    const displayCategoryName = subcategory || resolvedCategory.sub || resolvedCategory.main || category;

    // Calculate display saving percentage if not explicitly provided
    const displaySaving = savingPercentage !== undefined
        ? savingPercentage
        : (resolvedOriginalPrice && resolvedPrice && resolvedOriginalPrice > resolvedPrice
            ? Math.round(((resolvedOriginalPrice - resolvedPrice) / resolvedOriginalPrice) * 100)
            : 0);

    // Safely parse daysLeft (number, string, or fallback calculation from validTo)
    const rawDaysLeft = daysLeft ?? (rest as any).days_left ?? (rest as any).daysLeft;
    const parsedDaysLeft: number | null = (() => {
        if (rawDaysLeft !== undefined && rawDaysLeft !== null && rawDaysLeft !== "") {
            const num = Number(rawDaysLeft);
            if (!Number.isNaN(num)) return num;
        }
        const validToStr = validTo || (rest as any).valid_to || (rest as any).validTo;
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

    return (
        <PremiumCard
            data-navigate-card={clickEnable ? "true" : undefined}
            variant="default"
            padding="none"
            className={cn(
                "group h-full flex flex-col border border-slate-100 dark:border-slate-800/80 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-none transition-all duration-500 rounded-t-xl rounded-b-xl !bg-white dark:!bg-[#1c2018]",
                clickEnable
                    ? "cursor-pointer hover:shadow-[0_20px_40px_rgba(249,115,22,0.08)] hover:border-orange-500/20"
                    : "cursor-default"
            )}
            onClick={(e) => {
                const target = e.target as HTMLElement | null;
                if (target?.closest("button, [role='button'], a, [data-prevent-card-nav]")) {
                    return;
                }
                if (clickEnable) {
                    router.push(`/product/${id}`);
                }
            }}
            onMouseEnter={() => clickEnable && setIsHovered(true)}
            onMouseLeave={() => clickEnable && setIsHovered(false)}
        >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-900/10">
                {resolvedImage ? (
                    <Image
                        src={resolvedImage}
                        alt={resolvedName}
                        fill
                        unoptimized
                        className="object-contain p-1.5"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900/20">
                        <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-700" />
                    </div>
                )}

                {/* Hover backdrop overlay */}
                <div className={cn(
                    "absolute inset-0 transition-all duration-500 bg-slate-950/20 backdrop-blur-[2px] pointer-events-none",
                    isHovered ? "opacity-100" : "opacity-0"
                )} />

                {/* Top Actions/Badges */}
                <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start pointer-events-none z-30">
                    <div className="flex items-center gap-1 flex-wrap max-w-[calc(100%-2.25rem)]">
                        {displaySaving > 0 ? (
                            <span className="h-4 px-1.5 rounded-full text-[8px] font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm inline-flex items-center tracking-tight whitespace-nowrap shrink-0 border border-transparent leading-none box-border">
                                <span className="leading-none">Save {displaySaving}%</span>
                            </span>
                        ) : discount ? (
                            <span className="h-4 px-1.5 rounded-full text-[8px] font-bold bg-orange-500 text-white shadow-sm inline-flex items-center tracking-tight whitespace-nowrap shrink-0 border border-transparent leading-none box-border">
                                <span className="leading-none">{discount.toLowerCase().startsWith("save") ? `Save ${discount.replace(/^save\s*/i, "")}` : `Save ${discount.replace(/%$/, "")}%`}</span>
                            </span>
                        ) : null}

                        {daysLeftText && (
                            <span
                                className={cn(
                                    "h-4 px-1.5 rounded-full text-[8px] font-bold shadow-sm inline-flex items-center gap-0.5 tracking-tight whitespace-nowrap shrink-0 backdrop-blur-md border leading-none box-border transition-all",
                                    isUrgent
                                        ? "bg-rose-600/90 text-white border-rose-400/40"
                                        : isExpiringSoon
                                        ? "bg-amber-500/90 text-white border-amber-300/40"
                                        : "bg-slate-900/80 dark:bg-black/80 text-white border-white/20"
                                )}
                            >
                                <Clock
                                    className={cn(
                                        "w-2 h-2 sm:w-2.5 sm:h-2.5 shrink-0",
                                        isUrgent ? "animate-pulse" : isExpiringSoon ? "text-amber-100" : "text-orange-400"
                                    )}
                                />
                                <span className="leading-none">{daysLeftText}</span>
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        data-prevent-card-nav="true"
                        onClick={handleFavoriteClick}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        disabled={toggleFavorite.isPending}
                        className={cn(
                            "p-1 rounded-full flex items-center justify-center transition-all pointer-events-auto group/fav cursor-pointer focus:outline-none shrink-0",
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

                {/* Category tag */}
                {Boolean(displayCategoryName) && displayCategoryName?.toLowerCase() !== "product" && (
                    <div className="absolute top-3 left-3 pointer-events-none z-10">
                        <span className="px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-black/60 dark:bg-black/80 text-white backdrop-blur-sm border border-white/10">
                            {displayCategoryName}
                        </span>
                    </div>
                )}

                {/* Action Hover Text */}
                {clickEnable && (
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-center transition-all duration-500 z-10 pointer-events-none",
                        isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                    )}>
                        <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/95 dark:bg-slate-900/95 text-orange-600 dark:text-orange-400 shadow-xl backdrop-blur-md border border-white/20 transform hover:scale-105 transition-transform duration-300">
                            view details
                        </span>
                    </div>
                )}
            </div>

            {/* Content Info */}
            <div className="px-3 pb-2 pt-3 flex-1 flex flex-col bg-white dark:bg-[#1c2018] rounded-b-[2rem]">
                <div>
                    {/* Shop details & Distance */}
                    {(resolvedShopName || resolvedDistance != null) && (
                        <div className="flex items-center justify-between gap-1.5 mb-1.5 min-w-0">
                            {resolvedShopName && (
                                <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 tracking-wider truncate">
                                    {resolvedShopName}
                                </span>
                            )}
                            <DistanceBadge distance={resolvedDistance} />
                        </div>
                    )}
                    {/* Product Name */}
                    <h4 className={cn(
                        "text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-snug line-clamp-2 transition-colors",
                        clickEnable && "group-hover:text-orange-500"
                    )}>
                        {resolvedName}
                    </h4>
                </div>

                {/* Price and Details link */}
                <div className="flex items-center justify-between mt-auto pt-1 border-t border-slate-100/60 dark:border-slate-800/40">
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                            <span className="text-md font-black text-slate-950 dark:text-white tracking-tight">
                                ₹{resolvedPrice}
                            </span>
                            {!!resolvedOriginalPrice && resolvedOriginalPrice > resolvedPrice && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through font-bold">
                                    ₹{resolvedOriginalPrice}
                                </span>
                            )}
                        </div>
                        {displaySaving > 0 ? (
                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                Save {displaySaving}%
                            </span>
                        ) : (<span className="text-[10px] font-extrabold text-emerald-600 dark:text-slate-400">
                            Offer price
                        </span>
                        )}
                    </div>

                    {/* Sleek action button */}
                    {clickEnable && (
                        <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-all duration-300 border border-orange-100/30 dark:border-orange-900/30 group-hover:scale-105">
                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                    )}
                </div>
            </div>
        </PremiumCard>
    );
};

export default ProductCard;
