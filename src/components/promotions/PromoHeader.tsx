"use client";

import React from "react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

interface PromoHeaderProps {
  totalVideosCount?: number;
  totalShopsCount?: number;
}

export default function PromoHeader({
  totalVideosCount = 0,
  totalShopsCount = 0,
}: PromoHeaderProps) {

  return (
    <div className="relative mb-2.5 sm:mb-3">
      {/* Standard Shared Breadcrumb Navigation */}
      <Breadcrumbs items={[{ label: "Promotions" }]} className="mb-1" />

      {/* Main Title Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-1">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground font-sans">
            Promotional <span className="text-gradient">Showcase</span>
          </h1>
        </div>
      </div>
    </div>
  );
}
