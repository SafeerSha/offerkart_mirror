"use client";

import React from 'react';
import { TemplateProps } from '../types';
import { ProductSlot } from '../shared/ProductSlot';
import { EditableText } from '../shared/EditableText';
import { ShopLogo } from '../shared/ShopLogo';
import { Phone, MapPin, Zap, Flame } from 'lucide-react';

export function MegaWeekendSaleTemplate({
    shopData,
    campaignInfo,
    products,
    isEditable = false,
    excludeHeader = false,
    onSlotClick,
    onSlotRemove,
    onFieldChange,
    gridConfig,
}: TemplateProps) {
    const rows = gridConfig?.rows ?? 4;
    const columns = gridConfig?.columns ?? 2;
    const totalSlots = rows * columns;

    return (
        <div
            className="w-[794px] h-[1123px] max-w-[794px] max-h-[1123px] shrink-0 relative flex flex-col overflow-hidden bg-amber-50 select-none font-sans"
            style={{ width: '794px', height: '1123px' }}
        >
            {/* ── HEADER ── */}
            {!excludeHeader && (
                <header className="h-[230px] bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 text-white px-8 py-6 flex flex-col justify-between relative shadow-xl shrink-0 overflow-hidden">
                    {/* Background Graphic elements */}
                    <div className="absolute -top-12 -right-12 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 w-96 h-20 bg-white/10 skew-y-3 pointer-events-none" />

                    <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-4">
                            <ShopLogo
                                logoUrl={shopData.logoUrl}
                                shopName={shopData.shopName}
                                className="w-20 h-20 object-contain bg-white rounded-2xl p-2 shadow-xl border-2 border-white/40"
                                fallback={
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner">
                                        <Flame className="w-8 h-8 text-yellow-300" />
                                    </div>
                                }
                            />

                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
                                    {shopData.shopName || "SUPER OUTLET"}
                                </h2>
                                <p className="text-xs font-bold text-yellow-200 tracking-wider flex items-center gap-1 mt-0.5">
                                    <Zap className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                                    Biggest Discounts of the Season
                                </p>
                            </div>
                        </div>

                        <div className="bg-black text-yellow-400 font-black text-xs px-4 py-2 rounded-xl uppercase tracking-widest shadow-2xl border border-yellow-400/40 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            LIMITED OFFER
                        </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-white/20 pt-3 z-10">
                        <div className="flex-1 mr-4">
                            <EditableText
                                as="h1"
                                value={campaignInfo.title || "MEGA WEEKEND FLASH SALE"}
                                onChange={(val) => onFieldChange?.('title', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit offer title..."
                                className="text-4xl font-black uppercase tracking-tight text-white drop-shadow-lg leading-none"
                            />
                            <EditableText
                                as="p"
                                value={campaignInfo.subtitle || "Don't miss out on doorbuster discounts available this weekend only!"}
                                onChange={(val) => onFieldChange?.('subtitle', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit subtitle..."
                                className="text-xs font-semibold text-yellow-100 mt-1"
                            />
                        </div>

                        {(campaignInfo.validFrom || campaignInfo.validTo) && (
                            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30 text-right shrink-0">
                                <span className="text-[10px] uppercase text-yellow-200 block font-bold">Promotion Dates</span>
                                <span className="text-xs font-black text-white">
                                    {campaignInfo.validFrom || "This Weekend"} - {campaignInfo.validTo || "Until Midnight"}
                                </span>
                            </div>
                        )}
                    </div>
                </header>
            )}

            {/* ── PRODUCT GRID ── */}
            <main className="flex-1 bg-gradient-to-b from-orange-50/60 to-amber-100/40 p-6 overflow-hidden flex flex-col justify-center">
                <div
                    className="grid gap-4 w-full h-full max-h-full"
                    style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                    }}
                >
                    {Array.from({ length: totalSlots }).map((_, idx) => (
                        <ProductSlot
                            key={idx}
                            index={idx}
                            item={products[idx]}
                            isEditable={isEditable}
                            onClick={() => onSlotClick?.(idx)}
                            onRemove={() => onSlotRemove?.(idx)}
                            variant="modern"
                            accentColor="#ea580c"
                            density={rows >= 5 ? 'dense' : rows === 4 ? 'compact' : 'normal'}
                            imageContainerClassName={
                                rows >= 5 ? "max-h-[75px] aspect-auto h-[75px]" :
                                    rows === 4 ? "max-h-[100px] aspect-auto h-[100px]" :
                                        rows === 3 ? "max-h-[140px] aspect-auto h-[140px]" :
                                            "aspect-square max-h-[175px]"
                            }
                            className="h-full"
                        />
                    ))}
                </div>
            </main>

            {/* ── FOOTER ── */}
            <footer className="h-[65px] bg-neutral-900 text-white px-8 flex items-center justify-between text-xs font-medium border-t-2 border-orange-500 shrink-0 z-10">
                <div className="flex items-center gap-2 max-w-[60%] truncate">
                    <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="truncate">
                        {shopData.branches && shopData.branches.length > 0
                            ? `Participating Branches: ${shopData.branches.join("  •  ")}`
                            : "Available across all locations"}
                    </span>
                </div>

                <div className="flex items-center gap-6 shrink-0 font-bold">
                    {shopData.shopPhone && (
                        <div className="flex items-center gap-1.5 text-orange-400">
                            <Phone className="w-4 h-4" />
                            <span>{shopData.shopPhone}</span>
                        </div>
                    )}
                    <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-wider">
                        Shop Now
                    </span>
                </div>
            </footer>
        </div>
    );
}
