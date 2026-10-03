"use client";

import React from "react";
import { PlayCircle } from "lucide-react";

export function PromoSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 w-full animate-in fade-in duration-300">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col rounded-3xl overflow-hidden bg-card border border-border/60 shadow-2xs"
        >
          {/* Video 16:9 Canvas Skeleton */}
          <div className="relative aspect-video w-full bg-muted/70 skeleton-shimmer flex items-center justify-center">
            <PlayCircle className="w-10 h-10 text-muted-foreground/30" />
            <div className="absolute top-3 left-3 w-16 h-5 rounded-full bg-background/50 skeleton-shimmer" />
            <div className="absolute bottom-3 right-3 w-14 h-5 rounded-lg bg-background/50 skeleton-shimmer" />
          </div>

          {/* Footer Area Skeleton */}
          <div className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted/80 skeleton-shimmer shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-4 w-3/4 bg-muted/80 rounded-md skeleton-shimmer" />
              <div className="h-3 w-1/2 bg-muted/50 rounded-md skeleton-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
