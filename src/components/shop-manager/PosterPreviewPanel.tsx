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
    variant?: "inline" | "overlay";
}

export function PosterPreviewPanel({
    posters,
    initialIndex,
    onClose,
    onEditMarking,
    onAddMarking,
    isPreparing = false,
    variant = "inline",
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

    const content = (
        <div className={cn(
            "flex flex-col bg-white overflow-hidden animate-in fade-in duration-300 shadow-2xl transition-colors",
            variant === "overlay" 
                ? "relative w-full h-[95%] sm:h-[90%] max-w-5xl mx-auto my-auto rounded-3xl border border-zinc-200 p-4 md:p-8 opacity-100" 
                : "absolute inset-0 p-5 sm:p-7 rounded-[2rem] border border-zinc-100 shadow-sm"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex items-baseline gap-2 min-w-0">
                        <h3 className="font-bold text-sm truncate text-zinc-900">Poster Preview</h3>
                        <span className="text-[11px] font-bold opacity-40 uppercase tracking-wider whitespace-nowrap text-zinc-500">
                            {currentIndex + 1} of {posters.length}
                        </span>
                    </div>
                </div>

                {/* Close button for overlay */}
                {variant === "overlay" && (
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors shadow-sm text-zinc-900"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
                {/* Left: Close - Hide on overlay as we have X in header */}
                <div className={cn(variant === "overlay" ? "hidden" : "block")}>
                    <PremiumButton
                        variant="outline"
                        onClick={onClose}
                        leftIcon={X}
                        disabled={isPreparing}
                        className="rounded-xl h-9 text-xs px-4"
                    >
                        Close Preview
                    </PremiumButton>
                </div>

                {/* Right: Status Badge & Action */}
                <div className="flex flex-1 sm:flex-initial items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    {hasMarking ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 shrink-0">
                            <MousePointerClick className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                Marked
                            </span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 shrink-0">
                            <ImageIcon className="w-3.5 h-3.5 opacity-40 text-zinc-900" />
                            <span className="text-[11px] font-bold uppercase tracking-wider opacity-60 text-zinc-900">
                                Plain
                            </span>
                        </div>
                    )}

                    <div className="flex-1 sm:flex-initial">
                        {hasMarking ? (
                            <PremiumButton
                                onClick={() => onEditMarking(currentIndex)}
                                leftIcon={FileEdit}
                                isLoading={isPreparing}
                                disabled={isPreparing}
                                className="rounded-xl h-9 text-xs px-4 w-full sm:w-auto"
                            >
                                {isPreparing ? "Wait..." : "Edit Marking"}
                            </PremiumButton>
                        ) : (
                            <PremiumButton
                                onClick={() => onAddMarking(currentIndex)}
                                leftIcon={MousePointerClick}
                                isLoading={isPreparing}
                                disabled={isPreparing}
                                className="rounded-xl h-9 text-xs px-4 w-full sm:w-auto"
                            >
                                {isPreparing ? "Wait..." : "Add Marking"}
                            </PremiumButton>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Preview */}
            <div className="relative flex-1 min-h-0 w-full p-2 group bg-muted/5 rounded-2xl">
                <MarkedPoster
                    src={poster.previewUrl}
                    alt={`Poster ${currentIndex + 1}`}
                    markedItems={poster.markedItems}
                    className="rounded-xl border border-border/5 overflow-hidden bg-muted/10 shadow-inner"
                    priority
                />

                {/* Navigation Buttons */}
                {posters.length > 1 && (
                    <>
                        <div className="absolute inset-y-0 left-0 w-16 md:w-24 flex items-center justify-start px-2 md:px-4 z-40">
                            <button
                                onClick={handlePrev}
                                disabled={isPreparing}
                                className={cn(
                                    "w-9 h-9 md:w-12 md:h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 transition-all shadow-xl",
                                    isPreparing && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="absolute inset-y-0 right-0 w-16 md:w-24 flex items-center justify-end px-2 md:px-4 z-40">
                            <button
                                onClick={handleNext}
                                disabled={isPreparing}
                                className={cn(
                                    "w-9 h-9 md:w-12 md:h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 transition-all shadow-xl",
                                    isPreparing && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </>
                )}

                {/* Floating Tags Button */}
                {hasMarking && !showTagsOverlay && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 w-full max-w-[280px]">
                        <PremiumButton
                            variant="outline"
                            glow={false}
                            onClick={() => setShowTagsOverlay(true)}
                            leftIcon={List}
                            className="w-full rounded-2xl shadow-2xl bg-white text-zinc-900 border-0 hover:bg-white h-12 px-6 text-xs font-black transition-all"
                        >
                            View {poster.markedItems!.length} Marked Product{poster.markedItems!.length !== 1 ? "s" : ""}
                        </PremiumButton>
                    </div>
                )}

                {/* Tags Overlay */}
                {showTagsOverlay && hasMarking && (
                    <div className="absolute inset-x-0 bottom-0 top-0 sm:top-1/4 sm:bottom-0 z-50 bg-white animate-in slide-in-from-bottom-full duration-500 rounded-t-3xl border-t border-zinc-200 shadow-2xl flex flex-col transition-colors">
                        <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto my-3 shrink-0" />
                        
                        <div className="flex items-center justify-between px-6 pb-4 shrink-0">
                            <div className="flex items-center gap-2">
                                <List className="w-4 h-4 text-primary" />
                                <h3 className="font-black text-sm uppercase tracking-tight text-zinc-900">Marked Products ({poster.markedItems!.length})</h3>
                            </div>
                            <button
                                onClick={() => setShowTagsOverlay(false)}
                                className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors text-zinc-900"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-8 custom-scrollbar">
                            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
                                {poster.markedItems!.map((item: any, idx) => (
                                    <TaggedProductAccordion key={item.id} item={item} idx={idx} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Thumbnail Navigation Strip */}
            <div className="mt-4 shrink-0 pb-2">
                <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
                    {posters.map((p, i) => (
                        <button
                            key={p.id}
                            onClick={() => !isPreparing && setCurrentIndex(i)}
                            disabled={isPreparing}
                            className={cn(
                                "relative w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 active:scale-95",
                                i === currentIndex
                                    ? "border-orange-500 ring-2 ring-orange-500/30 scale-105 z-10 shadow-lg"
                                    : "border-gray-100 opacity-60 hover:opacity-100 hover:border-gray-200",
                                isPreparing && "cursor-not-allowed"
                            )}
                        >
                            {p.previewUrl && (
                                <Image src={p.previewUrl} alt="" fill className="object-cover" unoptimized />
                            )}
                            <div className={cn(
                                "absolute inset-0 bg-orange-500/10",
                                i !== currentIndex && "hidden"
                            )} />
                            {p.type === "marked_poster" && (
                                <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-orange-500 flex items-center justify-center border border-white shadow-sm">
                                    <MousePointerClick className="w-2 h-2 text-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    if (variant === "overlay") {
        return (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
                <div className="absolute inset-0 -z-10" onClick={onClose} />
                {content}
            </div>
        );
    }

    return content;
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
