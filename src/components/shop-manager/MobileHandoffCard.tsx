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
    ShieldCheck,
    Share2,
    Sparkles,
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

    // Construct mobile target URL with auto-scroll anchor
    const getMobileUrl = () => {
        if (typeof window === "undefined" || !shopId) return "";
        return `${window.location.origin}/shop-manager/add-shop?id=${encodeURIComponent(
            shopId
        )}&tab=verification#storefront-photos`;
    };

    const mobileUrl = getMobileUrl();

    // Generate QR code Data URL
    useEffect(() => {
        if (!mobileUrl) {
            setQrDataUrl(null);
            return;
        }

        let isMounted = true;
        QRCode.toDataURL(mobileUrl, {
            width: 220,
            margin: 1.5,
            color: {
                dark: "#1e293b",
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
                    "hidden md:block rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4 text-xs text-amber-900",
                    className
                )}
            >
                <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="font-medium">
                        <strong>Desktop Tip:</strong> Save basic shop details in the &apos;Basic Details&apos; tab first to generate a mobile QR code for storefront photos.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "hidden md:block rounded-2xl border border-orange-200/90 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/40 p-4 lg:p-5 shadow-xs transition-all",
                className
            )}
        >
            {/* Header & Status Summary */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-gray-900">
                                Recommended for Desktop: Take Photos with Your Smartphone
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Accurate GPS & High-Res
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                            Desktop webcams cannot be pointed outside. Scan this QR code with your phone camera to snap the 3 storefront photos on-site.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="py-1.5 px-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50"
                            title="Check if photos were captured on phone"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-orange-600")} />
                            <span>{isRefreshing ? "Syncing..." : "Sync Photos"}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                        title={isCollapsed ? "Expand QR Code" : "Collapse QR Code"}
                        aria-label={isCollapsed ? "Expand QR Code" : "Collapse QR Code"}
                    >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Collapsed state with completion badge */}
            {isCollapsed ? (
                <div className="mt-3 pt-3 border-t border-orange-100 flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                        {isAllCaptured ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="font-semibold text-emerald-800">
                                    All 3 storefront photos captured!
                                </span>
                            </>
                        ) : (
                            <>
                                <QrCode className="w-4 h-4 text-orange-600 shrink-0" />
                                <span>
                                    {capturedCount} of {totalCount} photos captured.
                                </span>
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(false)}
                        className="text-orange-600 hover:text-orange-700 font-semibold text-xs cursor-pointer underline flex items-center gap-1"
                    >
                        <span>{isAllCaptured ? "Show Mobile QR Code (to retake)" : "Show Mobile QR Code"}</span>
                    </button>
                </div>
            ) : (
                /* Expanded QR Code & Sharing Options */
                <div className="mt-4 pt-4 border-t border-orange-100 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    {/* Left: Step instructions */}
                    <div className="md:col-span-7 space-y-3">
                        <div className="space-y-2 text-xs text-gray-700">
                            <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                    1
                                </span>
                                <div>
                                    <strong className="text-gray-900">Scan QR Code</strong> with your phone&apos;s standard camera app or Google Lens.
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                    2
                                </span>
                                <div>
                                    <strong className="text-gray-900">Open the link</strong> on your smartphone. It opens directly to the storefront camera section.
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                    3
                                </span>
                                <div>
                                    <strong className="text-gray-900">Snap on-site photos</strong> using your phone&apos;s rear camera. Geotags are embedded automatically.
                                </div>
                            </div>
                        </div>

                        {/* Quick action share buttons */}
                        <div className="pt-2 flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={handleCopyLink}
                                className="py-1.5 px-3 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                                <span>{copied ? "Link Copied!" : "Copy Mobile Link"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleShareWhatsApp}
                                className="py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Share via WhatsApp</span>
                            </button>

                            <a
                                href={mobileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-1.5 px-2.5 text-xs text-gray-500 hover:text-gray-800 hover:underline flex items-center gap-1"
                            >
                                <span>Preview link</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                    {/* Right: QR Code Visual */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center">
                        <div className="p-3 bg-white rounded-2xl border-2 border-orange-200/80 shadow-sm relative group">
                            {qrDataUrl ? (
                                <div className="relative w-36 h-36">
                                    <Image
                                        src={qrDataUrl}
                                        alt="Scan QR code to open verification on mobile"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                            ) : qrError ? (
                                <div className="w-36 h-36 flex items-center justify-center text-[11px] text-red-500 text-center p-2">
                                    {qrError}
                                </div>
                            ) : (
                                <div className="w-36 h-36 flex items-center justify-center text-gray-400">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                </div>
                            )}

                            {/* Center branding icon badge */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-7 h-7 rounded-lg bg-white shadow-sm border border-orange-200 flex items-center justify-center text-orange-600">
                                    <Smartphone className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <span className="text-[11px] font-medium text-gray-500 mt-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-orange-500" />
                            <span>Scan with any camera app</span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
