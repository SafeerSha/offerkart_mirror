"use client";

import ProductCard from "./ProductCard";
import { StaticImageData } from "next/image";

interface Product {
    id: number;
    name: string;
    shopName: string;
    price: number;
    originalPrice?: number;
    savingPercentage?: number;
    image: string | StaticImageData;
    category: string;
    rating?: number;
    reviews?: number;
    discount?: string;
}

interface ProductGridProps {
    products: Product[];
    isLoading?: boolean;
}

const ProductGrid = ({ products, isLoading }: ProductGridProps) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-white rounded-[2rem] aspect-[4/5] animate-pulse flex flex-col">
                        <div className="flex-1 bg-gray-100 rounded-t-[2rem]" />
                        <div className="p-6 space-y-3">
                            <div className="h-4 bg-gray-100 rounded w-1/3" />
                            <div className="h-6 bg-gray-100 rounded w-3/4" />
                            <div className="h-4 bg-gray-100 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your filters or category.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-1">
            {products.map((product) => (
                <div key={product.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ProductCard {...product} />
                </div>
            ))}
        </div>
    );
};

export default ProductGrid;
