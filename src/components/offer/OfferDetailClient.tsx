"use client";

import { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import { Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Subheading, Text } from "@/components/shared/Typography";
import { MarkedPoster } from "@/components/shared/MarkedPoster";
import { Poster, MarkedItem } from "@/lib/types/offer";

import Breadcrumbs from "@/components/shared/Breadcrumbs";
import OfferCard from "@/components/offer/OfferCard";
import { ConsumerProductModal } from "@/components/offer/ConsumerProductModal";

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
}

export default function OfferDetailClient({ offer, similarOffers }: OfferDetailClientProps) {
    const [posterIndex, setPosterIndex] = useState(0);
    const [similarCarouselIndex, setSimilarCarouselIndex] = useState(0);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedProductName, setSelectedProductName] = useState<string | null>(null);

    const [breadcrumbItems, setBreadcrumbItems] = useState([
        { label: "Offers", href: "/offers" },
        { label: offer.offerName }
    ]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const referrer = document.referrer;
            const origin = window.location.origin;

            if (referrer === origin || referrer === origin + "/") {
                // If coming from Home, show simple Home > [Offer] path
                setBreadcrumbItems([{ label: offer.offerName }]);
            } else if (referrer.includes("/offers")) {
                // If coming from Offers list, preserve filters in the breadcrumb link
                const path = referrer.replace(origin, "");
                setBreadcrumbItems([
                    { label: "Offers", href: path },
                    { label: offer.offerName }
                ]);
            }
        }
    }, [offer.offerName]);

    const nextPoster = () => {
        setPosterIndex((prev) => (prev + 1) % offer.images.length);
    };

    const prevPoster = () => {
        setPosterIndex((prev) => (prev - 1 + offer.images.length) % offer.images.length);
    };

    const itemsPerSlide = 3;
    const totalSlides = Math.ceil(similarOffers.length / itemsPerSlide);

    const nextSimilarSlide = () => {
        setSimilarCarouselIndex((prev) => (prev + 1) % totalSlides);
    };

    const prevSimilarSlide = () => {
        setSimilarCarouselIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    return (
        <div className="min-h-screen bg-background">


            {/* Hero Spacer */}
            <div className="h-40 lg:h-36" />

            {/* Breadcrumbs */}
            <div className="container mx-auto px-4 py-4">
                <Breadcrumbs items={breadcrumbItems} />
            </div>

            <div className="container mx-auto px-4 pb-16">
                {/* Main Poster Carousel */}
                <div className="max-w-lg mx-auto mb-16">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-primary/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
                        <MarkedPoster
                            src={offer.posters?.[posterIndex]?.posterSrc || (offer.images[posterIndex] as string)}
                            alt={offer.shopName}
                            markedItems={offer.posters?.[posterIndex]?.markedItems || []}
                            className="w-full h-full"
                            showNames={true}
                            interactive={true}
                            onItemClick={(item: MarkedItem) => {
                                if (item.name && item.name !== "Processing...") {
                                    setSelectedProductName(item.name);
                                    setIsProductModalOpen(true);
                                }
                            }}
                        />
                        <div className="absolute top-4 left-4">
                            <span className="badge-futuristic">
                                <Tag className="w-3 h-3 mr-1" />
                                {offer.discount}
                            </span>
                        </div>

                        {/* Carousel Navigation */}
                        {offer.images.length > 1 && (
                            <>
                                <PremiumButton
                                    variant="secondary"
                                    size="icon"
                                    onClick={prevPoster}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 backdrop-blur-sm h-10 w-10 rounded-full"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </PremiumButton>
                                <PremiumButton
                                    variant="secondary"
                                    size="icon"
                                    onClick={nextPoster}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 backdrop-blur-sm h-10 w-10 rounded-full"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </PremiumButton>

                                {/* Dots Indicator */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {offer.images.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setPosterIndex(index)}
                                            className={`w-2 h-2 rounded-full transition-all ${index === posterIndex ? "bg-primary" : "bg-white/50"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Similar Offers Carousel */}
                <div className="mt-16">
                    <div className="flex items-center justify-between mb-8">
                        <Subheading className="text-2xl font-bold">Similar Offers</Subheading>
                        <div className="flex items-center gap-2">
                            <PremiumButton
                                variant="outline"
                                size="icon"
                                onClick={prevSimilarSlide}
                                className="rounded-full border-border/50 h-10 w-10"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </PremiumButton>
                            <PremiumButton
                                variant="outline"
                                size="icon"
                                onClick={nextSimilarSlide}
                                className="rounded-full border-border/50 h-10 w-10"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </PremiumButton>
                        </div>
                    </div>

                    <div className="overflow-hidden">
                        <div
                            className="flex transition-transform duration-300 ease-in-out"
                            style={{ transform: `translateX(-${similarCarouselIndex * 100}%)` }}
                        >
                            {Array.from({ length: totalSlides }, (_, slideIndex) => (
                                <div key={slideIndex} className="flex-shrink-0 w-full flex gap-6">
                                    {similarOffers.slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide).map((offer, idx) => (
                                        <div key={`${offer.id || 'similar'}-${slideIndex}-${idx}`} className="flex-1">
                                            <OfferCard {...offer} />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <ConsumerProductModal
                open={isProductModalOpen}
                onOpenChange={setIsProductModalOpen}
                productName={selectedProductName}
            />
        </div>
    );
}
