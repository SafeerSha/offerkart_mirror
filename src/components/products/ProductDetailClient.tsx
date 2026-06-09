"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Tag, Check, ShoppingBag, ArrowLeft, Heart, Share2 } from "lucide-react";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import ProductCard from "./ProductCard";
import { useTranslation } from "@/hooks/useTranslation";

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
}

interface ProductDetailClientProps {
    product: Product;
    similarProducts: Product[];
}

export default function ProductDetailClient({ product, similarProducts }: ProductDetailClientProps) {
    const { t } = useTranslation("common");
    const [selectedImage, setSelectedImage] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);

    const productImages = [
        ...(Array.isArray(product.images) ? product.images : []),
        ...(product.image ? [product.image] : [])
    ].filter(Boolean);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header spacer */}
            <div className="h-28" />

            <div className="container mx-auto px-4 py-4 max-w-7xl">
                <Breadcrumbs
                    items={[
                        { label: t("nav.products"), href: "/products" },
                        { label: product.name }
                    ]}
                />

                <div className="mt-6 mb-8 flex items-center justify-between">
                    <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-orange-600 transition-colors bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                        <ArrowLeft className="w-4 h-4" />
                        {t("catalog.backToProducts")}
                    </Link>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`p-3 rounded-full border transition-all ${
                                isFavorite 
                                    ? "bg-rose-50 text-rose-500 border-rose-100" 
                                    : "bg-white text-gray-400 border-gray-100 hover:text-rose-500"
                            } shadow-sm`}
                        >
                            <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                        </button>
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Left: Images */}
                    <div className="lg:col-span-6 space-y-4">
                        <PremiumCard className="overflow-hidden border-none shadow-xl shadow-gray-100/50 bg-white rounded-[2rem] aspect-square relative">
                            {productImages.length > 0 ? (
                                <Image
                                    src={productImages[selectedImage]}
                                    alt={product.name}
                                    fill
                                    unoptimized
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
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
                                        className={`relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                                            selectedImage === idx 
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
                    <div className="lg:col-span-6 space-y-6">
                        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-6">
                            <div className="space-y-2">
                                <span className="text-xs font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-100/50">
                                    {product.category}
                                </span>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight pt-2">
                                    {product.name}
                                </h1>
                                <p className="text-gray-500 font-medium text-sm flex items-center gap-1.5">
                                    {t("catalog.offeredBy")} <span className="text-gray-800 font-bold hover:text-orange-600 transition-colors cursor-pointer">{product.shopName}</span>
                                </p>
                            </div>

                            {/* Ratings & Pricing */}
                            <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-gray-50/50 border border-gray-100 rounded-2xl">
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t("catalog.premiumOfferPrice")}</span>
                                    <div className="flex items-end gap-3">
                                        <span className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                                            ₹{product.price}
                                        </span>
                                        {product.originalPrice && (
                                            <span className="text-base text-red-500 line-through font-bold pb-1">
                                                ₹{product.originalPrice}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating || 4.5) ? "fill-current" : "opacity-30"}`} />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">
                                        {product.rating || 4.5}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                                    {t("catalog.descQualityAssurance")}
                                </h3>
                                <p className="text-gray-600 font-medium leading-relaxed text-sm">
                                    {product.description || t("catalog.fallbackProductDesc").replace("{productName}", product.name).replace("{shopName}", product.shopName)}
                                </p>
                            </div>

                            {/* Specifications */}
                            {product.specifications && product.specifications.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">{t("catalog.keyInformation")}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {product.specifications.map((spec, index) => (
                                            <div key={index} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-orange-50/20 hover:border-orange-100/50 transition-all">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{spec.label}</span>
                                                <span className="text-sm font-black text-gray-800">{spec.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Checkout / Inquire button */}
                            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                <PremiumButton 
                                    className="flex-1 h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-500/20 text-base"
                                    leftIcon={ShoppingBag}
                                    onClick={() => alert(t("catalog.addedToCartAlert"))}
                                >
                                    {t("catalog.claimOffer")}
                                </PremiumButton>
                                <PremiumButton 
                                    variant="outline"
                                    className="h-14 px-6 rounded-2xl border-gray-200 hover:bg-gray-50 text-gray-700"
                                    leftIcon={Check}
                                    onClick={() => alert(t("catalog.checkingAvailabilityAlert").replace("{shopName}", product.shopName))}
                                >
                                    {t("catalog.checkInStock")}
                                </PremiumButton>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Similar items section */}
                {similarProducts.length > 0 && (
                    <div className="mt-20 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-1.5 bg-orange-500 rounded-full" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t("catalog.moreInCategory").replace("{category}", product.category)}</h2>
                                    <p className="text-sm text-gray-500 font-medium">{t("catalog.explorePremiumOptions")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {similarProducts.map((p) => (
                                <ProductCard key={p.id} {...p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
