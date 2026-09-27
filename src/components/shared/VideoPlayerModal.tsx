"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ExternalLink, Store, X } from "lucide-react";
import { getSocialEmbedInfo, getYouTubeVideoId, cn } from "@/lib/utils";

interface VideoPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl?: string | null;
    platform?: string | null;
    title?: string | null;
    subtitle?: string | null;
}

export default function VideoPlayerModal({
    isOpen,
    onClose,
    videoUrl,
    platform,
    title,
    subtitle
}: VideoPlayerModalProps) {
    const isYouTube = platform?.toLowerCase() === "youtube" || (videoUrl && (videoUrl.includes("youtube") || videoUrl.includes("youtu.be")));
    const isInstagram = platform?.toLowerCase() === "instagram" || (videoUrl && videoUrl.includes("instagram.com"));
    const youtubeVideoId = videoUrl ? getYouTubeVideoId(videoUrl) : null;
    const isVerticalShorts = isYouTube && videoUrl?.includes("/shorts/");
    const isVertical = isInstagram || isVerticalShorts || (videoUrl && (videoUrl.includes("tiktok.com") || videoUrl.includes("/reel/") || videoUrl.includes("/reels/")));

    const embedInfo = videoUrl && (platform || isInstagram || isYouTube) ? getSocialEmbedInfo(platform || (isInstagram ? "instagram" : isYouTube ? "youtube" : ""), videoUrl) : null;
    const isDirectVideo = videoUrl?.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                hideCloseButton={true}
                overlayClassName="bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
                className={cn(
                    "p-0 bg-transparent border-0 shadow-none focus:outline-none flex flex-col justify-center items-center max-h-[92vh] w-[95vw] my-auto overflow-hidden",
                    isVertical ? "max-w-[420px]" : "max-w-4xl"
                )}
            >
                {/* Screen Reader accessible Dialog elements */}
                <div className="sr-only">
                    <DialogTitle>{title || "Promotional Video"}</DialogTitle>
                    <DialogDescription>{subtitle ? `By ${subtitle}` : "Promotional Ad Video"}</DialogDescription>
                </div>

                <div className="relative w-full flex flex-col select-none max-h-[92vh]">
                    {/* 1. Header Row: Floating Pills ABOVE the Player (No section background) */}
                    <div className="w-full flex items-center justify-between gap-2 pb-2.5 px-1 shrink-0">
                        {/* Left: Pill-shaped badges for Shop Name & Title */}
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                            {subtitle && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 text-orange-600 dark:text-orange-400 text-xs font-semibold shadow-md shrink-0">
                                    <Store className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate max-w-[130px] sm:max-w-[180px]">{subtitle}</span>
                                </div>
                            )}
                            {title && (
                                <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white text-xs font-bold shadow-md truncate max-w-[150px] sm:max-w-[260px]">
                                    <span className="truncate">{title}</span>
                                </div>
                            )}
                        </div>

                        {/* Right: Pill-shaped badges for Original link & Close Button */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {videoUrl && (
                                <a
                                    href={videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900 backdrop-blur-md text-slate-700 hover:text-slate-900 dark:text-white/90 text-xs font-semibold border border-slate-200/80 dark:border-slate-700/80 shadow-md transition-all active:scale-95"
                                    title="Open on original platform"
                                >
                                    <ExternalLink className="w-3.5 h-3.5 text-orange-500" />
                                    <span>Original</span>
                                </a>
                            )}
                            <button
                                onClick={onClose}
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900 backdrop-blur-md text-slate-700 hover:text-slate-950 dark:text-white flex items-center justify-center transition-all shadow-md active:scale-95 border border-slate-200/80 dark:border-slate-700/80 flex-shrink-0"
                                aria-label="Close video player"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>

                    {/* 2. Video Player Screen Container (Native Player) */}
                    <div className="relative w-full bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200/40 dark:border-slate-800 flex items-center justify-center flex-1 min-h-0">
                        {isYouTube && youtubeVideoId ? (
                            /* Native YouTube Embed Player with full native controls */
                            <div className={`relative w-full flex items-center justify-center ${isVerticalShorts ? "h-[70vh] max-h-[580px] aspect-[9/16] mx-auto" : "aspect-video max-h-[75vh]"}`}>
                                <iframe
                                    src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&controls=1&playsinline=1&rel=0`}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        ) : isInstagram && embedInfo?.embedUrl ? (
                            /* Native Instagram Embed View */
                            <div className="w-full h-full flex items-center justify-center p-1 sm:p-2 bg-black">
                                <iframe
                                    src={`${embedInfo.embedUrl}${embedInfo.embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
                                    className="w-full h-[70vh] max-h-[580px] max-w-[390px] border-0 rounded-xl sm:rounded-2xl bg-black"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    scrolling="no"
                                />
                            </div>
                        ) : isDirectVideo ? (
                            /* Native HTML5 Video File with Native Controls */
                            <div className="relative w-full aspect-video max-h-[75vh]">
                                <video
                                    src={videoUrl!}
                                    controls
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        ) : embedInfo?.embedUrl ? (
                            /* Fallback native embed frame */
                            <div className="w-full aspect-video max-h-[75vh]">
                                <iframe
                                    src={embedInfo.embedUrl}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            /* Non-playable external URL fallback */
                            <div className="text-white p-8 sm:p-12 text-center flex flex-col items-center">
                                <p className="mb-4 text-slate-300 text-sm">This video format is optimized for direct viewing on its platform.</p>
                                {videoUrl && (
                                    <a
                                        href={videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-orange-500/25"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Watch on {platform || "Source"}
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
