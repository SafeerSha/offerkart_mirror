"use client";

import React from 'react';
import { TemplateProps } from '../types';
import { ProductSlot } from '../shared/ProductSlot';
import { EditableText } from '../shared/EditableText';
import { Phone, MapPin, Sparkles, ShoppingBag, Store } from 'lucide-react';

export function SpecialOffersPosterTemplate({
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
            className="w-[794px] h-[1123px] max-w-[794px] max-h-[1123px] shrink-0 relative flex flex-col overflow-hidden bg-[#fff8eb] text-[#171717] select-none font-sans"
            style={{ width: '794px', height: '1123px' }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,500;0,600;0,700;0,800;0,900;1,700;1,800;1,900&display=swap');
                .font-montserrat { font-family: 'Montserrat', sans-serif; }
            `}</style>

            {/* Top Dynamic Wave graphic */}
            <div className="absolute left-[-5%] top-[-3%] w-[110%] h-[200px] bg-gradient-to-r from-[#ff7410] to-[#ff941f] rounded-b-[45%] z-0 pointer-events-none opacity-90 shadow-md" />

            {/* Decorative Sparkles */}
            <div className="absolute left-[60px] top-[140px] text-[#f6a91a] text-2xl font-black select-none pointer-events-none z-10">
                ✦
            </div>
            <div className="absolute right-[70px] top-[170px] text-[#f6a91a] text-2xl font-black select-none pointer-events-none z-10">
                ✦
            </div>
            <div className="absolute left-[130px] top-[260px] text-[#ff7410] text-lg font-black select-none pointer-events-none z-10">
                ◆
            </div>
            <div className="absolute right-[120px] top-[280px] text-[#ff7410] text-lg font-black select-none pointer-events-none z-10">
                ◆
            </div>

            {/* ── HEADER ── */}
            {!excludeHeader && (
                <header className="h-[250px] px-8 pt-6 pb-4 flex flex-col justify-between relative z-10 shrink-0 font-montserrat">
                    <div className="flex items-start justify-between">
                        {/* Shop Logo & Name */}
                        <div className="flex items-center gap-4">
                            {shopData.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={shopData.logoUrl}
                                    alt="Shop Logo"
                                    className="w-16 h-16 object-contain bg-white rounded-2xl p-2 shadow-lg border border-white/80"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-white/80 flex flex-col items-center justify-center text-[#ff7410] shadow-lg font-black text-[10px] leading-tight text-center">
                                    <Sparkles className="w-5 h-5 text-[#ff7410] mb-0.5" />
                                    <span>{shopData.shopName ? shopData.shopName.substring(0, 6) : "SPECIAL"}</span>
                                </div>
                            )}

                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-md">
                                    {shopData.shopName || "SUPER RETAIL"}
                                </h2>
                                <p className="text-xs font-extrabold text-amber-100 tracking-wider mt-0.5 drop-shadow">
                                    Top Brands • Unbeatable Savings
                                </p>
                            </div>
                        </div>

                        {/* Top Kicker */}
                        <div className="text-right text-white">
                            <span className="text-xs font-black uppercase tracking-wider block drop-shadow">
                                Good Products
                            </span>
                            <span className="text-xs font-extrabold text-amber-200 block drop-shadow">
                                Brighter Days
                            </span>
                        </div>
                    </div>

                    {/* Campaign Title & Ribbon */}
                    <div className="flex items-end justify-between mt-2 pt-2 border-t border-white/20">
                        <div className="flex-1 mr-4">
                            <div className="flex items-baseline gap-2">
                                <EditableText
                                    as="h1"
                                    value={campaignInfo.title || "SPECIAL OFFERS"}
                                    onChange={(val) => onFieldChange?.('title', val)}
                                    isEditable={isEditable}
                                    placeholder="Click to edit campaign title..."
                                    className="font-montserrat text-4xl font-black italic tracking-tight text-[#f04a1a] drop-shadow-sm leading-none"
                                />
                            </div>
                            <div className="mt-2 inline-flex items-center -skew-x-12 bg-[#f04a1a] text-white font-extrabold text-xs px-4 py-1.5 shadow-[0_3px_0_#c9310c]">
                                <EditableText
                                    as="span"
                                    value={campaignInfo.subtitle || "Save More • Shop Smart"}
                                    onChange={(val) => onFieldChange?.('subtitle', val)}
                                    isEditable={isEditable}
                                    placeholder="Click to edit subtitle..."
                                    className="skew-x-12 tracking-wide"
                                />
                            </div>
                        </div>

                        {(campaignInfo.validFrom || campaignInfo.validTo) && (
                            <div className="bg-white text-[#f04a1a] px-4 py-2 rounded-xl shadow-md text-right shrink-0 border border-[#f04a1a]/20">
                                <span className="text-[10px] uppercase text-[#ff7410] block font-extrabold">Flash Window</span>
                                <span className="text-xs font-black text-neutral-900">
                                    {campaignInfo.validFrom || "This Week"} - {campaignInfo.validTo || "While Stocks Last"}
                                </span>
                            </div>
                        )}
                    </div>
                </header>
            )}

            {/* ── PRODUCT GRID ── */}
            <main className="flex-1 p-6 overflow-hidden flex flex-col justify-center relative z-10 font-montserrat">
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
                            variant="dynamic"
                            accentColor="#f04a1a"
                            density={rows >= 5 ? 'dense' : rows === 4 ? 'compact' : 'normal'}
                            imageContainerClassName={
                                rows >= 5 ? "max-h-[85px] aspect-auto h-[85px]" :
                                rows === 4 ? "max-h-[125px] aspect-auto h-[125px]" :
                                "aspect-square max-h-[175px]"
                            }
                            className="h-full bg-white shadow-sm border-2 border-orange-500/25 hover:border-orange-500/60"
                        />
                    ))}
                </div>
            </main>

            {/* ── FOOTER ── */}
            <footer className="relative mt-auto h-[100px] bg-[#ff8a17] text-neutral-900 px-8 flex flex-col justify-between py-3 shrink-0 z-20 font-montserrat before:content-[''] before:absolute before:-top-[22px] before:left-0 before:w-full before:h-[30px] before:bg-[#ff8a17] before:rounded-t-[50%]">
                {/* Store Perks */}
                <div className="relative z-10 flex items-center justify-around border-b border-black/10 pb-2 text-xs font-black">
                    <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-neutral-900" />
                        <span>Visit Our Store Near You</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-neutral-900" />
                        <span>Quality Products Everyday</span>
                    </div>
                </div>

                {/* Shop Branches & Contact */}
                <div className="relative z-10 flex items-center justify-between text-xs font-bold text-neutral-900">
                    <div className="flex items-center gap-2 max-w-[65%] truncate">
                        <MapPin className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                        <span className="truncate">
                            {shopData.branches && shopData.branches.length > 0
                                ? `Branches: ${shopData.branches.join("  •  ")}`
                                : "Available in all retail mega stores"}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-extrabold">
                        {shopData.shopPhone && (
                            <div className="flex items-center gap-1.5 text-neutral-950">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{shopData.shopPhone}</span>
                            </div>
                        )}
                        <span className="bg-neutral-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            Hurry In
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
