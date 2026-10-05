"use client";

import React from "react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { 
  Heart, 
  Ticket, 
  ShoppingBag, 
  Store 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoritesHeaderProps {
  totalCount: number;
  offersCount: number;
  productsCount: number;
  storesCount: number;
}

export default function FavoritesHeader({
  totalCount,
  offersCount,
  productsCount,
  storesCount,
}: FavoritesHeaderProps) {
  const stats = [
    {
      label: "Total",
      value: totalCount,
      icon: Heart,
      color: "text-rose-500 dark:text-rose-400",
      bgColor: "bg-rose-500/10 dark:bg-rose-500/15",
      borderColor: "border-rose-500/20",
    },
    {
      label: "Offers",
      value: offersCount,
      icon: Ticket,
      color: "text-orange-500 dark:text-orange-400",
      bgColor: "bg-orange-500/10 dark:bg-orange-500/15",
      borderColor: "border-orange-500/20",
    },
    {
      label: "Products",
      value: productsCount,
      icon: ShoppingBag,
      color: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/15",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Stores",
      value: storesCount,
      icon: Store,
      color: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/15",
      borderColor: "border-emerald-500/20",
    },
  ];

  return (
    <div className="relative mb-2.5 sm:mb-3">
      {/* Standard Shared Breadcrumb Navigation */}
      <Breadcrumbs items={[{ label: "Favorites" }]} className="mb-1" />

      {/* Main Title & Compact Stats Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground font-sans">
            My <span className="text-gradient">Favorites</span>
          </h1>
        </div>

        {/* Quick Summary Stat Chips in a single row */}
        {totalCount > 0 && (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 w-full lg:w-auto shrink-0">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center justify-center sm:justify-start gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-xl min-w-0",
                    "bg-card/80 backdrop-blur-md border border-border/80",
                    "shadow-2xs hover:shadow-xs transition-all duration-200"
                  )}
                >
                  <div className={cn("w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 border", stat.bgColor, stat.borderColor)}>
                    <Icon className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", stat.color)} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-base font-black text-foreground tracking-tight leading-none">
                      {stat.value}
                    </div>
                    <div className="text-[9px] sm:text-[11px] font-medium text-muted-foreground truncate leading-none mt-0.5">
                      {stat.label}
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
