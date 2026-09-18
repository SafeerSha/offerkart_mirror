"use client";

import React from 'react';
import { TemplateProps } from '../types';
import { ProductSlot } from '../shared/ProductSlot';
import { EditableText } from '../shared/EditableText';
import { ShopLogo } from '../shared/ShopLogo';
import { Phone, MapPin, Sparkles } from 'lucide-react';

export function OnamSpecialOffersPosterTemplate({
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
            className="w-[794px] h-[1123px] max-w-[794px] max-h-[1123px] shrink-0 relative flex flex-col overflow-hidden bg-[#fff9e8] text-[#7b321b] select-none font-sans"
            style={{ width: '794px', height: '1123px' }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Kalam:wght@400;700&family=Nunito:wght@600;700;800;900&display=swap');
                .font-serif-display { font-family: 'DM Serif Display', serif; }
                .font-kalam { font-family: 'Kalam', cursive; }
                .font-nunito { font-family: 'Nunito', sans-serif; }
            `}</style>

            {/* Background Boat & Flower Accents */}
            <div className="absolute bottom-[100px] right-[20px] text-7xl select-none pointer-events-none opacity-20 rotate-[-4deg] z-0">
                ⛵
            </div>
            <div className="absolute bottom-[130px] left-[30px] text-[#e6a822] text-2xl select-none pointer-events-none opacity-40 z-0">
                ✿ ✿
            </div>

            {/* ── HEADER ── */}
            {!excludeHeader && (
                <>
                    {/* Decorative Palm Leaves & Flowers */}
                    <div className="absolute left-[-15px] top-[40px] text-[#2b7b3d] text-6xl select-none pointer-events-none opacity-40 rotate-[-25deg] z-0">
                        ❧
                    </div>
                    <div className="absolute right-[-20px] top-[110px] text-[#2b7b3d] text-6xl select-none pointer-events-none opacity-40 rotate-[20deg] z-0">
                        ❧
                    </div>
                    <div className="absolute left-[50px] top-[170px] text-[#eeb52a] text-3xl select-none pointer-events-none opacity-50 z-0">
                        ✿
                    </div>
                    <div className="absolute right-[50px] top-[230px] text-[#eeb52a] text-3xl select-none pointer-events-none opacity-50 z-0">
                        ✿
                    </div>

                    <header className="h-[240px] px-8 pt-6 pb-4 flex flex-col justify-between relative z-10 shrink-0 border-b border-[#f2c13c]/40 font-nunito">
                        <div className="flex items-start justify-between">
                            {/* Shop Logo & Name */}
                            <div className="flex items-center gap-4">
                                <ShopLogo
                                    logoUrl={shopData.logoUrl}
                                    shopName={shopData.shopName}
                                    className="w-16 h-16 object-contain bg-white rounded-2xl p-2 shadow-sm border border-[#eeb52a]/50"
                                    fallback={
                                        <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#eeb52a]/60 flex flex-col items-center justify-center text-[#19703a] shadow-sm font-black text-[10px] leading-tight text-center">
                                            <Sparkles className="w-5 h-5 text-[#eeb52a] mb-0.5" />
                                            <span>{shopData.shopName ? shopData.shopName.substring(0, 6) : "FESTIVE"}</span>
                                        </div>
                                    }
                                />

                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-[#19703a]">
                                        {shopData.shopName || "GRAND BAZAAR"}
                                    </h2>
                                    <p className="text-xs font-bold text-[#a44722] tracking-wider mt-0.5">
                                        Festive Celebrations • Pure Tradition
                                    </p>
                                </div>
                            </div>

                            {/* Top Micro Note */}
                            <div className="text-right">
                                <span className="font-kalam text-base font-bold text-[#356a36] leading-tight block">
                                    Celebrate Traditions
                                </span>
                                <span className="font-kalam text-sm font-bold text-[#a44722] block">
                                    Together with Family
                                </span>
                            </div>
                        </div>

                        {/* Offer Title & Subtitle */}
                        <div className="flex items-end justify-between mt-2 pt-2 border-t border-[#f2c13c]/30">
                            <div className="flex-1 mr-4">
                                <div className="flex items-baseline gap-2">
                                    <EditableText
                                        as="h1"
                                        value={campaignInfo.title || "Onam Special Offers"}
                                        onChange={(val) => onFieldChange?.('title', val)}
                                        isEditable={isEditable}
                                        placeholder="Click to edit offer title..."
                                        className="font-serif-display text-4xl text-[#19703a] leading-none"
                                    />
                                </div>
                                <EditableText
                                    as="p"
                                    value={campaignInfo.subtitle || "Traditional Goodness • Special Prices"}
                                    onChange={(val) => onFieldChange?.('subtitle', val)}
                                    isEditable={isEditable}
                                    placeholder="Click to edit subtitle..."
                                    className="font-kalam text-sm font-bold text-[#a44722] mt-1 tracking-wide"
                                />
                            </div>

                            {(campaignInfo.validFrom || campaignInfo.validTo) && (
                                <div className="bg-[#19703a] text-white px-4 py-2 rounded-2xl shadow-sm text-right shrink-0">
                                    <span className="text-[10px] uppercase text-[#f2c13c] block font-bold font-nunito">Festive Period</span>
                                    <span className="text-xs font-black text-white font-nunito">
                                        {campaignInfo.validFrom || "This Season"} - {campaignInfo.validTo || "Offer Ends Soon"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </header>
                </>
            )}

            {/* ── PRODUCT GRID ── */}
            <main className="flex-1 p-6 overflow-hidden flex flex-col justify-center relative z-10 font-nunito">
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
                            variant="festive"
                            accentColor="#218340"
                            density={rows >= 5 ? 'dense' : rows === 4 ? 'compact' : 'normal'}
                            imageContainerClassName={
                                rows >= 5 ? "max-h-[75px] aspect-auto h-[75px]" :
                                    rows === 4 ? "max-h-[100px] aspect-auto h-[100px]" :
                                        rows === 3 ? "max-h-[140px] aspect-auto h-[140px]" :
                                            "aspect-square max-h-[175px]"
                            }
                            className="h-full bg-white/95 shadow-sm border-2 border-[#f2c13c]/40 hover:border-[#19703a]/50"
                        />
                    ))}
                </div>
            </main>

            {/* ── FOOTER ── */}
            <footer className="relative mt-auto h-[100px] bg-[#f2c13c] text-[#19703a] px-8 flex flex-col justify-between py-3 shrink-0 z-20 font-nunito before:content-[''] before:absolute before:-top-[22px] before:left-0 before:w-full before:h-[30px] before:bg-[#f2c13c] before:rounded-t-[50%]">
                {/* Festive Message */}
                <div className="relative z-10 text-center border-b border-[#19703a]/15 pb-1">
                    <span className="font-extrabold text-sm tracking-wide">
                        Goodness for Every Home ✿ Celebrate • Share • Enjoy
                    </span>
                </div>

                {/* Shop Branches & Contact */}
                <div className="relative z-10 flex items-center justify-between text-xs font-bold text-[#19703a]">
                    <div className="flex items-center gap-2 max-w-[65%] truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#a44722] shrink-0" />
                        <span className="truncate">
                            {shopData.branches && shopData.branches.length > 0
                                ? `Branches: ${shopData.branches.join("  •  ")}`
                                : "Available across all festival branches"}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        {shopData.shopPhone && (
                            <div className="flex items-center gap-1.5 text-[#19703a]">
                                <Phone className="w-3.5 h-3.5 text-[#a44722]" />
                                <span>{shopData.shopPhone}</span>
                            </div>
                        )}
                        <span className="bg-[#19703a] text-[#f2c13c] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            Onam Mega Deal
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
