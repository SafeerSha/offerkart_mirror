"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useInfiniteSocialLinks } from "@/hooks/useApi";
import { getIndustries, Industry } from "@/lib/api/industry";
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
    Sparkles,
    CheckCircle2,
    Share2,
    Copy,
    MoreVertical,
    Film,
    Video,
    ShoppingBag,
    Shirt,
    UtensilsCrossed,
    Laptop,
    Home,
    Flame,
    RotateCcw,
    ExternalLink,
    Car,
    Dumbbell,
    HeartHandshake,
    Maximize2,
    Play,
} from "lucide-react";
import { OfferSocialLink, SocialLinkItem } from "@/lib/types/socialLinks";
import { getSocialEmbedInfo, getSocialThumbnail } from "@/lib/utils";
import { useLocationContext } from "@/context/LocationContext";
import { toast } from "sonner";
import Link from "next/link";
import VideoPlayerModal from "@/components/shared/VideoPlayerModal";

// Predefined category taxonomy with curated icons
const CATEGORY_DEFINITIONS = [
    { key: "all", label: "All Videos", icon: Film, keywords: [] },
    { key: "supermarket", label: "Supermarkets", icon: ShoppingBag, keywords: ["supermarket", "grocery", "groceries", "mart", "retail"] },
    { key: "electronics", label: "Electronics", icon: Laptop, keywords: ["electronic", "mobile", "computer", "gadget", "appliances", "tech"] },
    { key: "fashion", label: "Fashion", icon: Shirt, keywords: ["fashion", "clothing", "wear", "dress", "textile", "apparel"] },
    { key: "food", label: "Food & Beverages", icon: UtensilsCrossed, keywords: ["food", "restaurant", "cafe", "beverage", "bakery", "dining"] },
    { key: "home", label: "Home & Living", icon: Home, keywords: ["home", "furniture", "living", "decor", "interior"] },
    { key: "beauty", label: "Beauty & Health", icon: Sparkles, keywords: ["beauty", "health", "salon", "spa", "cosmetic", "wellness"] },
    { key: "sports", label: "Sports", icon: Dumbbell, keywords: ["sport", "fitness", "gym", "athletics"] },
    { key: "automotive", label: "Automotive", icon: Car, keywords: ["auto", "car", "bike", "motor", "garage"] },
];

export default function PromoGallery() {
    const { location: globalLocation } = useLocationContext();

    // Filters and search state
    const [industryId, setIndustryId] = useState<string>("all");
    const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<{ url: string; platform: string; item: OfferSocialLink } | null>(null);
    const [inlinePlayingId, setInlinePlayingId] = useState<number | null>(null);

    // Dynamic filters for API request
    const filters = useMemo(() => ({
        industryId: industryId === "all" ? undefined : industryId,
        latitude: globalLocation.latitude,
        longitude: globalLocation.longitude,
    }), [industryId, globalLocation.latitude, globalLocation.longitude]);

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

    // Fetch Industries for dropdown and category alignment
    useEffect(() => {
        async function fetchInd() {
            try {
                const res = await getIndustries();
                if (res.success && res.data) {
                    setIndustries(res.data);
                }
            } catch (error) {
                console.error("Failed to load industries:", error);
            }
        }
        fetchInd();
    }, []);

    // Flatten all pages of video items
    const allItems = useMemo(() => {
        return data?.pages.flatMap((page) => page.data) || [];
    }, [data]);

    // Handle Category pill selection
    const handleCategorySelect = (catKey: string) => {
        setSelectedCategoryKey(catKey);

        if (catKey === "all") {
            setIndustryId("all");
            return;
        }

        const catDef = CATEGORY_DEFINITIONS.find((c) => c.key === catKey);
        if (!catDef) return;

        // Try finding a matching industry from API industries list
        const matchedIndustry = industries.find((ind) => {
            const nameLower = ind.name.toLowerCase();
            return catDef.keywords.some((kw) => nameLower.includes(kw));
        });

        if (matchedIndustry) {
            setIndustryId(String(matchedIndustry.id));
        } else {
            // Keep category selected for client filtering
            setIndustryId("all");
        }
    };

    // Synchronize Industry dropdown with category pills
    const handleIndustryDropdownChange = (val: string) => {
        setIndustryId(val);

        if (val === "all") {
            setSelectedCategoryKey("all");
            return;
        }

        const currentInd = industries.find((i) => String(i.id) === val);
        if (currentInd) {
            const nameLower = currentInd.name.toLowerCase();
            const matchedCat = CATEGORY_DEFINITIONS.find((cat) =>
                cat.keywords.some((kw) => nameLower.includes(kw))
            );
            if (matchedCat) {
                setSelectedCategoryKey(matchedCat.key);
                return;
            }
        }
        setSelectedCategoryKey("");
    };

    // Filter items based on valid video links, search query, and category keywords
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

            // Category keyword filter if not mapped to a backend industry
            if (selectedCategoryKey !== "all" && industryId === "all") {
                const catDef = CATEGORY_DEFINITIONS.find((c) => c.key === selectedCategoryKey);
                if (catDef && catDef.keywords.length > 0) {
                    const combinedText = `${item.title} ${item.shop_name}`.toLowerCase();
                    const matchesKeyword = catDef.keywords.some((kw) => combinedText.includes(kw));
                    if (!matchesKeyword) return false;
                }
            }

            return true;
        });
    }, [allItems, searchQuery, selectedCategoryKey, industryId]);

    // Play inline on thumbnail with native default player
    const handlePlayInline = (item: OfferSocialLink, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setInlinePlayingId(item.id);
    };

    // Enlarge -> Open Custom Video Player Modal
    const handleVideoClick = (item: OfferSocialLink) => {
        if (!item.socialLinks || item.socialLinks.length === 0) return;
        const video = item.socialLinks.find((link) =>
            ["youtube", "instagram", "facebook"].includes(link.platform.toLowerCase())
        );
        if (video) {
            setInlinePlayingId(null);
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
        setSelectedCategoryKey("all");
        setSearchQuery("");
    };

    // Responsive Masonry Screen Width Tracking
    const [screenWidth, setScreenWidth] = useState<number>(1280);

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isMobile = screenWidth < 640;

    // Maximum columns based on responsive breakpoints
    // Mobile: 2 columns for Instagram Explore-style grid
    const maxCols = useMemo(() => {
        if (screenWidth < 360) return 1;
        if (screenWidth < 640) return 2;  // Mobile: always 2 cols for explore grid
        if (screenWidth < 768) return 2;
        if (screenWidth < 1024) return 3;
        return 4;
    }, [screenWidth]);

    // Item height weights: Vertical (9:16) ~ 1.85, Horizontal (16:9) ~ 0.80
    const itemWeights = useMemo(() => {
        return filteredItems.map((item) => {
            const firstVideo = item.socialLinks?.find((l) =>
                ["youtube", "instagram", "facebook", "tiktok"].includes(l.platform.toLowerCase())
            );
            const isVertical = firstVideo?.platform?.toLowerCase() === "instagram" || firstVideo?.platform?.toLowerCase() === "tiktok";
            return isVertical ? 1.85 : 0.8;
        });
    }, [filteredItems]);

    // Calculate target columns to guarantee no stranded horizontal items with empty space underneath
    const targetCols = useMemo(() => {
        if (filteredItems.length === 0) return 1;

        const shortCount = itemWeights.filter((w) => w < 1.0).length;
        let cols = maxCols;

        // When horizontal items exist and total item count is <= maxCols,
        // allocating 1 item per column leaves YouTube cards with huge blank space below.
        // Reducing by 1 column allows the YouTube item to stack with another item (YouTube or Instagram)
        // creating a completely filled, balanced layout with no dead white space.
        if (shortCount > 0 && filteredItems.length <= maxCols) {
            cols = Math.max(1, filteredItems.length - 1);
        }

        return Math.min(cols, filteredItems.length);
    }, [filteredItems.length, itemWeights, maxCols]);

    // Greedy shortest-column bin packing: always drop next item in the column with minimal height
    const columnsData = useMemo(() => {
        if (filteredItems.length === 0) return [];

        const cols: OfferSocialLink[][] = Array.from({ length: targetCols }, () => []);
        const colHeights = new Array(targetCols).fill(0);

        filteredItems.forEach((item, index) => {
            const weight = itemWeights[index];
            // Find the column with the minimum cumulative height
            let minColIdx = 0;
            let minHeight = colHeights[0];
            for (let c = 1; c < targetCols; c++) {
                if (colHeights[c] < minHeight) {
                    minHeight = colHeights[c];
                    minColIdx = c;
                }
            }

            cols[minColIdx].push(item);
            // Add item weight plus gap factor if column already has an item
            colHeights[minColIdx] += weight + (cols[minColIdx].length > 1 ? 0.06 : 0);
        });

        return cols;
    }, [filteredItems, itemWeights, targetCols]);

    // Render individual video card preserving strict original aspect ratios
    const renderCard = (item: OfferSocialLink, key: string | number) => {
        const firstVideo = item.socialLinks?.find((l) =>
            ["youtube", "instagram", "facebook"].includes(l.platform.toLowerCase())
        );
        const duration = getDuration(item.id);

        const isVertical = firstVideo?.platform?.toLowerCase() === "instagram" || firstVideo?.platform?.toLowerCase() === "tiktok";
        const aspectClass = isVertical ? "aspect-[9/16]" : "aspect-video";
        const embedInfo = firstVideo ? getSocialEmbedInfo(firstVideo.platform, firstVideo.url) : null;
        const dynamicThumbnail = firstVideo ? getSocialThumbnail(firstVideo.platform, firstVideo.url) : null;
        const posterSrc = dynamicThumbnail || item.defaultPoster;

        const isInlinePlaying = inlinePlayingId === item.id;
        const activeEmbedUrl = embedInfo?.nativeEmbedUrl || embedInfo?.embedUrl;

        return (
            <article
                key={key}
                className="group flex flex-col gap-1 sm:gap-2 w-full"
            >
                {/* Video Thumbnail Box */}
                <div
                    onClick={(e) => {
                        if (!isInlinePlaying) {
                            handlePlayInline(item, e);
                        }
                    }}
                    className={`relative bg-slate-100 dark:bg-slate-900 rounded-xl sm:rounded-3xl overflow-hidden shadow-sm sm:hover:shadow-[0_20px_40px_-10px_rgba(249,115,22,0.25)] sm:hover:-translate-y-1.5 transition-all duration-300 ${aspectClass} border border-slate-200/30 sm:border-slate-200/50 dark:border-slate-800/50 cursor-pointer`}
                >
                    {/* Inline Native Player when active on this card (Default YouTube / Instagram Player) */}
                    {isInlinePlaying && activeEmbedUrl ? (
                        <div className="absolute inset-0 w-full h-full z-20 bg-black" onClick={(e) => e.stopPropagation()}>
                            <iframe
                                src={activeEmbedUrl}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                scrolling="no"
                            />
                            {/* Floating Enlarge to Custom Player & Close Buttons */}
                            <div className="absolute top-1.5 sm:top-2.5 right-1.5 sm:right-2.5 z-30 flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleVideoClick(item);
                                    }}
                                    className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full bg-black/80 hover:bg-orange-500 text-white text-[10px] sm:text-[11px] font-bold backdrop-blur-md transition-all flex items-center gap-1 sm:gap-1.5 shadow-lg border border-white/20 active:scale-95 group/enlarge"
                                    title="Enlarge Video"
                                >
                                    <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400 group-hover/enlarge:text-white" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setInlinePlayingId(null);
                                    }}
                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-colors shadow-lg border border-white/20 active:scale-95"
                                    title="Close Inline Player"
                                >
                                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Graceful Fallback Pattern */}
                            <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-700 bg-gradient-to-br from-slate-100 via-slate-150 to-slate-200 dark:from-slate-900 dark:to-slate-950">
                                <PlayCircle className="w-8 h-8 sm:w-12 sm:h-12 opacity-30 text-slate-400" />
                            </div>

                            {/* Poster Image */}
                            {posterSrc && (
                                <img
                                    src={posterSrc}
                                    alt={item.title || "Video Thumbnail"}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 z-10"
                                    onError={(e) => {
                                        if (dynamicThumbnail && item.defaultPoster && e.currentTarget.src !== item.defaultPoster) {
                                            e.currentTarget.src = item.defaultPoster;
                                        } else {
                                            e.currentTarget.style.display = "none";
                                        }
                                    }}
                                />
                            )}

                            {/* Subtle Gradient Overlays for contrast */}
                            <div className="absolute inset-x-0 top-0 h-10 sm:h-14 bg-gradient-to-b from-black/30 to-transparent z-10 pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-0 h-20 sm:h-16 bg-gradient-to-t from-black/60 sm:from-black/40 to-transparent z-10 pointer-events-none" />

                            {/* Central Play Button Overlay */}
                            <div
                                className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer group-hover:bg-black/10 transition-colors duration-200"
                                onClick={(e) => handlePlayInline(item, e)}
                            >
                                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white/30 backdrop-blur-xl text-orange-500 rounded-full flex items-center justify-center shadow-[0_6px_24px_rgba(0,0,0,0.4)] border-2 border-white/70 ring-2 sm:ring-3 ring-black/15 transform group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-400 group-hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] group-hover:ring-orange-400/30 transition-all duration-300">
                                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Top-Right: Actions (Three-Dot Menu + Enlarge Button) */}
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

                        {/* Enlarge to Custom Player Modal */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleVideoClick(item);
                            }}
                            className="hidden sm:flex px-2.5 py-1.5 rounded-full items-center gap-1.5 bg-black/50 hover:bg-orange-500 text-white text-[11px] font-semibold backdrop-blur-md border border-white/15 transition-all shadow-md active:scale-95 group/enlarge"
                            title="Enlarge Video"
                            aria-label="Enlarge Video"
                        >
                            <Maximize2 className="w-3.5 h-3.5 text-orange-400 group-hover/enlarge:text-white" />
                        </button>
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
            {/* C. SEARCH BAR & INDUSTRY SELECTOR (hidden on mobile — header provides search) */}
            {/* ============================================================== */}
            <section className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <div className="flex flex-row items-center justify-start gap-3 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                    {/* Search Input */}
                    <div className="relative w-72 lg:w-80 group">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search shops, offers, products..."
                            className="w-full h-11 pl-10 pr-9 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-800 dark:text-slate-100"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Industry Dropdown */}
                    <div className="w-[190px]">
                        <Select value={industryId} onValueChange={handleIndustryDropdownChange}>
                            <SelectTrigger className="w-full h-11 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-orange-500/20">
                                <SelectValue placeholder="All Industries" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl max-h-64">
                                <SelectItem value="all" className="font-semibold">All Industries</SelectItem>
                                {industries.map((ind) => (
                                    <SelectItem key={ind.id} value={String(ind.id)}>
                                        {ind.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            {/* ============================================================== */}
            {/* D. CATEGORY FILTER BAR (HORIZONTAL PILLS)                      */}
            {/* ============================================================== */}
            <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mb-3 sm:mb-8">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
                    {CATEGORY_DEFINITIONS.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = selectedCategoryKey === cat.key;

                        return (
                            <button
                                key={cat.key}
                                onClick={() => handleCategorySelect(cat.key)}
                                className={`flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-sm shrink-0 ${
                                    isActive
                                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25 scale-[1.02]"
                                        : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:border-orange-200 dark:hover:border-slate-700 hover:bg-orange-50/40 dark:hover:bg-slate-800/60"
                                }`}
                            >
                                <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-orange-500"}`} />
                                <span className="hidden sm:inline">{cat.label}</span>
                                <span className="sm:hidden">{cat.key === 'all' ? 'All' : cat.label.split(' ')[0]}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ============================================================== */}
            {/* E. PROMOTIONAL VIDEO GRID / SKELETONS / EMPTY / ERROR STATES   */}
            {/* ============================================================== */}
            <section className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
                {/* 1. Loading Skeleton */}
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0.5 sm:gap-4">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800/80 shadow-sm animate-pulse"
                            >
                                <div className="aspect-[9/16] sm:aspect-video bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                    <PlayCircle className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 dark:text-slate-700" />
                                </div>
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
                    /* 4. Active Video Cards Masonry Grid */
                    <div
                        className="grid gap-0.5 sm:gap-4 items-start w-full mr-auto"
                        style={{
                            gridTemplateColumns: `repeat(${columnsData.length}, minmax(0, 1fr))`,
                            maxWidth: isMobile ? '100%' : (columnsData.length === 1 ? "340px" : `${Math.min(1280, columnsData.length * 280 + (columnsData.length - 1) * 16)}px`),
                        }}
                    >
                        {columnsData.map((colItems, colIdx) => (
                            <div key={colIdx} className="flex flex-col gap-0.5 sm:gap-4 min-w-0">
                                {colItems.map((item) => renderCard(item, item.id))}
                            </div>
                        ))}
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
