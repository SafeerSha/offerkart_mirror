"use client";

import React from "react";
import { 
  Search, 
  X, 
  RotateCcw, 
  Video, 
  Layers,
  Sparkles
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
    { id: "youtube" as const, label: "YouTube", icon: Video },
    { id: "instagram" as const, label: "Reels", icon: Sparkles },
    { id: "facebook" as const, label: "Facebook", icon: Video },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar & Platform Tabs Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Platform Segmented Tabs */}
        <div className="p-1.5 bg-slate-100/90 dark:bg-card/70 border border-border/70 rounded-2xl inline-flex self-start md:self-auto overflow-x-auto max-w-full shadow-2xs">
          {platforms.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedPlatform === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onPlatformChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 cursor-pointer",
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

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search commercials, shops, products..."
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
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Secondary Row: Industry Selector & Active Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          {/* Industry Dropdown */}
          <div className="w-[180px] sm:w-[220px]">
            <Select value={industryId} onValueChange={onIndustryChange}>
              <SelectTrigger className="w-full h-9 sm:h-10 rounded-2xl bg-card border-border/80 shadow-2xs text-xs sm:text-sm font-medium text-foreground focus:ring-primary/40 px-3">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl bg-card border border-border shadow-xl max-h-64 z-[100]">
                <SelectItem value="all" className="font-semibold text-xs sm:text-sm cursor-pointer hover:bg-primary/10 hover:text-primary">
                  All Industries
                </SelectItem>
                {industries.map((ind) => (
                  <SelectItem
                    key={ind.id}
                    value={String(ind.id)}
                    className="text-xs sm:text-sm cursor-pointer hover:bg-primary/10 hover:text-primary"
                  >
                    {ind.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters Chip */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
