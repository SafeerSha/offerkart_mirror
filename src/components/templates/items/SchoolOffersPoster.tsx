"use client";

import React from 'react';
import { TemplateProps } from '../types';
import { ProductSlot } from '../shared/ProductSlot';
import { EditableText } from '../shared/EditableText';
import { Phone, MapPin, Sparkles, BookOpen, Smile } from 'lucide-react';

export function SchoolOffersPosterTemplate({
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
            className="w-[794px] h-[1123px] max-w-[794px] max-h-[1123px] shrink-0 relative flex flex-col overflow-hidden bg-[#f8fbff] text-[#102e59] select-none font-sans"
            style={{ width: '794px', height: '1123px' }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@600;700;800;900&display=swap');
                .font-baloo { font-family: 'Baloo 2', cursive, sans-serif; }
                .font-nunito { font-family: 'Nunito', sans-serif; }
            `}</style>

            {/* Playful School Doodles */}
            <div className="absolute left-[30px] top-[30px] text-[#9bb7d9] opacity-40 text-2xl select-none pointer-events-none z-0">
                ✧
            </div>
            <div className="absolute right-[40px] top-[40px] text-[#9bb7d9] opacity-40 text-2xl select-none pointer-events-none z-0">
                ☆
            </div>
            <div className="absolute left-[25px] top-[260px] text-[#9bb7d9] opacity-35 text-3xl select-none pointer-events-none z-0">
                ✈
            </div>
            <div className="absolute right-[30px] top-[320px] text-[#9bb7d9] opacity-35 text-3xl select-none pointer-events-none z-0">
                ☼
            </div>
            <div className="absolute left-[20px] top-[500px] text-[#9bb7d9] opacity-30 text-2xl select-none pointer-events-none z-0">
                ✧
            </div>
            <div className="absolute right-[25px] top-[550px] text-[#9bb7d9] opacity-30 text-2xl select-none pointer-events-none z-0">
                ✎
            </div>

            {/* Pencil Graphic */}
            <div className="absolute right-[50px] top-[140px] text-5xl text-[#ef4d23] select-none pointer-events-none rotate-[18deg] opacity-70 z-0">
                ✎
            </div>

            {/* ── HEADER ── */}
            {!excludeHeader && (
                <header className="h-[245px] px-8 pt-6 pb-4 flex flex-col justify-between relative z-10 shrink-0 border-b border-[#173d73]/15 font-nunito">
                    <div className="flex items-start justify-between">
                        {/* Shop Logo & Name */}
                        <div className="flex items-center gap-4">
                            {shopData.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={shopData.logoUrl}
                                    alt="Shop Logo"
                                    className="w-16 h-16 object-contain bg-white rounded-2xl p-2 shadow-sm border border-[#173d73]/20"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#173d73]/30 flex flex-col items-center justify-center text-[#173d73] shadow-sm font-black text-[10px] leading-tight text-center">
                                    <Sparkles className="w-5 h-5 text-[#ef4d23] mb-0.5" />
                                    <span>{shopData.shopName ? shopData.shopName.substring(0, 6) : "SCHOOL"}</span>
                                </div>
                            )}

                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight text-[#173d73]">
                                    {shopData.shopName || "STATIONERY HUB"}
                                </h2>
                                <p className="text-xs font-bold text-[#ef4d23] tracking-wider mt-0.5">
                                    Back To School • Best Gear & Supplies
                                </p>
                            </div>
                        </div>

                        {/* Top Micro Tagline */}
                        <div className="text-right">
                            <span className="text-xs font-extrabold text-[#173d73] leading-tight block">
                                Learn Today
                            </span>
                            <span className="text-[11px] font-bold text-[#ef4d23] block">
                                A Brighter Tomorrow
                            </span>
                        </div>
                    </div>

                    {/* Campaign Title & Subtitle */}
                    <div className="flex items-end justify-between mt-2 pt-2 border-t border-[#173d73]/10">
                        <div className="flex-1 mr-4">
                            <div className="flex items-center gap-3">
                                <EditableText
                                    as="h1"
                                    value={campaignInfo.title || "SCHOOL OFFERS"}
                                    onChange={(val) => onFieldChange?.('title', val)}
                                    isEditable={isEditable}
                                    placeholder="Click to edit campaign title..."
                                    className="font-baloo text-4xl font-black tracking-tight text-[#173d73] leading-none"
                                />
                                <div className="bg-[#ffdc19] text-[#ef4d23] border-2 border-[#173d73] rounded-lg px-3 py-1 font-baloo text-xl font-black -rotate-2 shadow-[2px_2px_0px_#173d73] shrink-0">
                                    SAVE BIG!
                                </div>
                            </div>
                            <EditableText
                                as="p"
                                value={campaignInfo.subtitle || "Everything for a Brighter Academic Year"}
                                onChange={(val) => onFieldChange?.('subtitle', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit subtitle..."
                                className="text-sm font-extrabold text-[#173d73]/80 mt-1 tracking-wide"
                            />
                        </div>

                        {(campaignInfo.validFrom || campaignInfo.validTo) && (
                            <div className="bg-[#173d73] text-white px-4 py-2 rounded-2xl shadow-sm text-right shrink-0">
                                <span className="text-[10px] uppercase text-[#ffdc19] block font-bold">School Season</span>
                                <span className="text-xs font-black text-white">
                                    {campaignInfo.validFrom || "This Term"} - {campaignInfo.validTo || "Limited Stocks"}
                                </span>
                            </div>
                        )}
                    </div>
                </header>
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
                            variant="school"
                            accentColor="#1f5bb5"
                            density={rows >= 5 ? 'dense' : rows === 4 ? 'compact' : 'normal'}
                            imageContainerClassName={
                                rows >= 5 ? "max-h-[85px] aspect-auto h-[85px]" :
                                rows === 4 ? "max-h-[125px] aspect-auto h-[125px]" :
                                "aspect-square max-h-[175px]"
                            }
                            className="h-full bg-white/95 shadow-sm border-2 border-[#173d73]/20 hover:border-[#1f5bb5]/60"
                        />
                    ))}
                </div>
            </main>

            {/* ── FOOTER ── */}
            <footer className="relative mt-auto h-[100px] bg-[#ffdd1a] text-[#173d73] px-8 flex flex-col justify-between py-3 shrink-0 z-20 font-nunito before:content-[''] before:absolute before:-top-[20px] before:left-0 before:w-full before:h-[28px] before:bg-[#ffdd1a] before:rounded-t-[50%]">
                {/* School Trust Points */}
                <div className="relative z-10 flex items-center justify-around border-b border-[#173d73]/15 pb-2 text-xs font-black">
                    <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#173d73]" />
                        <span>Shop Now • Save More</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Smile className="w-4 h-4 text-[#173d73]" />
                        <span>Quality for Growing Minds</span>
                    </div>
                </div>

                {/* Shop Branches & Contact */}
                <div className="relative z-10 flex items-center justify-between text-xs font-bold text-[#173d73]">
                    <div className="flex items-center gap-2 max-w-[65%] truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#ef4d23] shrink-0" />
                        <span className="truncate">
                            {shopData.branches && shopData.branches.length > 0
                                ? `Stores: ${shopData.branches.join("  •  ")}`
                                : "Available in all retail stationery outlets"}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-extrabold">
                        {shopData.shopPhone && (
                            <div className="flex items-center gap-1.5 text-[#173d73]">
                                <Phone className="w-3.5 h-3.5 text-[#ef4d23]" />
                                <span>{shopData.shopPhone}</span>
                            </div>
                        )}
                        <span className="bg-[#173d73] text-[#ffdd1a] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            Student Deals
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
