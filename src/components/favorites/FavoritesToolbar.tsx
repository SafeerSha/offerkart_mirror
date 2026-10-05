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
  RotateCcw,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

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
      label: "All",
      count: totalCount,
      icon: Layers,
    },
    {
      id: "offers" as const,
      label: "Offers",
      count: offersCount,
      icon: Tag,
    },
    {
      id: "products" as const,
      label: "Products",
      count: productsCount,
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="mb-2.5 sm:mb-3 space-y-2">
      {/* Top Bar: Tabs & Combined Store Filter + Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 sm:gap-2.5">
        {/* Segmented Tab Controls */}
        <div className="p-1 bg-slate-100/90 dark:bg-card/70 border border-border/70 rounded-xl inline-flex self-start lg:self-auto overflow-x-auto max-w-full shadow-2xs shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0 cursor-pointer",
                  isActive
                    ? "bg-white dark:bg-card text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-muted/40"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] font-bold py-0.2 px-1.5 rounded-full",
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

        {/* Combined Store Filter + Search Input in a single row field */}
        <div className="flex items-center gap-2 flex-1 lg:max-w-xl">
          <div className="flex items-center w-full bg-card border border-border/80 rounded-xl shadow-2xs focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all overflow-hidden h-9 sm:h-10">
            {/* Store Filter Selector (if available) */}
            {availableStores.length > 0 && (
              <>
                <div className="w-[120px] sm:w-[150px] shrink-0 h-full">
                  <Select value={selectedStore} onValueChange={onStoreChange}>
                    <SelectTrigger className="w-full h-full border-0 bg-transparent rounded-none px-2.5 text-xs font-medium text-foreground focus:ring-0 focus:ring-offset-0 shadow-none hover:bg-muted/40 transition-colors cursor-pointer gap-1.5 [&>span]:truncate">
                      <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <SelectValue placeholder="All Stores" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl !bg-white dark:!bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-64 z-[100] text-slate-900 dark:text-slate-100 min-w-[150px]">
                      <SelectItem value="all" className="font-semibold text-xs cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 dark:focus:bg-slate-800 dark:focus:text-orange-400">
                        All Stores ({availableStores.length})
                      </SelectItem>
                      {availableStores.map((store) => (
                        <SelectItem key={store} value={store} className="text-xs cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 dark:focus:bg-slate-800 dark:focus:text-orange-400">
                          {store}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-4 w-[1px] bg-border shrink-0" />
              </>
            )}

            {/* Search Input */}
            <div className="relative flex-1 flex items-center h-full min-w-0">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 pointer-events-none shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search saved offers, products..."
                className="w-full h-full pl-8 pr-7 text-xs bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Controls Bar: Sort, Reset, Share, View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        {/* Sort and Active Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort By Modern Selector */}
          <Select value={sortBy} onValueChange={(val) => onSortChange(val as SortOptionType)}>
            <SelectTrigger className="h-8 rounded-lg bg-card border border-border/80 shadow-2xs text-xs font-medium text-foreground px-2.5 gap-1.5 hover:border-primary/50 focus:ring-1 focus:ring-primary transition-colors cursor-pointer w-auto min-w-[130px]">
              <SlidersHorizontal className="w-3 h-3 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="rounded-xl !bg-white dark:!bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-[100] text-slate-900 dark:text-slate-100 min-w-[160px]">
              <SelectItem value="recent" className="text-xs cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 dark:focus:bg-slate-800 dark:focus:text-orange-400">
                Recently Saved
              </SelectItem>
              <SelectItem value="expiring" className="text-xs cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 dark:focus:bg-slate-800 dark:focus:text-orange-400">
                Expiring Soonest
              </SelectItem>
              <SelectItem value="price_asc" className="text-xs cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 dark:focus:bg-slate-800 dark:focus:text-orange-400">
                Price: Low to High
              </SelectItem>
              <SelectItem value="price_desc" className="text-xs cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 dark:focus:bg-slate-800 dark:focus:text-orange-400">
                Price: High to Low
              </SelectItem>
              <SelectItem value="savings" className="text-xs cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 dark:focus:bg-slate-800 dark:focus:text-orange-400">
                Highest Savings
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters Chip */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* View Mode & Share Collection */}
        <div className="flex items-center gap-1.5">
          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shadow-2xs cursor-pointer"
            title="Share Favorites"
          >
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* View Mode Toggle */}
          <div className="p-0.5 bg-slate-100 dark:bg-card border border-border/70 rounded-lg inline-flex items-center">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "p-1 rounded-md transition-colors cursor-pointer",
                viewMode === "grid"
                  ? "bg-white dark:bg-muted text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Standard Grid (4-5 columns)"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("compact")}
              className={cn(
                "p-1 rounded-md transition-colors cursor-pointer",
                viewMode === "compact"
                  ? "bg-white dark:bg-muted text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Focused Grid (2-3 columns)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
