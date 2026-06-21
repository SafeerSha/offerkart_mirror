"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Star, Heart, Tag, IndianRupee, ShoppingBag, ArrowRight } from "lucide-react";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";

interface ProductCardProps {
    id: number;
    name: string;
    shopName: string;
    price: number;
    originalPrice?: number;
    image?: string | StaticImageData | null;
    category: string;
    subcategory?: string;
    rating?: number;
    reviews?: number;
    discount?: string;
    savingPercentage?: number;
}

const ProductCard = ({
    id,
    name,
    shopName,
    price,
    originalPrice,
    image,
    category,
    subcategory,
    rating = 4.5,
    reviews = 0,
    discount,
    savingPercentage,
}: ProductCardProps) => {
    const { t } = useTranslation("common");
    const router = useRouter();
    const { resolveHierarchyById } = useCategoryHierarchy();
    const [isHovered, setIsHovered] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const resolvedCategory = resolveHierarchyById(category);
    const displayCategoryName = subcategory || resolvedCategory.sub || resolvedCategory.main || category;

    // Calculate display saving percentage if not explicitly provided
    const displaySaving = savingPercentage !== undefined
        ? savingPercentage
        : (originalPrice && price && originalPrice > price
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : 0);

    return (
        <PremiumCard
            variant="default"
            padding="none"
            className="group cursor-pointer h-full flex flex-col border border-slate-100 dark:border-slate-800/80 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-none hover:shadow-[0_20px_40px_rgba(249,115,22,0.08)] hover:border-orange-500/20 transition-all duration-500  rounded-t-xl rounded-b-xl !bg-white dark:!bg-[#1c2018]"
            onClick={() => router.push(`/product/${id}`)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-900/10">
                {image ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        unoptimized
                        className="object-cover"
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
                {/* <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
                    <div className="flex flex-col gap-1.5 items-start">
                        {displaySaving > 0 ? (
                            <span className="px-3 py-1.5 rounded-full text-[10px] font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 flex items-center gap-1">
                                <Tag className="w-3.5 h-3.5" />
                                SAVE {displaySaving}%
                            </span>
                        ) : discount ? (
                            <span className="px-3 py-1.5 rounded-full text-[10px] font-black bg-orange-500 text-white shadow-lg shadow-orange-500/20 flex items-center gap-1">
                                <Tag className="w-3.5 h-3.5" />
                                {discount}
                            </span>
                        ) : null}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFavorite(!isFavorite);
                        }}
                        className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all pointer-events-auto border",
                            isFavorite
                                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20 scale-105"
                                : "bg-white/70 dark:bg-slate-950/70 text-slate-700 dark:text-slate-300 border-white/20 hover:bg-white/95 dark:hover:bg-slate-900"
                        )}
                    >
                        <Heart className={cn("w-4.5 h-4.5 transition-transform duration-300", isFavorite && "fill-current scale-110")} />
                    </button>
                </div> */}

                {/* Category tag */}
                {displayCategoryName.toLowerCase() !== "product" && (
                    <div className="absolute top-3 left-3 pointer-events-none z-10">
                        <span className="px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-black/60 dark:bg-black/80 text-white backdrop-blur-sm border border-white/10">
                            {displayCategoryName}
                        </span>
                    </div>
                )}

                {/* Action Hover Text */}
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-500 z-10",
                    isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
                )}>
                    <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/95 dark:bg-slate-900/95 text-orange-600 dark:text-orange-400 shadow-xl backdrop-blur-md border border-white/20 transform hover:scale-105 transition-transform duration-300">
                        view details
                    </span>
                </div>
            </div>

            {/* Content Info */}
            <div className="px-3 pb-2 pt-3 flex-1 flex flex-col bg-white dark:bg-[#1c2018] rounded-b-[2rem]">
                <div>
                    {/* Shop details */}
                    <div className="flex items-center gap-1.5 mb-2">
                        {/* <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-800 text-orange-500">
                            <ShoppingBag className="w-2.5 h-2.5" />
                        </span> */}
                        <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 tracking-wider truncate">
                            {shopName}
                        </span>
                    </div>

                    {/* Product Name */}
                    <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors">
                        {name}
                    </h4>
                </div>

                {/* Price and Details link */}
                <div className="flex items-center justify-between mt-auto pt-1 border-t border-slate-100/60 dark:border-slate-800/40">
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                            <span className="text-md font-black text-slate-950 dark:text-white tracking-tight">
                                ₹{price}
                            </span>
                            {originalPrice && originalPrice > price && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through font-bold">
                                    ₹{originalPrice}
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
                    <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-all duration-300 border border-orange-100/30 dark:border-orange-900/30 group-hover:scale-105">
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                </div>
            </div>
        </PremiumCard>
    );
};

export default ProductCard;
