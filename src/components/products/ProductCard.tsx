"use client";

import { DistanceBadge } from "@/components/shared/DistanceControl";
import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Star, Heart, Percent, IndianRupee, ShoppingBag, ArrowRight } from "lucide-react";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import { useFavorites, useAddFavorite, useRemoveFavorite } from "@/hooks/useFavorites";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface ProductCardProps {
    distanceKm?: number | null;
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
    distanceKm,
    clickEnable = true,
    ...rest
}: ProductCardProps) => {
    const { t } = useTranslation("common");
    const router = useRouter();
    const { resolveHierarchyById } = useCategoryHierarchy();
    const [isHovered, setIsHovered] = useState(false);

    const { data: session } = useSession();
    const { data: favorites } = useFavorites();
    const addFavorite = useAddFavorite();
    const removeFavorite = useRemoveFavorite();

    // Resilient field fallbacks
    const resolvedName = name || displayName || (rest as any).title || (rest as any).product_name || (rest as any).productName || "Product";
    const resolvedPrice = price !== undefined ? price : (offerPrice !== undefined ? offerPrice : (offer_price !== undefined ? offer_price : 0));
    const resolvedOriginalPrice = originalPrice !== undefined ? originalPrice : (original_price !== undefined ? original_price : undefined);
    const resolvedImage = image || imageUrl || image_url || product_image || (Array.isArray((rest as any).images) && (rest as any).images[0]) || null;
    const resolvedShopName = shopName || shop_name || (rest as any).shop?.shop_name || (rest as any).shop?.name || "";

    const isFavorite = Array.isArray(favorites) && favorites.some(f => f.item_id === id && f.type === 'product');
    const favoriteItem = Array.isArray(favorites) ? favorites.find(f => f.item_id === id && f.type === 'product') : undefined;

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!session) {
            toast.warning("Authentication required", {
                description: "Please login to save favorites.",
            });
            router.push("/login");
            return;
        }

        if (isFavorite && favoriteItem) {
            removeFavorite.mutate(favoriteItem.id);
        } else {
            addFavorite.mutate({ itemId: id, type: 'product' });
        }
    };

    const resolvedCategory = resolveHierarchyById(category || "Product");
    const displayCategoryName = subcategory || resolvedCategory.sub || resolvedCategory.main || category;

    // Calculate display saving percentage if not explicitly provided
    const displaySaving = savingPercentage !== undefined
        ? savingPercentage
        : (resolvedOriginalPrice && resolvedPrice && resolvedOriginalPrice > resolvedPrice
            ? Math.round(((resolvedOriginalPrice - resolvedPrice) / resolvedOriginalPrice) * 100)
            : 0);

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
            onClick={() => clickEnable && router.push(`/product/${id}`)}
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
                    "absolute inset-0 transition-all duration-500 bg-slate-950/20 backdrop-blur-[2px]",
                    isHovered ? "opacity-100" : "opacity-0"
                )} />

                {/* Top Actions/Badges */}
                <div className="absolute top-2 left-2 right-2 sm:top-2 sm:left-2 sm:right-2 flex justify-between items-start pointer-events-none z-10">
                    <div className="flex flex-col gap-1.5 items-start">
                        {displaySaving > 0 ? (
                            <span className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 inline-flex items-center gap-1 tracking-tight whitespace-nowrap shrink-0">
                                <Percent className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3] shrink-0" />
                                <span>SAVE {displaySaving}</span>
                            </span>
                        ) : discount ? (
                            <span className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-orange-500 text-white shadow-md shadow-orange-500/20 inline-flex items-center gap-1 tracking-tight whitespace-nowrap shrink-0">
                                <Percent className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3] shrink-0" />
                                <span>{discount.replace(/%$/, "")}</span>
                            </span>
                        ) : null}
                    </div>

                    <button
                        onClick={handleFavoriteClick}
                        disabled={addFavorite.isPending || removeFavorite.isPending}
                        className={cn(
                            "px-3 py-1 sm:px-4 sm:py-1 rounded-full flex items-center justify-center backdrop-blur-md transition-all pointer-events-auto border",
                            isFavorite
                                ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20 scale-105"
                                : "bg-white/70 dark:bg-slate-950/70 text-slate-700 dark:text-slate-300 border-white/20 hover:bg-white/95 dark:hover:bg-slate-900",
                            (addFavorite.isPending || removeFavorite.isPending) && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        <Heart className={cn("w-4.5 h-4.5 transition-transform duration-300", isFavorite && "fill-current scale-110", (addFavorite.isPending || removeFavorite.isPending) && "animate-pulse")} />
                    </button>
                </div>

                {/* Category tag */}
                {displayCategoryName?.toLowerCase() !== "product" && (
                    <div className="absolute top-3 left-3 pointer-events-none z-10">
                        <span className="px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-black/60 dark:bg-black/80 text-white backdrop-blur-sm border border-white/10">
                            {displayCategoryName}
                        </span>
                    </div>
                )}

                {/* Action Hover Text */}
                {clickEnable && (
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-center transition-all duration-500 z-10",
                        isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
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
                    {/* Shop details */}
                    {resolvedShopName && (
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 tracking-wider truncate">
                                {resolvedShopName}
                            </span>
                        </div>
                    )}

                    <DistanceBadge distance={distanceKm} />
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
