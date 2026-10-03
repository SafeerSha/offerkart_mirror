"use client";

import React from "react";
import Link from "next/link";
import {
  Video,
  Store,
  Sparkles,
  ChevronRight,
  Film,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PromoHeaderProps {
  totalVideosCount?: number;
  totalShopsCount?: number;
}

export default function PromoHeader({
  totalVideosCount = 0,
  totalShopsCount = 0,
}: PromoHeaderProps) {
  const stats = [
    {
      label: "Live Commercials",
      value: totalVideosCount > 0 ? `${totalVideosCount}+` : "Live",
      icon: Film,
      color: "text-orange-500 dark:text-orange-400",
      bgColor: "bg-orange-500/10 dark:bg-orange-500/15",
      borderColor: "border-orange-500/20",
    },
    {
      label: "Partner Stores",
      value: totalShopsCount > 0 ? totalShopsCount : "Verified",
      icon: Store,
      color: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/15",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Interactive Reels",
      value: "HD & 4K",
      icon: Play,
      color: "text-rose-500 dark:text-rose-400",
      bgColor: "bg-rose-500/10 dark:bg-rose-500/15",
      borderColor: "border-rose-500/20",
    },
  ];

  return (
    <div className="relative mb-8 pb-2">
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
          <Video className="w-3.5 h-3.5 text-primary" />
          Promotions & Videos
        </span>
      </nav>

      {/* Main Title Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground font-sans">
            Promotional <span className="text-gradient">Showcase</span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Watch short video reels, product demonstrations, and exclusive commercials
            from verified shops in your neighborhood. Discover top deals in action!
          </p>
        </div>

        {/* Quick Summary Stat Chips */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl",
                  "bg-card/80 backdrop-blur-md border border-border/80",
                  "shadow-xs hover:shadow-md transition-all duration-300",
                  "hover:-translate-y-0.5"
                )}
              >
                <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border", stat.bgColor, stat.borderColor)}>
                  <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.color)} />
                </div>
                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-black text-foreground tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
