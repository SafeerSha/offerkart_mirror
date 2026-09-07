"use client";

import React from 'react';
import { TemplateProps } from '../types';
import { ProductSlot } from '../shared/ProductSlot';
import { EditableText } from '../shared/EditableText';
import { Phone, MapPin, Sparkles, Check, Heart, Box } from 'lucide-react';

export function EverydayEssentialsPosterTemplate({
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
            className="w-[794px] h-[1123px] max-w-[794px] max-h-[1123px] shrink-0 relative flex flex-col overflow-hidden bg-[#f7f5ef] text-[#17383d] select-none font-sans"
            style={{ width: '794px', height: '1123px' }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,600&family=Inter:wght@400;500;600;700;800;900&display=swap');
                .font-playfair { font-family: 'Playfair Display', Georgia, serif; }
            `}</style>

            {/* Background Botanical Flourishes */}
            <div className="absolute right-[-20px] top-[140px] text-[#5c7d61] text-6xl select-none pointer-events-none opacity-40 rotate-[18deg] z-0">
                ❧
            </div>
            <div className="absolute left-[-25px] top-[370px] text-[#5c7d61] text-7xl select-none pointer-events-none opacity-30 rotate-[-22deg] z-0">
                ❧
            </div>
            <div className="absolute right-[-15px] top-[600px] text-[#5c7d61] text-6xl select-none pointer-events-none opacity-30 rotate-[12deg] z-0">
                ❧
            </div>

            {/* ── HEADER ── */}
            {!excludeHeader && (
                <header className="h-[235px] px-8 pt-6 pb-4 flex flex-col justify-between relative z-10 shrink-0 border-b border-[#5c7d61]/20">
                    <div className="flex items-start justify-between">
                        {/* Shop Logo & Name */}
                        <div className="flex items-center gap-4">
                            {shopData.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={shopData.logoUrl}
                                    alt="Shop Logo"
                                    className="w-16 h-16 object-contain bg-white rounded-xl p-2 shadow-sm border border-[#17383d]/15"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-xl bg-white border border-[#17383d]/20 flex flex-col items-center justify-center text-[#17383d] shadow-sm font-black text-[10px] leading-tight text-center">
                                    <Sparkles className="w-5 h-5 text-[#5c7d61] mb-1" />
                                    <span>{shopData.shopName ? shopData.shopName.substring(0, 8).toUpperCase() : "STORE"}</span>
                                </div>
                            )}

                            <div>
                                <h2 className="text-2xl font-extrabold uppercase tracking-tight text-[#17383d]">
                                    {shopData.shopName || "EVERYDAY STORE"}
                                </h2>
                                <p className="text-xs font-semibold text-[#5c7d61] tracking-wider mt-0.5">
                                    Quality Assured • Best Value
                                </p>
                            </div>
                        </div>

                        {/* Top Micro Tagline */}
                        <div className="text-right">
                            <span className="font-playfair text-base font-semibold italic text-[#25434a] leading-tight block">
                                Live Better Everyday
                            </span>
                            <span className="text-[11px] font-bold text-[#5c7d61] uppercase tracking-widest block mt-0.5">
                                Curated Essentials
                            </span>
                        </div>
                    </div>

                    {/* Campaign Title & Subtitle */}
                    <div className="flex items-end justify-between mt-2 pt-2 border-t border-[#17383d]/10">
                        <div className="flex-1 mr-4">
                            <EditableText
                                as="h1"
                                value={campaignInfo.title || "Everyday Essentials"}
                                onChange={(val) => onFieldChange?.('title', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit campaign title..."
                                className="font-playfair text-4xl font-bold tracking-tight text-[#17383d] leading-none"
                            />
                            <EditableText
                                as="p"
                                value={campaignInfo.subtitle || "Great Products • Great Prices"}
                                onChange={(val) => onFieldChange?.('subtitle', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit subtitle..."
                                className="text-sm font-bold text-[#5c7d61] mt-1 tracking-wide"
                            />
                        </div>

                        {(campaignInfo.validFrom || campaignInfo.validTo) && (
                            <div className="bg-[#17383d] text-white px-4 py-2 rounded-xl shadow-sm text-right shrink-0">
                                <span className="text-[10px] uppercase text-[#a5c4ab] block font-bold">Limited Period</span>
                                <span className="text-xs font-black text-white">
                                    {campaignInfo.validFrom || "Now"} - {campaignInfo.validTo || "Stock Lasts"}
                                </span>
                            </div>
                        )}
                    </div>
                </header>
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
                            variant="botanical"
                            accentColor="#17383d"
                            density={rows >= 5 ? 'dense' : rows === 4 ? 'compact' : 'normal'}
                            imageContainerClassName={
                                rows >= 5 ? "max-h-[85px] aspect-auto h-[85px]" :
                                rows === 4 ? "max-h-[125px] aspect-auto h-[125px]" :
                                "aspect-square max-h-[175px]"
                            }
                            className="h-full bg-white/90 shadow-sm border border-[#17383d]/15 hover:border-[#17383d]/40"
                        />
                    ))}
                </div>
            </main>

            {/* ── FOOTER ── */}
            <footer className="relative mt-auto h-[100px] bg-[#173f45] text-white px-8 flex flex-col justify-between py-3 shrink-0 z-20 before:content-[''] before:absolute before:-top-[20px] before:left-0 before:w-full before:h-[28px] before:bg-[#173f45] before:rounded-t-[50%]">
                {/* Trust Points */}
                <div className="relative z-10 flex items-center justify-around border-b border-white/15 pb-2 text-xs font-bold text-[#e1ece4]">
                    <div className="flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-[#a5c4ab]" />
                        <span>Fast & Reliable</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#a5c4ab]" />
                        <span>Quality Assured</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-[#a5c4ab]" />
                        <span>Shop with Confidence</span>
                    </div>
                </div>

                {/* Shop Branches & Contact */}
                <div className="relative z-10 flex items-center justify-between text-xs font-medium text-white/90">
                    <div className="flex items-center gap-2 max-w-[65%] truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#a5c4ab] shrink-0" />
                        <span className="truncate">
                            {shopData.branches && shopData.branches.length > 0
                                ? `Branches: ${shopData.branches.join("  •  ")}`
                                : "Available across all local outlets"}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-bold">
                        {shopData.shopPhone && (
                            <div className="flex items-center gap-1.5 text-[#a5c4ab]">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{shopData.shopPhone}</span>
                            </div>
                        )}
                        <span className="bg-[#5c7d61] text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-wider">
                            Shop Local
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
