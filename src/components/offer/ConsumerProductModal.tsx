"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerTitle,
} from "@/components/ui/drawer";
import { IndianRupee, Tag, X, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Text } from "@/components/shared/Typography";
import { useTranslation } from "@/hooks/useTranslation";
import { MarkedItem } from "@/lib/types/offer";

interface ConsumerProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    markedItems: MarkedItem[];
    initialItemId: string | null;
}

export const ConsumerProductModal = ({
    open,
    onOpenChange,
    markedItems = [],
    initialItemId,
}: ConsumerProductModalProps) => {
    const { t } = useTranslation("common");
    const [activeIndex, setActiveIndex] = useState(0);

    // Sync activeIndex with initialItemId when modal opens
    useEffect(() => {
        if (open && initialItemId && markedItems.length > 0) {
            const index = markedItems.findIndex(item => String(item.id) === String(initialItemId));
            if (index !== -1) {
                setActiveIndex(index);
            } else {
                setActiveIndex(0);
            }
        }
    }, [open, initialItemId, markedItems]);

    if (markedItems.length === 0) return null;

    const activeItem = markedItems[activeIndex] || markedItems[0];
    if (!activeItem) return null;

    const handleNext = () => {
        setActiveIndex((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveIndex((prev) => prev - 1);
    };

    const discountValue = activeItem.oldPrice && activeItem.offerPrice && activeItem.oldPrice > activeItem.offerPrice
        ? `${Math.round(((activeItem.oldPrice - activeItem.offerPrice) / activeItem.oldPrice) * 100)}% OFF`
        : "Sale";

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[92vh] border-none bg-[var(--card)] rounded-t-[32px] overflow-hidden focus:outline-none">
                {/* Close Button */}
                <DrawerClose className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all focus:outline-none border-none">
                    <X className="w-5 h-5" />
                </DrawerClose>

                <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-10 pb-8 pt-4 flex items-center justify-between">
                    
                    {/* Left Navigation Arrow */}
                    <button 
                        onClick={handleBack}
                        disabled={activeIndex === 0}
                        className="hidden md:flex p-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-md focus:outline-none mr-4 cursor-pointer disabled:bg-orange-200 disabled:text-white/60 disabled:cursor-not-allowed border-none"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-8 items-stretch w-full max-h-[75vh] overflow-y-auto pr-2">
                        {/* Image Section */}
                        <div className="relative w-full md:w-[45%] aspect-square md:aspect-auto md:min-h-[350px] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                            {activeItem.productImage ? (
                                <Image
                                    src={activeItem.productImage}
                                    alt={activeItem.name}
                                    fill
                                    className="object-contain p-4"
                                    sizes="(max-width: 768px) 100vw, 400px"
                                    unoptimized
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/10 text-slate-400">
                                    <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800/60 mb-2">
                                        <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        {t("catalog.noImage") || "No Image Available"}
                                    </span>
                                </div>
                            )}
                            
                            {activeItem.oldPrice > activeItem.offerPrice && (
                                <div className="absolute top-4 left-4">
                                    <span className="badge-futuristic bg-orange-500 border-none text-white font-bold py-1.5 px-3">
                                        <Tag className="w-3.5 h-3.5 mr-1" />
                                        {discountValue}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="flex-1 flex flex-col justify-between py-2">
                            <div>
                                <div className="flex items-center justify-between gap-4 mb-2">
                                    <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">
                                        {activeItem.mainCategory || t("catalog.featuredCollection")}
                                    </span>
                                    {markedItems.length > 1 && (
                                        <span className="text-xs font-semibold text-slate-400">
                                            {activeIndex + 1} / {markedItems.length}
                                        </span>
                                    )}
                                </div>
                                
                                <DrawerTitle className="text-2xl md:text-3xl font-extrabold text-foreground mb-3 leading-tight">
                                    {activeItem.name}
                                </DrawerTitle>

                                <div className="flex items-end gap-3 mb-5">
                                    <div className="flex items-center text-3xl font-extrabold text-foreground">
                                        <IndianRupee className="w-6 h-6 stroke-[2.5]" />
                                        {activeItem.offerPrice.toLocaleString()}
                                    </div>
                                    {activeItem.oldPrice > activeItem.offerPrice && (
                                        <div className="flex items-center text-lg font-semibold text-muted-foreground line-through mb-1">
                                            <IndianRupee className="w-4 h-4" />
                                            {activeItem.oldPrice.toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <Text className="text-muted-foreground text-sm md:text-base leading-relaxed">
                                        {activeItem.description || "No description available for this item."}
                                    </Text>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Mobile-only Navigation Controls */}
                                <div className="flex md:hidden gap-3 w-full justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                    <button 
                                        onClick={handleBack}
                                        disabled={activeIndex === 0}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-orange-500 border-none text-white hover:bg-orange-600 text-sm font-semibold transition-all cursor-pointer disabled:bg-orange-200 disabled:text-white/60 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Back
                                    </button>
                                    <span className="text-xs font-bold text-slate-500 px-3">
                                        {activeIndex + 1} of {markedItems.length}
                                    </span>
                                    <button 
                                        onClick={handleNext}
                                        disabled={activeIndex === markedItems.length - 1}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-orange-500 border-none text-white hover:bg-orange-600 text-sm font-semibold transition-all cursor-pointer disabled:bg-orange-200 disabled:text-white/60 disabled:cursor-not-allowed"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Navigation Arrow */}
                    <button 
                        onClick={handleNext}
                        disabled={activeIndex === markedItems.length - 1}
                        className="hidden md:flex p-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-md focus:outline-none ml-4 cursor-pointer disabled:bg-orange-200 disabled:text-white/60 disabled:cursor-not-allowed border-none"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                </div>
            </DrawerContent>
        </Drawer>
    );
};
