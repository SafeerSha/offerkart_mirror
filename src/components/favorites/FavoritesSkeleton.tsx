"use client";

import React from "react";

export default function FavoritesSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Skeleton Header Area */}
      <div className="space-y-4">
        <div className="h-4 w-32 bg-muted/60 rounded-full skeleton-shimmer" />
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="h-6 w-36 bg-muted/70 rounded-full skeleton-shimmer" />
            <div className="h-10 w-72 sm:w-96 bg-muted/80 rounded-2xl skeleton-shimmer" />
            <div className="h-4 w-full max-w-lg bg-muted/50 rounded-lg skeleton-shimmer" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 w-32 bg-muted/60 rounded-2xl skeleton-shimmer" />
            ))}
          </div>
        </div>
      </div>

      {/* Skeleton Toolbar Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40">
        <div className="h-11 w-72 bg-muted/60 rounded-2xl skeleton-shimmer" />
        <div className="h-11 w-full sm:w-64 bg-muted/50 rounded-2xl skeleton-shimmer" />
      </div>

      {/* Skeleton Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {[...Array(10)].map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col rounded-2xl overflow-hidden bg-card border border-border/60 shadow-2xs"
          >
            {/* Poster / Image Box */}
            <div className="relative aspect-[4/5] bg-muted/70 skeleton-shimmer">
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/50 skeleton-shimmer" />
              <div className="absolute bottom-3 left-3 w-16 h-5 rounded-full bg-background/50 skeleton-shimmer" />
            </div>

            {/* Content Area */}
            <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-muted/70 rounded-md skeleton-shimmer" />
                <div className="h-3 w-1/2 bg-muted/50 rounded-md skeleton-shimmer" />
              </div>
              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <div className="h-5 w-16 bg-muted/80 rounded-md skeleton-shimmer" />
                <div className="h-6 w-6 rounded-full bg-muted/60 skeleton-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
