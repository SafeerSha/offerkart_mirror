"use client";

import React from "react";
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  Grid3X3, 
  LayoutGrid, 
  Share2, 
  Ticket, 
  ShoppingBag, 
  Layers,
  ArrowUpDown,
  Store,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type FavoritesTabType = "all" | "offers" | "products";
export type SortOptionType = "recent" | "expiring" | "price_asc" | "price_desc" | "savings";

interface FavoritesToolbarProps {
  activeTab: FavoritesTabType;
  onTabChange: (tab: FavoritesTabType) => void;
  totalCount: number;
  offersCount: number;
  productsCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStore: string;
  onStoreChange: (store: string) => void;
  availableStores: string[];
  sortBy: SortOptionType;
  onSortChange: (sort: SortOptionType) => void;
  viewMode: "grid" | "compact";
  onViewModeChange: (mode: "grid" | "compact") => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export default function FavoritesToolbar({
  activeTab,
  onTabChange,
  totalCount,
  offersCount,
  productsCount,
  searchQuery,
  onSearchChange,
  selectedStore,
  onStoreChange,
  availableStores,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClearFilters,
}: FavoritesToolbarProps) {
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      toast.success("Favorites page link copied to clipboard!", {
        description: "You can now share your favorite deals and products.",
      });
    }
  };

  const tabs = [
    {
      id: "all" as const,
      label: "All Items",
      count: totalCount,
      icon: Layers,
    },
    {
      id: "offers" as const,
      label: "Offers & Flyers",
      count: offersCount,
      icon: Ticket,
    },
    {
      id: "products" as const,
      label: "Products",
      count: productsCount,
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="space-y-4 mb-8">
      {/* Top Bar: Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Segmented Tab Controls */}
        <div className="p-1.5 bg-slate-100/90 dark:bg-card/70 border border-border/70 rounded-2xl inline-flex self-start md:self-auto overflow-x-auto max-w-full shadow-2xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0",
                  isActive
                    ? "bg-white dark:bg-card text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-muted/40"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] font-bold py-0.5 px-2 rounded-full",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-200 dark:bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search saved offers, products, stores..."
            className={cn(
              "w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs sm:text-sm",
              "bg-card border border-border/80 text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all",
              "shadow-2xs"
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Secondary Controls Bar: Filters, Sort, View Toggle, Share */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Store Filter Selector */}
          {availableStores.length > 0 && (
            <div className="relative inline-flex items-center">
              <Store className="w-3.5 h-3.5 text-muted-foreground absolute left-3 pointer-events-none" />
              <select
                value={selectedStore}
                onChange={(e) => onStoreChange(e.target.value)}
                className={cn(
                  "pl-8 pr-7 py-1.5 rounded-xl text-xs font-medium appearance-none cursor-pointer",
                  "bg-card border border-border/80 text-foreground",
                  "hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary transition-colors",
                  selectedStore !== "all" && "border-primary/50 bg-primary/5 text-primary font-semibold"
                )}
              >
                <option value="all">All Stores ({availableStores.length})</option>
                {availableStores.map((store) => (
                  <option key={store} value={store}>
                    {store}
                  </option>
                ))}
              </select>
              <ArrowUpDown className="w-3 h-3 text-muted-foreground absolute right-2.5 pointer-events-none opacity-60" />
            </div>
          )}

          {/* Sort By Selector */}
          <div className="relative inline-flex items-center">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground absolute left-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOptionType)}
              className={cn(
                "pl-8 pr-7 py-1.5 rounded-xl text-xs font-medium appearance-none cursor-pointer",
                "bg-card border border-border/80 text-foreground",
                "hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              )}
            >
              <option value="recent">Recently Saved</option>
              <option value="expiring">Expiring Soonest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="savings">Highest Savings</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-muted-foreground absolute right-2.5 pointer-events-none opacity-60" />
          </div>

          {/* Reset Filters Chip */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* View Mode & Share Collection */}
        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium",
              "bg-card border border-border/80 text-muted-foreground hover:text-foreground",
              "hover:border-primary/40 transition-colors shadow-2xs"
            )}
            title="Share Favorites"
          >
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* View Mode Toggle */}
          <div className="p-1 bg-slate-100 dark:bg-card border border-border/70 rounded-xl inline-flex items-center">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                viewMode === "grid"
                  ? "bg-white dark:bg-muted text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Standard Grid (4-5 columns)"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("compact")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                viewMode === "compact"
                  ? "bg-white dark:bg-muted text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Focused Grid (2-3 columns)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
