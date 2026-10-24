"use client";

import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import {
    Package,
    Eye,
    Tag,
    MousePointerClick,
    ShoppingBag,
    Search,
    ExternalLink
} from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { StatusToggleButton } from "@/components/shared/StatusToggleButton";
import { toggleOfferProductStatus } from "@/lib/api/offerproduct";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PosterItem } from "./PosterCardStack";

interface PosterProductsPanelProps {
    posters: PosterItem[];
    initialPosterIndex?: number;
    selectedPosterIndex?: number;
    onSelectPosterIndex?: (index: number) => void;
    onPreviewPoster: (index: number) => void;
    onEditMarking?: (index: number) => void;
    onProductStatusChange?: (posterIndex: number, targetId: string, newStatus: boolean) => void;
    className?: string;
}

export function PosterProductsPanel({
    posters,
    initialPosterIndex = 0,
    selectedPosterIndex: controlledPosterIndex,
    onSelectPosterIndex,
    onPreviewPoster,
    onEditMarking,
    onProductStatusChange,
    className
}: PosterProductsPanelProps) {
    const [internalPosterIndex, setInternalPosterIndex] = useState(
        Math.min(initialPosterIndex, Math.max(0, posters.length - 1))
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [productStatuses, setProductStatuses] = useState<Record<string, boolean>>({});
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

    const activeIndex = controlledPosterIndex !== undefined ? controlledPosterIndex : internalPosterIndex;
    const selectedPosterIndex = Math.min(activeIndex, Math.max(0, posters.length - 1));

    const handleSelectPoster = (idx: number) => {
        if (controlledPosterIndex === undefined) {
            setInternalPosterIndex(idx);
        }
        onSelectPosterIndex?.(idx);
        setSearchQuery("");
    };

    // Safe active poster
    const activePoster = posters[selectedPosterIndex] || posters[0];
    const allProducts = activePoster?.markedItems || [];

    const isProductActive = useCallback((item: any): boolean => {
        const key = String(item.offerProductId || item.productId || item.id);
        if (productStatuses[key] !== undefined) {
            return productStatuses[key];
        }
        if (item.isActive !== undefined) return Boolean(item.isActive);
        if (item.status) return item.status === "active" || item.status === "ACTIVE";
        return true;
    }, [productStatuses]);

    const handleToggleStatus = async (item: any, idx: number, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        const targetId = String(item.offerProductId || item.productId || item.id);
        if (!targetId || togglingIds.has(targetId)) {
            return;
        }

        const currentActive = isProductActive(item);
        const nextActive = !currentActive;

        // Optimistic UI update
        setProductStatuses((prev) => ({ ...prev, [targetId]: nextActive }));
        setTogglingIds((prev) => new Set(prev).add(targetId));

        try {
            // Call standalone offer product active/inactive toggle API
            const res = await toggleOfferProductStatus(targetId);
            if (res && (res.success || !res.error)) {
                toast.success(`Product ${nextActive ? "activated" : "paused"} successfully`);
                if (onProductStatusChange) {
                    onProductStatusChange(selectedPosterIndex, targetId, nextActive);
                }
            } else {
                throw new Error(res?.error || "Failed to update product status");
            }
        } catch (err: any) {
            console.error("Failed to toggle offer product status:", err);
            // Revert state on failure
            setProductStatuses((prev) => ({ ...prev, [targetId]: currentActive }));
            toast.error(`Failed to update product status: ${err?.message || "Server error"}`);
        } finally {
            setTogglingIds((prev) => {
                const next = new Set(prev);
                next.delete(targetId);
                return next;
            });
        }
    };

    // Filtered products if user types in search
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return allProducts;
        const q = searchQuery.toLowerCase().trim();
        return allProducts.filter((p: any) =>
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.mainCategory && p.mainCategory.toLowerCase().includes(q))
        );
    }, [allProducts, searchQuery]);

    if (!activePoster && posters.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                "flex flex-col bg-white text-zinc-900 rounded-[2rem] border border-border/80 shadow-sm overflow-hidden h-full animate-in fade-in duration-300 transition-colors",
                className
            )}
        >
            {/* 1. Header */}
            <div className="p-3.5 sm:p-5 border-b border-gray-100 bg-white/95 shrink-0 space-y-2.5 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-orange-500 shadow-2xs">
                            <Package className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <h3 className="font-bold text-xs sm:text-sm text-zinc-900 tracking-tight truncate">
                                    Poster Products
                                </h3>
                                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200/60 shrink-0">
                                    {allProducts.length} {allProducts.length === 1 ? "Product" : "Products"}
                                </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                                Products tagged in {posters.length > 1 ? `Poster ${selectedPosterIndex + 1}` : "this offer poster"}
                            </p>
                        </div>
                    </div>

                    {/* Quick Preview Action - Desktop view inline */}
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                        <PremiumButton
                            variant="outline"
                            onClick={() => onPreviewPoster(selectedPosterIndex)}
                            leftIcon={Eye}
                            className="rounded-xl h-8 text-xs px-3 font-bold border-gray-200 text-zinc-700 hover:text-orange-600 hover:border-orange-500/40"
                        >
                            Preview Poster
                        </PremiumButton>
                    </div>
                </div>

                {/* Mobile Action Bar (<sm): full-width button below title */}
                <div className="flex sm:hidden pt-0.5">
                    <PremiumButton
                        variant="outline"
                        onClick={() => onPreviewPoster(selectedPosterIndex)}
                        leftIcon={Eye}
                        className="rounded-xl h-8 text-xs px-2 font-bold w-full justify-center border-gray-200 text-zinc-700 hover:text-orange-600"
                    >
                        Preview Poster
                    </PremiumButton>
                </div>

                {/* 2. Poster Selector Tabs (Shown if multiple posters exist) */}
                {posters.length > 1 && (
                    <div className="pt-1">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                            {posters.map((p, idx) => {
                                const isSelected = idx === selectedPosterIndex;
                                const prodCount = p.markedItems?.length || 0;
                                return (
                                    <button
                                        key={p.id || idx}
                                        onClick={() => handleSelectPoster(idx)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold shrink-0 cursor-pointer",
                                            isSelected
                                                ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20"
                                                : "bg-gray-50/80 text-zinc-600 border-gray-200/70 hover:bg-white hover:border-gray-300"
                                        )}
                                    >
                                        <div className="w-5 h-6 rounded-md overflow-hidden bg-black/10 shrink-0 relative">
                                            {p.previewUrl ? (
                                                <Image
                                                    src={p.previewUrl}
                                                    alt=""
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[9px] font-bold">
                                                    #{idx + 1}
                                                </div>
                                            )}
                                        </div>
                                        <span>Poster {idx + 1}</span>
                                        <span
                                            className={cn(
                                                "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                                                isSelected
                                                    ? "bg-white/20 text-white"
                                                    : "bg-gray-200/80 text-zinc-600"
                                            )}
                                        >
                                            {prodCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. Search Filter (if more than 4 products) */}
                {allProducts.length > 4 && (
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter products by name or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-gray-50 border border-gray-200 focus:bg-white focus:border-orange-500 focus:outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>
                )}
            </div>

            {/* 4. Products List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 custom-scrollbar [scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.4)_transparent]">
                {allProducts.length === 0 ? (
                    // Empty state for poster with no products
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-3">
                            <ShoppingBag className="w-6 h-6 text-orange-500" />
                        </div>
                        <h4 className="font-bold text-sm text-zinc-900 mb-1">
                            No Products Tagged
                        </h4>
                        <p className="text-xs text-zinc-500 max-w-[240px] mb-4">
                            Poster {selectedPosterIndex + 1} does not have any product tags marked yet.
                        </p>
                        {onEditMarking && (
                            <PremiumButton
                                onClick={() => onEditMarking(selectedPosterIndex)}
                                leftIcon={MousePointerClick}
                                className="rounded-xl h-9 text-xs px-4"
                            >
                                Mark Products Now
                            </PremiumButton>
                        )}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    // No search matches
                    <div className="py-12 text-center text-zinc-400 text-xs font-medium">
                        No products match &ldquo;{searchQuery}&rdquo;
                    </div>
                ) : (
                    // Optimized Products List
                    <div className="space-y-2.5">
                        {filteredProducts.map((item: any, idx: number) => {
                            const oldPriceNum = typeof item.oldPrice === "number" ? item.oldPrice : (parseFloat(item.oldPrice) || 0);
                            const offerPriceNum = typeof item.offerPrice === "number" ? item.offerPrice : (parseFloat(item.offerPrice) || 0);
                            const hasDiscount = Boolean(oldPriceNum > 0 && oldPriceNum > offerPriceNum);
                            const discountPercent = hasDiscount
                                ? Math.round(((oldPriceNum - offerPriceNum) / oldPriceNum) * 100)
                                : 0;
                            const hasDistinctDescription =
                                item.description &&
                                item.description.trim().toLowerCase() !== (item.name || "").trim().toLowerCase();
                            const isItemActive = isProductActive(item);
                            const targetId = String(item.offerProductId || item.productId || item.id);
                            const isToggling = togglingIds.has(targetId);

                            return (
                                <div
                                    key={item.id || idx}
                                    onClick={() => onPreviewPoster(selectedPosterIndex)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            onPreviewPoster(selectedPosterIndex);
                                        }
                                    }}
                                    title="Click to preview on poster"
                                    className={cn(
                                        "p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 group flex items-center gap-2.5 sm:gap-3 relative cursor-pointer text-left select-none",
                                        isItemActive
                                            ? "border-gray-200/80 bg-white hover:border-orange-400 hover:shadow-md hover:shadow-orange-500/5"
                                            : "border-gray-200/60 bg-gray-50/70 opacity-75 hover:border-gray-300"
                                    )}
                                >
                                    {/* Product Image */}
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-50/80 border border-gray-200/70 shrink-0 relative flex items-center justify-center group-hover:border-orange-200 transition-colors shadow-2xs">
                                        {item.productImage ? (
                                            <Image
                                                src={item.productImage}
                                                alt={item.name || "Product"}
                                                fill
                                                className={cn(
                                                    "object-contain p-1 group-hover:scale-105 transition-transform duration-300",
                                                    !isItemActive && "grayscale-[30%]"
                                                )}
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                                <ShoppingBag className="w-5 h-5 text-gray-400" />
                                            </div>
                                        )}
                                        {/* Sequence Badge */}
                                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-black text-white leading-none shadow-xs">
                                            #{idx + 1}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 self-stretch">
                                        {/* Name, Discount Badge & Active/Inactive Toggle */}
                                        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                                            <h4
                                                dir="auto"
                                                className={cn(
                                                    "font-bold text-xs sm:text-sm text-zinc-900 truncate group-hover:text-orange-600 transition-colors leading-tight min-w-0 flex-1",
                                                    !isItemActive && "text-zinc-400 line-through opacity-80"
                                                )}
                                                title={item.name}
                                            >
                                                {item.name || `Product #${idx + 1}`}
                                            </h4>

                                            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                                                {discountPercent > 0 && (
                                                    <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200/60 leading-none">
                                                        {discountPercent}% OFF
                                                    </span>
                                                )}

                                                {/* Active / Inactive Standalone Toggle */}
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    className={cn(
                                                        "flex items-center transition-opacity",
                                                        isToggling && "opacity-50 pointer-events-none"
                                                    )}
                                                    title={isItemActive ? "Product active (click to pause)" : "Product paused (click to activate)"}
                                                >
                                                    <div className="scale-75 origin-right">
                                                        <StatusToggleButton
                                                            status={isItemActive ? "active" : "paused"}
                                                            onChange={() => handleToggleStatus(item, idx)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {hasDistinctDescription ? (
                                            <p
                                                dir="auto"
                                                className="text-[10px] sm:text-[11px] text-zinc-400 line-clamp-1 mt-0.5 leading-snug"
                                                title={item.description}
                                            >
                                                {item.description}
                                            </p>
                                        ) : null}

                                        {/* Prices + Badges in a single compact row */}
                                        <div className="flex items-center justify-between gap-2 mt-1.5">
                                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                                <span className={cn(
                                                    "text-xs sm:text-base font-black tracking-tight",
                                                    isItemActive ? "text-emerald-600" : "text-zinc-400"
                                                )}>
                                                    {item.currency || "₹"} {offerPriceNum > 0 ? offerPriceNum.toLocaleString() : (item.offerPrice ?? 0)}
                                                </span>
                                                {hasDiscount ? (
                                                    <span className="text-[10px] sm:text-[11px] text-zinc-400 line-through font-medium">
                                                        {item.currency || "₹"} {oldPriceNum.toLocaleString()}
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {item.mainCategory ? (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-50 border border-gray-200/60 text-[9px] sm:text-[10px] font-bold text-zinc-600 truncate max-w-[80px] sm:max-w-[100px]">
                                                        <Tag className="w-2.5 h-2.5 text-orange-500" />
                                                        <span className="truncate">{item.mainCategory}</span>
                                                    </span>
                                                ) : null}

                                                {!isItemActive ? (
                                                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-full">
                                                        Paused
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
