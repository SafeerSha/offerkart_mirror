"use client";

import React from "react";
import ProductCard from "@/components/products/ProductCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Heading, Text } from "@/components/shared/Typography";
import { Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

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
}

interface FeaturedProductsProps {
    products: Product[];
}

const FeaturedProducts = ({ products }: FeaturedProductsProps) => {
    const router = useRouter();

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <section className="py-16 md:py-24 relative bg-slate-50/50">
            {/* Background elements */}
            <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
            
            <div className="container mx-auto px-4 relative z-10">
                {/* Header section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 text-xs font-bold uppercase tracking-[0.15em] mb-4 border border-orange-500/15 animate-fade-in">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Premium Catalog</span>
                        </div>
                        <Heading className="text-3xl md:text-5xl font-extrabold tracking-tight">
                            Latest <span className="text-gradient">Products</span>
                        </Heading>
                        <Text className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl">
                            Discover premium items available at your favorite local businesses.
                        </Text>
                    </div>

                    <PremiumButton
                        variant="outline"
                        onClick={() => router.push("/products")}
                        className="rounded-2xl px-6 h-12 bg-white hover:bg-slate-50 border-slate-200 hover:border-orange-500 text-slate-800 hover:text-orange-600 transition-all font-semibold flex items-center shrink-0 self-start md:self-end"
                        rightIcon={ArrowRight}
                    >
                        Explore All Products
                    </PremiumButton>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 md:gap-2">
                    {products.slice(0, 5).map((product, index) => (
                        <div
                            key={product.id}
                            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <ProductCard {...product} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;
