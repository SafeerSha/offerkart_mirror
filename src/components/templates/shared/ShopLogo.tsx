"use client";

import React, { useState, useEffect } from "react";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShopLogoProps {
    logoUrl?: string | null;
    shopName?: string;
    alt?: string;
    className?: string;
    fallback?: React.ReactNode;
    fallbackClassName?: string;
}

/**
 * Standardized ShopLogo component for poster templates.
 * 
 * Guarantees:
 * 1. Safe URL validation (detects empty strings, "null", "undefined").
 * 2. Clean live DOM rendering without intrusive crossOrigin attributes that trigger S3 CORS errors.
 * 3. Graceful onError fallback: if an image fails to load, immediately swaps to the intended
 *    template placeholder, never leaving a broken browser image icon visible.
 */
export function ShopLogo({
    logoUrl,
    shopName,
    alt = "Shop Logo",
    className,
    fallback,
    fallbackClassName,
}: ShopLogoProps) {
    const [hasError, setHasError] = useState(false);

    // Reset error state if logoUrl changes
    useEffect(() => {
        setHasError(false);
    }, [logoUrl]);

    // Validate URL string
    const isValidUrl =
        logoUrl &&
        typeof logoUrl === "string" &&
        logoUrl.trim() !== "" &&
        logoUrl !== "null" &&
        logoUrl !== "undefined";

    if (!isValidUrl || hasError) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div
                className={cn(
                    "w-16 h-16 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner",
                    fallbackClassName
                )}
            >
                <Store className="w-8 h-8" />
            </div>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={logoUrl}
            alt={alt || shopName || "Shop Logo"}
            className={className}
            onError={() => {
                setHasError(true);
            }}
        />
    );
}
