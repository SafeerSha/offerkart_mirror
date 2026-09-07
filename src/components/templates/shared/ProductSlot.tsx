"use client";

import React from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductSlotItem } from '../types';

export interface ProductSlotProps {
    index: number;
    item?: ProductSlotItem;
    isEditable?: boolean;
    onClick?: () => void;
    onRemove?: () => void;
    variant?: 'retail' | 'modern' | 'minimal' | 'fresh' | 'dark' | 'glass' | 'botanical' | 'school' | 'festive' | 'dynamic' | 'supermarket';
    accentColor?: string;
    className?: string;
    imageContainerClassName?: string;
    density?: 'normal' | 'compact' | 'dense';
}

export function ProductSlot({
    index,
    item,
    isEditable = false,
    onClick,
    onRemove,
    variant = 'retail',
    accentColor,
    className,
    imageContainerClassName,
    density = 'normal',
}: ProductSlotProps) {
    const isFilled = Boolean(item && (item.title || item.image || item.offerPrice));

    // Variant Styles
    const variantStyles = {
        retail: {
            card: "bg-white border-2 border-red-500 shadow-sm rounded-lg overflow-hidden",
            priceBox: "bg-red-600 text-white",
            offerPrice: "text-red-700 font-black",
            title: "text-gray-900 font-bold",
        },
        fresh: {
            card: "bg-white border-2 border-emerald-500/30 shadow-sm rounded-xl overflow-hidden",
            priceBox: "bg-emerald-600 text-white",
            offerPrice: "text-emerald-700 font-black",
            title: "text-gray-900 font-bold",
        },
        modern: {
            card: "bg-white border border-gray-200 shadow-md rounded-2xl overflow-hidden",
            priceBox: "bg-orange-500 text-white",
            offerPrice: "text-orange-600 font-black",
            title: "text-gray-900 font-bold",
        },
        dark: {
            card: "bg-slate-900/90 border border-slate-700 shadow-xl rounded-xl overflow-hidden text-white",
            priceBox: "bg-blue-600 text-white",
            offerPrice: "text-cyan-400 font-black",
            title: "text-white font-bold",
        },
        minimal: {
            card: "bg-white border border-gray-100 shadow-sm rounded-none overflow-hidden",
            priceBox: "bg-black text-white",
            offerPrice: "text-black font-extrabold",
            title: "text-gray-900 font-medium",
        },
        glass: {
            card: "bg-white/70 backdrop-blur-md border border-white/40 shadow-lg rounded-2xl overflow-hidden",
            priceBox: "bg-purple-600 text-white",
            offerPrice: "text-purple-700 font-black",
            title: "text-gray-900 font-bold",
        },
        botanical: {
            card: "bg-white border-2 border-[#17383d]/20 shadow-sm rounded-xl overflow-hidden",
            priceBox: "bg-[#17383d] text-white",
            offerPrice: "text-[#17383d] font-black",
            title: "text-[#17383d] font-bold",
        },
        school: {
            card: "bg-white border-2 border-[#173d73]/30 shadow-sm rounded-xl overflow-hidden",
            priceBox: "bg-[#1f5bb5] text-white",
            offerPrice: "text-[#173d73] font-black",
            title: "text-[#102e59] font-bold",
        },
        festive: {
            card: "bg-white border-2 border-[#f2c13c]/60 shadow-sm rounded-xl overflow-hidden",
            priceBox: "bg-[#218340] text-white",
            offerPrice: "text-[#a44722] font-black",
            title: "text-[#39251d] font-bold",
        },
        dynamic: {
            card: "bg-white border-2 border-orange-500/30 shadow-sm rounded-xl overflow-hidden",
            priceBox: "bg-[#f04a1a] text-white",
            offerPrice: "text-[#f04a1a] font-black",
            title: "text-gray-900 font-bold",
        },
        supermarket: {
            card: "bg-white border-2 border-neutral-900/10 shadow-lg rounded-xl overflow-hidden",
            priceBox: "bg-[#ffd619] text-neutral-950 font-black",
            offerPrice: "text-red-600 font-black",
            title: "text-gray-900 font-bold",
        },
    }[variant];

    if (!isFilled) {
        if (!isEditable) {
            // Invisible or blank placeholder in capture / preview mode
            return (
                <div
                    data-slot-index={index}
                    data-product-slot="true"
                    className={cn("w-full h-full min-h-0 opacity-0 pointer-events-none", className)}
                />
            );
        }

        return (
            <div
                data-slot-index={index}
                data-product-slot="true"
                onClick={onClick}
                className={cn(
                    "group relative w-full h-full min-h-0 flex flex-col items-center justify-center select-none bg-white/40",
                    "border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50/30",
                    "rounded-xl cursor-pointer transition-all duration-200",
                    density === 'dense' ? "p-1.5" : density === 'compact' ? "p-2.5" : "p-4",
                    className
                )}
            >
                <div className={cn(
                    "rounded-full bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center text-gray-400 group-hover:text-orange-600 transition-colors",
                    density === 'dense' ? "w-6 h-6 mb-1" : density === 'compact' ? "w-8 h-8 mb-1.5" : "w-10 h-10 mb-2"
                )}>
                    <Plus className={density === 'dense' ? "w-3.5 h-3.5" : density === 'compact' ? "w-4 h-4" : "w-5 h-5"} />
                </div>
                <span className={cn(
                    "font-bold text-gray-600 group-hover:text-orange-600 transition-colors leading-tight text-center",
                    density === 'dense' ? "text-[10px]" : "text-xs"
                )}>
                    Add Product
                </span>
                <span className={cn(
                    "text-gray-400 leading-tight",
                    density === 'dense' ? "text-[8px] mt-0" : "text-[10px] mt-0.5"
                )}>
                    Slot {index + 1}
                </span>
            </div>
        );
    }

    const currency = item?.currency || "₹";
    const discount = item?.discountPercent
        ? `${item.discountPercent}% OFF`
        : (item?.oldPrice && item?.offerPrice && Number(item.oldPrice) > Number(item.offerPrice))
            ? `${Math.round(((Number(item.oldPrice) - Number(item.offerPrice)) / Number(item.oldPrice)) * 100)}% OFF`
            : null;

    return (
        <div
            data-slot-index={index}
            data-product-slot="true"
            data-product-id={item?.sourceProductId || ""}
            onClick={isEditable ? onClick : undefined}
            className={cn(
                "group relative w-full h-full min-h-0 flex flex-col transition-transform",
                variantStyles.card,
                isEditable && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
                className
            )}
        >
            {/* Quick Remove / Edit Button in Edit Mode */}
            {isEditable && onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className={cn(
                        "absolute z-20 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow hover:bg-red-600",
                        density === 'dense' ? "top-1 right-1 w-5 h-5" : "top-2 right-2 w-6 h-6"
                    )}
                    title="Remove Product"
                >
                    <X className={density === 'dense' ? "w-3 h-3" : "w-3.5 h-3.5"} />
                </button>
            )}

            {/* Discount / Badge */}
            {discount && (
                <div
                    className={cn(
                        "absolute z-10 font-black rounded shadow-sm",
                        density === 'dense' ? "top-1 left-1 text-[8px] px-1 py-0.2" : "top-2 left-2 text-[10px] px-2 py-0.5",
                        variantStyles.priceBox
                    )}
                    style={accentColor ? { backgroundColor: accentColor } : undefined}
                >
                    {discount}
                </div>
            )}

            {/* Product Image */}
            <div className={cn("relative w-full bg-gray-50 flex items-center justify-center overflow-hidden shrink-0", imageContainerClassName || "aspect-square max-h-[160px]")}>
                {item?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.image}
                        alt={item.title || "Product"}
                        className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                        crossOrigin="anonymous"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-300">
                        <ImageIcon className={density === 'dense' ? "w-5 h-5" : "w-7 h-7"} />
                        <span className="text-[9px]">No image</span>
                    </div>
                )}
            </div>

            {/* Product Information */}
            <div className={cn(
                "flex flex-col flex-1 justify-between min-w-0",
                density === 'dense' ? "p-1.5" : density === 'compact' ? "p-2" : "p-2.5"
            )}>
                <div>
                    <h4
                        className={cn(
                            "leading-tight",
                            density === 'dense' ? "text-[10px] line-clamp-1" : "text-xs line-clamp-2",
                            variantStyles.title
                        )}
                        title={item?.title}
                    >
                        {item?.title || "Product Name"}
                    </h4>
                    {item?.description && density !== 'dense' && (
                        <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                            {item.description}
                        </p>
                    )}
                </div>

                {/* Price Display */}
                <div className={cn(
                    "flex items-baseline gap-1 mt-1 pt-1 border-t border-gray-100/60",
                    density === 'dense' ? "mt-0.5 pt-0.5" : "mt-1 pt-1"
                )}>
                    <span className={cn(
                        "leading-none",
                        density === 'dense' ? "text-xs font-black" : density === 'compact' ? "text-sm font-black" : "text-base font-black",
                        variantStyles.offerPrice
                    )}>
                        {currency}{item?.offerPrice || "0"}
                    </span>
                    {item?.oldPrice && (
                        <span className={cn(
                            "text-gray-400 line-through leading-none",
                            density === 'dense' ? "text-[9px]" : "text-[11px]"
                        )}>
                            {currency}{item.oldPrice}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
