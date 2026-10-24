"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import heroBgImage from "../../../public/images/hero_bg.png";
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
  Store,
  Laptop,
  Car,
  BookOpen,
  Footprints,
  Heart,
  X,
  Tag,
  ChevronDown,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIndustries } from "@/hooks/useApi";
import { Industry } from "@/lib/api/industry";
import { useLocationContext } from "@/context/LocationContext";
import { useDistancePreference } from "@/hooks/useDistancePreference";
import { withinRadius } from "@/lib/distance";
import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import { getGlobalSearch } from "@/lib/api/userOffersService";
import type { SearchResultData, SearchProductItem } from "@/lib/types/search";
import { ShopSearchResults } from "@/components/layout/ShopSearchResults";
import { DistanceEmptyState } from "@/components/shared/DistanceControl";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [searchRetry, setSearchRetry] = useState(0);

  const { location: globalLocation } = useLocationContext();
  const { radius, locationReady } = useDistancePreference();
  const { resolveHierarchyById } = useCategoryHierarchy(searchOpen || searchQuery.trim().length > 0);
  const { data: industriesResponse, isLoading } = useIndustries();

  const groupedProducts = useMemo(() => {
    if (!searchResults || !searchResults.products) return {};
    const groups: Record<string, SearchProductItem[]> = {};
    searchResults.products.forEach((p: SearchProductItem) => {
      const cat = p.category || "General";
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(p);
    });
    return groups;
  }, [searchResults]);

  const getProductHref = (p: SearchProductItem) => {
    const resolvedCategory = resolveHierarchyById(p.category);
    const categoryParam = resolvedCategory.main ? resolvedCategory.main : (p.category || "All");
    const subcategoryParam = resolvedCategory.sub ? `&subcategory=${encodeURIComponent(resolvedCategory.sub)}` : "";
    return `/products?search=${encodeURIComponent(p.name)}&category=${encodeURIComponent(categoryParam)}${subcategoryParam}`;
  };

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      return;
    }

    let active = true;
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(false);
      try {
        const result = await getGlobalSearch(trimmed, globalLocation.latitude, globalLocation.longitude, radius);
        if (!active) return;
        if (result.success && result.data) {
          setSearchResults({
            ...result.data,
            shops: radius === null ? result.data.shops : locationReady ? result.data.shops.filter((shop) => withinRadius(shop.distance, radius)) : [],
          });
        } else {
          if (active) setSearchError(true);
        }
      } catch (error) {
        console.error("Hero search fetch failed:", error);
        if (active) setSearchError(true);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [searchQuery, globalLocation.latitude, globalLocation.longitude, searchRetry, radius, locationReady]);

  const fetchedIndustries = industriesResponse?.success && Array.isArray(industriesResponse.data) && industriesResponse.data.length > 0
    ? industriesResponse.data
    : (initialIndustries && initialIndustries.length > 0 ? initialIndustries : []);

  // Show the first 6 industries (same count as now), falling back safely if data is not yet available
  const displayIndustries = (fetchedIndustries.length > 0 ? fetchedIndustries : (isLoading ? [] : FALLBACK_INDUSTRIES)).slice(0, 6);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
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
      className="relative isolate min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-4.5rem)] lg:min-h-[calc(100dvh-4.5rem)] flex flex-col justify-between pt-24 sm:pt-28 lg:pt-24 pb-4 sm:pb-6 overflow-x-clip bg-[#faf5ee] dark:bg-slate-950 border-b border-orange-100/60 dark:border-slate-800/80"
    >
      {/* Hero Background Illustration */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0 select-none overflow-hidden"
      >
        <Image
          src={heroBgImage}
          alt="Local neighborhood shopping"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right blur-[16px] sm:blur-[10px] md:blur-none scale-105 md:scale-100 transition-all dark:mix-blend-luminosity"
        />
        {/* Soft mobile ambient overlay to enhance text readability on small screens */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#faf5ee]/40 md:bg-transparent dark:bg-slate-950/40 md:dark:bg-transparent"
        />
        {/* Soft horizontal gradient: ensures left and center text is crisp while right illustration stays vibrant */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#faf5ee] via-[#faf5ee]/80 via-50% to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:via-50% dark:to-transparent hidden md:block"
        />
        {/* Soft fade at bottom to blend into the next section */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-[#faf5ee]/90 to-transparent dark:from-slate-950/90 dark:to-transparent pointer-events-none"
        />
      </div>

      {/* Decorative Ambient Radial Glow Orbs */}
      <div
        aria-hidden="true"
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-r from-orange-500/10 via-amber-400/10 to-rose-400/5 rounded-full blur-[120px] pointer-events-none z-0"
      />

      <div className="relative z-10 container mx-auto px-4 flex-1 flex flex-col justify-center">
        {/* Top Header & Value Proposition */}
        <div className={cn("max-w-4xl mx-auto lg:mr-auto lg:ml-0 xl:ml-4 lg:max-w-2xl xl:max-w-3xl text-center lg:text-left", children ? "mb-8 lg:mb-12" : "mb-0")}>
          {/* H1 Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.14] mb-3 sm:mb-4">
            Your Neighborhood <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500">
              Your Savings
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto lg:mx-0 text-base sm:text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-6 sm:mb-7">
            Find supermarket offers, discount coupons, and great deals from shops near you.
          </p>

          {/* Hero Search Bar & Dropdown */}
          <div
            className="max-w-2xl mx-auto lg:mx-0 relative mb-5 sm:mb-7 z-30"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setSearchOpen(false);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setSearchQuery("");
                setSearchOpen(false);
              }
            }}
          >
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center group"
            >
              <div className="relative w-full flex items-center rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_36px_rgb(0,0,0,0.07)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] group-hover:border-orange-500/40 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all p-1.5">
                <div className="pl-3.5 pr-2 text-slate-400 dark:text-slate-500">
                  <Search className="w-5 h-5 group-hover:text-orange-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (!searchOpen) setSearchOpen(true);
                    if (val.trim().length < 3) {
                      setSearchResults(null);
                      setSearchError(false);
                      setIsSearching(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) setSearchOpen(true);
                  }}
                  maxLength={100}
                  placeholder="Search shops, flyers, groceries, electronics..."
                  aria-label="Search deals, shops and flyers"
                  className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults(null);
                      setSearchOpen(false);
                    }}
                    aria-label="Clear search input"
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 mr-1.5 transition-colors cursor-pointer"
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

            {/* Search Results Dropdown */}
            {searchOpen && searchQuery && (
              <div
                aria-label="Search results"
                className="absolute top-full left-0 right-0 mt-2 sm:mt-3 bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-[0_16px_48px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6)] z-50 overflow-hidden max-h-[420px] overflow-y-auto animate-in fade-in slide-in-from-top-3 duration-200 text-left"
              >
                {searchQuery.trim().length < 3 ? (
                  <p role="status" className="p-4 text-sm text-slate-500 dark:text-slate-400">
                    Enter at least 3 characters to search
                  </p>
                ) : searchError ? (
                  <div role="alert" className="p-4 text-sm text-slate-500 dark:text-slate-400">
                    Search failed. Please try again.{" "}
                    <button
                      type="button"
                      onClick={() => setSearchRetry((v) => v + 1)}
                      className="ml-2 rounded text-orange-600 dark:text-orange-400 font-semibold underline hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer"
                    >
                      Retry search
                    </button>
                  </div>
                ) : isSearching || !searchResults ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full border-2 border-orange-200 dark:border-orange-900/40" />
                      <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-transparent border-t-orange-500 animate-spin" />
                    </div>
                    <span role="status" className="text-xs text-slate-400 font-medium">
                      Finding results...
                    </span>
                  </div>
                ) : searchResults.products.length === 0 && searchResults.offers.length === 0 && searchResults.shops.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
                    <Search className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      No results found for &ldquo;{searchQuery}&rdquo;
                    </span>
                    {radius !== null && locationReady ? (
                      <DistanceEmptyState compact />
                    ) : (
                      <p role="status" className="text-xs text-slate-400">
                        No matching shops or offers found
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="pb-2">
                    {radius !== null && locationReady && searchResults.shops.length === 0 && (
                      <DistanceEmptyState compact />
                    )}
                    <ShopSearchResults
                      shops={searchResults.shops}
                      onSelect={() => {
                        setSearchQuery("");
                        setSearchOpen(false);
                      }}
                    />

                    {/* Products Section */}
                    {searchResults.products && searchResults.products.length > 0 && (
                      <div className="mb-3 last:mb-0">
                        <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-500 dark:text-orange-400 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800/40 mb-2 flex items-center gap-1.5">
                          <Package className="w-3 h-3 shrink-0" />
                          Products
                        </div>
                        <div className="max-h-[240px] overflow-y-auto pr-1 px-2 space-y-2">
                          {Object.entries(groupedProducts).map(([categoryName, products]) => (
                            <div key={categoryName} className="space-y-0.5">
                              <div className="text-[10.5px] text-slate-400 font-semibold tracking-wide px-3.5 mb-1">
                                in <span className="text-orange-500 dark:text-orange-400 font-bold">{categoryName}</span>
                              </div>
                              {products.map((p, idx) => (
                                <Link
                                  key={idx}
                                  href={getProductHref(p)}
                                  onClick={() => {
                                    setSearchOpen(false);
                                    setSearchQuery("");
                                  }}
                                  className="group/item flex items-center justify-between mx-1 pl-4 pr-3 py-1.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 text-left gap-4"
                                >
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Package className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                      <span
                                        className="font-semibold text-[11.5px] text-slate-800 dark:text-slate-200 truncate leading-tight tracking-wide"
                                        title={p.name}
                                      >
                                        {p.name}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-400 tracking-wide bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg select-none">
                                      <span>{p.totalOfferProducts} {p.totalOfferProducts === 1 ? "Product" : "Products"}</span>
                                      <span className="text-slate-300 dark:text-slate-600 font-normal">•</span>
                                      <span>{p.shopCount} {p.shopCount === 1 ? "Shop" : "Shops"}</span>
                                    </div>
                                    <ChevronDown className="w-4 h-4 -rotate-90 text-slate-300 dark:text-slate-600 group-hover/item:text-slate-400 transition-colors shrink-0" />
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Offers Section */}
                    {searchResults.offers && searchResults.offers.length > 0 && (
                      <div className="mb-1 last:mb-0">
                        <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-500 dark:text-orange-400 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800/40 mb-2 flex items-center gap-1.5">
                          <Tag className="w-3 h-3 shrink-0" />
                          Offers
                        </div>
                        <div className="max-h-[240px] overflow-y-auto pr-1 px-2 space-y-0.5">
                          {searchResults.offers.map((o) => (
                            <Link
                              key={o.offerId}
                              href={`/offer/${o.offerId}`}
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery("");
                              }}
                              className="group/item flex items-center justify-between mx-1 px-3 py-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 text-left gap-4"
                            >
                              <div className="flex flex-col min-w-0 flex-1 py-0.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Tag className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                  <span
                                    className="font-semibold text-[13px] text-slate-800 dark:text-slate-200 truncate leading-tight tracking-wide"
                                    title={o.offerName}
                                  >
                                    {o.offerName}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0">
                                {o.shopName && (
                                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-400 tracking-wide bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg select-none">
                                    {o.shopName}
                                  </span>
                                )}
                                <ChevronDown className="w-4 h-4 -rotate-90 text-slate-300 dark:text-slate-600 group-hover/item:text-slate-400 transition-colors shrink-0" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* View All Deals Footer */}
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 text-center px-4 py-2">
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>See all deals for &ldquo;{searchQuery}&rdquo;</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Categories Bar */}
          <div className="flex flex-col items-center lg:items-start gap-2.5 sm:gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white">
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
          <div className="mt-6 pt-5 sm:mt-7 sm:pt-6 border-t border-orange-200/50 dark:border-slate-800/60 flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-10 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-orange-500" />
              <span>Verified Shops</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-500" />
              <span>Live Offers</span>
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
