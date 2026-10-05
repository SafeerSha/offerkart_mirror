"use client";

import React from "react";
import Link from "next/link";
import { 
  HeartCrack, 
  SearchX, 
  ArrowRight, 
  ShoppingBag, 
  Compass,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoritesEmptyStateProps {
  type: "global" | "filtered";
  searchQuery?: string;
  selectedStore?: string;
  onResetFilters?: () => void;
}

export default function FavoritesEmptyState({
  type,
  searchQuery,
  selectedStore,
  onResetFilters,
}: FavoritesEmptyStateProps) {
  if (type === "filtered") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card/60 backdrop-blur-md rounded-3xl border border-dashed border-border/80 max-w-2xl mx-auto my-6 animate-fade-in shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mb-5 text-amber-500">
          <SearchX className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          No matches found
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6 leading-relaxed">
          {searchQuery && selectedStore && selectedStore !== "all"
            ? `No saved items matching "${searchQuery}" in ${selectedStore}.`
            : searchQuery
            ? `No saved items matching "${searchQuery}".`
            : selectedStore && selectedStore !== "all"
            ? `You haven't saved any items from ${selectedStore} yet.`
            : "No saved items match your selected filter criteria."}
        </p>

        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 transition-all hover:scale-105"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Search & Filters</span>
          </button>
        )}
      </div>
    );
  }

  // Global Empty State
  const quickCategories = [
    { label: "Supermarket & Groceries", href: "/offers" },
    { label: "Electronics & Tech", href: "/offers" },
    { label: "Fashion & Lifestyle", href: "/products" },
    { label: "Dining & Food", href: "/offers" },
  ];

  return (
    <div className="relative overflow-hidden py-16 px-6 sm:px-12 text-center rounded-3xl bg-card/70 backdrop-blur-xl border border-border/80 shadow-card max-w-3xl mx-auto my-4 animate-fade-in">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Animated Heart Graphic */}
      <div className="relative inline-flex items-center justify-center mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-orange-500/20 via-primary/10 to-amber-500/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
          <HeartCrack className="w-12 h-12 text-primary" />
        </div>
      </div>

      {/* Headline & Description */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-3 font-sans">
        Your Wishlist is Empty
      </h2>
      <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
        Save offers, discounts, and favorite products by tapping the heart icon anywhere on OfferNearU. 
        Keep tabs on flash sales and grab them before they expire!
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
        <Link
          href="/"
          className={cn(
            "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm font-bold",
            "bg-primary text-primary-foreground hover:opacity-95 transition-all shadow-lg shadow-primary/25",
            "hover:scale-105 active:scale-95"
          )}
        >
          <Compass className="w-4 h-4" />
          <span>Explore Local Offers</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/products"
          className={cn(
            "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-semibold",
            "bg-secondary text-secondary-foreground hover:bg-muted/70 transition-all border border-border/80",
            "hover:scale-105 active:scale-95"
          )}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Browse Products</span>
        </Link>
      </div>

      {/* Quick Discovery Tags */}
      <div className="pt-6 border-t border-border/60">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Popular Categories to Explore
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {quickCategories.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="text-xs px-3.5 py-1.5 rounded-full bg-background/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border/80 transition-all text-muted-foreground font-medium"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
