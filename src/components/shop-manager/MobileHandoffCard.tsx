"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
    Smartphone,
    QrCode,
    Copy,
    Check,
    RefreshCw,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Share2,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface MobileHandoffCardProps {
    shopId?: string | null;
    shopName?: string;
    capturedCount: number;
    totalCount?: number;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    className?: string;
}

export function MobileHandoffCard({
    shopId,
    shopName,
    capturedCount,
    totalCount = 3,
    onRefresh,
    isRefreshing = false,
    className
}: MobileHandoffCardProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [qrError, setQrError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const isAllCaptured = capturedCount >= totalCount;

    // Auto-collapse if all photos are captured, but allow expanding
    useEffect(() => {
        if (isAllCaptured) {
            setIsCollapsed(true);
        }
    }, [isAllCaptured]);

    const mobileUrl =
        typeof window !== "undefined" && shopId
            ? `${window.location.origin}/shop-manager/add-shop?id=${encodeURIComponent(
                  shopId
              )}&tab=verification#storefront-photos`
            : "";

    useEffect(() => {
        if (!mobileUrl) {
            setQrDataUrl(null);
            return;
        }

        let isMounted = true;
        QRCode.toDataURL(mobileUrl, {
            width: 200,
            margin: 1.5,
            color: {
                dark: "#221c17",
                light: "#ffffff",
            },
            errorCorrectionLevel: "M",
        })
            .then((url) => {
                if (isMounted) {
                    setQrDataUrl(url);
                    setQrError(null);
                }
            })
            .catch((err) => {
                console.error("Failed to generate QR code:", err);
                if (isMounted) setQrError("Failed to render QR code");
            });

        return () => {
            isMounted = false;
        };
    }, [mobileUrl]);

    const handleCopyLink = () => {
        if (!mobileUrl) {
            toast.error("Please save shop details first to generate link");
            return;
        }
        navigator.clipboard.writeText(mobileUrl);
        setCopied(true);
        toast.success("Mobile verification link copied!");
        setTimeout(() => setCopied(false), 2500);
    };

    const handleShareWhatsApp = () => {
        if (!mobileUrl) return;
        const text = encodeURIComponent(
            `Take storefront verification photos for ${
                shopName || "our shop"
            } on your phone:\n${mobileUrl}`
        );
        window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    };

    if (!shopId) {
        return (
            <div
                className={cn(
                    "hidden md:flex items-center gap-2.5 rounded-xl border border-dashed border-border bg-background/60 px-4 py-3 text-xs text-muted-foreground",
                    className
                )}
            >
                <Smartphone className="w-4 h-4 text-primary shrink-0" />
                <p>
                    Save basic shop details in the <span className="font-semibold text-foreground">Basic Details</span> tab first to generate a mobile verification QR code.
                </p>
            </div>
        );
    }

    // Ultra-clean single-row bar when collapsed
    if (isCollapsed) {
        return (
            <div
                className={cn(
                    "hidden md:flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-background/60 px-4 py-2.5 text-xs transition-all",
                    className
                )}
            >
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    {isAllCaptured ? (
                        <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-medium text-foreground">
                                All 3 storefront photos captured!
                            </span>
                        </>
                    ) : (
                        <>
                            <QrCode className="w-4 h-4 text-primary shrink-0" />
                            <span>
                                {capturedCount} of {totalCount} photos captured
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                            title="Check if photos were captured on phone"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-primary")} />
                            <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsCollapsed(false)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                    >
                        <span>{isAllCaptured ? "Show Mobile QR Code (to retake)" : "Show Mobile QR Code"}</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "hidden md:block rounded-2xl border border-border/80 bg-background/60 p-4 lg:p-5 transition-all",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">
                            Recommended for Desktop: Take Photos with Your Smartphone
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Scan with your phone camera for accurate GPS and high-resolution storefront photos.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="py-1.5 px-3 rounded-lg bg-card hover:bg-secondary/60 border border-border text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            title="Check if photos were captured on phone"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-primary")} />
                            <span>{isRefreshing ? "Syncing..." : "Sync Photos"}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsCollapsed(true)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
                        title="Collapse QR Code"
                        aria-label="Collapse QR Code"
                    >
                        <ChevronUp className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Expanded QR Code & Sharing Options */}
            <div className="mt-4 pt-4 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Left: Minimal steps & share actions */}
                <div className="space-y-3.5 flex-1">
                    <ol className="space-y-2 text-xs text-muted-foreground">
                        <li className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-semibold text-[11px] flex items-center justify-center shrink-0">
                                1
                            </span>
                            <span>
                                <strong className="font-medium text-foreground">Scan QR Code</strong> with your phone camera
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-semibold text-[11px] flex items-center justify-center shrink-0">
                                2
                            </span>
                            <span>
                                <strong className="font-medium text-foreground">Capture 3 photos</strong> on-site with automatic geotags
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-semibold text-[11px] flex items-center justify-center shrink-0">
                                3
                            </span>
                            <span>
                                <strong className="font-medium text-foreground">Click Sync Photos</strong> or submit directly from your phone
                            </span>
                        </li>
                    </ol>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="py-1.5 px-3 rounded-lg bg-card hover:bg-secondary/60 border border-border text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                            <span>{copied ? "Link Copied!" : "Copy Mobile Link"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleShareWhatsApp}
                            className="py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Share via WhatsApp</span>
                        </button>

                        <a
                            href={mobileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2 text-xs text-muted-foreground hover:text-foreground hover:underline inline-flex items-center gap-1"
                        >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                {/* Right: Clean QR Code */}
                <div className="flex flex-col items-center shrink-0">
                    <div className="p-2.5 bg-white rounded-xl border border-border shadow-2xs relative">
                        {qrDataUrl ? (
                            <div className="relative w-32 h-32">
                                <Image
                                    src={qrDataUrl}
                                    alt="Scan QR code to open verification on mobile"
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                        ) : qrError ? (
                            <div className="w-32 h-32 flex items-center justify-center text-[11px] text-destructive text-center p-2">
                                {qrError}
                            </div>
                        ) : (
                            <div className="w-32 h-32 flex items-center justify-center text-muted-foreground">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
