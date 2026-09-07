"use client";

import React from 'react';
import { TemplateProps } from '../types';
import { ProductSlot } from '../shared/ProductSlot';
import { EditableText } from '../shared/EditableText';
import { Phone, MapPin, Store } from 'lucide-react';

export function HypermarketRedTemplate({
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
    const columns = gridConfig?.columns ?? 3;
    const totalSlots = rows * columns;

    return (
        <div
            className="w-[794px] h-[1123px] max-w-[794px] max-h-[1123px] shrink-0 relative flex flex-col overflow-hidden bg-white select-none font-sans"
            style={{ width: '794px', height: '1123px' }}
        >
            {/* ── HEADER ── */}
            {!excludeHeader && (
                <header className="h-[210px] bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white px-8 py-5 flex flex-col justify-between relative shadow-md shrink-0">
                    {/* Top Row: Logo & Shop Identity */}
                    <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-4">
                            {shopData.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={shopData.logoUrl}
                                    alt="Shop Logo"
                                    className="w-20 h-20 object-contain bg-white rounded-xl p-1.5 shadow-lg border-2 border-white/20"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner">
                                    <Store className="w-8 h-8" />
                                </div>
                            )}

                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow">
                                    {shopData.shopName || "GRAND HYPERMARKET"}
                                </h2>
                                <p className="text-xs font-semibold text-red-100 tracking-wider uppercase mt-0.5">
                                    Best Prices & Quality Assured
                                </p>
                            </div>
                        </div>

                        {/* Top Right: Promo Badge */}
                        <div className="bg-yellow-400 text-red-950 font-black text-xs px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg transform rotate-2">
                            SUPER DEALS
                        </div>
                    </div>

                    {/* Bottom Row: Campaign Headline */}
                    <div className="flex items-end justify-between border-t border-red-500/50 pt-2 z-10">
                        <div className="flex-1 mr-4">
                            <EditableText
                                as="h1"
                                value={campaignInfo.title || "WEEKEND MEGA SAVINGS"}
                                onChange={(val) => onFieldChange?.('title', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit campaign title..."
                                className="text-4xl font-black uppercase tracking-tight text-yellow-300 drop-shadow-md leading-none"
                            />
                            <EditableText
                                as="p"
                                value={campaignInfo.subtitle || "Massive discounts across all groceries & household essentials!"}
                                onChange={(val) => onFieldChange?.('subtitle', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit subtitle..."
                                className="text-xs font-medium text-red-50 mt-1"
                            />
                        </div>

                        {/* Campaign Dates */}
                        {(campaignInfo.validFrom || campaignInfo.validTo) && (
                            <div className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 text-right shrink-0">
                                <span className="text-[10px] uppercase text-red-200 block font-bold">Valid Period</span>
                                <span className="text-xs font-extrabold text-white">
                                    {campaignInfo.validFrom || "Starts Now"} - {campaignInfo.validTo || "Limited Time"}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-80 h-full bg-white/5 skew-x-12 pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-yellow-400/10 blur-2xl pointer-events-none" />
                </header>
            )}

            {/* ── PRODUCT GRID BODY ── */}
            <main className="flex-1 bg-gradient-to-b from-gray-50 to-red-50/20 p-5 overflow-hidden flex flex-col justify-center">
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
                            variant="retail"
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
            <footer className="h-[65px] bg-red-800 text-white px-8 flex items-center justify-between text-xs font-medium border-t-2 border-red-900 shrink-0 shadow-inner z-10">
                <div className="flex items-center gap-2 max-w-[60%] truncate">
                    <MapPin className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span className="truncate">
                        {shopData.branches && shopData.branches.length > 0
                            ? `Branches: ${shopData.branches.join("  •  ")}`
                            : "Available across all store branches"}
                    </span>
                </div>

                <div className="flex items-center gap-6 shrink-0 font-bold">
                    {shopData.shopPhone && (
                        <div className="flex items-center gap-1.5 text-yellow-300">
                            <Phone className="w-4 h-4" />
                            <span>{shopData.shopPhone}</span>
                        </div>
                    )}
                    <span className="bg-yellow-400 text-red-900 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                        T&C Apply
                    </span>
                </div>
            </footer>
        </div>
    );
}
