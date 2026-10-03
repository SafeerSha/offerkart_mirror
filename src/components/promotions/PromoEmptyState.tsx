"use client";

import React from "react";
import Link from "next/link";
import { 
  RotateCcw, 
  Film, 
  SearchX, 
  Compass, 
  ArrowRight 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PromoEmptyStateProps {
  type: "global" | "filtered";
  searchQuery?: string;
  selectedShopName?: string;
  onResetFilters?: () => void;
}

export function PromoEmptyState({
  type,
  searchQuery,
  selectedShopName,
  onResetFilters,
}: PromoEmptyStateProps) {
  if (type === "filtered") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card/60 backdrop-blur-md rounded-3xl border border-dashed border-border/80 max-w-xl mx-auto my-6 animate-fade-in shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
          <SearchX className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          No matching videos found
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6 leading-relaxed">
          {searchQuery && selectedShopName
            ? `No commercials matching "${searchQuery}" for ${selectedShopName}.`
            : searchQuery
            ? `No commercials matching "${searchQuery}".`
            : selectedShopName
            ? `No promotional videos found for ${selectedShopName}.`
            : "No promotional videos currently match your selected filters."}
        </p>

        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 transition-all hover:scale-105 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Search & Filters</span>
          </button>
        )}
      </div>
    );
  }

  // Global Empty State
  return (
    <div className="relative overflow-hidden py-16 px-6 sm:px-12 text-center rounded-3xl bg-card/70 backdrop-blur-xl border border-border/80 shadow-card max-w-2xl mx-auto my-6 animate-fade-in">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Floating Graphic */}
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500/20 via-primary/10 to-amber-500/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
          <Film className="w-10 h-10 text-primary" />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-2 font-sans">
        No Commercials Available
      </h2>
      <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
        Local shops in this area haven&apos;t published video commercials yet. Check out their latest flyers and discount offers!
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
      </div>
    </div>
  );
}
