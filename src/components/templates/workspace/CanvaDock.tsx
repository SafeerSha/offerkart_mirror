"use client";

import React, { useState, useMemo } from 'react';
import {
    LayoutTemplate,
    Package,
    Sparkles,
    Type,
    Image as ImageIcon,
    Upload,
    Search,
    Plus,
    X,
    Check,
    Loader2,
    Store,
} from 'lucide-react';
import { TEMPLATE_METAS } from '../registry';
import { STICKER_PRESETS, PRESET_TEXT_TEMPLATES, StickerPreset } from './stickerPresets';
import { useAllProducts, useMyShops } from '@/hooks/useApi';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { extractS3Url } from '@/lib/common';
import { toast } from 'sonner';

export type CanvaDockTab = 'templates' | 'products' | 'badges' | 'text' | 'uploads';

interface CanvaDockProps {
    activeTab: CanvaDockTab | null;
    onTabChange: (tab: CanvaDockTab | null) => void;
    currentTemplateId: string;
    onSelectTemplate: (templateId: string) => void;
    shopId: string | null;
    usedProductIds?: Set<string>;
    usedProductTitles?: Set<string>;
    onInsertProduct: (product: any) => void;
    onAddSticker: (preset: StickerPreset) => void;
    onAddText: (textConfig: any) => void;
    onAddImageOverlay: (imageUrl: string) => void;
    onOpenCreateProductModal: () => void;
}

export function CanvaDock({
    activeTab,
    onTabChange,
    currentTemplateId,
    onSelectTemplate,
    shopId,
    usedProductIds,
    usedProductTitles,
    onInsertProduct,
    onAddSticker,
    onAddText,
    onAddImageOverlay,
    onOpenCreateProductModal,
}: CanvaDockProps) {
    // Dock items
    const dockItems: { id: CanvaDockTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
        { id: 'templates', label: 'Templates', icon: LayoutTemplate },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'badges', label: 'Badges', icon: Sparkles },
        { id: 'text', label: 'Text', icon: Type },
        { id: 'uploads', label: 'Uploads', icon: Upload },
    ];

    const handleTabClick = (tabId: CanvaDockTab) => {
        if (activeTab === tabId) {
            onTabChange(null); // toggle close
        } else {
            onTabChange(tabId);
        }
    };

    return (
        <div className="flex h-full shrink-0 z-30 select-none">
            {/* ── VERTICAL CANVA DOCK ── */}
            <div className="w-[72px] h-full bg-card/95 backdrop-blur-md border-r border-border/80 flex flex-col items-center py-3 gap-2 shrink-0">
                {dockItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => handleTabClick(item.id)}
                            className={cn(
                                "w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group relative",
                                isActive
                                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 scale-[1.03]"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                            )}
                            title={item.label}
                        >
                            <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "scale-110")} />
                            <span className={cn(
                                "text-[10px] font-bold tracking-tight transition-colors",
                                isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                                {item.label}
                            </span>

                            {/* Active indicator bar */}
                            {isActive && (
                                <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-orange-500 rounded-l-full shadow-sm" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── EXPANDABLE DRAWER PANEL ── */}
            {activeTab && (
                <div className="w-[330px] h-full bg-background/95 backdrop-blur-xl border-r border-border/80 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 shrink-0 z-20">
                    {/* Drawer Header */}
                    <div className="h-13 px-4 py-3 border-b border-border/70 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-sm uppercase tracking-wider text-foreground">
                                {activeTab === 'templates' && 'Templates'}
                                {activeTab === 'products' && 'Shop Products'}
                                {activeTab === 'badges' && 'Retail Badges'}
                                {activeTab === 'text' && 'Text Overlays'}
                                {activeTab === 'uploads' && 'Upload Graphics'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => onTabChange(null)}
                            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Drawer Content */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {activeTab === 'templates' && (
                            <TemplatesDrawerContent
                                currentTemplateId={currentTemplateId}
                                onSelectTemplate={onSelectTemplate}
                            />
                        )}

                        {activeTab === 'products' && (
                            <ProductsDrawerContent
                                shopId={shopId}
                                usedProductIds={usedProductIds}
                                usedProductTitles={usedProductTitles}
                                onInsertProduct={onInsertProduct}
                                onOpenCreateProductModal={onOpenCreateProductModal}
                            />
                        )}

                        {activeTab === 'badges' && (
                            <BadgesDrawerContent onAddSticker={onAddSticker} />
                        )}

                        {activeTab === 'text' && (
                            <TextDrawerContent onAddText={onAddText} />
                        )}

                        {activeTab === 'uploads' && (
                            <UploadsDrawerContent onAddImageOverlay={onAddImageOverlay} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// DRAWER 1: TEMPLATES
// ─────────────────────────────────────────────

function TemplatesDrawerContent({
    currentTemplateId,
    onSelectTemplate,
}: {
    currentTemplateId: string;
    onSelectTemplate: (templateId: string) => void;
}) {
    const [filterCategory, setFilterCategory] = useState<string>('all');

    const categories = [
        { id: 'all', label: 'All' },
        { id: 'retail', label: 'Retail' },
        { id: 'food', label: 'Food' },
        { id: 'tech', label: 'Tech' },
        { id: 'fashion', label: 'Fashion' },
    ];

    const filteredTemplates = useMemo(() => {
        if (filterCategory === 'all') return TEMPLATE_METAS;
        return TEMPLATE_METAS.filter(t => t.category === filterCategory);
    }, [filterCategory]);

    return (
        <div className="flex flex-col gap-3">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((c) => (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => setFilterCategory(c.id)}
                        className={cn(
                            "px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                            filterCategory === c.id
                                ? "bg-orange-500 text-white shadow-sm"
                                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
                {filteredTemplates.map((t) => {
                    const isSelected = t.id === currentTemplateId;

                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => onSelectTemplate(t.id)}
                            className={cn(
                                "group flex flex-col text-left rounded-xl border p-2 transition-all relative overflow-hidden bg-card hover:shadow-md",
                                isSelected
                                    ? "border-orange-500 ring-2 ring-orange-500/20 shadow-md"
                                    : "border-border/80 hover:border-orange-500/40"
                            )}
                        >
                            {/* Visual Preview Box */}
                            <div
                                className="w-full h-24 rounded-lg flex flex-col justify-between p-2 mb-2 relative overflow-hidden shadow-inner transition-transform group-hover:scale-[1.02]"
                                style={{ background: t.previewColors.bg }}
                            >
                                <div
                                    className="w-full h-4 rounded px-1.5 flex items-center justify-between"
                                    style={{ background: t.previewColors.primary }}
                                >
                                    <div className="w-2.5 h-1.5 rounded-sm bg-white/70" />
                                    <div className="w-8 h-1 rounded-sm bg-white/50" />
                                </div>

                                <div className="grid grid-cols-3 gap-1 my-auto">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div
                                            key={i}
                                            className="h-3.5 rounded-sm bg-slate-200 dark:bg-slate-700/60 border border-black/5"
                                        />
                                    ))}
                                </div>

                                <div
                                    className="w-full h-2 rounded-sm"
                                    style={{ background: t.previewColors.accent }}
                                />

                                {isSelected && (
                                    <div className="absolute inset-0 bg-orange-500/15 backdrop-blur-[1px] flex items-center justify-center">
                                        <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg">
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between w-full">
                                <span className="text-xs font-bold text-foreground truncate group-hover:text-orange-500 transition-colors">
                                    {t.name}
                                </span>
                                <span className="text-[10px] font-black text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded-md">
                                    {t.slotCount}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// DRAWER 2: SHOP PRODUCTS
// ─────────────────────────────────────────────

function ProductsDrawerContent({
    shopId,
    usedProductIds,
    usedProductTitles,
    onInsertProduct,
    onOpenCreateProductModal,
}: {
    shopId: string | null;
    usedProductIds?: Set<string>;
    usedProductTitles?: Set<string>;
    onInsertProduct: (product: any) => void;
    onOpenCreateProductModal: () => void;
}) {
    const { data: session } = useSession();
    const { data: shopsResponse, isLoading: isLoadingShops } = useMyShops();
    const [search, setSearch] = useState('');

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

    const { data: productsData, isLoading: isLoadingProducts, isFetching: isFetchingProducts } = useAllProducts(
        effectiveShopId || undefined,
        { limit: 100 }
    );

    const isInventoryLoading = (isLoadingShops && !effectiveShopId) || (isLoadingProducts && !productsData);

    const rawProducts = useMemo(() => {
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

    const filtered = useMemo(() => {
        if (!search.trim()) return rawProducts;
        const q = search.toLowerCase().trim();
        return rawProducts.filter((p: any) =>
            (p.name || p.title || p.displayName || p.product_name || '').toLowerCase().includes(q) ||
            (typeof p.category === 'string' ? p.category : p.category?.name || '').toLowerCase().includes(q)
        );
    }, [rawProducts, search]);

    return (
        <div className="flex flex-col gap-3">
            {/* Search Input */}
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-muted/60 border border-border/80 rounded-xl text-xs font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-orange-500 transition-colors"
                />
            </div>

            {/* Quick Add Product Button */}
            <button
                type="button"
                onClick={onOpenCreateProductModal}
                className="w-full py-2 px-3 border-2 border-dashed border-orange-500/40 hover:border-orange-500 rounded-xl text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/5 hover:bg-orange-500/10 flex items-center justify-center gap-1.5 transition-all"
            >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
            </button>

            {/* Product Items List */}
            {isInventoryLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                    <span className="text-xs font-medium">Loading inventory...</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-10 px-4 text-muted-foreground">
                    <Store className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-bold">No products found</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                        Create a product or clear search
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {filtered.length} Products Available • Click or Drag to Slot
                    </span>

                    {filtered.map((prod: any) => {
                        const prodId = String(prod.id || prod.productId || prod._id || '');
                        const rawImg = prod.image || prod.imageUrl || prod.image_url || prod.product_image || prod.images?.[0] || prod.thumbnail;
                        const img = extractS3Url(rawImg);
                        const title = prod.name || prod.title || prod.displayName || prod.product_name || 'Product';
                        const price = prod.price ?? prod.offerPrice ?? prod.offer_price ?? 0;
                        const originalPrice = prod.originalPrice ?? prod.oldPrice ?? prod.original_price ?? prod.old_price;

                        const isAlreadyUsed = Boolean(
                            (prodId && usedProductIds?.has(prodId)) ||
                            (title && usedProductTitles?.has(title.trim().toLowerCase()))
                        );

                        return (
                            <div
                                key={prodId || title}
                                draggable={!isAlreadyUsed}
                                onDragStart={(e) => {
                                    if (isAlreadyUsed) {
                                        e.preventDefault();
                                        return;
                                    }
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                        id: prodId,
                                        title,
                                        image: img,
                                        offerPrice: price,
                                        oldPrice: originalPrice,
                                        category: typeof prod.category === 'string' ? prod.category : prod.category?.name,
                                    }));
                                }}
                                onClick={() => {
                                    if (isAlreadyUsed) {
                                        toast.error(`"${title}" is already in a slot in this poster.`);
                                        return;
                                    }
                                    onInsertProduct(prod);
                                }}
                                className={cn(
                                    "group flex items-center gap-3 p-2 border rounded-xl transition-all",
                                    isAlreadyUsed
                                        ? "bg-muted/40 border-border/40 opacity-55 cursor-not-allowed"
                                        : "bg-card hover:bg-muted/60 border-border/80 hover:border-orange-500/40 cursor-grab active:cursor-grabbing hover:shadow-sm"
                                )}
                            >
                                <div className="w-12 h-12 rounded-lg bg-muted border border-border/60 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                                    {img ? (
                                        <img src={img} alt={title} className="w-full h-full object-contain" />
                                    ) : (
                                        <Package className="w-5 h-5 text-muted-foreground/50" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-foreground truncate group-hover:text-orange-500 transition-colors">
                                        {title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                                            ₹{price}
                                        </span>
                                        {originalPrice && originalPrice > price && (
                                            <span className="text-[10px] text-muted-foreground line-through">
                                                ₹{originalPrice}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {isAlreadyUsed ? (
                                    <span className="text-[10px] font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md shrink-0 select-none">
                                        In Slot
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-orange-500 group-hover:text-white transition-colors"
                                        title="Add to slot"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// DRAWER 3: RETAIL BADGES & STICKERS
// ─────────────────────────────────────────────

function BadgesDrawerContent({ onAddSticker }: { onAddSticker: (preset: StickerPreset) => void }) {
    const [activeCat, setActiveCat] = useState<string>('all');

    const cats = [
        { id: 'all', label: 'All' },
        { id: 'discount', label: 'Discounts' },
        { id: 'urgency', label: 'Urgency' },
        { id: 'festive', label: 'Festive' },
    ];

    const filteredBadges = useMemo(() => {
        if (activeCat === 'all') return STICKER_PRESETS;
        return STICKER_PRESETS.filter(b => b.category === activeCat);
    }, [activeCat]);

    return (
        <div className="flex flex-col gap-3">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {cats.map((c) => (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveCat(c.id)}
                        className={cn(
                            "px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                            activeCat === c.id
                                ? "bg-orange-500 text-white shadow-sm"
                                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Click to add badge to canvas
            </span>

            <div className="grid grid-cols-2 gap-3 pt-1">
                {filteredBadges.map((preset) => (
                    <button
                        key={preset.id}
                        type="button"
                        onClick={() => onAddSticker(preset)}
                        className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-card border border-border/80 hover:border-orange-500 hover:shadow-md transition-all active:scale-95"
                    >
                        <div className="h-14 flex items-center justify-center transition-transform group-hover:scale-105">
                            {renderBadgePreview(preset)}
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground mt-2 truncate w-full text-center">
                            {preset.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function renderBadgePreview(preset: StickerPreset) {
    if (preset.shapeKind === 'starburst') {
        return (
            <div
                className="w-12 h-12 flex flex-col items-center justify-center text-[8px] font-black text-white p-1 text-center drop-shadow"
                style={{
                    background: preset.badgeBg,
                    clipPath: 'polygon(50% 0%, 63% 18%, 82% 10%, 82% 31%, 100% 38%, 89% 55%, 98% 74%, 78% 78%, 73% 98%, 54% 88%, 35% 98%, 30% 78%, 10% 74%, 19% 55%, 8% 38%, 26% 31%, 26% 10%, 45% 18%)',
                }}
            >
                <span className="leading-tight">{preset.text.split(' ')[0]}</span>
            </div>
        );
    }

    if (preset.shapeKind === 'circle') {
        return (
            <div
                className="w-12 h-12 rounded-full flex flex-col items-center justify-center text-[8px] font-black text-white p-1 text-center shadow border border-dashed border-white/60"
                style={{ background: preset.badgeBg }}
            >
                <span className="leading-tight">{preset.text}</span>
            </div>
        );
    }

    return (
        <div
            className="px-3 py-1.5 rounded-full text-[9px] font-black text-white shadow text-center border border-white/30 whitespace-nowrap"
            style={{ background: preset.badgeBg, color: preset.badgeTextColor }}
        >
            {preset.text}
        </div>
    );
}

// ─────────────────────────────────────────────
// DRAWER 4: TEXT OVERLAYS
// ─────────────────────────────────────────────

function TextDrawerContent({ onAddText }: { onAddText: (textConfig: any) => void }) {
    return (
        <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Add Standard Text
            </span>

            <button
                type="button"
                onClick={() => onAddText({
                    text: 'Add a heading',
                    fontSize: 32,
                    fontWeight: 800,
                    w: 300,
                    h: 50,
                })}
                className="w-full p-3 rounded-xl bg-card border border-border/80 hover:border-orange-500 hover:shadow-sm text-left transition-all group"
            >
                <span className="text-xl font-black text-foreground group-hover:text-orange-500 transition-colors">
                    Add a heading
                </span>
            </button>

            <button
                type="button"
                onClick={() => onAddText({
                    text: 'Add a subheading',
                    fontSize: 18,
                    fontWeight: 700,
                    w: 260,
                    h: 40,
                })}
                className="w-full p-3 rounded-xl bg-card border border-border/80 hover:border-orange-500 hover:shadow-sm text-left transition-all group"
            >
                <span className="text-sm font-bold text-foreground group-hover:text-orange-500 transition-colors">
                    Add a subheading
                </span>
            </button>

            <button
                type="button"
                onClick={() => onAddText({
                    text: 'Add a callout note or offer text',
                    fontSize: 13,
                    fontWeight: 500,
                    w: 240,
                    h: 35,
                })}
                className="w-full p-3 rounded-xl bg-card border border-border/80 hover:border-orange-500 hover:shadow-sm text-left transition-all group"
            >
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Add a callout note
                </span>
            </button>

            <div className="w-full h-[1px] bg-border/60 my-2" />

            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Pre-Styled Promotional Callouts
            </span>

            {PRESET_TEXT_TEMPLATES.map((tmpl) => (
                <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => onAddText(tmpl)}
                    className="w-full p-3 rounded-xl bg-card border border-border/80 hover:border-orange-500 hover:shadow-sm text-left transition-all group flex flex-col gap-1"
                >
                    <span
                        className="truncate"
                        style={{
                            fontSize: `${Math.min(tmpl.fontSize, 18)}px`,
                            fontWeight: tmpl.fontWeight,
                            fontFamily: tmpl.fontFamily,
                            color: tmpl.color,
                        }}
                    >
                        {tmpl.text}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                        {tmpl.label}
                    </span>
                </button>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
// DRAWER 5: UPLOADS
// ─────────────────────────────────────────────

function UploadsDrawerContent({ onAddImageOverlay }: { onAddImageOverlay: (imageUrl: string) => void }) {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
            const dataUrl = uploadEvent.target?.result as string;
            if (dataUrl) {
                onAddImageOverlay(dataUrl);
            }
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Upload Custom Stickers / Logos
            </span>

            <label className="w-full h-36 border-2 border-dashed border-border/80 hover:border-orange-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-card/60 hover:bg-muted/40 transition-all p-4 text-center group">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Upload className="w-5 h-5" />
                    )}
                </div>
                <div>
                    <span className="text-xs font-bold text-foreground block">
                        Click to upload image
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        PNG, JPG, SVG or WEBP
                    </span>
                </div>
            </label>

            <div className="p-3 bg-muted/40 border border-border/60 rounded-xl text-[11px] text-muted-foreground leading-relaxed">
                Tip: You can upload sponsor logos, custom QR codes, or store branding stamps to overlay anywhere on the poster.
            </div>
        </div>
    );
}
