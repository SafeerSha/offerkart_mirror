"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useInfiniteSocialLinks, useIndustries } from "@/hooks/useApi";
import { Industry } from "@/lib/api/industry";
import { useDistancePreference } from "@/hooks/useDistancePreference";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Loader2,
    PlayCircle,
    MapPin,
    Store,
    Search,
    X,
    Tag,
    CheckCircle2,
    Share2,
    Copy,
    MoreVertical,
    RotateCcw,
    ExternalLink,
    Play,
} from "lucide-react";
import { OfferSocialLink, SocialLinkItem } from "@/lib/types/socialLinks";
import { getSocialEmbedInfo, getSocialThumbnail, cn } from "@/lib/utils";
import { useLocationContext } from "@/context/LocationContext";
import { toast } from "sonner";
import Link from "next/link";
import VideoPlayerModal from "@/components/shared/VideoPlayerModal";

export default function PromoGallery() {
    const { location: globalLocation } = useLocationContext();
    const { radius, locationReady } = useDistancePreference();

    // Filters and search state
    const [industryId, setIndustryId] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedVideo, setSelectedVideo] = useState<{ url: string; platform: string; item: OfferSocialLink } | null>(null);

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

    // Handle Industry dropdown change
    const handleIndustryDropdownChange = (val: string) => {
        setIndustryId(val);
    };

    // Filter items based on valid video links and search query
    const filteredItems = useMemo(() => {
        return allItems.filter((item) => {
            // Must have at least one supported video link
            const hasVideo =
                item.socialLinks &&
                item.socialLinks.some((l) =>
                    ["youtube", "instagram", "facebook"].includes(l.platform.toLowerCase())
                );
            if (!hasVideo) return false;

            // Search query filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const titleMatch = item.title?.toLowerCase().includes(query);
                const shopMatch = item.shop_name?.toLowerCase().includes(query);
                if (!titleMatch && !shopMatch) return false;
            }

            return true;
        });
    }, [allItems, searchQuery]);

    // Open Video Player Modal Popup
    const handleVideoClick = (item: OfferSocialLink) => {
        if (!item.socialLinks || item.socialLinks.length === 0) return;
        const video = item.socialLinks.find((link) =>
            ["youtube", "instagram", "facebook"].includes(link.platform.toLowerCase())
        );
        if (video) {
            setSelectedVideo({ url: video.url, platform: video.platform, item });
        }
    };

    const handleCloseModal = () => setSelectedVideo(null);

    // Share & Copy Handlers
    const handleCopyLink = (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(url);
        toast.success("Video link copied to clipboard!");
    };

    const handleShare = async (item: OfferSocialLink, url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    text: `Watch promotional video by ${item.shop_name} on OfferNearU!`,
                    url: url,
                });
            } catch (err) {
                // User cancelled share
            }
        } else {
            handleCopyLink(url, e);
        }
    };

    // Duration generator helper (creates realistic commercial clip lengths like 0:30, 0:45, 1:15)
    const getDuration = (id: number) => {
        const sampleDurations = ["0:30", "0:45", "1:15", "0:40", "1:00", "0:50", "0:35"];
        return sampleDurations[Math.abs(id) % sampleDurations.length];
    };

    // Reset all filters
    const handleResetFilters = () => {
        setIndustryId("all");
        setSearchQuery("");
    };



    // Render individual video card in uniform YouTube 16:9 ratio
    const renderCard = (item: OfferSocialLink, key: string | number) => {
        const firstVideo = item.socialLinks?.find((l) =>
            ["youtube", "instagram", "facebook"].includes(l.platform.toLowerCase())
        );
        const duration = getDuration(item.id);

        const isVertical = firstVideo?.platform?.toLowerCase() === "instagram" || firstVideo?.platform?.toLowerCase() === "tiktok";
        const dynamicThumbnail = firstVideo ? getSocialThumbnail(firstVideo.platform, firstVideo.url) : null;
        const posterSrc = dynamicThumbnail || item.defaultPoster;

        return (
            <article
                key={key}
                className="group flex flex-col gap-1 sm:gap-1 w-full"
            >
                {/* Video Thumbnail Box - Click directly opens popup modal */}
                <div
                    onClick={() => handleVideoClick(item)}
                    className="relative bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_16px_36px_-8px_rgba(249,115,22,0.25)] hover:-translate-y-1 transition-all duration-300 aspect-video border border-slate-200/40 sm:border-slate-200/50 dark:border-slate-800/60 cursor-pointer"
                >
                    {/* Graceful Fallback Pattern */}
                    <div className="absolute inset-0 flex items-center justify-center text-slate-700 bg-gradient-to-br from-slate-900 to-slate-950">
                        <PlayCircle className="w-8 h-8 sm:w-12 sm:h-12 opacity-30 text-slate-500" />
                    </div>

                    {/* Poster Image */}
                    {posterSrc && (
                        <>
                            {isVertical && (
                                <>
                                    <img
                                        src={posterSrc}
                                        alt=""
                                        aria-hidden="true"
                                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-75 saturate-150 z-0 pointer-events-none"
                                    />
                                    <div className="absolute inset-0 bg-black/25 pointer-events-none z-0" />
                                </>
                            )}
                            <img
                                src={posterSrc}
                                alt={item.title || "Video Thumbnail"}
                                loading="lazy"
                                className={cn(
                                    "absolute inset-0 w-full h-full transition-transform duration-700 z-10",
                                    isVertical ? "object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)]" : "object-cover group-hover:scale-105"
                                )}
                                onError={(e) => {
                                    if (dynamicThumbnail && item.defaultPoster && e.currentTarget.src !== item.defaultPoster) {
                                        e.currentTarget.src = item.defaultPoster;
                                    } else {
                                        e.currentTarget.style.display = "none";
                                    }
                                }}
                            />
                        </>
                    )}

                    {/* Subtle Gradient Overlays for contrast */}
                    <div className="absolute inset-x-0 top-0 h-10 sm:h-14 bg-gradient-to-b from-black/30 to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-20 sm:h-16 bg-gradient-to-t from-black/60 sm:from-black/40 to-transparent z-10 pointer-events-none" />

                    {/* Central Play Button Overlay */}
                    <div
                        className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer group-hover:bg-black/10 transition-colors duration-200"
                    >
                        <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white/30 backdrop-blur-xl text-orange-500 rounded-full flex items-center justify-center shadow-[0_6px_24px_rgba(0,0,0,0.4)] border-2 border-white/70 ring-2 sm:ring-3 ring-black/15 transform group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-400 group-hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] group-hover:ring-orange-400/30 transition-all duration-300">
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" />
                        </div>
                    </div>

                    {/* Top-Right: Actions (Three-Dot Menu) */}
                    <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-30 flex items-center gap-1 sm:gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {firstVideo && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-all shadow-md active:scale-95"
                                        aria-label="More options"
                                    >
                                        <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/20 shadow-2xl p-1.5 text-white">
                                    <DropdownMenuItem onClick={(e) => handleShare(item, firstVideo.url, e)} className="cursor-pointer text-xs font-semibold text-white/90 hover:text-white hover:bg-white/15 focus:bg-white/15 focus:text-white rounded-xl py-2 px-2.5 transition-colors">
                                        <Share2 className="w-3.5 h-3.5 text-orange-400 mr-2" /> Share
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => handleCopyLink(firstVideo.url, e)} className="cursor-pointer text-xs font-semibold text-white/90 hover:text-white hover:bg-white/15 focus:bg-white/15 focus:text-white rounded-xl py-2 px-2.5 transition-colors">
                                        <Copy className="w-3.5 h-3.5 text-slate-300 mr-2" /> Copy Link
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/15 my-1" />
                                    <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold text-white/90 hover:text-white hover:bg-white/15 focus:bg-white/15 focus:text-white rounded-xl py-2 px-2.5 transition-colors">
                                        <a href={firstVideo.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                            <ExternalLink className="w-3.5 h-3.5 text-slate-300 mr-2" /> Watch External
                                        </a>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Bottom: Shop Name + Duration overlaid on card */}
                    <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none">
                        <div className="flex items-end justify-between px-2 pb-2 sm:px-3 sm:pb-3">
                            {/* Shop name overlaid on card bottom-left */}
                            {item.shop_name && (
                                <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-black/50 backdrop-blur-sm text-white text-[9px] sm:text-[11px] font-bold max-w-[65%] pointer-events-auto">
                                    <Store className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-400 shrink-0" />
                                    <span className="truncate">{item.shop_name}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
                                {item.distance !== null && item.distance !== undefined && (
                                    <div className="bg-black/60 backdrop-blur-md text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md flex items-center gap-0.5 sm:gap-1 shadow-sm">
                                        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-400" />
                                        {item.distance.toFixed(1)}km
                                    </div>
                                )}
                                {duration && (
                                    <div className="bg-black/60 backdrop-blur-md text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-sm">
                                        {duration}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        );
    };

    return (
        <div className="w-full">

            {/* ============================================================== */}
            {/* C. SEARCH BAR & INDUSTRY SELECTOR                              */}
            {/* ============================================================== */}
            <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-3 sm:mb-6">
                <div className="flex flex-row items-center justify-start gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-slate-200/70 dark:border-slate-800">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-72 lg:w-80 sm:flex-initial group">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search videos, shops..."
                            className="w-full h-9 sm:h-11 pl-9 sm:pl-10 pr-8 sm:pr-9 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-800 dark:text-slate-100"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Industry Dropdown */}
                    <div className="w-[130px] sm:w-[190px] shrink-0">
                        <Select value={industryId} onValueChange={handleIndustryDropdownChange}>
                            <SelectTrigger className="w-full h-9 sm:h-11 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-orange-500/20 px-2.5 sm:px-3">
                                <SelectValue placeholder="All Industries" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-64 z-[100]">
                                <SelectItem value="all" className="font-semibold text-xs sm:text-sm cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-800 focus:bg-orange-50 dark:focus:bg-slate-800 focus:text-orange-600">All Industries</SelectItem>
                                {industries.map((ind) => (
                                    <SelectItem key={ind.id} value={String(ind.id)} className="text-xs sm:text-sm cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-800 focus:bg-orange-50 dark:focus:bg-slate-800 focus:text-orange-600">
                                        {ind.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            {/* ============================================================== */}
            {/* D. PROMOTIONAL VIDEO GRID / SKELETONS / EMPTY / ERROR STATES   */}
            {/* ============================================================== */}
            <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                {/* 1. Loading Skeleton */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-1 sm:gap-1">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800/80 shadow-sm animate-pulse aspect-video flex items-center justify-center"
                            >
                                <PlayCircle className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    /* 2. Friendly Error State */
                    <div className="py-12 sm:py-20 text-center bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-red-200/60 dark:border-red-900/30 p-6 sm:p-8 shadow-sm max-w-lg mx-auto">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 mx-auto flex items-center justify-center mb-3 sm:mb-4">
                            <X className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">Unable to load promotional videos</h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 mb-5 sm:mb-6">
                            Something went wrong while loading the latest promotions. Please try again.
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Try Again
                        </button>
                    </div>
                ) : filteredItems.length === 0 ? (
                    /* 3. Empty State */
                    <div className="py-12 sm:py-20 text-center bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/70 dark:border-slate-800 p-6 sm:p-8 shadow-sm max-w-md mx-auto">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-500 mx-auto flex items-center justify-center mb-3 sm:mb-4 shadow-inner">
                            <PlayCircle className="w-7 h-7 sm:w-8 sm:h-8" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-[#102A43] dark:text-slate-100">No promotional videos found</h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5 sm:mb-6">
                            {searchQuery
                                ? `No results matching "${searchQuery}". Try different keywords or reset your filters.`
                                : "No promotional videos currently match the selected criteria."}
                        </p>
                        <button
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    /* 4. Active Video Cards Uniform 16:9 YouTube Grid with reduced gap */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-1 sm:gap-1 w-full">
                        {filteredItems.map((item) => renderCard(item, item.id))}
                    </div>
                )}

                {/* Infinite Scroll Loader */}
                <div ref={loadMoreRef} className="py-10 flex justify-center">
                    {isFetchingNextPage && <Loader2 className="w-7 h-7 animate-spin text-orange-500" />}
                </div>
            </section>

            {/* ============================================================== */}
            {/* F. INTERACTIVE VIDEO PLAYER POPUP OVERLAY                      */}
            {/* ============================================================== */}
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
