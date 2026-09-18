"use client";

import React, { useState, useMemo } from 'react';
import { AppModal } from '@/components/shared/AppModal';
import { ProductSlotItem } from '../types';
import { Search, ShoppingBag, Plus, CheckCircle2, ArrowUpRight, IndianRupee, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAllProducts, useMyShops } from '@/hooks/useApi';
import { useSession } from 'next-auth/react';
import { extractS3Url } from '@/lib/common';
import { toast } from 'sonner';

interface SlotProductPickerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    slotIndex: number | null;
    shopId: string | null;
    usedProductIds?: Set<string>;
    usedProductTitles?: Set<string>;
    onSelectProduct: (product: ProductSlotItem) => void;
    onOpenCustomProductModal: () => void;
}

export function SlotProductPickerModal({
    open,
    onOpenChange,
    slotIndex,
    shopId,
    usedProductIds,
    usedProductTitles,
    onSelectProduct,
    onOpenCustomProductModal,
}: SlotProductPickerModalProps) {
    const { data: session } = useSession();
    const { data: shopsResponse, isLoading: isLoadingShops } = useMyShops();
    const [searchQuery, setSearchQuery] = useState("");

    const effectiveShopId = useMemo(() => {
        if (shopId && shopId !== 'all' && shopId !== 'undefined' && shopId !== 'null') {
            return String(shopId);
        }
        const sid = session?.shopId ?? (session?.user as any)?.shopId;
        if (sid) return String(sid);
        if (shopsResponse?.success && shopsResponse?.data) {
            const list = Array.isArray(shopsResponse.data) ? shopsResponse.data : (shopsResponse.data as any).data || [];
            if (list.length > 0) {
                return String(list[0].id || list[0]._id || list[0].shopId || '');
            }
        }
        return '';
    }, [shopId, session, shopsResponse]);

    const { data: productsData, isLoading: isLoadingProducts } = useAllProducts(
        effectiveShopId || undefined,
        { limit: 100 }
    );

    const isLoading = (isLoadingShops && !effectiveShopId) || (isLoadingProducts && !productsData);

    const products = useMemo(() => {
        if (!productsData) return [];
        if (Array.isArray(productsData)) return productsData;
        const res = productsData as any;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data?.data)) return res.data.data;
        if (Array.isArray(res.data?.products)) return res.data.products;
        if (Array.isArray(res.value)) return res.value;
        if (Array.isArray(res.items)) return res.items;
        if (Array.isArray(res.products)) return res.products;
        if (Array.isArray(res.rows)) return res.rows;
        if (Array.isArray(res.result)) return res.result;
        return [];
    }, [productsData]);

    const filtered = products.filter((p: any) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        const name = (p.name || p.title || p.displayName || p.product_name || "").toLowerCase();
        const category = (typeof p.category === 'string' ? p.category : p.category?.name || "").toLowerCase();
        return name.includes(q) || category.includes(q);
    });

    const handlePickProduct = (p: any) => {
        const rawImg = p.image || p.imageUrl || p.image_url || p.product_image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "");
        const item: ProductSlotItem = {
            id: crypto.randomUUID(),
            sourceProductId: String(p.id || p.productId || p._id || ''),
            title: p.name || p.title || p.displayName || p.product_name || "Product",
            description: p.description || "",
            image: extractS3Url(rawImg) || rawImg || "",
            offerPrice: p.price ?? p.offerPrice ?? p.offer_price ?? "0",
            oldPrice: p.originalPrice ?? p.oldPrice ?? p.original_price ?? p.old_price ?? undefined,
            currency: "₹",
            category: typeof p.category === 'string' ? p.category : p.category?.name || "General",
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
                            const prodId = String(p.id || p.productId || p._id || '');
                            const rawImg = p.image || p.imageUrl || p.image_url || p.product_image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "");
                            const imageSrc = extractS3Url(rawImg) || rawImg;
                            const title = p.name || p.title || p.displayName || p.product_name || "Product";
                            const price = p.price ?? p.offerPrice ?? p.offer_price ?? "0";
                            const originalPrice = p.originalPrice ?? p.oldPrice ?? p.original_price ?? p.old_price;
                            const categoryName = typeof p.category === 'string' ? p.category : p.category?.name;

                            const isAlreadyUsed = Boolean(
                                (prodId && usedProductIds?.has(prodId)) ||
                                (title && usedProductTitles?.has(title.trim().toLowerCase()))
                            );

                            return (
                                <div
                                    key={prodId || title}
                                    onClick={() => {
                                        if (isAlreadyUsed) {
                                            toast.error(`"${title}" is already added to another slot in this poster.`);
                                            return;
                                        }
                                        handlePickProduct(p);
                                    }}
                                    className={cn(
                                        "group flex items-center justify-between p-3 rounded-xl border transition-all",
                                        isAlreadyUsed
                                            ? "border-gray-200 bg-gray-50/80 opacity-60 cursor-not-allowed"
                                            : "border-gray-100 bg-white hover:border-orange-500 hover:shadow-sm cursor-pointer"
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
                                                />
                                            ) : (
                                                <ImageIcon className="w-5 h-5 text-gray-300" />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-gray-900 truncate leading-tight group-hover:text-orange-600 transition-colors">
                                                {title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-black text-gray-900">
                                                    ₹{price}
                                                </span>
                                                {originalPrice && (
                                                    <span className="text-[11px] text-gray-400 line-through">
                                                        ₹{originalPrice}
                                                    </span>
                                                )}
                                                {categoryName && (
                                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                                        {categoryName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {isAlreadyUsed ? (
                                        <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 select-none">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                                            <span>In Poster</span>
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
