"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Tag, Check, ShoppingBag, ArrowLeft, Heart, Share2, Calendar, MapPin, AlertTriangle, Store, Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import ProductCard from "./ProductCard";
import { useTranslation } from "@/hooks/useTranslation";
import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import { useLocationContext } from "@/context/LocationContext";
import { useSession } from "next-auth/react";
import { config } from "@/lib/config";
import { useSimilarProducts } from "@/hooks/useApi";

interface Product {
    id: any;
    name: string;
    shopName: string;
    price: number;
    originalPrice?: number;
    savingPercentage?: number;
    image: any;
    category: string;
    rating?: number;
    reviews?: number;
    discount?: string;
    description?: string;
    specifications?: { label: string; value: string }[];
    images?: any[];
    validFrom?: string;
    validTo?: string;
    offerId?: number | string | null;
    daysLeft?: number | null;
    shopLogo?: string | null;
    availableBranches?: {
        id: number | string;
        branch_name: string;
        address?: string;
        phone?: string;
        latitude?: number;
        longitude?: number;
    }[];
}

interface ProductDetailClientProps {
    product: Product;
    similarProducts: Product[];
}

interface LocationItem {
    name: string;
    latitude?: number;
    longitude?: number;
}

function getFallbackLocations(shopName?: string): LocationItem[] {
    if (!shopName) return [{ name: "Main Outlet" }];
    const name = shopName.toLowerCase();

    const getCoords = (locName: string): { latitude?: number; longitude?: number } => {
        const ln = locName.toLowerCase();
        if (ln.includes("bandra west")) return { latitude: 19.0596, longitude: 72.8295 };
        if (ln.includes("colaba")) return { latitude: 18.9067, longitude: 72.8147 };
        if (ln.includes("lokhandwala") || ln.includes("andheri west")) return { latitude: 19.1363, longitude: 72.8276 };
        if (ln.includes("andheri east")) return { latitude: 19.1179, longitude: 72.8631 };
        if (ln.includes("palladium") || ln.includes("lower parel")) return { latitude: 18.9950, longitude: 72.8250 };
        if (ln.includes("juhu")) return { latitude: 19.1012, longitude: 72.8258 };
        if (ln.includes("oberoi") || ln.includes("goregaon")) return { latitude: 19.1634, longitude: 72.8412 };
        if (ln.includes("warden road")) return { latitude: 18.9667, longitude: 72.8056 };
        if (ln.includes("prabhadevi")) return { latitude: 19.0166, longitude: 72.8300 };
        if (ln.includes("powai")) return { latitude: 19.1176, longitude: 72.9060 };
        if (ln.includes("marketcity") || ln.includes("kurla")) return { latitude: 19.0728, longitude: 72.8826 };
        if (ln.includes("fort")) return { latitude: 18.9345, longitude: 72.8371 };
        if (ln.includes("thane")) return { latitude: 19.2183, longitude: 72.9781 };
        if (ln.includes("malad west")) return { latitude: 19.1860, longitude: 72.8485 };
        return {};
    };

    let names: string[] = [];
    if (name.includes("coffee") || name.includes("artisan")) {
        names = ["Bandra West", "Colaba", "Andheri Lokhandwala"];
    } else if (name.includes("zara")) {
        names = ["Phoenix Palladium (Lower Parel)", "Juhu", "Oberoi Mall (Goregaon)"];
    } else if (name.includes("basket") || name.includes("nature")) {
        names = ["Warden Road", "Prabhadevi", "Bandra West", "Powai"];
    } else if (name.includes("h&m") || name.includes("h & m")) {
        names = ["Phoenix Marketcity (Kurla)", "Oberoi Mall (Goregaon)", "Fort"];
    } else if (name.includes("starbucks")) {
        names = ["Horniman Circle (Fort)", "Carter Road (Bandra)", "Juhu Beach", "Hiranandani (Powai)"];
    } else if (name.includes("roma") || name.includes("pizza")) {
        names = ["Colaba", "Bandra West", "Andheri West"];
    } else if (name.includes("kart") || name.includes("offer")) {
        names = ["Andheri East", "Malad West", "Thane"];
    } else {
        names = [`${shopName} - Bandra West`, `${shopName} - Colaba`, `${shopName} - Andheri East`];
    }

    return names.map(n => ({
        name: n,
        ...getCoords(n)
    }));
}

export default function ProductDetailClient({ product, similarProducts: initialSimilarProducts }: ProductDetailClientProps) {
    const router = useRouter();
    const { t } = useTranslation("common");
    const { location } = useLocationContext();
    const { latitude, longitude } = location;
    const { data: fetchedSimilarProducts } = useSimilarProducts(product.id, latitude, longitude);
    const similarProducts: Product[] = fetchedSimilarProducts && fetchedSimilarProducts.length > 0 ? fetchedSimilarProducts : initialSimilarProducts;
    const similarProductsRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();

    // Track product click analytics
    useEffect(() => {
        const trackProductClick = async () => {
            if (!product.id) return;
            try {
                const bodyPayload: { offerProductId: number; offerId?: number; userId?: number } = {
                    offerProductId: Number(product.id),
                };
                if (product.offerId) {
                    bodyPayload.offerId = Number(product.offerId);
                }
                if (session?.user?.id) {
                    bodyPayload.userId = Number(session.user.id);
                }

                await fetch(`${config.api.upstreamBaseUrl}/user/analytics/offerproductclick`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(bodyPayload),
                });
            } catch (error) {
                console.error("Error tracking product click analytics:", error);
            }
        };

        trackProductClick();
    }, [product.id, product.offerId, session]);

    const scrollSimilarProducts = (direction: "left" | "right") => {
        if (!similarProductsRef.current) return;
        const container = similarProductsRef.current;
        const scrollAmount = container.clientWidth * 0.8;
        container.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth"
        });
    };
    const { resolveHierarchyById } = useCategoryHierarchy();
    const [selectedImage, setSelectedImage] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isImageZoomed, setIsImageZoomed] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [offerId, setOfferId] = useState<string | number | null>(product.offerId || null);

    useEffect(() => {
        if (!offerId && typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const oid = params.get("offerId");
            if (oid) {
                setOfferId(oid);
            }
        }
    }, [offerId]);

    const resolvedCategory = resolveHierarchyById(product.category);
    const displayCategoryName = resolvedCategory.sub || resolvedCategory.main || product.category;

    const primaryImage = product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null);
    const productImages = primaryImage ? [primaryImage] : [];

    const shopLogo = product.shopLogo || null;

    const discountPercent = product.originalPrice && product.price && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const savingsAmount = product.originalPrice && product.price && product.originalPrice > product.price
        ? product.originalPrice - product.price
        : 0;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
        } catch (e) {
            return dateStr;
        }
    };
    const validFromFormatted = formatDate(product.validFrom);
    const validToFormatted = formatDate(product.validTo);

    const calculateDaysLeft = (validTo?: string) => {
        if (!validTo) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(validTo);
        targetDate.setHours(0, 0, 0, 0);
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? diffDays : null;
    };

    const calculatedDaysLeft = product.daysLeft !== undefined && product.daysLeft !== null
        ? product.daysLeft
        : calculateDaysLeft(product.validTo);

    const locations: LocationItem[] = product.availableBranches && product.availableBranches.length > 0
        ? product.availableBranches.map(b => ({
            name: b.branch_name,
            latitude: b.latitude,
            longitude: b.longitude
        }))
        : getFallbackLocations(product.shopName);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header spacer */}
            <div className="h-36 lg:h-28" />

            <div className="container mx-auto px-4 py-4 max-w-7xl">
                <Breadcrumbs
                    items={[
                        { label: t("nav.products"), href: "/products" },
                        { label: product.name }
                    ]}
                />

                <div className="mt-3 mb-3 flex items-center justify-between">
                    <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-orange-600 transition-colors bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                        <ArrowLeft className="w-4 h-4" />
                        {t("catalog.backToProducts")}
                    </Link>
                    <div className="flex items-center gap-2">
                        {/* <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`p-3 rounded-full border transition-all ${isFavorite
                                ? "bg-rose-50 text-rose-500 border-rose-100"
                                : "bg-white text-gray-400 border-gray-100 hover:text-rose-500"
                                } shadow-sm`}
                        >
                            <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                        </button> */}
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert(t("catalog.linkCopied"));
                            }}
                            className="p-3 rounded-full bg-white text-gray-400 border border-gray-100 hover:text-orange-500 transition-all shadow-sm"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Product Detail Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
                    {/* Left: Images */}
                    <div className="lg:col-span-5 space-y-4">
                        <PremiumCard
                            onClick={() => {
                                if (productImages.length > 0) {
                                    setIsImageZoomed(true);
                                }
                            }}
                            className="overflow-hidden border-none shadow-xl shadow-gray-100/50 bg-white rounded-[2rem] aspect-square relative cursor-zoom-in group/img"
                        >
                            {productImages.length > 0 ? (
                                <>
                                    <Image
                                        src={productImages[selectedImage]}
                                        alt={product.name}
                                        fill
                                        unoptimized
                                        className="object-contain p-6 bg-white group-hover/img:scale-105 transition-transform duration-500"
                                    />
                                    {/* Zoom Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100 duration-300">
                                        <div className="bg-white/95 dark:bg-zinc-900/95 p-2.5 rounded-full shadow-lg border border-slate-200/40 dark:border-zinc-800/40 flex items-center gap-1.5 transform translate-y-2 group-hover/img:translate-y-0 transition-all duration-300">
                                            <Maximize2 className="w-4 h-4 text-orange-500" />
                                            <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider pr-1">Click to Zoom</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                                            <ShoppingBag className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-400">{t("catalog.noImage")}</span>
                                    </div>
                                </div>
                            )}
                            {product.discount && (
                                <div className="absolute top-6 left-6">
                                    <span className="px-3.5 py-1.5 bg-orange-500 text-white font-black text-xs uppercase tracking-wide rounded-full shadow-lg shadow-orange-500/30 flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                                        <Tag className="w-3.5 h-3.5" />
                                        {product.discount}
                                    </span>
                                </div>
                            )}
                        </PremiumCard>

                        {/* Thumbnail Carousel */}
                        {productImages.length > 1 && (
                            <div className="flex items-center gap-3 overflow-x-auto py-2">
                                {productImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${selectedImage === idx
                                            ? "border-orange-500 bg-orange-50/30 scale-105 shadow-md shadow-orange-500/10"
                                            : "border-transparent bg-white hover:border-gray-200"
                                            }`}
                                    >
                                        <Image src={img} alt={`${product.name} preview ${idx + 1}`} fill unoptimized className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Info */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white p-5 md:p-10 rounded-[2.5rem] border border-gray-100/80 shadow-xl shadow-gray-200/20 space-y-2">

                            {/* Shop Header (Outlet Info) - D4D Style */}
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                <Link
                                    href={`/products?shop=${encodeURIComponent(product.shopName)}`}
                                    className="flex items-center gap-3 group"
                                >
                                    <div className="w-12 h-12 rounded-full border border-gray-200 bg-white overflow-hidden flex items-center justify-center shadow-sm group-hover:border-orange-500/30 transition-all flex-shrink-0">
                                        {shopLogo ? (
                                            <img src={shopLogo} alt={product.shopName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <Store className="w-5 h-5 text-orange-500" />
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 tracking-widest block">Shop name</span>
                                        <span className="text-base font-black text-gray-800 group-hover:text-orange-600 transition-colors flex items-center gap-1">
                                            {product.shopName}
                                        </span>
                                    </div>
                                </Link>
                            </div>

                            {/* Category & Title */}
                            <div className="space-y-2.5">
                                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-md border border-orange-100/50">
                                    {displayCategoryName}
                                </span>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight pt-1 break-words">
                                    {product.name}
                                </h1>
                            </div>

                            {/* Pricing & Savings Breakdown */}
                            <div className="space-y-3 p-5 bg-gray-50 border border-gray-100 rounded-3xl">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t("catalog.premiumOfferPrice")}</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl md:text-4xl font-black text-orange-600 tracking-tight">
                                                ₹{product.price.toLocaleString()}
                                            </span>
                                            {!!product.originalPrice && product.originalPrice > product.price && (
                                                <span className="text-sm text-gray-400 line-through font-bold">
                                                    ₹{product.originalPrice.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Savings indicator */}
                                {!!product.originalPrice && product.originalPrice > product.price && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60">
                                        <span className="px-2.5 py-1 bg-green-500 text-white font-black text-[9px] uppercase tracking-wider rounded-md shadow-sm">
                                            SAVE {discountPercent}%
                                        </span>
                                        <span className="text-xs font-bold text-green-700">
                                            You save ₹{savingsAmount.toLocaleString()} on this offer
                                        </span>
                                    </div>
                                )}
                            </div>


                            {/* Offer Validity / Dates */}
                            <div className="flex items-center gap-3 p-4 bg-slate-50/60 border border-slate-100/60 rounded-2xl">
                                <Calendar className="w-5 h-5 text-orange-500 shrink-0" />
                                <div className="text-xs">
                                    <span className="text-gray-400 font-bold uppercase tracking-wider block">Validity Period</span>
                                    <span className="font-black text-gray-800">
                                        {calculatedDaysLeft !== null ? (
                                            calculatedDaysLeft === 0 ? "Offer ends today" : `Offer ends in ${calculatedDaysLeft} ${calculatedDaysLeft === 1 ? 'day' : 'days'}`
                                        ) : (
                                            "Valid while stock lasts"
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                                    {t("catalog.descQualityAssurance")}
                                </h3>
                                <p className="text-gray-600 font-medium leading-relaxed text-sm">
                                    {product.description || t("catalog.fallbackProductDesc").replace("{productName}", product.name).replace("{shopName}", product.shopName)}
                                </p>
                            </div>

                            {/* Available branches with Map Links */}
                            {locations.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2 text-gray-800">
                                        <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                                            {t("catalog.availableAt") || "Available Store Locations"}
                                        </h4>
                                    </div>

                                    <div className="flex flex-row flex-wrap gap-2">
                                        {locations.map((loc, idx) => {
                                            const query = loc.latitude && loc.longitude
                                                ? `${loc.latitude},${loc.longitude}`
                                                : encodeURIComponent(`${product.shopName} ${loc.name}`);
                                            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
                                            return (
                                                <a
                                                    key={idx}
                                                    href={mapUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-gray-50 border border-gray-100 hover:bg-orange-50 hover:border-orange-500/30 text-gray-700 hover:text-orange-500 transition-all shrink-0 cursor-pointer decoration-none"
                                                >
                                                    <MapPin className="w-3 h-3 text-orange-500/80 shrink-0" />
                                                    <span className="text-xs font-semibold leading-none">
                                                        {loc.name}
                                                    </span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Checkout / Claim Offer CTA buttons */}
                            <div className="pt-4 flex gap-4 w-full">
                                {offerId && (
                                    <PremiumButton
                                        className="flex-1 h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-500/20 text-base font-bold"
                                        leftIcon={Tag}
                                        isLoading={isNavigating}
                                        onClick={() => {
                                            setIsNavigating(true);
                                            router.push(`/offer/${offerId}`);
                                        }}
                                    >
                                        Go to Offer
                                    </PremiumButton>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Similar items section */}
                {similarProducts.length > 0 && (
                    <div className="mt-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-1.5 bg-orange-500 rounded-full" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t("catalog.moreInCategory").replace("{category}", displayCategoryName)}</h2>
                                    <p className="text-sm text-gray-500 font-medium">{t("catalog.explorePremiumOptions")}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <PremiumButton
                                    variant="outline"
                                    size="icon"
                                    onClick={() => scrollSimilarProducts("left")}
                                    className="rounded-full border-border/50 h-10 w-10"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </PremiumButton>
                                <PremiumButton
                                    variant="outline"
                                    size="icon"
                                    onClick={() => scrollSimilarProducts("right")}
                                    className="rounded-full border-border/50 h-10 w-10"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </PremiumButton>
                            </div>
                        </div>

                        <div
                            ref={similarProductsRef}
                            className="flex gap-1 overflow-x-auto pb-4 scrollbar-hide px-0.5 snap-x snap-mandatory scroll-smooth"
                        >
                            {similarProducts.map((p) => (
                                <div
                                    key={p.id}
                                    className="w-[calc((100%-0.5rem)/2)] sm:w-[calc((100%-0.75rem)/2)] md:w-[calc((100%-1rem)/5)] lg:w-[calc((100%-1rem)/5)] flex-shrink-0 snap-start"
                                >
                                    <ProductCard {...p} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* High Scale Zoom Lightbox Overlay */}
                {isImageZoomed && productImages.length > 0 && typeof window !== "undefined" && createPortal(
                    <div
                        onClick={() => setIsImageZoomed(false)}
                        className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center cursor-zoom-out animate-in fade-in-0 duration-300"
                        style={{ zIndex: 999999 }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsImageZoomed(false);
                            }}
                            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center animate-in scale-in-95 duration-200"
                        >
                            <img
                                src={productImages[selectedImage]}
                                alt={product.name}
                                className="max-w-full max-h-[85vh] object-contain rounded-xl select-none shadow-2xl border border-white/5"
                            />
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
}
