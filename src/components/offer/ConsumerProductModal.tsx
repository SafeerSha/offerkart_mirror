"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { AppModal } from "@/components/shared/AppModal";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { ShoppingCart, IndianRupee, Heart, Tag } from "lucide-react";
import { Subheading, Text } from "@/components/shared/Typography";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { getUserProducts } from "@/lib/api/products";

interface ConsumerProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productName: string | null;
}

// Mock image generator based on name
const getMockImage = (name: string) => {
    // Generate a consistent random-looking nature/product image based on name length
    const id = name.length > 0 ? name.charCodeAt(0) % 100 : 1;
    return `https://picsum.photos/seed/${id}/400/400`;
};

export const ConsumerProductModal = ({
    open,
    onOpenChange,
    productName,
}: ConsumerProductModalProps) => {
    const { t } = useTranslation("common");
    const [mockProduct, setMockProduct] = useState<any>(null);
    const [isAddedToCart, setIsAddedToCart] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open && productName) {
            setIsLoading(true);
            const fetchProductDetails = async () => {
                try {
                    const res = await getUserProducts({ search: productName, limit: 1 });
                    if (res && res.success && res.data && res.data.data && res.data.data.length > 0) {
                        const product = res.data.data[0];
                        setMockProduct({
                            name: product.name,
                            description: product.description || t("catalog.mockProductDesc").replace("{productName}", productName),
                            image: product.image || getMockImage(productName),
                            originalPrice: product.originalPrice || product.price,
                            price: product.price,
                            discount: product.discount || "Sale",
                            category: product.category || t("catalog.featuredCollection"),
                            stock: 10,
                        });
                    } else {
                        setMockProduct({
                            notFound: true,
                            name: productName,
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch product details for modal:", error);
                    setMockProduct({
                        notFound: true,
                        name: productName,
                    });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProductDetails();
            setIsAddedToCart(false);
        } else {
            // Optional: clear out after close animation
            setTimeout(() => {
                if (!open) {
                    setMockProduct(null);
                }
            }, 300);
        }
    }, [open, productName, t]);

    const handleAddToCart = () => {
        setIsAddedToCart(true);
        toast({
            title: t("catalog.addedToCart"),
            description: t("catalog.addedToCartDesc").replace("{productName}", productName || ""),
        });
    };

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            title=""
            description=""
            className="sm:max-w-md p-0 overflow-hidden rounded-[32px] sm:rounded-3xl border-none"
        >
            {!mockProduct ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : mockProduct.notFound ? (
                <div className="p-8 text-center bg-card">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 mx-auto shadow-sm">
                        <Tag className="w-8 h-8 text-slate-400" />
                    </div>
                    <Subheading className="text-xl font-bold mb-2 text-foreground">
                        {mockProduct.name}
                    </Subheading>
                    <Text className="text-muted-foreground text-sm mb-6">
                        Product details are not available for this item.
                    </Text>
                    <PremiumButton onClick={() => onOpenChange(false)} className="w-full rounded-2xl">
                        Close
                    </PremiumButton>
                </div>
            ) : (
                <div className="flex flex-col bg-card">
                    {/* Image Section */}
                    <div className="relative w-full aspect-square bg-gray-100">
                        <Image
                            src={mockProduct.image}
                            alt={mockProduct.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 400px"
                        />
                        <div className="absolute top-4 left-4">
                            <span className="badge-futuristic bg-black/50 backdrop-blur-md border-white/20 text-white">
                                <Tag className="w-3 h-3 mr-1" />
                                {mockProduct.discount}
                            </span>
                        </div>
                        <button className="absolute top-4 right-4 p-2.5 rounded-full bg-white/80 backdrop-blur-md text-gray-600 hover:text-rose-500 hover:bg-white transition-all">
                            <Heart className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Details Section */}
                    <div className="p-6">
                        <div className="mb-2">
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                {mockProduct.category}
                            </span>
                        </div>
                        <Subheading className="text-2xl font-bold mb-2 text-foreground">
                            {mockProduct.name}
                        </Subheading>
                        
                        <div className="flex items-end gap-3 mb-4">
                            <div className="flex items-center text-3xl font-bold text-foreground">
                                <IndianRupee className="w-6 h-6 stroke-[2.5]" />
                                {mockProduct.price.toLocaleString()}
                            </div>
                            <div className="flex items-center text-lg font-medium text-muted-foreground line-through mb-1">
                                <IndianRupee className="w-4 h-4" />
                                {mockProduct.originalPrice.toLocaleString()}
                            </div>
                        </div>

                        <div className="mb-6">
                            <Text className="text-muted-foreground text-sm leading-relaxed">
                                {mockProduct.description}
                            </Text>
                        </div>

                        <div className="flex gap-3">
                            <PremiumButton
                                onClick={handleAddToCart}
                                disabled={isAddedToCart}
                                className="flex-1 py-6 text-base font-bold rounded-2xl"
                                glow={!isAddedToCart}
                            >
                                {isAddedToCart ? (
                                    t("catalog.addedToCart")
                               ) : (
                                   <>
                                       <ShoppingCart className="w-5 h-5 mr-2" />
                                       {t("catalog.addToCart")}
                                   </>
                               )}
                            </PremiumButton>
                        </div>
                    </div>
                </div>
            )}
        </AppModal>
    );
};
