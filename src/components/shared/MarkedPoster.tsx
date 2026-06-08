"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
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
    onItemClick
}: MarkedPosterProps) {
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);

    // Reset ratio when src changes to prevent stale layout shifts
    useEffect(() => {
        setAspectRatio(null);
    }, [src]);

    return (
        <div 
            className={cn("relative mx-auto flex items-center justify-center overflow-hidden w-full h-full", className)}
        >
            <div 
                className="relative bg-card shadow-sm overflow-hidden"
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
                            setAspectRatio(naturalWidth / naturalHeight);
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
                            "absolute transition-all shadow-sm z-10",
                            interactive 
                                ? "border-2 border-primary/50 bg-primary/10 hover:bg-primary/20 hover:border-primary hover:shadow-[0_0_15px_rgba(var(--primary),0.5)] cursor-pointer pointer-events-auto animate-pulse hover:animate-none" 
                                : "border-[1.5px] border-red-500 bg-red-500/10 pointer-events-none"
                        )}
                        style={{
                            left: `${item.x * 100}%`,
                            top: `${item.y * 100}%`,
                            width: `${item.width * 100}%`,
                            height: `${item.height * 100}%`,
                        }}
                    >
                        {showNames && item.name && item.name !== "Processing..." && (
                            <div className={cn(
                                "absolute top-0 left-0 px-1 py-0.5 rounded-br-sm",
                                interactive ? "bg-primary text-primary-foreground" : "bg-red-500 text-white"
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
