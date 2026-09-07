"use client";

import React from 'react';
import { TemplateProps } from '../types';
import { ProductSlot } from '../shared/ProductSlot';
import { EditableText } from '../shared/EditableText';
import { Phone, MapPin, Sprout, Sparkles, Heart, Check } from 'lucide-react';

export function FreshDealsPosterTemplate({
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
            className="w-[794px] h-[1123px] max-w-[794px] max-h-[1123px] shrink-0 relative flex flex-col overflow-hidden bg-[#fbfff7] text-[#174b27] select-none font-sans"
            style={{ width: '794px', height: '1123px' }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Pacifico&display=swap');
                .font-pacifico { font-family: 'Pacifico', cursive; }
                .font-dmsans { font-family: 'DM Sans', sans-serif; }
            `}</style>

            {/* Decorative Floating Leaves */}
            <div className="absolute left-[20px] top-[110px] text-[#2d8c3c] text-3xl select-none pointer-events-none opacity-40 rotate-[-30deg] z-0">
                ⌁
            </div>
            <div className="absolute right-[20px] top-[180px] text-[#2d8c3c] text-3xl select-none pointer-events-none opacity-40 rotate-[25deg] z-0">
                ⌁
            </div>
            <div className="absolute left-[15px] top-[430px] text-[#2d8c3c] text-4xl select-none pointer-events-none opacity-30 z-0">
                ❧
            </div>
            <div className="absolute right-[15px] top-[540px] text-[#2d8c3c] text-4xl select-none pointer-events-none opacity-30 z-0">
                ❧
            </div>

            {/* ── HEADER ── */}
            {!excludeHeader && (
                <header className="h-[235px] px-8 pt-6 pb-4 flex flex-col justify-between relative z-10 shrink-0 border-b border-[#2d8c3c]/20">
                    <div className="flex items-start justify-between">
                        {/* Shop Logo & Name */}
                        <div className="flex items-center gap-4">
                            {shopData.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={shopData.logoUrl}
                                    alt="Shop Logo"
                                    className="w-16 h-16 object-contain bg-white rounded-2xl p-2 shadow-sm border border-[#2d8c3c]/25"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-white border border-[#2d8c3c]/30 flex flex-col items-center justify-center text-[#174b27] shadow-sm">
                                    <Sprout className="w-6 h-6 text-[#15863b]" />
                                    <span className="text-[9px] font-black uppercase mt-0.5 tracking-wider">
                                        {shopData.shopName ? shopData.shopName.substring(0, 6) : "ORGANIC"}
                                    </span>
                                </div>
                            )}

                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight text-[#174b27] font-dmsans">
                                    {shopData.shopName || "NATURE'S BASKET"}
                                </h2>
                                <p className="text-xs font-bold text-[#2d8c3c] tracking-wider flex items-center gap-1 mt-0.5 font-dmsans">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    100% Farm Fresh & Daily Handpicked
                                </p>
                            </div>
                        </div>

                        {/* Top Micro Tagline */}
                        <div className="text-right">
                            <span className="font-pacifico text-lg text-[#27723a] leading-tight block">
                                Fresh Choices
                            </span>
                            <span className="text-[11px] font-bold text-[#15863b] uppercase tracking-widest block mt-0.5 font-dmsans">
                                Healthier You
                            </span>
                        </div>
                    </div>

                    {/* Campaign Title & Subtitle */}
                    <div className="flex items-end justify-between mt-2 pt-2 border-t border-[#174b27]/10">
                        <div className="flex-1 mr-4">
                            <EditableText
                                as="h1"
                                value={campaignInfo.title || "Fresh Deals"}
                                onChange={(val) => onFieldChange?.('title', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit campaign title..."
                                className="font-pacifico text-4xl text-[#197136] drop-shadow-sm leading-none"
                            />
                            <EditableText
                                as="p"
                                value={campaignInfo.subtitle || "Farm Fresh • Great Prices"}
                                onChange={(val) => onFieldChange?.('subtitle', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit subtitle..."
                                className="text-sm font-bold text-[#315c3a] mt-1 font-dmsans tracking-wide"
                            />
                        </div>

                        {(campaignInfo.validFrom || campaignInfo.validTo) && (
                            <div className="bg-[#13813a] text-white px-4 py-2 rounded-2xl shadow-sm text-right shrink-0">
                                <span className="text-[10px] uppercase text-[#a7f3d0] block font-bold font-dmsans">Offer Validity</span>
                                <span className="text-xs font-black text-white font-dmsans">
                                    {campaignInfo.validFrom || "Today"} - {campaignInfo.validTo || "Until Stock Lasts"}
                                </span>
                            </div>
                        )}
                    </div>
                </header>
            )}

            {/* ── PRODUCT GRID ── */}
            <main className="flex-1 p-6 overflow-hidden flex flex-col justify-center relative z-10 font-dmsans">
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
                            variant="fresh"
                            accentColor="#15863b"
                            density={rows >= 5 ? 'dense' : rows === 4 ? 'compact' : 'normal'}
                            imageContainerClassName={
                                rows >= 5 ? "max-h-[85px] aspect-auto h-[85px]" :
                                rows === 4 ? "max-h-[125px] aspect-auto h-[125px]" :
                                "aspect-square max-h-[175px]"
                            }
                            className="h-full bg-white/95 shadow-sm border-2 border-emerald-500/20 hover:border-emerald-500/50"
                        />
                    ))}
                </div>
            </main>

            {/* ── FOOTER ── */}
            <footer className="relative mt-auto h-[100px] bg-[#13813a] text-white px-8 flex flex-col justify-between py-3 shrink-0 z-20 font-dmsans before:content-[''] before:absolute before:-top-[20px] before:left-0 before:w-full before:h-[28px] before:bg-[#13813a] before:rounded-t-[50%]">
                {/* Trust Points */}
                <div className="relative z-10 flex items-center justify-around border-b border-white/20 pb-2 text-xs font-bold text-[#d1fae5]">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm">❧</span>
                        <span>Fresh Quality</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#a7f3d0]" />
                        <span>Best Prices</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-[#a7f3d0]" />
                        <span>Happier Families</span>
                    </div>
                </div>

                {/* Shop Branches & Contact */}
                <div className="relative z-10 flex items-center justify-between text-xs font-medium text-white/95">
                    <div className="flex items-center gap-2 max-w-[65%] truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#a7f3d0] shrink-0" />
                        <span className="truncate">
                            {shopData.branches && shopData.branches.length > 0
                                ? `Branches: ${shopData.branches.join("  •  ")}`
                                : "Available in all neighborhood stores"}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-bold">
                        {shopData.shopPhone && (
                            <div className="flex items-center gap-1.5 text-[#a7f3d0]">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{shopData.shopPhone}</span>
                            </div>
                        )}
                        <span className="bg-white text-[#13813a] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            Fresh Today
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
