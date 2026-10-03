"use client";

import React from "react";
import { 
  Play, 
  PlayCircle, 
  MapPin, 
  Store, 
  Share2, 
  Copy, 
  ExternalLink, 
  MoreVertical,
  Clock
} from "lucide-react";
import { OfferSocialLink, SocialLinkItem } from "@/lib/types/socialLinks";
import { getSocialThumbnail, cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface PromoCardProps {
  item: OfferSocialLink;
  onPlay: (item: OfferSocialLink) => void;
}

export function PromoCard({ item, onPlay }: PromoCardProps) {
  const firstVideo: SocialLinkItem | undefined = item.socialLinks?.find((l) =>
    ["youtube", "instagram", "facebook"].includes(l.platform.toLowerCase())
  );

  const platform = firstVideo?.platform?.toLowerCase() || "youtube";
  const isVertical = platform === "instagram" || platform === "tiktok";
  const dynamicThumbnail = firstVideo ? getSocialThumbnail(firstVideo.platform, firstVideo.url) : null;
  const posterSrc = dynamicThumbnail || item.defaultPoster;

  // Realistic commercial duration based on item id
  const sampleDurations = ["0:30", "0:45", "1:15", "0:40", "1:00", "0:50", "0:35"];
  const duration = sampleDurations[Math.abs(item.id || 0) % sampleDurations.length];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (firstVideo?.url) {
      navigator.clipboard?.writeText(firstVideo.url);
      toast.success("Video link copied to clipboard!");
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firstVideo?.url) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Watch promotional video by ${item.shop_name} on OfferNearU!`,
          url: firstVideo.url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy(e);
    }
  };

  const getPlatformBadge = () => {
    if (platform === "youtube") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600/90 text-white backdrop-blur-md shadow-xs">
          <span>YouTube</span>
        </span>
      );
    }
    if (platform === "instagram") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white backdrop-blur-md shadow-xs">
          <span>Reel</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600/90 text-white backdrop-blur-md shadow-xs">
        <span>Video</span>
      </span>
    );
  };

  return (
    <article
      onClick={() => onPlay(item)}
      className={cn(
        "group relative flex flex-col rounded-3xl overflow-hidden cursor-pointer",
        "bg-card/90 backdrop-blur-xl border border-border/80",
        "shadow-card hover:shadow-card-hover hover:-translate-y-1.5",
        "transition-all duration-300"
      )}
    >
      {/* 16:9 Video Canvas Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        {/* Background Fallback Icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-700">
          <PlayCircle className="w-12 h-12 opacity-30 text-muted-foreground" />
        </div>

        {/* Video Thumbnail */}
        {posterSrc && (
          <>
            {isVertical && (
              <>
                <img
                  src={posterSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-70 saturate-150 pointer-events-none"
                />
                <div className="absolute inset-0 bg-black/30 pointer-events-none" />
              </>
            )}
            <img
              src={posterSrc}
              alt={item.title || "Video Thumbnail"}
              loading="lazy"
              className={cn(
                "absolute inset-0 w-full h-full transition-transform duration-700",
                isVertical
                  ? "object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]"
                  : "object-cover group-hover:scale-105"
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

        {/* Subtle Dark Vignette Gradients */}
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-10" />

        {/* Top-Left: Platform Badge */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          {getPlatformBadge()}
        </div>

        {/* Top-Right: Three-Dot Action Dropdown Menu */}
        <div
          className="absolute top-2.5 right-2.5 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {firstVideo && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all shadow-md active:scale-95 cursor-pointer"
                  aria-label="Video options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-xl p-1.5 text-foreground"
              >
                <DropdownMenuItem
                  onClick={handleShare}
                  className="cursor-pointer text-xs font-semibold rounded-xl py-2 px-2.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-primary mr-2" /> Share Video
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleCopy}
                  className="cursor-pointer text-xs font-semibold rounded-xl py-2 px-2.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground mr-2" /> Copy Link
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/60 my-1" />
                <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold rounded-xl py-2 px-2.5 transition-colors">
                  <a
                    href={firstVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground mr-2" /> Open External
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Central Glowing Play Button */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center",
            "bg-white/30 backdrop-blur-xl text-primary border-2 border-white/70 shadow-lg",
            "group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:border-primary/80",
            "group-hover:shadow-[0_0_30px_rgba(249,115,22,0.6)]",
            "transition-all duration-300"
          )}>
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5 drop-shadow-md" />
          </div>
        </div>

        {/* Bottom Right Badges: Duration & Distance */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 pointer-events-none">
          {item.distance !== null && item.distance !== undefined && (
            <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
              <MapPin className="w-3 h-3 text-primary" />
              <span>{item.distance.toFixed(1)}km</span>
            </div>
          )}
          {duration && (
            <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{duration}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer / Details Bar */}
      <div className="p-4 flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Shop Logo Avatar */}
          <div className="w-9 h-9 rounded-xl bg-muted/80 border border-border/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            {item.logo_url ? (
              <img
                src={item.logo_url}
                alt={item.shop_name || "Shop Logo"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Store className="w-4 h-4 text-primary" />
            )}
          </div>

          {/* Titles */}
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {item.title || "Special Store Commercial"}
            </h3>
            <div className="text-[11px] font-medium text-muted-foreground truncate flex items-center gap-1">
              <Store className="w-3 h-3 text-primary/70 shrink-0" />
              <span className="truncate">{item.shop_name || "OfferNearU Partner"}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
