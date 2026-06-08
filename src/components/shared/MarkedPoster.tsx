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
    onAspectRatioChange
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
                            "absolute transition-all duration-300 shadow-sm z-10",
                            interactive 
                                ? (isBlinking 
                                    ? "custom-big-dashed-border bg-black/5 cursor-pointer pointer-events-auto animate-pulse"
                                    : "hover-custom-big-dashed-border bg-transparent hover:bg-black/5 cursor-pointer pointer-events-auto")
                                : "border-[1.5px] border-red-500 bg-red-500/10 pointer-events-none"
                        )}
                        style={{
                            left: `${item.x * 100}%`,
                            top: `${item.y * 100}%`,
                            width: `${item.width * 100}%`,
                            height: `${item.height * 100}%`,
                        }}
                    >
                        {interactive && isBlinking && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-black/70 text-white p-1 rounded-full shadow-md animate-bounce scale-75 sm:scale-100">
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
                
                <style>{`
                    .custom-big-dashed-border {
                        background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='black' stroke-width='3' stroke-dasharray='15%2c 10' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e");
                    }
                    .hover-custom-big-dashed-border {
                        background-image: none;
                        transition: background-image 0.3s ease;
                    }
                    .hover-custom-big-dashed-border:hover {
                        background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='black' stroke-width='3' stroke-dasharray='15%2c 10' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e");
                    }
                `}</style>
            </div>
        </div>
    );
}
