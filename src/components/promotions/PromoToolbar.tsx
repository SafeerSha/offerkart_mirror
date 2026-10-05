"use client";

import React from "react";
import { 
  Search, 
  X, 
  RotateCcw, 
  Video, 
  Layers,
  Sparkles,
  Film,
  Youtube,
  Instagram,
  Facebook
} from "lucide-react";
import { Industry } from "@/lib/api/industry";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PlatformFilterType = "all" | "youtube" | "instagram" | "facebook";

interface PromoToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPlatform: PlatformFilterType;
  onPlatformChange: (p: PlatformFilterType) => void;
  industryId: string;
  onIndustryChange: (id: string) => void;
  industries: Industry[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function PromoToolbar({
  searchQuery,
  onSearchChange,
  selectedPlatform,
  onPlatformChange,
  industryId,
  onIndustryChange,
  industries,
  hasActiveFilters,
  onResetFilters,
}: PromoToolbarProps) {
  const platforms = [
    { id: "all" as const, label: "All Platforms", icon: Layers },
    { id: "youtube" as const, label: "YouTube", icon: Youtube },
    { id: "instagram" as const, label: "Reels", icon: Instagram },
    { id: "facebook" as const, label: "Facebook", icon: Facebook },
  ];

  return (
    <div className="mb-2.5 sm:mb-3">
      {/* Main Toolbar Row: Platform Tabs + Combined Search & Industry Field */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 sm:gap-2.5">
        {/* Platform Segmented Tabs */}
        <div className="p-1 bg-slate-100/90 dark:bg-card/70 border border-border/70 rounded-xl inline-flex self-start lg:self-auto overflow-x-auto max-w-full shadow-2xs shrink-0">
          {platforms.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedPlatform === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onPlatformChange(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0 cursor-pointer",
                  isActive
                    ? "bg-white dark:bg-card text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-muted/40"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Combined Industry Filter + Search Bar in a single compact row field */}
        <div className="flex items-center gap-2 flex-1 lg:max-w-xl">
          <div className="flex items-center w-full bg-card border border-border/80 rounded-xl shadow-2xs focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all overflow-hidden h-9 sm:h-10">
            {/* Industry Dropdown Section */}
            <div className="w-[115px] sm:w-[145px] shrink-0 h-full">
              <Select value={industryId} onValueChange={onIndustryChange}>
                <SelectTrigger className="w-full h-full border-0 bg-transparent rounded-none px-2.5 text-xs font-medium text-foreground focus:ring-0 focus:ring-offset-0 shadow-none hover:bg-muted/40 transition-colors cursor-pointer">
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent className="rounded-xl !bg-white dark:!bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-64 z-[100] text-slate-900 dark:text-slate-100">
                  <SelectItem value="all" className="font-semibold text-xs cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 dark:focus:bg-slate-800 dark:focus:text-orange-400">
                    All Industries
                  </SelectItem>
                  {industries.map((ind) => (
                    <SelectItem
                      key={ind.id}
                      value={String(ind.id)}
                      className="text-xs cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 dark:focus:bg-slate-800 dark:focus:text-orange-400"
                    >
                      {ind.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vertical Divider */}
            <div className="h-4 w-[1px] bg-border shrink-0" />

            {/* Search Input Section */}
            <div className="relative flex-1 flex items-center h-full min-w-0">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 pointer-events-none shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search commercials, shops, products..."
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

          {/* Reset Filters Chip */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset Filters</span>
              <span className="sm:hidden">Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
