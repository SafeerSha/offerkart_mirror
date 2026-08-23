"use client";

import React, { useMemo } from "react";
import ProductCard from "@/components/products/ProductCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Heading, Text } from "@/components/shared/Typography";
import { Sparkles, ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocationContext } from "@/context/LocationContext";
import { useUserProductsFiltered } from "@/hooks/useApi";

interface Product {
    id: number;
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
    distanceKm?: number | null;
}

interface FeaturedProductsProps {
    products: Product[];
}

const FeaturedProducts = ({ products }: FeaturedProductsProps) => {
    const router = useRouter();
    const { location: userLocation, hydrated } = useLocationContext();

    const queryFilters = useMemo(() => {
        const filters: any = {};
        if (userLocation.latitude !== null && userLocation.longitude !== null) {
            filters.latitude = userLocation.latitude;
            filters.longitude = userLocation.longitude;
        }
        return filters;
    }, [userLocation]);

    const hasLocation = userLocation.latitude !== null && userLocation.longitude !== null;

    const { data: dynamicProductsRes, isLoading } = useUserProductsFiltered(queryFilters, {
        enabled: hydrated && hasLocation
    });

    const displayProducts = useMemo(() => {
        if (hydrated && hasLocation && Array.isArray(dynamicProductsRes)) {
            return dynamicProductsRes;
        }
        return products;
    }, [hydrated, hasLocation, dynamicProductsRes, products]);

    const sortedProducts = useMemo(() => {
        if (!displayProducts) return [];
        let items = displayProducts.map(p => {
            return { ...p, distanceKm: p.distanceKm ?? null };
        });

        if (userLocation.latitude !== null && userLocation.longitude !== null) {
            items.sort((a, b) => {
                const distA = a.distanceKm ?? Infinity;
                const distB = b.distanceKm ?? Infinity;
                return distA - distB;
            });
        }
        return items;
    }, [displayProducts, userLocation]);

    if (isLoading && hasLocation) {
        return (
            <section className="py-8 md:py-12 relative bg-slate-50/50">
                <div className="container mx-auto px-4">
                    <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-8 md:py-12 relative bg-slate-50/50">
            {/* Background elements */}
            <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-6">
                    <div>
                        <Heading className="text-3xl md:text-5xl font-extrabold tracking-tight">
                            Latest <span className="text-gradient">Products</span>
                        </Heading>
                        <Text className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl">
                            Discover premium items available at your favorite local businesses.
                        </Text>
                    </div>

                    <PremiumButton
                        variant="outline"
                        data-loader-text="Loading products catalog..."
                        onClick={() => router.push("/products")}
                        className="rounded-2xl px-6 h-12 bg-white hover:bg-slate-50 border-slate-200 hover:border-orange-500 text-slate-800 hover:text-orange-600 transition-all font-semibold flex items-center shrink-0 self-start md:self-end"
                        rightIcon={ArrowRight}
                    >
                        Explore All Products
                    </PremiumButton>
                </div>

                {sortedProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 animate-in fade-in duration-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-500">Try to change your location preferences</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 md:gap-2">
                        {sortedProducts.slice(0, 12).map((product, index) => (
                            <div
                                key={product.id}
                                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <ProductCard {...product} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default FeaturedProducts;
