"use client";

import React from "react";
import Link from "next/link";
import { 
  Heart, 
  Ticket, 
  ShoppingBag, 
  Store, 
  ChevronRight,
  BookmarkCheck
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
      label: "Total Saved",
      value: totalCount,
      icon: Heart,
      color: "text-rose-500 dark:text-rose-400",
      bgColor: "bg-rose-500/10 dark:bg-rose-500/15",
      borderColor: "border-rose-500/20",
    },
    {
      label: "Offers & Flyers",
      value: offersCount,
      icon: Ticket,
      color: "text-orange-500 dark:text-orange-400",
      bgColor: "bg-orange-500/10 dark:bg-orange-500/15",
      borderColor: "border-orange-500/20",
    },
    {
      label: "Saved Products",
      value: productsCount,
      icon: ShoppingBag,
      color: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/15",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Local Stores",
      value: storesCount,
      icon: Store,
      color: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/15",
      borderColor: "border-emerald-500/20",
    },
  ];

  return (
    <div className="relative mb-8 pb-4">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 font-medium">
        <Link 
          href="/" 
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-40" />
        <span className="text-foreground font-semibold flex items-center gap-1">
          <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
          Favorites
        </span>
      </nav>

      {/* Main Title Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground font-sans">
            My Saved <span className="text-gradient">Favorites</span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Keep track of your favorite local flyers, special discounts, and top products. 
            All your bookmarks synchronized and ready for your next shopping run.
          </p>
        </div>

        {/* Quick Summary Stat Chips / Cards */}
        {totalCount > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl",
                    "bg-card/80 backdrop-blur-md border border-border/80",
                    "shadow-xs hover:shadow-md transition-all duration-300",
                    "hover:-translate-y-0.5"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", stat.bgColor, stat.borderColor)}>
                    <Icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div>
                    <div className="text-xl font-black text-foreground tracking-tight">
                      {stat.value}
                    </div>
                    <div className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
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
