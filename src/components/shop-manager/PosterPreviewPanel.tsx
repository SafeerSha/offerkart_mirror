"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    X,
    ChevronLeft,
    ChevronRight,
    MousePointerClick,
    FileEdit,
    Sparkles,
    Image as ImageIcon,
    ChevronDown,
    List,
} from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { PosterItem } from "./PosterCardStack";
import { MarkedPoster } from "@/components/shared/MarkedPoster";

interface PosterPreviewPanelProps {
    posters: PosterItem[];
    initialIndex: number;
    onClose: () => void;
    onEditMarking: (index: number) => void;
    onAddMarking: (index: number) => void;
    isPreparing?: boolean;
}

export function PosterPreviewPanel({
    posters,
    initialIndex,
    onClose,
    onEditMarking,
    onAddMarking,
    isPreparing = false,
}: PosterPreviewPanelProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [showTagsOverlay, setShowTagsOverlay] = useState(false);

    const poster = posters[currentIndex];
    const hasMarking = poster?.type === "marked_poster" && (poster.markedItems?.length ?? 0) > 0;

    // Turn off overlay when switching posters
    useEffect(() => {
        setShowTagsOverlay(false);
    }, [currentIndex]);

    // Sync when initialIndex changes (e.g. clicking a different thumbnail)
    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "ArrowRight") handleNext();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    });

    const handlePrev = useCallback(() => {
        setCurrentIndex((i) => (i === 0 ? posters.length - 1 : i - 1));
    }, [posters.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex((i) => (i === posters.length - 1 ? 0 : i + 1));
    }, [posters.length]);

    if (!poster) return null;

    return (
        <div className="flex flex-col absolute inset-0 bg-background overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="font-bold text-sm">Poster Preview</h3>
                        <span className="text-[11px] font-bold opacity-40 uppercase tracking-wider">
                            {currentIndex + 1} of {posters.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Row: Cancel (Left) | Badge + Action (Right) */}
            <div className="flex items-center justify-between mb-3 shrink-0">
                {/* Left: Close/Cancel */}
                <PremiumButton
                    variant="outline"
                    onClick={onClose}
                    leftIcon={X}
                    disabled={isPreparing}
                    className="rounded-xl h-9 text-xs px-4"
                >
                    Close Preview
                </PremiumButton>

                {/* Right: Status Badge & Make/Edit Marking */}
                <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    {hasMarking ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                            <MousePointerClick className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                Marked
                            </span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border/50">
                            <ImageIcon className="w-3.5 h-3.5 opacity-40" />
                            <span className="text-[11px] font-bold uppercase tracking-wider opacity-50">
                                Plain / Unmarked
                            </span>
                        </div>
                    )}

                    {/* Action Button */}
                    {hasMarking ? (
                        <PremiumButton
                            onClick={() => onEditMarking(currentIndex)}
                            leftIcon={FileEdit}
                            isLoading={isPreparing}
                            disabled={isPreparing}
                            className="rounded-xl h-9 text-xs px-4"
                        >
                            {isPreparing ? "Preparing..." : "Edit Marking"}
                        </PremiumButton>
                    ) : (
                        <PremiumButton
                            onClick={() => onAddMarking(currentIndex)}
                            leftIcon={MousePointerClick}
                            isLoading={isPreparing}
                            disabled={isPreparing}
                            className="rounded-xl h-9 text-xs px-4"
                        >
                            {isPreparing ? "Preparing..." : "Add Marking"}
                        </PremiumButton>
                    )}
                </div>
            </div>

            {/* Image Preview with MarkedPoster Component */}
            <div className="relative flex-1 min-h-0 w-full p-2">
                <MarkedPoster
                    src={poster.previewUrl}
                    alt={`Poster ${currentIndex + 1}`}
                    markedItems={poster.markedItems}
                    className="rounded-xl border border-border/10 overflow-hidden"
                    priority
                />

                {/* Overlay Navigation (Glass Buttons) */}
                {posters.length > 1 && (
                    <>
                        {/* Prev Button Zone */}
                        <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-start px-2 md:px-4 transition-opacity duration-300">
                            <button
                                onClick={handlePrev}
                                disabled={isPreparing}
                                className={cn(
                                    "w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/40 hover:scale-105 transition-all shadow-xl",
                                    isPreparing && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Next Button Zone */}
                        <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end px-2 md:px-4 transition-opacity duration-300">
                            <button
                                onClick={handleNext}
                                disabled={isPreparing}
                                className={cn(
                                    "w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/40 hover:scale-105 transition-all shadow-xl",
                                    isPreparing && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </>
                )}

                {/* Tags Overlay Drawer */}
                {showTagsOverlay && hasMarking && (
                    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-300 flex flex-col">
                        {/* Overlay Header */}
                        <div className="flex items-center justify-between p-4 shrink-0 bg-card/50">
                            <div className="flex items-center gap-2">
                                <List className="w-4 h-4 text-primary" />
                                <h3 className="font-bold text-sm">Marked Products ({poster.markedItems!.length})</h3>
                            </div>
                            <button
                                onClick={() => setShowTagsOverlay(false)}
                                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-3 content-start items-start">
                                {poster.markedItems!.map((item: any, idx) => (
                                    <TaggedProductAccordion key={item.id} item={item} idx={idx} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Tags Button to prevent layout jumping */}
                {hasMarking && !showTagsOverlay && (
                    <div className="absolute bottom-4 left-4 right-4 z-40 transition-all duration-300">
                        <PremiumButton
                            variant="outline"
                            glow={false}
                            onClick={() => setShowTagsOverlay(true)}
                            leftIcon={List}
                            className="w-full rounded-xl shadow-xl bg-white text-zinc-900 border border-border/50 hover:bg-white/95 hover:-translate-y-0.5 h-11 px-5 text-xs font-bold transition-all"
                        >
                            View {poster.markedItems!.length} Tagged Product{poster.markedItems!.length !== 1 ? "s" : ""}
                        </PremiumButton>
                    </div>
                )}
            </div>



            {/* Footer Navigation Dots */}
            <div className="mt-auto space-y-3 pt-2">
                {/* Navigation */}
                {posters.length > 1 && (
                    <div className="flex items-center justify-center mb-2">
                        <div className="flex items-center gap-1.5">
                            {posters.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => !isPreparing && setCurrentIndex(i)}
                                    disabled={isPreparing}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-200",
                                        i === currentIndex
                                            ? "bg-primary scale-125"
                                            : "bg-muted-foreground/20 hover:bg-muted-foreground/40",
                                        isPreparing && "cursor-not-allowed"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

// Sub-component for accordion tagged product cards
function TaggedProductAccordion({ item, idx }: { item: any; idx: number }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={cn(
            "border border-border/50 rounded-xl bg-white text-zinc-900 transition-all shadow-md relative group",
            expanded ? "z-50" : "z-10"
        )}>
            <div
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors relative z-20",
                    expanded ? "bg-muted/10 rounded-t-xl" : "rounded-xl"
                )}
            >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/10 shrink-0 relative">
                    {item.productImage ? (
                        <Image src={item.productImage} alt="" fill unoptimized className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] opacity-30 font-bold">
                            #{idx + 1}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.name || `Item ${idx + 1}`}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {item.oldPrice > 0 && (
                            <span className="text-[10px] line-through opacity-40">
                                {item.currency} {item.oldPrice}
                            </span>
                        )}
                        <span className="text-xs font-bold text-green-500">
                            {item.currency} {item.offerPrice}
                        </span>
                    </div>
                </div>
                <div className="shrink-0 w-8 h-8 rounded-full bg-muted/50 flex flex-col items-center justify-center">
                    <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
                </div>
            </div>

            {/* Expanded Details - Floating Overlay */}
            {expanded && (
                <div className="absolute top-full left-[-1px] right-[-1px] p-3 pt-4 bg-white border border-border/50 border-t-0 rounded-b-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="space-y-3 text-xs">
                        {/* Title & Description */}
                        <div>
                            <span className="opacity-50 block text-[10px] uppercase mb-1">Description</span>
                            <p className="font-medium text-zinc-600 leading-relaxed line-clamp-3">
                                {item.description || "No description provided."}
                            </p>
                        </div>

                        {/* Categories */}
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <span className="opacity-50 block text-[10px] uppercase mb-1">Main Category</span>
                                <span className="font-semibold text-primary">{item.mainCategory || "N/A"}</span>
                            </div>
                            <div className="flex-1">
                                <span className="opacity-50 block text-[10px] uppercase mb-1">Subcategories</span>
                                <div className="flex flex-wrap gap-1">
                                    {item.subcategories && item.subcategories.length > 0
                                        ? item.subcategories.slice(0, 3).map((sub: string, i: number) => (
                                            <span key={i} className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-medium">
                                                {sub}
                                            </span>
                                        ))
                                        : <span className="opacity-50">None</span>}
                                </div>
                            </div>
                        </div>

                        {item.productUrl && (
                            <div className="pt-2 border-t border-border/10">
                                <span className="opacity-50 text-[10px] uppercase mr-2 font-bold">Visit Link</span>
                                <a href={item.productUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px] font-bold" onClick={(e) => e.stopPropagation()}>
                                    View Product Details
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
