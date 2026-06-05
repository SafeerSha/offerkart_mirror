"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Star, Heart, Tag, IndianRupee, ShoppingBag } from "lucide-react";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface ProductCardProps {
    id: number;
    name: string;
    shopName: string;
    price: number;
    originalPrice?: number;
    image?: string | StaticImageData | null;
    category: string;
    rating?: number;
    reviews?: number;
    discount?: string;
}

const ProductCard = ({
    id,
    name,
    shopName,
    price,
    originalPrice,
    image,
    category,
    rating = 4.5,
    reviews = 0,
    discount,
}: ProductCardProps) => {
    const { t } = useTranslation("common");
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    return (
        <PremiumCard
            variant="premium"
            padding="none"
            className="group cursor-pointer h-full flex flex-col border-none overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 rounded-[2rem] bg-white"
            onClick={() => router.push(`/product/${id}`)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gray-100">
                {image ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        unoptimized
                        className={cn(
                            "object-cover transition-transform duration-1000 ease-out",
                            isHovered ? "scale-110" : "scale-100"
                        )}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <ShoppingBag className="w-12 h-12 text-gray-300" />
                    </div>
                )}

                {/* Overlays */}
                <div className={cn(
                    "absolute inset-0 transition-all duration-500 bg-black/20",
                    isHovered ? "opacity-100" : "opacity-0"
                )} />

                {/* Top Actions/Badges */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                    <div className="flex flex-col gap-2 items-start">
                        {discount && (
                            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500 text-white shadow-lg shadow-orange-500/20 flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {discount}
                            </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20">
                            {category}
                        </span>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFavorite(!isFavorite);
                        }}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all pointer-events-auto",
                            isFavorite
                                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                : "bg-white/20 text-white hover:bg-white/40"
                        )}
                    >
                        <Heart className={cn("w-5 h-5 transition-transform", isFavorite && "fill-current scale-110")} />
                    </button>
                </div>

                {/* Bottom Hover Action */}
                <div className={cn(
                    "absolute bottom-4 left-4 right-4 transition-all duration-500 transform",
                    isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                )}>
                    <button className="w-full py-3 bg-white text-gray-900 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl">
                        <ShoppingCart className="w-4 h-4 text-orange-500" />
                        {t("catalog.quickView")}
                    </button>
                </div>
            </div>

            {/* Content Info */}
            <div className="p-6 flex-1 flex flex-col">
                <div className="mb-auto">
                    <div className="flex items-center gap-1 mb-2">
                        <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={cn("w-3 h-3 h-3", i < Math.floor(rating) ? "fill-current" : "opacity-30")}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">({reviews})</span>
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                        {name}
                    </h4>
                    <p className="text-gray-500 text-xs font-medium mb-4 flex items-center gap-1">
                        {t("catalog.by")} <span className="text-gray-900">{shopName}</span>
                    </p>
                </div>

                <div className="flex items-end justify-between mt-4">
                    <div className="flex flex-col">
                        {originalPrice && (
                            <span className="text-xs text-red-500 line-through font-medium">
                                ₹{originalPrice}
                            </span>
                        )}
                        <span className="text-xl font-black text-gray-900">
                            ₹{price}
                        </span>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                        <ShoppingCart className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </PremiumCard>
    );
};

export default ProductCard;
