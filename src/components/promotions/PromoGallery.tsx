"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useInfiniteSocialLinks, useIndustries, useFeaturedShops } from "@/hooks/useApi";
import { useDistancePreference } from "@/hooks/useDistancePreference";
import { isAllLocation } from "@/lib/distance";
import FeaturedShops from "@/components/home/FeaturedShops";
import type { StaticImageData } from "next/image";

interface FeaturedShop {
  distanceKm?: number | null;
  id: number | string;
  name: string;
  logo: string | StaticImageData;
}
import { 
  Loader2, 
  RotateCcw, 
  AlertCircle, 
  X
} from "lucide-react";
import { OfferSocialLink } from "@/lib/types/socialLinks";
import { useLocationContext } from "@/context/LocationContext";
import VideoPlayerModal from "@/components/shared/VideoPlayerModal";
import PromoHeader from "./PromoHeader";
import { PromoToolbar, PlatformFilterType } from "./PromoToolbar";
import { PromoCard } from "./PromoCard";
import { PromoSkeleton } from "./PromoSkeleton";
import { PromoEmptyState } from "./PromoEmptyState";

export default function PromoGallery() {
  const { location: globalLocation } = useLocationContext();
  const { radius, locationReady } = useDistancePreference();

  // Filters and search state
  const [industryId, setIndustryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilterType>("all");
  const [selectedShopId, setSelectedShopId] = useState<string | number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; platform: string; item: OfferSocialLink } | null>(null);

  // Fetch featured shops for location and industry
  const isAll = isAllLocation(globalLocation.name);
  const hasLocation = isAll || (globalLocation.latitude !== null && globalLocation.longitude !== null);
  const { data: dynamicShops, isLoading: shopsLoading } = useFeaturedShops(
    isAll ? undefined : globalLocation.latitude,
    isAll ? undefined : globalLocation.longitude,
    industryId === "all" ? undefined : industryId,
    radius,
    {
      enabled: (hasLocation || industryId !== "all") && radius === null,
    }
  );
  const featuredShops = useMemo(() => {
    return dynamicShops?.success && Array.isArray(dynamicShops.data) 
      ? (dynamicShops.data as FeaturedShop[]) 
      : [];
  }, [dynamicShops]);

  // Cached Industries from React Query
  const { data: industriesResponse } = useIndustries();
  const industries = useMemo(
    () => (industriesResponse?.success && industriesResponse.data ? industriesResponse.data : []),
    [industriesResponse]
  );

  // Dynamic filters for API request
  const filters = useMemo(() => ({
    industryId: industryId === "all" ? undefined : industryId,
    latitude: globalLocation.latitude,
    longitude: globalLocation.longitude,
    radius: locationReady ? radius : undefined,
  }), [industryId, globalLocation.latitude, globalLocation.longitude, locationReady, radius]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteSocialLinks(12, filters);

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages of video items
  const allItems = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  // Extract shops from loaded promo video cards
  const shopsFromVideos = useMemo(() => {
    const map = new Map<string, { id: string | number; name: string; logo: string; distanceKm: number | null }>();
    allItems.forEach((item) => {
      const record = item as OfferSocialLink & Record<string, unknown>;
      const sId = (record.shopId ?? record.shop_id ?? record.shop_name) as string | number | undefined;
      const sName = record.shop_name;
      const sLogo = (record.logo_url ?? record.shopLogo ?? "") as string;
      if (sName) {
        map.set(String(sId ?? sName), {
          id: sId ?? sName,
          name: sName,
          logo: sLogo,
          distanceKm: record.distance ?? null,
        });
      }
    });
    return Array.from(map.values());
  }, [allItems]);

  // Combined visible shops deduplicated
  const visibleShops = useMemo(() => {
    const seenNames = new Set<string>();
    const seenIds = new Set<string>();
    const result: FeaturedShop[] = [];

    featuredShops.forEach((shop) => {
      const idKey = String(shop.id);
      const nameKey = String(shop.name || "").trim().toLowerCase();
      if (!seenIds.has(idKey) && (!nameKey || !seenNames.has(nameKey))) {
        seenIds.add(idKey);
        if (nameKey) seenNames.add(nameKey);
        result.push(shop);
      }
    });

    shopsFromVideos.forEach((shop) => {
      const idKey = String(shop.id);
      const nameKey = String(shop.name || "").trim().toLowerCase();
      if (!seenIds.has(idKey) && (!nameKey || !seenNames.has(nameKey))) {
        seenIds.add(idKey);
        if (nameKey) seenNames.add(nameKey);
        result.push(shop);
      }
    });

    return result;
  }, [shopsFromVideos, featuredShops]);

  const handleShopSelect = (shopId: number | string) => {
    setSelectedShopId((prev) => (String(prev) === String(shopId) ? null : shopId));
  };

  const handleIndustryChange = (val: string) => {
    setIndustryId(val);
    setSelectedShopId(null);
  };

  // Filter items based on video platform, search query, and selected shop
  const filteredItems = useMemo(() => {
    return allItems.filter((item: OfferSocialLink) => {
      if (!item.socialLinks || !Array.isArray(item.socialLinks)) return false;

      // Filter by platform
      if (selectedPlatform === "all") {
        const hasSupported = item.socialLinks.some((l) =>
          ["youtube", "instagram", "facebook"].includes(l.platform?.toLowerCase())
        );
        if (!hasSupported) return false;
      } else {
        const hasMatchingPlatform = item.socialLinks.some(
          (l) => l.platform?.toLowerCase() === selectedPlatform
        );
        if (!hasMatchingPlatform) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const shopMatch = item.shop_name?.toLowerCase().includes(query);
        if (!titleMatch && !shopMatch) return false;
      }

      // Shop filter
      if (selectedShopId !== null && selectedShopId !== undefined) {
        const record = item as OfferSocialLink & Record<string, unknown>;
        const sId = record.shopId ?? record.shop_id;
        const sName = (item.shop_name ?? "").trim().toLowerCase();
        const targetId = String(selectedShopId);
        const matchesId = sId !== undefined && sId !== null && String(sId) === targetId;
        const selectedShop = visibleShops.find((s) => String(s.id) === targetId);
        const selectedShopName = String(selectedShop?.name || "").trim().toLowerCase();
        const matchesName = sName && (sName === targetId.toLowerCase() || (selectedShopName && selectedShopName === sName));
        if (!matchesId && !matchesName) return false;
      }

      return true;
    });
  }, [allItems, selectedPlatform, searchQuery, selectedShopId, visibleShops]);

  // Open Video Player Modal Popup
  const handleVideoClick = (item: OfferSocialLink) => {
    if (!item.socialLinks || item.socialLinks.length === 0) return;
    const video = item.socialLinks.find((link) => {
      if (selectedPlatform === "all") {
        return ["youtube", "instagram", "facebook"].includes(link.platform.toLowerCase());
      }
      return link.platform.toLowerCase() === selectedPlatform;
    }) || item.socialLinks[0];

    if (video) {
      setSelectedVideo({ url: video.url, platform: video.platform, item });
    }
  };

  const handleCloseModal = () => setSelectedVideo(null);

  const handleResetFilters = () => {
    setIndustryId("all");
    setSearchQuery("");
    setSelectedPlatform("all");
    setSelectedShopId(null);
  };

  const hasActiveFilters = Boolean(
    industryId !== "all" || searchQuery.trim() || selectedPlatform !== "all" || selectedShopId !== null
  );

  const selectedShopObj = selectedShopId !== null 
    ? visibleShops.find((s) => String(s.id) === String(selectedShopId))
    : null;

  return (
    <div className="w-full">
      {/* 1. Header with Stats */}
      <PromoHeader
        totalVideosCount={allItems.length}
        totalShopsCount={visibleShops.length}
      />

      {/* 2. Unified Toolbar: Search, Platform Tabs, Industry Selector */}
      <PromoToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
        industryId={industryId}
        onIndustryChange={handleIndustryChange}
        industries={industries}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Featured Shops Carousel Filter */}
      {(visibleShops.length > 0 || (radius === null && shopsLoading)) && (
        <section className="mb-2.5 sm:mb-3">
          <FeaturedShops
            shops={visibleShops}
            variant="minimal"
            activeShopId={selectedShopId || undefined}
            onShopClick={handleShopSelect}
            isLoading={radius === null && shopsLoading}
            disableDynamicFetch={true}
          />

          {selectedShopId && (
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 shadow-xs animate-in fade-in duration-200">
                <span>
                  Filtering by: {selectedShopObj?.name || `Shop #${selectedShopId}`}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedShopId(null)}
                  className="w-4 h-4 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer text-primary"
                  title="Clear shop filter"
                  aria-label="Clear shop filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
        </section>
      )}

      {/* 4. Video Grid Showcase */}
      <section>
        {isLoading ? (
          <PromoSkeleton />
        ) : isError ? (
          <div className="py-16 text-center bg-card/90 backdrop-blur-xl rounded-3xl border border-destructive/20 p-8 shadow-card max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Unable to load promotions
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 mb-6">
              Something went wrong while fetching promotional videos. Please check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all hover:scale-105 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <PromoEmptyState
            type={hasActiveFilters ? "filtered" : "global"}
            searchQuery={searchQuery}
            selectedShopName={selectedShopObj?.name}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 w-full animate-fade-in">
            {filteredItems.map((item) => (
              <PromoCard
                key={item.id}
                item={item}
                onPlay={handleVideoClick}
              />
            ))}
          </div>
        )}

        {/* Infinite Scroll Loader */}
        <div ref={loadMoreRef} className="py-12 flex justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Loading more commercials...</span>
            </div>
          )}
        </div>
      </section>

      {/* 5. Interactive Video Player Modal */}
      <VideoPlayerModal
        isOpen={!!selectedVideo}
        onClose={handleCloseModal}
        videoUrl={selectedVideo?.url}
        platform={selectedVideo?.platform}
        title={selectedVideo?.item.title}
        subtitle={selectedVideo?.item.shop_name}
      />
    </div>
  );
}
