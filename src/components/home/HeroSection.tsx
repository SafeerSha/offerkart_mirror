"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Smartphone,
  Shirt,
  Utensils,
  Sparkle,
  Home as HomeIcon,
  ArrowRight,
  ShieldCheck,
  Percent,
  Store,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  children?: React.ReactNode;
}

interface QuickCategory {
  id: string;
  name: string;
  categoryParam: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const QUICK_CATEGORIES: QuickCategory[] = [
  {
    id: "grocery",
    name: "Supermarkets",
    categoryParam: "Grocery",
    icon: ShoppingBag,
    color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40",
  },
  {
    id: "electronics",
    name: "Electronics",
    categoryParam: "Electronics",
    icon: Smartphone,
    color: "text-blue-600 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/40",
  },
  {
    id: "fashion",
    name: "Fashion",
    categoryParam: "Fashion",
    icon: Shirt,
    color: "text-pink-600 bg-pink-500/10 border-pink-500/20 group-hover:border-pink-500/40",
  },
  {
    id: "dining",
    name: "Dining & Cafes",
    categoryParam: "Food & Dining",
    icon: Utensils,
    color: "text-amber-600 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40",
  },
  {
    id: "beauty",
    name: "Beauty & Care",
    categoryParam: "Beauty",
    icon: Sparkle,
    color: "text-purple-600 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/40",
  },
  {
    id: "home",
    name: "Home & Living",
    categoryParam: "Home & Garden",
    icon: HomeIcon,
    color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20 group-hover:border-indigo-500/40",
  },
];

export default function HeroSection({ children }: HeroSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/offers?search=${encodeURIComponent(trimmed.slice(0, 100))}`);
    } else {
      router.push("/offers");
    }
  };

  const handleCategoryClick = (categoryParam: string) => {
    router.push(`/offers?category=${encodeURIComponent(categoryParam)}`);
  };

  return (
    <section
      aria-label="Hero discovery section"
      className="relative pt-32 sm:pt-36 lg:pt-40 pb-6 lg:pb-10 overflow-hidden bg-gradient-to-b from-orange-500/[0.05] via-amber-500/[0.02] to-background border-b border-slate-100 dark:border-slate-800/80"
    >
      {/* Decorative Ambient Radial Glow Orbs */}
      <div
        aria-hidden="true"
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-r from-orange-500/12 via-amber-400/12 to-rose-400/8 rounded-full blur-[120px] pointer-events-none -z-10"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/3 -left-40 w-96 h-96 bg-orange-400/8 rounded-full blur-[100px] pointer-events-none -z-10"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/4 -right-40 w-96 h-96 bg-amber-400/8 rounded-full blur-[100px] pointer-events-none -z-10"
      />

      <div className="container mx-auto px-4">
        {/* Top Header & Value Proposition */}
        <div className="max-w-4xl mx-auto text-center mb-8 lg:mb-12">
          {/* H1 Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.14] mb-4">
            Your Neighborhood <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500">
              Your Offers
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed mb-7 sm:mb-9">
            Find supermarket offers, discount coupons, and great deals from shops near you.
          </p>

          {/* Hero Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto relative flex items-center mb-6 sm:mb-8 group"
          >
            <div className="relative w-full flex items-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] group-hover:border-orange-500/40 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all p-1.5">
              <div className="pl-3.5 pr-2 text-slate-400 dark:text-slate-500">
                <Search className="w-5 h-5 group-hover:text-orange-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={100}
                placeholder="Search shops, flyers, groceries, electronics..."
                aria-label="Search deals, shops and flyers"
                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search input"
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 mr-1.5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Find Deals</span>
                <ArrowRight className="w-4 h-4 hidden sm:inline-block" />
              </button>
            </div>
          </form>

          {/* Quick Categories Bar */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Popular Categories
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-3xl">
              {QUICK_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.categoryParam)}
                    className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <div className={cn("p-1 rounded-lg border transition-colors", cat.color)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trust Metrics Pill */}
          <div className="mt-7 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-orange-500" />
              <span>500+ Verified Shops</span>
            </div>
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-500" />
              <span>1,200+ Live Offers</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Updated Daily</span>
            </div>
          </div>
        </div>

        {/* Hero Children: The Featured Flyer Showcase Stage */}
        {children && (
          <div className="relative mt-4">
            {/* Ambient Backdrop Stage Glow */}
            <div
              aria-hidden="true"
              className="absolute inset-x-8 -top-6 bottom-4 bg-gradient-to-r from-orange-500/5 via-amber-500/8 to-orange-500/5 rounded-[3rem] blur-2xl pointer-events-none -z-10"
            />
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
