"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { StaticImageData } from "next/image";
import { Tag, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Subheading } from "@/components/shared/Typography";
import { MarkedPoster } from "@/components/shared/MarkedPoster";
import { Poster, MarkedItem } from "@/lib/types/offer";

import Breadcrumbs from "@/components/shared/Breadcrumbs";
import OfferCard from "@/components/offer/OfferCard";
import { ConsumerProductModal } from "@/components/offer/ConsumerProductModal";
import { useTranslation } from "@/hooks/useTranslation";
import { backend } from "@/lib/api/backendClient";
import { ENDPOINTS } from "@/lib/api/endpoints";

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
        const rawPosterSrc = p.imageUrl || p.posterSrc;
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
    };
}

export default function OfferDetailClient({ offer: initialOffer, similarOffers, prevOfferId: initialPrevId, nextOfferId: initialNextId }: OfferDetailClientProps) {
    const { t } = useTranslation("common");

    // --- Current offer state (can be changed client-side without page reload) ---
    const [offer, setOffer] = useState(initialOffer);
    const [prevOfferId, setPrevOfferId] = useState(initialPrevId);
    const [nextOfferId, setNextOfferId] = useState(initialNextId);
    const [allOfferIds, setAllOfferIds] = useState<(number | string)[]>([]);
    const [isNavigating, setIsNavigating] = useState(false);

    // --- Poster / carousel state ---
    const [posterIndex, setPosterIndex] = useState(0);
    const similarCarouselRef = useRef<HTMLDivElement>(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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
            .catch(() => {/* silently ignore */});
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
            const res = await backend.get<any>(ENDPOINTS.USER_OFFER.DETAILS(targetId));
            const json = res;
            if (json.success && json.data) {
                const raw = json.data?.data ?? json.data;
                const newOffer = mapApiOfferToDetail(raw);
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

            {/* Hero Spacer */}
            <div className="h-40 lg:h-36" />

            {/* Breadcrumbs */}
            <div className="container mx-auto px-4 py-4">
                <Breadcrumbs items={breadcrumbItems} />
            </div>

            <div className="container mx-auto px-4 pb-16">
                {/* Main Poster Section */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-4xl mx-auto mb-16">
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
                        <div className="flex flex-row items-center justify-between gap-2 px-1">
                            <div className="flex flex-col items-start text-left">
                                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-zinc-200 line-clamp-1">
                                    {offer.offerName}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
                                    {totalPosters} {totalPosters === 1 ? "Poster" : "Posters"}
                                </span>
                            </div>
                            <span className="bg-white dark:bg-zinc-900/95 text-slate-700 dark:text-zinc-300 text-[10px] font-bold px-3 py-1.5 rounded-2xl border border-primary/10 shadow-sm tracking-wider shrink-0">
                                Poster {posterIndex + 1} of {totalPosters}
                            </span>
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
                    <div className="flex md:hidden w-full justify-between items-center gap-3 mt-6 relative z-10">
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

                {/* Similar Offers Carousel */}
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
        </div>
    );
}
