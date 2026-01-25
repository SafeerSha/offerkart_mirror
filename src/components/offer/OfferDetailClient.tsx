"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image, { StaticImageData } from "next/image";
import { ArrowLeft, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import OfferCard from "@/components/offer/OfferCard";

interface OfferDetail {
    id: number;
    shopName: string;
    offerName: string;
    images: (string | StaticImageData)[];
    category: string;
    location: string;
    validUntil: string;
    discount: string;
    rating: number;
    reviews: number;
    price: string;
    originalPrice: string;
}

interface SimilarOffer {
    id: number;
    shopName: string;
    offerName: string;
    image: string | StaticImageData;
    category: string;
    location: string;
    validUntil: string;
    discount?: string;
}

interface OfferDetailClientProps {
    offer: OfferDetail;
    similarOffers: SimilarOffer[];
}

export default function OfferDetailClient({ offer, similarOffers }: OfferDetailClientProps) {
    const router = useRouter();
    const [posterIndex, setPosterIndex] = useState(0);
    const [similarCarouselIndex, setSimilarCarouselIndex] = useState(0);

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
            <Header />

            {/* Hero Spacer */}
            <div className="h-32 lg:h-24" />

            {/* Back Button */}
            <div className="container mx-auto px-4 py-4">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Offers
                </Button>
            </div>

            <div className="container mx-auto px-4 pb-16">
                {/* Main Poster Carousel */}
                <div className="max-w-lg mx-auto mb-16">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-primary/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
                        <Image
                            src={offer.images[posterIndex]}
                            alt={offer.shopName}
                            fill
                            className="object-cover transition-opacity duration-300"
                        />
                        <div className="absolute top-4 left-4">
                            <Badge className="badge-futuristic">
                                <Sparkles className="w-3 h-3 mr-1" />
                                {offer.discount}
                            </Badge>
                        </div>

                        {/* Carousel Navigation */}
                        {offer.images.length > 1 && (
                            <>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={prevPoster}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 backdrop-blur-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={nextPoster}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 backdrop-blur-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>

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
                        <h3 className="text-2xl font-bold">Similar Offers</h3>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={prevSimilarSlide}
                                className="rounded-full border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={nextSimilarSlide}
                                className="rounded-full border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-hidden">
                        <div
                            className="flex transition-transform duration-300 ease-in-out"
                            style={{ transform: `translateX(-${similarCarouselIndex * 100}%)` }}
                        >
                            {Array.from({ length: totalSlides }, (_, slideIndex) => (
                                <div key={slideIndex} className="flex-shrink-0 w-full flex gap-6">
                                    {similarOffers.slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide).map((offer) => (
                                        <div key={offer.id} className="flex-1">
                                            <OfferCard {...offer} />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
