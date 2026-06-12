"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerTitle,
} from "@/components/ui/drawer";
import { useRouter } from "next/navigation";
import { IndianRupee, Tag, X, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Text } from "@/components/shared/Typography";
import { useTranslation } from "@/hooks/useTranslation";
import { MarkedItem } from "@/lib/types/offer";

interface ConsumerProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    markedItems: MarkedItem[];
    initialItemId: string | null;
    offerCategory?: string;
    onActiveItemChange?: (item: MarkedItem) => void;
    prevOfferId?: number | string | null;
    nextOfferId?: number | string | null;
    onNavigateToOffer?: (targetId: number | string) => void;
}

export const ConsumerProductModal = ({
    open,
    onOpenChange,
    markedItems = [],
    initialItemId,
    offerCategory,
    onActiveItemChange,
    prevOfferId,
    nextOfferId,
    onNavigateToOffer,
}: ConsumerProductModalProps) => {
    const router = useRouter();
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

    const activeItem = markedItems[activeIndex] || markedItems[0];

    // Trigger callback when activeItem changes
    useEffect(() => {
        if (open && activeItem && onActiveItemChange) {
            onActiveItemChange(activeItem);
        }
    }, [activeIndex, open, activeItem, onActiveItemChange]);

    if (markedItems.length === 0) return null;
    if (!activeItem) return null;

    const handleNext = () => {
        setActiveIndex((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveIndex((prev) => prev - 1);
    };

    const handleBackClick = () => {
        if (activeIndex === 0) {
            if (prevOfferId) {
                if (onNavigateToOffer) {
                    onNavigateToOffer(prevOfferId);
                } else {
                    router.push(`/offer/${prevOfferId}`);
                }
                onOpenChange(false);
            }
        } else {
            handleBack();
        }
    };

    const handleNextClick = () => {
        if (activeIndex === markedItems.length - 1) {
            if (nextOfferId) {
                if (onNavigateToOffer) {
                    onNavigateToOffer(nextOfferId);
                } else {
                    router.push(`/offer/${nextOfferId}`);
                }
                onOpenChange(false);
            }
        } else {
            handleNext();
        }
    };

    const discountValue = activeItem.oldPrice && activeItem.offerPrice && activeItem.oldPrice > activeItem.offerPrice
        ? `${Math.round(((activeItem.oldPrice - activeItem.offerPrice) / activeItem.oldPrice) * 100)}% OFF`
        : "Sale";

    // Poster boundary checking for info pills
    const currentPosterIndex = typeof (activeItem as any).posterIndex === "number" 
        ? (activeItem as any).posterIndex 
        : 0;
    const itemsInSamePoster = markedItems.filter(item => (item as any).posterIndex === currentPosterIndex);
    const isLastInPoster = itemsInSamePoster.length > 0 && 
        itemsInSamePoster[itemsInSamePoster.length - 1].id === activeItem.id;
    const isFirstInPoster = itemsInSamePoster.length > 0 && 
        itemsInSamePoster[0].id === activeItem.id;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[92vh] border-none bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl rounded-t-[32px] overflow-hidden focus:outline-none">
                {/* Drag Handle for Mobile */}
                <div className="mx-auto my-3 h-1 w-12 rounded-full bg-zinc-300 dark:bg-zinc-800 md:hidden" />

                {/* Close Button */}
                <DrawerClose className="absolute top-4 right-4 z-50 p-2 rounded-full bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all focus:outline-none border-none">
                    <X className="w-4 h-4" />
                </DrawerClose>

                <div className="relative w-full max-w-5xl mx-auto px-4 md:px-10 pb-6 pt-2 md:pt-6 flex items-center justify-between">
                    
                    {/* Left Desktop Navigation */}
                    <button
                        onClick={handleBackClick}
                        disabled={activeIndex === 0 && !prevOfferId}
                        className="hidden md:flex w-40 items-center justify-center gap-2 px-4 py-3 rounded-xl border border-orange-500/30 dark:border-orange-500/20 hover:border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-500/5 transition-all text-xs font-bold uppercase tracking-wider shrink-0 disabled:opacity-30 disabled:pointer-events-none mr-6"
                    >
                        <ChevronLeft className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                            {activeIndex === 0 ? "Prev Offer" : "Prev Product"}
                        </span>
                    </button>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-8 items-stretch w-full max-h-[75vh] overflow-y-auto overflow-x-hidden pr-1">
                        {/* Image Section */}
                        <div className="relative w-full md:w-[45%] h-64 md:h-auto md:min-h-[360px] rounded-2xl overflow-hidden bg-gradient-to-tr from-slate-50 to-white dark:from-zinc-900/40 dark:to-zinc-950/80 border border-slate-200/60 dark:border-zinc-800/60 shadow-sm flex-shrink-0 flex items-center justify-center">
                            {activeItem.productImage ? (
                                <Image
                                    src={activeItem.productImage}
                                    alt={activeItem.name}
                                    fill
                                    className="object-contain p-6"
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

                        </div>

                        {/* Details Section */}
                        <div className="flex-1 flex flex-col justify-start py-1">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2.5 py-1 rounded-md">
                                            {activeItem.mainCategory || offerCategory || "Product"}
                                        </span>
                                        {activeItem.oldPrice > activeItem.offerPrice && (
                                            <span className="bg-orange-500 text-white font-black text-[9px] uppercase tracking-wider py-0.5 px-2 rounded-full flex items-center shadow-sm">
                                                <Tag className="w-2.5 h-2.5 mr-1" />
                                                {discountValue}
                                            </span>
                                        )}
                                        {isLastInPoster && activeIndex < markedItems.length - 1 && (
                                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full border border-amber-500/20">
                                                No more products in this poster
                                            </span>
                                        )}
                                        {isFirstInPoster && activeIndex > 0 && (
                                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full border border-amber-500/20">
                                                First product in this poster
                                            </span>
                                        )}
                                    </div>
                                    {markedItems.length > 1 && (
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {activeIndex + 1} / {markedItems.length}
                                        </span>
                                    )}
                                </div>
                                
                                <DrawerTitle className="text-xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight pt-1">
                                    {activeItem.name}
                                </DrawerTitle>

                                <div className="flex items-baseline gap-2.5 pt-1">
                                    <span className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600 dark:from-orange-400 dark:to-amber-500 flex items-center">
                                        <IndianRupee className="w-6 h-6 md:w-7 md:h-7 stroke-[3] text-orange-500 dark:text-orange-400 mr-0.5" />
                                        {activeItem.offerPrice.toLocaleString()}
                                    </span>
                                    {activeItem.oldPrice > activeItem.offerPrice && (
                                        <span className="text-sm md:text-base font-medium text-muted-foreground line-through flex items-center">
                                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                            {activeItem.oldPrice.toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <Text className="text-muted-foreground text-sm leading-relaxed">
                                        {activeItem.description || "No description available for this item."}
                                    </Text>
                                </div>
                            </div>

                            {/* Mobile-only Navigation Controls (Labeled Buttons) */}
                            <div className="flex md:hidden items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-zinc-900/60 w-full gap-3">
                                <button 
                                    onClick={handleBackClick}
                                    disabled={activeIndex === 0 && !prevOfferId}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-orange-500/30 dark:border-orange-500/20 hover:border-orange-500 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <ChevronLeft className="w-4 h-4 shrink-0" />
                                    <span className="truncate">
                                        {activeIndex === 0 ? "Prev Offer" : "Prev Product"}
                                    </span>
                                </button>
                                
                                {markedItems.length > 1 && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-zinc-900/60 border border-slate-200/40 dark:border-zinc-800/30 text-xs font-semibold text-muted-foreground shrink-0">
                                        <span className="text-foreground font-bold">{activeIndex + 1}</span>
                                        <span>/</span>
                                        <span>{markedItems.length}</span>
                                    </div>
                                )}

                                <button 
                                    onClick={handleNextClick}
                                    disabled={activeIndex === markedItems.length - 1 && !nextOfferId}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-orange-500/30 dark:border-orange-500/20 hover:border-orange-500 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <span className="truncate">
                                        {activeIndex === markedItems.length - 1 ? "Next Offer" : "Next Product"}
                                    </span>
                                    <ChevronRight className="w-4 h-4 shrink-0" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Desktop Navigation */}
                    <button
                        onClick={handleNextClick}
                        disabled={activeIndex === markedItems.length - 1 && !nextOfferId}
                        className="hidden md:flex w-40 items-center justify-center gap-2 px-4 py-3 rounded-xl border border-orange-500/30 dark:border-orange-500/20 hover:border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-500/5 transition-all text-xs font-bold uppercase tracking-wider shrink-0 disabled:opacity-30 disabled:pointer-events-none ml-6"
                    >
                        <span className="truncate">
                            {activeIndex === markedItems.length - 1 ? "Next Offer" : "Next Product"}
                        </span>
                        <ChevronRight className="w-4 h-4 shrink-0" />
                    </button>

                </div>
            </DrawerContent>
        </Drawer>
    );
};
