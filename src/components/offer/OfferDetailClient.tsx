"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { StaticImageData } from "next/image";
import { Tag, ChevronLeft, ChevronRight, Loader2, Store, Link as LinkIcon, ExternalLink } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Subheading } from "@/components/shared/Typography";
import { MarkedPoster } from "@/components/shared/MarkedPoster";
import { Poster, MarkedItem } from "@/lib/types/offer";
import { cn, getSocialEmbedInfo } from "@/lib/utils";
import Link from "next/link";
import {
    SiFacebook,
    SiInstagram,
    SiYoutube,
    SiWhatsapp,
    SiThreads,
    SiX
} from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";

import Breadcrumbs from "@/components/shared/Breadcrumbs";
import OfferCard from "@/components/offer/OfferCard";
import { ConsumerProductModal } from "@/components/offer/ConsumerProductModal";
import { useTranslation } from "@/hooks/useTranslation";

interface OfferDetail {
    id: number | string;
    shopName: string;
    offerName: string;
    images: (string | StaticImageData)[];
    posters?: Poster[];
    category: string;
    location: string;
    validFrom: string;
    validTo: string;
    discount: string;
    rating: number;
    reviews: number;
    price: string;
    originalPrice: string;
    branchId?: number | string;
    branchName?: string;
    shopLogo?: string | null;
    shopId?: number | string;
    socialLinks?: { platform: string; url: string; }[] | null;
}

interface SimilarOffer {
    id: number;
    shopName: string;
    offerName: string;
    image: string | StaticImageData;
    category: string;
    location: string;
    validFrom: string;
    validTo: string;
    discount?: string;
    branchName?: string;
}

interface OfferDetailClientProps {
    offer: OfferDetail;
    similarOffers: SimilarOffer[];
    prevOfferId?: number | string | null;
    nextOfferId?: number | string | null;
}

/** Map the Offer object (returned by getUserOfferById / the API route) to OfferDetail shape */
function mapApiOfferToDetail(raw: any): OfferDetail {
    const DEFAULT_IMAGE = "/images/shop-registration-bg-light.png";

    const finalPosters: Poster[] = (raw.posters || []).map((p: any) => {
        const rawPosterSrc = p.imageUrl || p.posterSrc || p.image_url || p.image;
        const posterSrc = typeof rawPosterSrc === "object" ? (rawPosterSrc as any)?.src ?? DEFAULT_IMAGE : rawPosterSrc || DEFAULT_IMAGE;

        let markedItems: MarkedItem[] = [];
        if (Array.isArray(p.markedItems)) {
            markedItems = p.markedItems.map((item: any) => ({
                id: String(item.id ?? ""),
                name: item.name || "",
                description: item.description || "",
                productImage: item.productImage || "",
                currency: item.currency || "₹",
                oldPrice: item.oldPrice ?? 0,
                offerPrice: item.offerPrice ?? 0,
                x: item.x ?? 0,
                y: item.y ?? 0,
                width: item.width ?? 0,
                height: item.height ?? 0,
                mainCategory: item.mainCategory || "",
            }));
        } else if (Array.isArray(p.products)) {
            for (const prod of p.products) {
                const areas = prod.areas || [];
                for (const area of areas) {
                    markedItems.push({
                        id: String(prod.id ?? ""),
                        name: prod.displayName || prod.name || "Product",
                        description: prod.displayDescription || prod.description || "",
                        productImage: prod.imageUrl || prod.productImage || "",
                        currency: "₹",
                        oldPrice: prod.originalPrice || prod.oldPrice || prod.offerPrice || 0,
                        offerPrice: prod.offerPrice ?? 0,
                        x: area.xPercent ?? area.x ?? 0,
                        y: area.yPercent ?? area.y ?? 0,
                        width: area.widthPercent ?? area.width ?? 0,
                        height: area.heightPercent ?? area.height ?? 0,
                        mainCategory: prod.mainCategory || prod.category || "",
                    });
                }
            }
        }

        return {
            id: String(p.id ?? ""),
            posterSrc,
            type: ("just_post" as const),
            markedItems,
            title: p.title,
        };
    });

    const primaryImage = finalPosters[0]?.posterSrc || (typeof raw.image === "string" ? raw.image : null) || raw.posterSrc || DEFAULT_IMAGE;

    return {
        id: raw.id,
        shopName: raw.shopName || "OfferKart",
        offerName: raw.offerName || raw.title || "Untitled Offer",
        images: [primaryImage],
        posters: finalPosters,
        category: raw.category || "Offers",
        location: raw.location || "Location unavailable",
        validFrom: raw.validFrom || "",
        validTo: raw.validTo || "",
        discount: raw.discount || "Live now",
        rating: 0,
        reviews: 0,
        price: "",
        originalPrice: "",
        branchName: raw.branchNames?.[0] ?? raw.branchName,
        shopLogo: raw.shopLogo || null,
        shopId: raw.shopId || raw.shop_id || undefined,
        socialLinks: raw.socialLinks || raw.social_links || null,
    };
}

const SOCIAL_PLATFORMS: Record<string, { label: string; icon: React.ComponentType<any>; color: string; hoverBg: string }> = {
    YOUTUBE: { label: "YouTube", icon: SiYoutube, color: "text-[#FF0000] hover:text-[#FF0000]", hoverBg: "hover:bg-[#FF0000]/10 border-[#FF0000]/20 hover:border-[#FF0000]/50" },
    INSTAGRAM: { label: "Instagram", icon: SiInstagram, color: "text-[#E4405F] hover:text-[#E4405F]", hoverBg: "hover:bg-[#E4405F]/10 border-[#E4405F]/20 hover:border-[#E4405F]/50" },
    FACEBOOK: { label: "Facebook", icon: SiFacebook, color: "text-[#1877F2] hover:text-[#1877F2]", hoverBg: "hover:bg-[#1877F2]/10 border-[#1877F2]/20 hover:border-[#1877F2]/50" },
    WHATSAPP: { label: "WhatsApp", icon: SiWhatsapp, color: "text-[#25D366] hover:text-[#25D366]", hoverBg: "hover:bg-[#25D366]/10 border-[#25D366]/20 hover:border-[#25D366]/50" },
    THREADS: { label: "Threads", icon: SiThreads, color: "text-black dark:text-white hover:text-black dark:hover:text-white", hoverBg: "hover:bg-black/5 dark:hover:bg-white/10 border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30" },
    X: { label: "X", icon: SiX, color: "text-black dark:text-white hover:text-black dark:hover:text-white", hoverBg: "hover:bg-black/5 dark:hover:bg-white/10 border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30" },
    LINKEDIN: { label: "LinkedIn", icon: FaLinkedin, color: "text-[#0A66C2] hover:text-[#0A66C2]", hoverBg: "hover:bg-[#0A66C2]/10 border-[#0A66C2]/20 hover:border-[#0A66C2]/50" },
    WEBSITE: { label: "Website", icon: LinkIcon, color: "text-indigo-600 hover:text-indigo-600", hoverBg: "hover:bg-indigo-50 border-indigo-100 hover:border-indigo-500" },
};

export default function OfferDetailClient({ offer: initialOffer, similarOffers, prevOfferId: initialPrevId, nextOfferId: initialNextId }: OfferDetailClientProps) {
    const { t } = useTranslation("common");

    // --- Current offer state (can be changed client-side without page reload) ---
    const [offer, setOffer] = useState(initialOffer);
    const [prevOfferId, setPrevOfferId] = useState(initialPrevId);
    const activeSocialLinks = useMemo(() => {
        if (!offer.socialLinks || !Array.isArray(offer.socialLinks)) return [];
        return offer.socialLinks.filter(link => link.url && link.url.trim() !== "");
    }, [offer.socialLinks]);
    const [nextOfferId, setNextOfferId] = useState(initialNextId);
    const [allOfferIds, setAllOfferIds] = useState<(number | string)[]>([]);
    const [isNavigating, setIsNavigating] = useState(false);

    // --- Poster / carousel state ---
    const [posterIndex, setPosterIndex] = useState(0);
    const similarCarouselRef = useRef<HTMLDivElement>(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // --- Social media preview modal state ---
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewPlatform, setPreviewPlatform] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [previewEmbedUrl, setPreviewEmbedUrl] = useState("");
    const [previewAspectClass, setPreviewAspectClass] = useState("");

    const handleSocialClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, platform: string, rawUrl: string) => {
        let finalUrl = rawUrl;
        if (platform.toUpperCase() === "WHATSAPP" && !finalUrl.startsWith("http") && /^\d+$/.test(finalUrl.replace(/\D/g, ""))) {
            finalUrl = `https://wa.me/${finalUrl.replace(/\D/g, "")}`;
        } else if (!finalUrl.startsWith("http")) {
            finalUrl = `https://${finalUrl}`;
        }

        const embedInfo = getSocialEmbedInfo(platform, finalUrl);
        if (embedInfo.embedUrl) {
            e.preventDefault();
            setPreviewPlatform(platform.toLowerCase());
            setPreviewUrl(finalUrl);
            setPreviewEmbedUrl(embedInfo.embedUrl);
            setPreviewAspectClass(embedInfo.aspectClass);
            setPreviewModalOpen(true);
        }
    }, []);

    // Load and trigger Instagram embed SDK
    useEffect(() => {
        if (previewModalOpen && previewPlatform.toLowerCase() === 'instagram') {
            const processEmbeds = () => {
                if ((window as any).instgrm?.Embeds) {
                    try {
                        (window as any).instgrm.Embeds.process();
                    } catch (err) {
                        console.warn("Error processing Instagram embeds:", err);
                    }
                }
            };

            if ((window as any).instgrm) {
                setTimeout(processEmbeds, 100);
            } else {
                const existingScript = document.getElementById('instagram-embed-script');
                if (!existingScript) {
                    const script = document.createElement('script');
                    script.id = 'instagram-embed-script';
                    script.src = 'https://www.instagram.com/embed.js';
                    script.async = true;
                    script.defer = true;
                    script.onload = () => setTimeout(processEmbeds, 200);
                    document.body.appendChild(script);
                } else {
                    setTimeout(processEmbeds, 300);
                }
            }
        }
    }, [previewModalOpen, previewPlatform, previewUrl]);

    // Keep breadcrumbs in sync with current offer name using useMemo instead of useEffect state sync
    const breadcrumbItems = useMemo(() => [
        { label: t("nav.offers"), href: "/offers" },
        { label: offer.offerName },
    ], [offer.offerName, t]);

    // On mount: fetch all offer IDs for client-side prev/next calculation
    useEffect(() => {
        fetch("/api/user/offer/ids")
            .then((res) => res.json())
            .then((json) => {
                if (json.success && Array.isArray(json.ids) && json.ids.length > 0) {
                    setAllOfferIds(json.ids);
                }
            })
            .catch(() => {/* silently ignore */ });
    }, []);

    // Recompute prev/next from the ID list when current offer or list changes
    useEffect(() => {
        if (allOfferIds.length < 2) return;
        const idx = allOfferIds.findIndex((id) => String(id) === String(offer.id));
        if (idx === -1) return;
        const prev = allOfferIds[(idx - 1 + allOfferIds.length) % allOfferIds.length];
        const next = allOfferIds[(idx + 1) % allOfferIds.length];
        setPrevOfferId(prev);
        setNextOfferId(next);
    }, [offer.id, allOfferIds]);

    // Reset poster index when offer changes
    useEffect(() => {
        setPosterIndex(0);
    }, [offer.id]);

    useEffect(() => {
        if (offer) {
            document.title = `${offer.offerName || "Untitled Offer"} at ${offer.shopName || "OfferKart"} - OfferKart`;
        }
    }, [offer]);

    const totalPosters = offer.posters?.length || offer.images.length || 1;

    const allMarkedItems = useMemo(() => {
        return offer.posters?.flatMap((poster, pIdx) =>
            (poster.markedItems || []).map((item) => ({ ...item, posterIndex: pIdx }))
        ) || [];
    }, [offer.posters]);

    /** Load a new offer client-side (no page reload) */
    const navigateToOffer = useCallback(async (targetId: number | string) => {
        if (isNavigating) return;
        setIsNavigating(true);
        try {
            const res = await fetch(`/api/user/offer/${targetId}`);
            const json = await res.json();
            if (json.success && json.data) {
                const newOffer = mapApiOfferToDetail(json.data);
                setOffer(newOffer);
                // Update the browser URL without causing a navigation / full reload
                window.history.pushState(null, "", `/offer/${targetId}`);
            }
        } catch (e) {
            console.error("Failed to navigate to offer:", e);
        } finally {
            setIsNavigating(false);
        }
    }, [isNavigating]);

    const handleNext = () => {
        if (totalPosters > 1 && posterIndex < totalPosters - 1) {
            setPosterIndex((prev) => prev + 1);
        } else if (nextOfferId) {
            navigateToOffer(nextOfferId);
        }
    };

    const handlePrev = () => {
        if (totalPosters > 1 && posterIndex > 0) {
            setPosterIndex((prev) => prev - 1);
        } else if (prevOfferId) {
            navigateToOffer(prevOfferId);
        }
    };

    const scrollSimilar = (direction: "left" | "right") => {
        if (!similarCarouselRef.current) return;
        const container = similarCarouselRef.current;
        const scrollAmount = container.clientWidth * 0.8;
        container.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth"
        });
    };

    const prevLabel = totalPosters === 1 || posterIndex === 0 ? "Prev Offer" : "Prev Poster";
    const nextLabel = totalPosters === 1 || posterIndex === totalPosters - 1 ? "Next Offer" : "Next Poster";

    const handleActiveItemChange = useCallback((item: any) => {
        if (item && typeof item.posterIndex === "number") {
            setPosterIndex((prev) => (prev !== item.posterIndex ? item.posterIndex : prev));
        }
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <div className="hidden" aria-hidden="true">
                {offer.posters?.map((p, i) => (
                    <img key={`preload-poster-${i}`} src={p.posterSrc} alt="" />
                ))}
                {offer.images?.map((img, i) => (
                    <img key={`preload-img-${i}`} src={typeof img === 'string' ? img : (img as any).src} alt="" />
                ))}
            </div>

            {/* Hero Spacer */}
            <div className="h-40 lg:h-36" />

            {/* Breadcrumbs Row */}
            <div className="container mx-auto px-4 py-4">
                <Breadcrumbs items={breadcrumbItems} />
            </div>

            {/* Main Content Layout with Sticky Right Sidebar */}
            <div className="container mx-auto px-4 pb-16 flex flex-col lg:flex-row gap-8 items-start">
                {/* Left side: Poster navigator and similar offers */}
                <div className="flex-1 w-full lg:max-w-4xl mx-auto">
                {/* Main Poster Section */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-2 max-w-4xl mx-auto mb-16">
                    {/* Left Desktop Navigation */}
                    <button
                        onClick={handlePrev}
                        disabled={isNavigating || (!prevOfferId && (totalPosters === 1 || posterIndex === 0))}
                        className="hidden md:flex w-44 items-center justify-center gap-2 px-4 py-3 rounded-xl border border-orange-500/30 dark:border-orange-500/20 hover:border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-500/5 transition-all text-xs font-bold uppercase tracking-wider shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isNavigating ? (
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        ) : (
                            <ChevronLeft className="w-4 h-4 shrink-0" />
                        )}
                        <span className="truncate">{prevLabel}</span>
                    </button>

                    {/* Poster Container */}
                    <div className="w-full max-w-lg flex flex-col gap-2 shrink-0">
                        <div className="w-full relative aspect-[3/4] overflow-hidden rounded-2xl border border-primary/20">
                            {/* Loading overlay when navigating */}
                            {isNavigating && (
                                <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest animate-pulse">Loading Offer...</span>
                                    </div>
                                </div>
                            )}
                            <MarkedPoster
                                src={offer.posters?.[posterIndex]?.posterSrc || (offer.images[posterIndex] as string)}
                                alt={offer.shopName}
                                markedItems={offer.posters?.[posterIndex]?.markedItems || []}
                                className="w-full h-full"
                                showNames={true}
                                interactive={true}
                                onItemClick={(item: MarkedItem) => {
                                    if (item.name && item.name !== "Processing...") {
                                        setSelectedItemId(item.id);
                                        setIsProductModalOpen(true);
                                    }
                                }}
                                showTopGradient={true}
                                showBottomGradient={true}
                            >
                                <div className="absolute top-4 left-4 z-20">
                                    <span className="badge-futuristic">
                                        <Tag className="w-3 h-3 mr-1" />
                                        {offer.discount}
                                    </span>
                                </div>

                                {/* Dots Indicator */}
                                {totalPosters > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                                        {Array.from({ length: totalPosters }).map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPosterIndex(index);
                                                }}
                                                className={`w-2 h-2 rounded-full transition-all ${index === posterIndex ? "bg-primary" : "bg-white/50"}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </MarkedPoster>
                        </div>
                        {/* Poster Info under the poster */}
                        <div className="flex flex-col gap-1.5 px-1 py-1">
                            <div className="flex flex-row items-center justify-between gap-2">
                                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-zinc-200 line-clamp-1">
                                    {offer.offerName}
                                </span>
                                <span className="bg-white dark:bg-zinc-900/95 text-slate-700 dark:text-zinc-300 text-[10px] font-bold px-3 py-1.5 rounded-2xl border border-primary/10 shadow-sm tracking-wider shrink-0">
                                    Poster {posterIndex + 1} of {totalPosters}
                                </span>
                            </div>

                            <div className="flex flex-row items-center justify-between gap-2 text-[10px]">
                                <div className="flex flex-col items-start font-medium">
                                    {/* <span>{totalPosters} {totalPosters === 1 ? "Poster" : "Posters"}</span>
                                    <span className="md:hidden">•</span> */}
                                    <span className="md:hidden text-orange-500 font-bold">Published by</span>
                                    <Link
                                        href={`/offers?shopId=${offer.shopId || ""}`}
                                        className="md:hidden font-bold  font-black hover:underline text-xs"
                                    >
                                        {offer.shopName}
                                    </Link>
                                </div>

                                {/* Mobile social icons only (hidden on desktop to avoid duplication) */}
                                {activeSocialLinks.length > 0 && (
                                    <div className="flex md:hidden items-center gap-1">
                                        {activeSocialLinks.map((link) => {
                                            const platformInfo = SOCIAL_PLATFORMS[link.platform.toUpperCase()] || {
                                                label: link.platform,
                                                icon: LinkIcon,
                                                color: "text-slate-500 hover:text-slate-700",
                                                hoverBg: "hover:bg-slate-50 border-slate-200 hover:border-slate-350"
                                            };
                                            const IconComponent = platformInfo.icon;

                                            let finalUrl = link.url;
                                            if (link.platform.toUpperCase() === "WHATSAPP" && !finalUrl.startsWith("http") && /^\d+$/.test(finalUrl.replace(/\D/g, ""))) {
                                                finalUrl = `https://wa.me/${finalUrl.replace(/\D/g, "")}`;
                                            } else if (!finalUrl.startsWith("http")) {
                                                finalUrl = `https://${finalUrl}`;
                                            }

                                            return (
                                                <a
                                                    key={link.platform}
                                                    href={finalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => handleSocialClick(e, link.platform, link.url)}
                                                    className={cn(
                                                        "transition-all active:scale-90 duration-200 p-1 rounded-lg",
                                                        platformInfo.color
                                                    )}
                                                    title={platformInfo.label}
                                                >
                                                    <IconComponent className="w-5 h-5" />
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Desktop Navigation */}
                    <button
                        onClick={handleNext}
                        disabled={isNavigating || (!nextOfferId && (totalPosters === 1 || posterIndex === totalPosters - 1))}
                        className="hidden md:flex w-44 items-center justify-center gap-2 px-4 py-3 rounded-xl border border-orange-500/30 dark:border-orange-500/20 hover:border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-500/5 transition-all text-xs font-bold uppercase tracking-wider shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <span className="truncate">{nextLabel}</span>
                        {isNavigating ? (
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        ) : (
                            <ChevronRight className="w-4 h-4 shrink-0" />
                        )}
                    </button>

                    {/* Mobile Carousel Navigation */}
                    <div className="flex md:hidden w-full justify-between items-center gap-2 mt-1 relative z-10">
                        <button
                            onClick={handlePrev}
                            disabled={isNavigating || (!prevOfferId && (totalPosters === 1 || posterIndex === 0))}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 dark:from-orange-500/10 dark:to-orange-500/5 backdrop-blur-xl border border-white/50 dark:border-white/10 ring-1 ring-inset ring-white/40 dark:ring-white/5 text-orange-600 dark:text-orange-400 transition-all active:scale-95 text-[10px] sm:text-xs font-bold uppercase tracking-wider relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent dark:from-white/5 opacity-50 pointer-events-none" />
                            {isNavigating ? (
                                <Loader2 className="w-4 h-4 animate-spin shrink-0 relative z-10" />
                            ) : (
                                <ChevronLeft className="w-4 h-4 shrink-0 relative z-10" />
                            )}
                            <span className="truncate relative z-10">{prevLabel}</span>
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={isNavigating || (!nextOfferId && (totalPosters === 1 || posterIndex === totalPosters - 1))}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 dark:from-orange-500/10 dark:to-orange-500/5 backdrop-blur-xl border border-white/50 dark:border-white/10 ring-1 ring-inset ring-white/40 dark:ring-white/5 text-orange-600 dark:text-orange-400 transition-all active:scale-95 text-[10px] sm:text-xs font-bold uppercase tracking-wider relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent dark:from-white/5 opacity-50 pointer-events-none" />
                            <span className="truncate relative z-10">{nextLabel}</span>
                            {isNavigating ? (
                                <Loader2 className="w-4 h-4 animate-spin shrink-0 relative z-10" />
                            ) : (
                                <ChevronRight className="w-4 h-4 shrink-0 relative z-10" />
                            )}
                        </button>
                    </div>
                </div>
                </div>

                {/* Right side: Shop info (sticky on desktop) */}
                <div className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 sticky top-36 self-start text-right items-end">
                    <span className="text-xs font-bold text-orange-500 uppercase tracking-widest leading-none">Published By</span>
                    <div className="flex items-baseline gap-2 mt-1.5 mb-1">
                        <Link
                            href={`/offers?shopId=${offer.shopId || ""}`}
                            className="text-2xl font-black text-slate-800 dark:text-zinc-200 hover:text-orange-500 transition-colors"
                        >
                            {offer.shopName}
                        </Link>
                    </div>

                    {/* Social Media Links under it stacked vertically with labels */}
                    {activeSocialLinks.length > 0 && (
                        <div className="flex flex-col gap-2 mt-4 items-end">
                            <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1.5 block">Connect With Us</span>
                            {activeSocialLinks.map((link) => {
                                const platformInfo = SOCIAL_PLATFORMS[link.platform.toUpperCase()] || {
                                    label: link.platform,
                                    icon: LinkIcon,
                                    color: "text-slate-500 hover:text-slate-700",
                                    hoverBg: "hover:bg-slate-50 border-slate-200 hover:border-slate-350"
                                };
                                const IconComponent = platformInfo.icon;

                                let finalUrl = link.url;
                                if (link.platform.toUpperCase() === "WHATSAPP" && !finalUrl.startsWith("http") && /^\d+$/.test(finalUrl.replace(/\D/g, ""))) {
                                    finalUrl = `https://wa.me/${finalUrl.replace(/\D/g, "")}`;
                                } else if (!finalUrl.startsWith("http")) {
                                    finalUrl = `https://${finalUrl}`;
                                }

                                return (
                                    <a
                                        key={link.platform}
                                        href={finalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => handleSocialClick(e, link.platform, link.url)}
                                        className={cn(
                                            "group flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-100/70 dark:hover:bg-zinc-900/75 hover:shadow-md hover:shadow-orange-500/5 transition-all active:scale-95 duration-300 relative overflow-hidden",
                                            platformInfo.color
                                        )}
                                    >
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                                        <span className="text-base font-bold transition-colors">{platformInfo.label}</span>
                                        <IconComponent className="w-6 h-6 transition-transform group-hover:scale-110 duration-300" />
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Similar Offers Carousel (Outside grid, spans full page width) */}
            <div className="container mx-auto px-4 pb-16">
                <div className="mt-10">
                    <div className="flex items-center justify-between mb-6">
                        <Subheading className="text-2xl font-bold">{t("catalog.similarOffers")}</Subheading>
                        <div className="flex items-center gap-2">
                            <PremiumButton
                                variant="outline"
                                size="icon"
                                onClick={() => scrollSimilar("left")}
                                className="rounded-full border-border/50 h-10 w-10"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </PremiumButton>
                            <PremiumButton
                                variant="outline"
                                size="icon"
                                onClick={() => scrollSimilar("right")}
                                className="rounded-full border-border/50 h-10 w-10"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </PremiumButton>
                        </div>
                    </div>

                    <div
                        ref={similarCarouselRef}
                        className="flex gap-1 overflow-x-auto pb-4 scrollbar-hide px-0.5 snap-x snap-mandatory scroll-smooth"
                    >
                        {similarOffers.map((o) => (
                            <div
                                key={o.id}
                                className="w-[calc((100%-0.5rem)/2)] sm:w-[calc((100%-0.75rem)/2)] md:w-[calc((100%-4rem)/5)] lg:w-[calc((100%-4rem)/5)] flex-shrink-0 snap-start"
                            >
                                <OfferCard {...o} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <ConsumerProductModal
                open={isProductModalOpen}
                onOpenChange={setIsProductModalOpen}
                markedItems={allMarkedItems}
                initialItemId={selectedItemId}
                offerCategory={offer.category}
                shopName={offer.shopName}
                shopLogo={offer.shopLogo}
            />

            {previewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                        onClick={() => setPreviewModalOpen(false)}
                    />
                    <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-w-xl w-full max-h-[90vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex-1 overflow-y-auto p-1 bg-slate-50/20 dark:bg-zinc-950/10 flex items-center justify-center">
                            {previewPlatform.toLowerCase() === 'instagram' ? (
                                <div key={previewUrl} className="w-full overflow-y-auto flex justify-center max-h-[90vh] py-2 bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-slate-150 dark:border-zinc-800">
                                    <blockquote
                                        className="instagram-media w-full"
                                        data-instgrm-captioned
                                        data-instgrm-permalink={previewUrl}
                                        data-instgrm-version="14"
                                        style={{ minWidth: '320px', width: '100%', margin: '0 auto' }}
                                    >
                                        <div className="p-8 text-center text-xs font-bold text-slate-400 dark:text-zinc-500 animate-pulse uppercase tracking-widest">
                                            Loading Instagram Post...
                                        </div>
                                    </blockquote>
                                </div>
                            ) : (
                                <div className={cn("relative w-full overflow-hidden rounded-xl shadow-sm border border-slate-150 dark:border-zinc-800 bg-black", previewAspectClass)}>
                                    <iframe
                                        src={previewEmbedUrl}
                                        className="absolute inset-0 w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                        title={`${previewPlatform} Embed`}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end px-2 py-1.5 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-950/20">
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors text-[11px] font-bold"
                                title={`Open in ${previewPlatform}`}
                            >
                                {(() => {
                                    const pInfo = SOCIAL_PLATFORMS[previewPlatform.toUpperCase()];
                                    const PIcon = pInfo?.icon;
                                    return PIcon ? <PIcon className="w-3.5 h-3.5" /> : null;
                                })()}
                                <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </a>
                            <button
                                onClick={() => setPreviewModalOpen(false)}
                                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors px-3 py-1.5"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
