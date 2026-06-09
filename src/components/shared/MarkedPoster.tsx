"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MousePointerClick } from "lucide-react";
import type { MarkedItem } from "@/lib/types/offer";

interface MarkedPosterProps {
    src: string;
    alt: string;
    markedItems?: MarkedItem[];
    className?: string;
    imageClassName?: string;
    showNames?: boolean;
    priority?: boolean;
    interactive?: boolean;
    onItemClick?: (item: MarkedItem) => void;
    onAspectRatioChange?: (ratio: number) => void;
    bgClassName?: string;
}

/**
 * MarkedPoster Component
 * 
 * Standardized component for rendering images with hotspot overlays.
 * Uses an aspect-ratio matched container to ensure that relative (0-1) coordinates
 * are perfectly pinned to the visible image content regardless of container size or 
 * screen orientation.
 */
export function MarkedPoster({
    src,
    alt,
    markedItems = [],
    className,
    imageClassName,
    showNames = true,
    priority = false,
    interactive = false,
    onItemClick,
    onAspectRatioChange,
    bgClassName = "bg-card shadow-sm"
}: MarkedPosterProps) {
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);
    const [isBlinking, setIsBlinking] = useState(interactive);

    // Reset ratio and restart blinking when src changes
    useEffect(() => {
        setAspectRatio(null);
        if (interactive) {
            setIsBlinking(true);
            const timer = setTimeout(() => {
                setIsBlinking(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [src, interactive]);

    return (
        <div 
            className={cn("relative mx-auto flex items-center justify-center overflow-hidden w-full h-full", className)}
        >
            <div 
                className={cn("relative overflow-hidden", bgClassName)}
                style={{ 
                    height: '100%', 
                    width: aspectRatio ? 'auto' : '100%',
                    aspectRatio: aspectRatio ? `${aspectRatio}` : 'auto',
                    maxHeight: '100%',
                    maxWidth: '100%'
                }}
            >
                {src && (
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        unoptimized
                        priority={priority}
                        className={cn("object-contain", imageClassName)}
                        onLoadingComplete={({ naturalWidth, naturalHeight }) => {
                            const ratio = naturalWidth / naturalHeight;
                            setAspectRatio(ratio);
                            if (onAspectRatioChange) {
                                onAspectRatioChange(ratio);
                            }
                        }}
                    />
                )}

                {/* Hotspot Overlays */}
                {markedItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={(e) => {
                            if (interactive && onItemClick) {
                                e.stopPropagation();
                                onItemClick(item);
                            }
                        }}
                        className={cn(
                            "absolute transition-all duration-300 z-10 group",
                            interactive 
                                ? (isBlinking 
                                    ? "bg-orange-500/5 cursor-pointer pointer-events-auto"
                                    : "bg-transparent hover:bg-orange-500/5 cursor-pointer pointer-events-auto")
                                : "bg-transparent pointer-events-none"
                        )}
                        style={{
                            left: `${item.x * 100}%`,
                            top: `${item.y * 100}%`,
                            width: `${item.width * 100}%`,
                            height: `${item.height * 100}%`,
                        }}
                    >
                        {/* Focus Reticle Corners */}
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Top Left */}
                            <div className={cn(
                                "absolute top-0 left-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 border-t-2 border-l-2 transition-all duration-300",
                                interactive 
                                    ? (isBlinking 
                                        ? "border-orange-500 animate-pulse" 
                                        : "border-orange-500/40 group-hover:border-orange-500 group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-[0_0_8px_rgba(249,115,22,0.4)]")
                                    : "border-red-500/50"
                            )} />
                            {/* Top Right */}
                            <div className={cn(
                                "absolute top-0 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 border-t-2 border-r-2 transition-all duration-300",
                                interactive 
                                    ? (isBlinking 
                                        ? "border-orange-500 animate-pulse" 
                                        : "border-orange-500/40 group-hover:border-orange-500 group-hover:-translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-[0_0_8px_rgba(249,115,22,0.4)]")
                                    : "border-red-500/50"
                            )} />
                            {/* Bottom Left */}
                            <div className={cn(
                                "absolute bottom-0 left-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 border-b-2 border-l-2 transition-all duration-300",
                                interactive 
                                    ? (isBlinking 
                                        ? "border-orange-500 animate-pulse" 
                                        : "border-orange-500/40 group-hover:border-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_8px_rgba(249,115,22,0.4)]")
                                    : "border-red-500/50"
                            )} />
                            {/* Bottom Right */}
                            <div className={cn(
                                "absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 border-b-2 border-r-2 transition-all duration-300",
                                interactive 
                                    ? (isBlinking 
                                        ? "border-orange-500 animate-pulse" 
                                        : "border-orange-500/40 group-hover:border-orange-500 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_8px_rgba(249,115,22,0.4)]")
                                    : "border-red-500/50"
                            )} />
                        </div>

                        {interactive && isBlinking && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-orange-500/90 text-white p-1.5 rounded-full shadow-lg shadow-orange-500/30 animate-bounce scale-75 sm:scale-100 border border-white/20">
                                    <MousePointerClick className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        )}

                        {showNames && !isBlinking && item.name && item.name !== "Processing..." && (
                            <div className={cn(
                                "absolute top-0 left-0 px-1 py-0.5 rounded-br-sm opacity-0 group-hover:opacity-100 transition-opacity",
                                interactive ? "bg-black text-white" : "bg-red-500 text-white"
                            )}>
                                <span className="text-[8px] sm:text-[10px] font-bold truncate block leading-none">
                                    {item.name}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
