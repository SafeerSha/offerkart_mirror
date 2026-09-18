"use client";

import React from 'react';
import { TemplateProps } from '../types';
import { ProductSlot } from '../shared/ProductSlot';
import { EditableText } from '../shared/EditableText';
import { ShopLogo } from '../shared/ShopLogo';
import { Phone, MapPin, Sparkles, ShoppingBag, Percent } from 'lucide-react';

export function SuperOffersPosterTemplate({
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
    const rows = gridConfig?.rows ?? 2;
    const columns = gridConfig?.columns ?? 3;
    const totalSlots = rows * columns;

    return (
        <div
            className="w-[794px] h-[1123px] max-w-[794px] max-h-[1123px] shrink-0 relative flex flex-col overflow-hidden bg-[#ed1324] text-white select-none font-sans"
            style={{ width: '794px', height: '1123px' }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@500;600;700;800;900&display=swap');
                .font-anton { font-family: 'Anton', Impact, sans-serif; }
            `}</style>

            {/* ── HEADER ── */}
            {!excludeHeader && (
                <>
                    {/* Decorative Bursts */}
                    <div className="absolute left-[50px] top-[140px] text-[#ffd619] text-3xl font-black select-none pointer-events-none -rotate-[20deg] z-0">
                        ◆
                    </div>
                    <div className="absolute right-[40px] top-[240px] text-[#ffd619] text-3xl font-black select-none pointer-events-none rotate-[25deg] z-0">
                        ◆
                    </div>
                    <div className="absolute left-[90px] top-[300px] text-[#ffd619] text-2xl font-black select-none pointer-events-none z-0">
                        ✦
                    </div>

                    <header className="h-[250px] px-8 pt-6 pb-4 flex flex-col justify-between relative z-10 shrink-0">
                        <div className="flex items-start justify-between">
                            {/* Shop Logo & Name */}
                            <div className="flex items-center gap-4">
                                <ShopLogo
                                    logoUrl={shopData.logoUrl}
                                    shopName={shopData.shopName}
                                    className="w-16 h-16 object-contain bg-white rounded-2xl p-2 shadow-2xl border-2 border-white"
                                    fallback={
                                        <div className="w-16 h-16 rounded-2xl bg-white border-2 border-white flex flex-col items-center justify-center text-[#ed1324] shadow-2xl font-black text-[10px] leading-tight text-center">
                                            <Sparkles className="w-5 h-5 text-[#ed1324] mb-0.5" />
                                            <span>{shopData.shopName ? shopData.shopName.substring(0, 6) : "SUPER"}</span>
                                        </div>
                                    }
                                />

                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-[2px_2px_0px_#101010]">
                                        {shopData.shopName || "SUPERMARKET"}
                                    </h2>
                                    <p className="text-xs font-black text-[#ffd619] tracking-wider mt-0.5 drop-shadow">
                                        Massive Savings • Wholesale Prices
                                    </p>
                                </div>
                            </div>

                            {/* Top Note */}
                            <div className="text-right">
                                <span className="text-xs font-black uppercase tracking-wider block drop-shadow">
                                    Shop Today
                                </span>
                                <span className="text-xs font-black text-[#ffd619] block drop-shadow">
                                    Save Tomorrow
                                </span>
                            </div>
                        </div>

                        {/* Offer Title & Skewed Yellow Ribbon */}
                        <div className="flex items-end justify-between mt-2 pt-2 border-t border-white/20">
                            <div className="flex-1 mr-4">
                                <div className="flex items-baseline gap-2">
                                    <EditableText
                                        as="h1"
                                        value={campaignInfo.title || "SUPER OFFERS"}
                                        onChange={(val) => onFieldChange?.('title', val)}
                                        isEditable={isEditable}
                                        placeholder="Click to edit offer title..."
                                        className="font-anton text-5xl tracking-wide text-white drop-shadow-[4px_4px_0px_#101010] -skew-x-3 leading-none"
                                    />
                                </div>
                                <div className="mt-2 inline-flex items-center -skew-x-6 bg-[#ffd619] text-neutral-950 font-black text-xs px-4 py-1.5 border-2 border-neutral-950 shadow-[3px_3px_0px_#101010]">
                                    <EditableText
                                        as="span"
                                        value={campaignInfo.subtitle || "BIG SAVINGS ON YOUR FAVOURITES"}
                                        onChange={(val) => onFieldChange?.('subtitle', val)}
                                        isEditable={isEditable}
                                        placeholder="Click to edit subtitle..."
                                        className="skew-x-6 tracking-wide"
                                    />
                                </div>
                            </div>

                            {(campaignInfo.validFrom || campaignInfo.validTo) && (
                                <div className="bg-neutral-950 text-white px-4 py-2 rounded-xl shadow-2xl text-right shrink-0 border border-[#ffd619]/40">
                                    <span className="text-[10px] uppercase text-[#ffd619] block font-black">Super Sale</span>
                                    <span className="text-xs font-black text-white">
                                        {campaignInfo.validFrom || "Limited Time"} - {campaignInfo.validTo || "Until Midnight"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </header>
                </>
            )}

            {/* ── PRODUCT GRID ── */}
            <main className="flex-1 p-6 overflow-hidden flex flex-col justify-center relative z-10">
                <div
                    className="grid gap-3 w-full h-full max-h-full"
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
                            variant="supermarket"
                            accentColor="#ffd619"
                            density={rows >= 5 ? 'dense' : rows === 4 ? 'compact' : 'normal'}
                            imageContainerClassName={
                                rows >= 5 ? "max-h-[75px] aspect-auto h-[75px]" :
                                    rows === 4 ? "max-h-[100px] aspect-auto h-[100px]" :
                                        rows === 3 ? "max-h-[140px] aspect-auto h-[140px]" :
                                            "aspect-square max-h-[175px]"
                            }
                            className="h-full bg-white shadow-xl border-2 border-neutral-900/10 hover:border-[#ffd619]"
                        />
                    ))}
                </div>
            </main>

            {/* ── FOOTER ── */}
            <footer className="relative mt-auto h-[100px] bg-[#ffd619] text-neutral-950 px-8 flex flex-col justify-between py-3 shrink-0 z-20 before:content-[''] before:absolute before:-top-[22px] before:left-0 before:w-full before:h-[30px] before:bg-[#ffd619] before:rounded-t-[50%]">
                {/* Supermarket Perks */}
                <div className="relative z-10 flex items-center justify-around border-b border-black/15 pb-2 text-xs font-black">
                    <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-neutral-950" />
                        <span>Great Deals Near You</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-neutral-950" />
                        <span>Shop More • Save More</span>
                    </div>
                </div>

                {/* Shop Branches & Contact */}
                <div className="relative z-10 flex items-center justify-between text-xs font-black text-neutral-950">
                    <div className="flex items-center gap-2 max-w-[65%] truncate">
                        <MapPin className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                        <span className="truncate">
                            {shopData.branches && shopData.branches.length > 0
                                ? `Branches: ${shopData.branches.join("  •  ")}`
                                : "Available across all supermarket locations"}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-black">
                        {shopData.shopPhone && (
                            <div className="flex items-center gap-1.5 text-neutral-950">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{shopData.shopPhone}</span>
                            </div>
                        )}
                        <span className="bg-[#ed1324] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            Best Deals
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
