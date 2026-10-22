"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Smartphone,
  Shirt,
  Utensils,
  Sparkles,
  Home as HomeIcon,
  ArrowRight,
  ShieldCheck,
  Percent,
  Store,
  Laptop,
  Car,
  BookOpen,
  Footprints,
  Heart,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIndustries } from "@/hooks/useApi";
import { Industry } from "@/lib/api/industry";

interface HeroSectionProps {
  children?: React.ReactNode;
  initialIndustries?: Industry[];
}

const COLOR_PALETTES = [
  "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40",
  "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/40",
  "text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/20 group-hover:border-pink-500/40",
  "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40",
  "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/40",
  "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20 group-hover:border-indigo-500/40",
  "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20 group-hover:border-teal-500/40",
  "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40",
];

function getIndustryIcon(name: string, slug?: string): React.ComponentType<{ className?: string }> {
  const lower = `${name} ${slug || ""}`.toLowerCase();
  if (lower.includes("supermarket") || lower.includes("hypermarket")) {
    return ShoppingBag;
  }
  if (lower.includes("grocer") || lower.includes("mart") || lower.includes("fmcg") || lower.includes("convenience")) {
    return Store;
  }
  if (lower.includes("mobile") || lower.includes("phone")) {
    return Smartphone;
  }
  if (lower.includes("computer") || lower.includes("laptop")) {
    return Laptop;
  }
  if (lower.includes("electronic") || lower.includes("gadget") || lower.includes("tech") || lower.includes("appliance")) {
    return Smartphone;
  }
  if (lower.includes("footwear") || lower.includes("shoe")) {
    return Footprints;
  }
  if (lower.includes("fashion") || lower.includes("cloth") || lower.includes("apparel") || lower.includes("wear") || lower.includes("boutique")) {
    return Shirt;
  }
  if (lower.includes("dining") || lower.includes("cafe") || lower.includes("restaurant") || lower.includes("bakery") || lower.includes("food") || lower.includes("fast food")) {
    return Utensils;
  }
  if (lower.includes("beauty") || lower.includes("salon") || lower.includes("cosmetic") || lower.includes("spa") || lower.includes("jewelry") || lower.includes("watch")) {
    return Sparkles;
  }
  if (lower.includes("pharmacy") || lower.includes("medical") || lower.includes("health")) {
    return Heart;
  }
  if (lower.includes("home") || lower.includes("living") || lower.includes("furniture") || lower.includes("decor") || lower.includes("hardware")) {
    return HomeIcon;
  }
  if (lower.includes("book") || lower.includes("stationery") || lower.includes("education")) {
    return BookOpen;
  }
  if (lower.includes("auto") || lower.includes("car") || lower.includes("motor") || lower.includes("tyre")) {
    return Car;
  }
  return Store;
}

const FALLBACK_INDUSTRIES: Industry[] = [
  { id: 2, name: "Supermarket", slug: "supermarket" },
  { id: 3, name: "Grocery Store", slug: "grocery-store" },
  { id: 4, name: "Hypermarket", slug: "hypermarket" },
  { id: 5, name: "Electronics", slug: "electronics" },
  { id: 6, name: "Mobile Shop", slug: "mobile-shop" },
  { id: 7, name: "Computer & Laptop", slug: "computer-laptop" },
];

export default function HeroSection({ children, initialIndustries }: HeroSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: industriesResponse, isLoading } = useIndustries();

  const fetchedIndustries = industriesResponse?.success && Array.isArray(industriesResponse.data) && industriesResponse.data.length > 0
    ? industriesResponse.data
    : (initialIndustries && initialIndustries.length > 0 ? initialIndustries : []);

  // Show the first 6 industries (same count as now), falling back safely if data is not yet available
  const displayIndustries = (fetchedIndustries.length > 0 ? fetchedIndustries : (isLoading ? [] : FALLBACK_INDUSTRIES)).slice(0, 6);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/offers?search=${encodeURIComponent(trimmed.slice(0, 100))}`);
    } else {
      router.push("/offers");
    }
  };

  const handleCategoryClick = (industryId: number) => {
    router.push(`/offers?industryId=${encodeURIComponent(String(industryId))}`);
  };

  return (
    <section
      aria-label="Hero discovery section"
      className="relative isolate pt-32 sm:pt-36 lg:pt-40 pb-6 lg:pb-10 overflow-hidden bg-[#faf5ee] dark:bg-slate-950 border-b border-orange-100/60 dark:border-slate-800/80"
    >
      {/* Hero Background Illustration */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0 select-none overflow-hidden"
      >
        <Image
          src="/images/hero_bg.png"
          alt="Local neighborhood shopping"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right blur-[16px] sm:blur-[10px] md:blur-none scale-110 md:scale-100 transition-all dark:mix-blend-luminosity"
        />
        {/* Soft mobile ambient overlay to enhance text readability on small screens */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#faf5ee]/40 md:bg-transparent dark:bg-slate-950/40 md:dark:bg-transparent"
        />
        {/* Soft horizontal gradient: ensures left and center text is crisp while right illustration stays vibrant */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#faf5ee] via-[#faf5ee]/70 via-45% to-transparent dark:from-slate-950 dark:via-slate-950/70 dark:via-45% dark:to-transparent hidden md:block"
        />
        {/* Soft fade at bottom to blend into the next section */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#faf5ee] via-[#faf5ee]/60 to-transparent dark:from-slate-950 dark:via-slate-950/60 dark:to-transparent"
        />
      </div>

      {/* Decorative Ambient Radial Glow Orbs */}
      <div
        aria-hidden="true"
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-r from-orange-500/10 via-amber-400/10 to-rose-400/5 rounded-full blur-[120px] pointer-events-none z-0"
      />

      <div className="relative z-10 container mx-auto px-4">
        {/* Top Header & Value Proposition */}
        <div className="max-w-4xl mx-auto lg:mr-auto lg:ml-0 xl:ml-4 lg:max-w-2xl xl:max-w-3xl text-center lg:text-left mb-8 lg:mb-12">
          {/* H1 Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.14] mb-4">
            Your Neighborhood <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500">
              Your Offers
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto lg:mx-0 text-base sm:text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-7 sm:mb-9">
            Find supermarket offers, discount coupons, and great deals from shops near you.
          </p>

          {/* Hero Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto lg:mx-0 relative flex items-center mb-6 sm:mb-8 group"
          >
            <div className="relative w-full flex items-center rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_36px_rgb(0,0,0,0.07)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] group-hover:border-orange-500/40 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all p-1.5">
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
          <div className="flex flex-col items-center lg:items-start gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Popular Categories
            </span>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-2.5 max-w-3xl min-h-[42px]">
              {isLoading && displayIndustries.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-9 w-28 sm:w-32 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse border border-slate-200/50 dark:border-slate-800/50"
                  />
                ))
              ) : (
                displayIndustries.map((ind, index) => {
                  const Icon = getIndustryIcon(ind.name, ind.slug);
                  const colorClass = COLOR_PALETTES[index % COLOR_PALETTES.length];
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => handleCategoryClick(ind.id)}
                      className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <div className={cn("p-1 rounded-lg border transition-colors", colorClass)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span>{ind.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Trust Metrics Pill */}
          <div className="mt-7 pt-6 border-t border-orange-200/50 dark:border-slate-800/60 flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-10 text-xs font-semibold text-slate-700 dark:text-slate-300">
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
