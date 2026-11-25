"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
    Smartphone,
    Copy,
    Check,
    RefreshCw,
    ExternalLink,
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

    const isAllCaptured = capturedCount >= totalCount;

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
                    "hidden md:flex items-center gap-2.5 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-xs text-muted-foreground",
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

    return (
        <div
            className={cn(
                "hidden md:flex items-center gap-5 rounded-xl border border-border/80 bg-card p-4 shadow-2xs",
                className
            )}
        >
            {/* Left: Static QR Code */}
            <div className="shrink-0 flex flex-col items-center">
                <div className="p-2 bg-white rounded-xl border border-border shadow-2xs">
                    {qrDataUrl ? (
                        <div className="relative w-28 h-28">
                            <Image
                                src={qrDataUrl}
                                alt="Scan QR code to open verification on mobile"
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                    ) : qrError ? (
                        <div className="w-28 h-28 flex items-center justify-center text-[11px] text-destructive text-center p-2">
                            {qrError}
                        </div>
                    ) : (
                        <div className="w-28 h-28 flex items-center justify-center text-muted-foreground">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Info & Actions */}
            <div className="flex-1 min-w-0 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-foreground">
                                {isAllCaptured
                                    ? "Captured via Mobile · Scan QR to Retake"
                                    : "Scan QR Code with Your Phone"}
                            </h4>
                            {isAllCaptured && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {capturedCount}/{totalCount} Ready
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            Only live on-premise camera photos are allowed. Scan this QR code on your smartphone to capture or retake storefront photos with GPS.
                        </p>
                    </div>

                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="shrink-0 py-1.5 px-3 rounded-lg bg-background hover:bg-secondary/60 border border-border text-foreground text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            title="Check if photos were captured on phone"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", isRefreshing && "animate-spin text-primary")} />
                            <span>{isRefreshing ? "Syncing..." : "Sync Photos"}</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <button
                        type="button"
                        onClick={handleCopyLink}
                        className="py-1.5 px-3 rounded-lg bg-background hover:bg-secondary/60 border border-border text-foreground text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                        <span>{copied ? "Link Copied!" : "Copy Mobile Link"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
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
        </div>
    );
}
