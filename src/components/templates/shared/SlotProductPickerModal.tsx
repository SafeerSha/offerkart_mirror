"use client";

import React, { useState } from 'react';
import { AppModal } from '@/components/shared/AppModal';
import { ProductSlotItem } from '../types';
import { Search, ShoppingBag, Plus, CheckCircle2, ArrowUpRight, IndianRupee, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAllProducts } from '@/hooks/useApi';

interface SlotProductPickerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    slotIndex: number | null;
    shopId: string | null;
    usedProductIds?: Set<string>;
    onSelectProduct: (product: ProductSlotItem) => void;
    onOpenCustomProductModal: () => void;
}

export function SlotProductPickerModal({
    open,
    onOpenChange,
    slotIndex,
    shopId,
    usedProductIds,
    onSelectProduct,
    onOpenCustomProductModal,
}: SlotProductPickerModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const { data: productsData, isLoading } = useAllProducts(shopId || "");
    const products = (productsData || []) as any[];

    const filtered = products.filter((p: any) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        const name = (p.name || p.title || "").toLowerCase();
        const category = (p.category || "").toLowerCase();
        return name.includes(q) || category.includes(q);
    });

    const handlePickProduct = (p: any) => {
        const item: ProductSlotItem = {
            id: crypto.randomUUID(),
            sourceProductId: String(p.id),
            title: p.name || p.title || "Product",
            description: p.description || "",
            image: p.image || p.imageUrl || p.image_url || "",
            offerPrice: p.price ?? p.offerPrice ?? "0",
            oldPrice: p.originalPrice ?? p.oldPrice ?? undefined,
            currency: "₹",
            category: p.category || "General",
            subcategories: Array.isArray(p.subcategory) ? p.subcategory : p.subcategory ? [p.subcategory] : ["General"],
            subcategoryId: p.subcategoryId ? Number(p.subcategoryId) : undefined,
        };
        onSelectProduct(item);
        onOpenChange(false);
    };

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            title={`Select Product for Slot ${slotIndex !== null ? slotIndex + 1 : ""}`}
            className="max-w-2xl max-h-[85vh] flex flex-col p-6"
        >
            <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
                {/* Search and Custom Product CTA */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by product name or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-orange-500 focus:outline-none transition-all"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            onOpenChange(false);
                            onOpenCustomProductModal();
                        }}
                        className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Custom Product
                    </button>
                </div>

                {/* Product Catalog List */}
                <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[480px] space-y-2 pr-1">
                    {isLoading ? (
                        <div className="h-48 flex items-center justify-center text-gray-400 text-sm font-medium">
                            Loading your products...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-sm">
                            <ShoppingBag className="w-10 h-10 mb-2 stroke-1 text-gray-300" />
                            <p className="font-semibold text-gray-600">No products found</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Try a different search term or add a custom product
                            </p>
                        </div>
                    ) : (
                        filtered.map((p: any) => {
                            const isAlreadyUsed = usedProductIds?.has(String(p.id));
                            const imageSrc = p.image || p.imageUrl || p.image_url;

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => handlePickProduct(p)}
                                    className={cn(
                                        "group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                                        isAlreadyUsed
                                            ? "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70"
                                            : "border-gray-100 bg-white hover:border-orange-500 hover:shadow-sm"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                                            {imageSrc ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={imageSrc}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    crossOrigin="anonymous"
                                                />
                                            ) : (
                                                <ImageIcon className="w-5 h-5 text-gray-300" />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-gray-900 truncate leading-tight group-hover:text-orange-600 transition-colors">
                                                {p.name || p.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-black text-gray-900">
                                                    ₹{p.price ?? p.offerPrice ?? "0"}
                                                </span>
                                                {p.originalPrice && (
                                                    <span className="text-[11px] text-gray-400 line-through">
                                                        ₹{p.originalPrice}
                                                    </span>
                                                )}
                                                {p.category && (
                                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                                        {p.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {isAlreadyUsed ? (
                                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold shrink-0">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Used
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-orange-100 text-gray-400 group-hover:text-orange-600 flex items-center justify-center transition-colors shrink-0">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </AppModal>
    );
}
