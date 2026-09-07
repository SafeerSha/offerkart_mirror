"use client";

import React from 'react';
import { TemplateProps } from '../types';
import { ProductSlot } from '../shared/ProductSlot';
import { EditableText } from '../shared/EditableText';
import { Phone, MapPin, Sparkles, Sprout } from 'lucide-react';

export function FreshDealsGreenTemplate({
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
    const rows = gridConfig?.rows ?? 3;
    const columns = gridConfig?.columns ?? 3;
    const totalSlots = rows * columns;

    return (
        <div
            className="w-[794px] h-[1123px] max-w-[794px] max-h-[1123px] shrink-0 relative flex flex-col overflow-hidden bg-emerald-900 select-none font-sans"
            style={{ width: '794px', height: '1123px' }}
        >
            {/* ── HEADER ── */}
            {!excludeHeader && (
                <header className="h-[220px] bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-800 text-white px-8 py-6 flex flex-col justify-between relative shadow-lg shrink-0">
                    <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-4">
                            {shopData.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={shopData.logoUrl}
                                    alt="Shop Logo"
                                    className="w-20 h-20 object-contain bg-white rounded-2xl p-2 shadow-md border-2 border-emerald-400/30"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-200 shadow-inner">
                                    <Sprout className="w-8 h-8" />
                                </div>
                            )}

                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow">
                                    {shopData.shopName || "FRESH SUPERMARKET"}
                                </h2>
                                <p className="text-xs font-semibold text-emerald-200 tracking-wider flex items-center gap-1.5 mt-0.5">
                                    <Sparkles className="w-3.5 h-3.5 text-lime-300" />
                                    100% Farm Fresh & Organic Selection
                                </p>
                            </div>
                        </div>

                        <div className="bg-lime-400 text-emerald-950 font-black text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow">
                            FRESH ARRIVALS
                        </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-emerald-600/40 pt-2 z-10">
                        <div className="flex-1 mr-4">
                            <EditableText
                                as="h1"
                                value={campaignInfo.title || "FRESH MARKET SPECIALS"}
                                onChange={(val) => onFieldChange?.('title', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit campaign title..."
                                className="text-4xl font-black uppercase tracking-tight text-lime-300 drop-shadow leading-none"
                            />
                            <EditableText
                                as="p"
                                value={campaignInfo.subtitle || "Handpicked fresh vegetables, fruits, dairy & daily groceries!"}
                                onChange={(val) => onFieldChange?.('subtitle', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit subtitle..."
                                className="text-xs font-medium text-emerald-100 mt-1"
                            />
                        </div>

                        {(campaignInfo.validFrom || campaignInfo.validTo) && (
                            <div className="bg-black/25 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-emerald-400/20 text-right shrink-0">
                                <span className="text-[10px] uppercase text-emerald-200 block font-bold">Offer Validity</span>
                                <span className="text-xs font-extrabold text-white">
                                    {campaignInfo.validFrom || "Today"} - {campaignInfo.validTo || "Until Stock Lasts"}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Subtle Glow Backgrounds */}
                    <div className="absolute top-0 right-1/4 w-72 h-72 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />
                </header>
            )}

            {/* ── PRODUCT GRID BODY ── */}
            <main className="flex-1 bg-emerald-50/40 p-6 overflow-hidden flex flex-col justify-center">
                <div
                    className="grid gap-3.5 w-full h-full max-h-full"
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
                            accentColor="#16a34a"
                            density={rows >= 5 ? 'dense' : rows === 4 ? 'compact' : 'normal'}
                            imageContainerClassName={
                                rows >= 5 ? "max-h-[85px] aspect-auto h-[85px]" :
                                rows === 4 ? "max-h-[125px] aspect-auto h-[125px]" :
                                "aspect-square max-h-[160px]"
                            }
                            className="h-full"
                        />
                    ))}
                </div>
            </main>

            {/* ── FOOTER ── */}
            <footer className="h-[65px] bg-emerald-950 text-emerald-100 px-8 flex items-center justify-between text-xs font-medium border-t border-emerald-800 shrink-0 z-10">
                <div className="flex items-center gap-2 max-w-[60%] truncate">
                    <MapPin className="w-4 h-4 text-lime-400 shrink-0" />
                    <span className="truncate">
                        {shopData.branches && shopData.branches.length > 0
                            ? `Branches: ${shopData.branches.join("  •  ")}`
                            : "Available at all fresh outlets"}
                    </span>
                </div>

                <div className="flex items-center gap-6 shrink-0 font-bold">
                    {shopData.shopPhone && (
                        <div className="flex items-center gap-1.5 text-lime-300">
                            <Phone className="w-4 h-4" />
                            <span>{shopData.shopPhone}</span>
                        </div>
                    )}
                    <span className="bg-lime-400 text-emerald-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                        Fresh Every Day
                    </span>
                </div>
            </footer>
        </div>
    );
}
