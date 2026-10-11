"use client";

import React, { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Store, Mail, Phone, Globe, ChevronRight, Gift, Tag, ExternalLink } from "lucide-react";
import { getUserShopDetails, getUserOfferProducts } from "@/lib/api/userOffersService";
import { getPaginatedOffers } from "@/lib/api/offers";
import { mapUserProductToProduct } from "@/lib/api/products";
import FilterableOffers from "@/components/home/FilterableOffers";
import FeaturedProducts from "@/components/home/FeaturedProducts";

function getGoogleMapsUrl(location: {
    latitude?: number | string | null;
    longitude?: number | string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    branch_name?: string | null;
}) {
    const lat = location.latitude ? Number(location.latitude) : null;
    const lng = location.longitude ? Number(location.longitude) : null;

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    const queryParts = [
        location.branch_name,
        location.address,
        location.city,
        location.state,
        location.pincode,
    ].filter(Boolean);

    if (queryParts.length > 0) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts.join(", "))}`;
    }

    return "https://www.google.com/maps";
}

export default function ShopDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [loading, setLoading] = useState(true);
    const [shop, setShop] = useState<any>(null);
    const [offers, setOffers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                const [shopRes, offersRes, productsRes] = await Promise.all([
                    getUserShopDetails(id),
                    getPaginatedOffers(1, 20, { shopId: id }),
                    getUserOfferProducts({ shopId: id, limit: 20 })
                ]);

                if (isMounted) {
                    if (!shopRes.success || !shopRes.data) {
                        setError(true);
                    } else {
                        setShop(shopRes.data);
                        const offersList = offersRes.success && offersRes.data
                            ? (Array.isArray(offersRes.data) ? offersRes.data : ((offersRes.data as any).data || []))
                            : [];
                        setOffers(offersList);

                        const rawProducts = productsRes.success && (productsRes as any).data
                            ? (Array.isArray((productsRes as any).data)
                                ? (productsRes as any).data
                                : ((productsRes as any).data?.data || []))
                            : [];
                        const mappedProducts = rawProducts.map((p: any) => mapUserProductToProduct(p) || p);
                        setProducts(mappedProducts);
                    }
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [id]);

    if (error) {
        notFound();
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-44 sm:pt-40 lg:pt-28">
                {/* Hero skeleton */}
                <div className="relative overflow-hidden bg-white">
                    <div className="container mx-auto px-4 py-10">
                        <div className="flex items-start gap-6">
                            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-slate-200 animate-pulse flex-shrink-0" />
                            <div className="flex-1 space-y-4 pt-2">
                                <div className="h-9 w-56 bg-slate-200 rounded-lg animate-pulse" />
                                <div className="h-5 w-80 bg-slate-200 rounded animate-pulse" />
                                <div className="flex gap-3">
                                    <div className="h-10 w-52 bg-slate-200 rounded-full animate-pulse" />
                                    <div className="h-10 w-40 bg-slate-200 rounded-full animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Section skeletons */}
                <div className="container mx-auto px-4 py-10 space-y-10">
                    <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!shop) {
        notFound();
    }

    const branches = shop.branches || [];
    const shopName = shop.shop_name || "Shop";

    return (
        <div className="min-h-screen bg-slate-50 pb-20">

            {/* ─── Hero / Banner ─── */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-50/70 via-orange-50/25 to-amber-50/35 border-b border-orange-100/50 shadow-xs pt-44 sm:pt-40 lg:pt-28 pb-6 lg:pb-8 min-h-0 lg:min-h-[300px] flex items-center">

                {/* Storefront banner — seamless 4-edge organic blend (left, right, top, bottom) */}
                <div
                    className="hidden md:block absolute inset-y-0 right-0 w-[58%] lg:w-[65%] xl:w-[70%] h-full pointer-events-none select-none overflow-hidden"
                    style={{
                        WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.12) 6%, rgba(0,0,0,0.65) 18%, rgba(0,0,0,1) 32%, rgba(0,0,0,1) 88%, rgba(0,0,0,0.35) 96%, transparent 100%)",
                        maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.12) 6%, rgba(0,0,0,0.65) 18%, rgba(0,0,0,1) 32%, rgba(0,0,0,1) 88%, rgba(0,0,0,0.35) 96%, transparent 100%)",
                    }}
                >
                    <div
                        className="relative w-full h-full"
                        style={{
                            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.25) 3%, rgba(0,0,0,0.85) 8%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 86%, rgba(0,0,0,0.85) 92%, rgba(0,0,0,0.25) 97%, transparent 100%)",
                            maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.25) 3%, rgba(0,0,0,0.85) 8%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 86%, rgba(0,0,0,0.85) 92%, rgba(0,0,0,0.25) 97%, transparent 100%)",
                        }}
                    >
                        <Image
                            src="/storefront banner.png"
                            alt={`${shopName} storefront banner`}
                            fill
                            className="object-cover object-[80%_center]"
                            priority
                        />
                    </div>
                </div>

                <div className="container mx-auto px-4 relative z-10 w-full">
                    <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">

                        {/* Shop Logo */}
                        <div className="w-28 h-28 md:w-36 md:h-36 flex-shrink-0 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-orange-100 shadow-lg overflow-hidden relative">
                            {shop.logo_url && shop.logo_url !== "null" ? (
                                <Image
                                    src={shop.logo_url}
                                    alt={shopName}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Store className="w-14 h-14 text-orange-300" />
                                </div>
                            )}
                        </div>

                        {/* Shop Info */}
                        <div className="flex-grow space-y-3 min-w-0 max-w-xl">
                            <h1 className="text-3xl md:text-4xl font-bold text-orange-500 tracking-tight">
                                {shopName}
                            </h1>

                            {shop.description && (
                                <p className="text-gray-500 text-base md:text-lg max-w-2xl leading-relaxed">
                                    {shop.description}  
                                </p>
                            )}

                            {/* Contact pills */}
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                {shop.email && (
                                    <a
                                        href={`mailto:${shop.email}`}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-[#334155] transition-colors shadow-sm"
                                    >
                                        <Mail className="w-4 h-4" />
                                        {shop.email}
                                    </a>
                                )}
                                {shop.phone && (
                                    <a
                                        href={`tel:${shop.phone}`}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-[#334155] transition-colors shadow-sm"
                                    >
                                        <Phone className="w-4 h-4" />
                                        {shop.phone}
                                    </a>
                                )}
                                {(() => {
                                    const raw = shop.website || shop.website_url || shop.web_site || shop.shop_website || shop.url || shop.websites;
                                    if (!raw) return null;
                                    const urls: string[] = Array.isArray(raw)
                                        ? raw.map((item: any) => typeof item === "string" ? item : (item?.url || item?.website || "")).filter(Boolean)
                                        : typeof raw === "string"
                                        ? raw.split(/[\n,]+/).map((u: string) => u.trim()).filter(Boolean)
                                        : [];

                                    if (urls.length === 0) return null;

                                    return urls.map((url: string, i: number) => {
                                        const href = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
                                        return (
                                            <a
                                                key={i}
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={url}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-[#334155] transition-colors shadow-sm"
                                            >
                                                <Globe className="w-4 h-4 shrink-0" />
                                                <span>Go to Website</span>
                                                <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
                                            </a>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Locations & Branches ─── */}
            {(branches.length > 0 || shop.address) && (
                <section className="container mx-auto px-4 pt-6 md:pt-8">
                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-orange-500" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 m-0">
                            <span className="text-orange-500">Branches</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        {/* Main shop address card */}
                        {(shop.address || branches[0]?.address) && (() => {
                            const primaryLoc = shop.address ? {
                                branch_name: "Main Location",
                                address: shop.address,
                                city: shop.city,
                                state: shop.state,
                                pincode: shop.pincode,
                                latitude: shop.latitude,
                                longitude: shop.longitude,
                            } : branches[0];
                            const mapUrl = getGoogleMapsUrl(primaryLoc);

                            return (
                                <a
                                    href={mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all px-5 py-4 flex items-center justify-between gap-4 group cursor-pointer"
                                >
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                            <Store className="w-6 h-6 text-orange-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-base group-hover:text-orange-600 transition-colors truncate">
                                                {shop.address ? "Main Location" : (branches[0]?.branch_name || "Primary Location")}
                                            </h3>
                                            <p className="text-gray-500 text-sm truncate">{shop.address || branches[0]?.address}</p>
                                            <p className="text-gray-400 text-xs mt-0.5 truncate">
                                                {[shop.city || branches[0]?.city, shop.state || branches[0]?.state, shop.pincode || branches[0]?.pincode].filter(Boolean).join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50/80 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all flex-shrink-0 text-xs font-semibold shadow-xs">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Show in Map</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </div>
                                </a>
                            );
                        })()}

                        {/* Branch cards */}
                        {(shop.address ? branches : branches.slice(1)).map((branch: any) => {
                            const mapUrl = getGoogleMapsUrl(branch);

                            return (
                                <a
                                    key={branch.id}
                                    href={mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all px-5 py-4 flex items-center justify-between gap-4 group cursor-pointer"
                                >
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                            <Store className="w-6 h-6 text-orange-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-base group-hover:text-orange-600 transition-colors truncate">
                                                {branch.branch_name}
                                            </h3>
                                            <p className="text-gray-500 text-sm truncate">{branch.address}</p>
                                            <p className="text-gray-400 text-xs mt-0.5 truncate">
                                                {[branch.city, branch.state, branch.pincode].filter(Boolean).join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50/80 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all flex-shrink-0 text-xs font-semibold shadow-xs">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Show in Map</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ─── Active Offers ─── */}
            {offers.length > 0 && (
                <section className="container mx-auto px-4 pt-8 md:pt-10">
                    <FilterableOffers
                        initialOffers={offers}
                        buttonText="View All Offers"
                        disableLocationFetch={true}
                    />
                </section>
            )}

            {/* ─── Featured Products ─── */}
            {products.length > 0 && (
                <section className="container mx-auto px-4 pt-8 md:pt-10">
                    <div className="-mx-4 md:mx-0">
                        <FeaturedProducts
                            products={products}
                            disableLocationFetch={true}
                        />
                    </div>
                </section>
            )}

            {/* ─── Empty state ─── */}
            {offers.length === 0 && products.length === 0 && (
                <div className="container mx-auto px-4 pt-12 md:pt-16">
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No Active Listings</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            This shop doesn&apos;t have any active offers or products right now.
                            Check back later!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
