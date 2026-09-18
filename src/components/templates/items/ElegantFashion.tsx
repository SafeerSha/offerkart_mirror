"use client";

import React from 'react';
import { TemplateProps } from '../types';
import { ProductSlot } from '../shared/ProductSlot';
import { EditableText } from '../shared/EditableText';
import { ShopLogo } from '../shared/ShopLogo';
import { Phone, MapPin, Sparkles, Gem } from 'lucide-react';

export function ElegantFashionTemplate({
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
    const columns = gridConfig?.columns ?? 2;
    const totalSlots = rows * columns;

    return (
        <div
            className="w-[794px] h-[1123px] max-w-[794px] max-h-[1123px] shrink-0 relative flex flex-col overflow-hidden bg-[#faf8f5] select-none font-serif"
            style={{ width: '794px', height: '1123px' }}
        >
            {/* ── HEADER ── */}
            {!excludeHeader && (
                <header className="h-[210px] bg-[#1a1715] text-[#f5f1eb] px-10 py-6 flex flex-col justify-between relative shadow-lg shrink-0 border-b border-amber-500/20">
                    <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-4 font-sans">
                            <ShopLogo
                                logoUrl={shopData.logoUrl}
                                shopName={shopData.shopName}
                                className="w-18 h-18 object-contain bg-white/5 backdrop-blur-md rounded-xl p-2 border border-amber-300/30"
                                fallback={
                                    <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
                                        <Gem className="w-7 h-7" />
                                    </div>
                                }
                            />

                            <div>
                                <h2 className="text-2xl font-normal tracking-[0.2em] uppercase text-white font-serif">
                                    {shopData.shopName || "MAISON DE FASHION"}
                                </h2>
                                <p className="text-[11px] text-amber-200/80 tracking-[0.3em] uppercase mt-0.5">
                                    Haute Couture & Ready-To-Wear
                                </p>
                            </div>
                        </div>

                        <div className="border border-amber-400/50 text-amber-300 font-sans text-[10px] font-bold px-3.5 py-1.5 uppercase tracking-[0.25em]">
                            NEW COLLECTION
                        </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-white/10 pt-3 z-10 font-sans">
                        <div className="flex-1 mr-4">
                            <EditableText
                                as="h1"
                                value={campaignInfo.title || "SEASONAL EDIT: UP TO 50% OFF"}
                                onChange={(val) => onFieldChange?.('title', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit offer title..."
                                className="text-3xl font-light tracking-wide text-amber-200 uppercase leading-none font-serif"
                            />
                            <EditableText
                                as="p"
                                value={campaignInfo.subtitle || "Curated seasonal styles crafted for timeless elegance & luxury."}
                                onChange={(val) => onFieldChange?.('subtitle', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit subtitle..."
                                className="text-xs font-light text-stone-300 mt-1 font-serif italic"
                            />
                        </div>

                        {(campaignInfo.validFrom || campaignInfo.validTo) && (
                            <div className="text-right shrink-0 font-serif">
                                <span className="text-[10px] uppercase text-amber-300/70 block tracking-widest">Available Until</span>
                                <span className="text-xs text-white tracking-wider">
                                    {campaignInfo.validTo || "Limited Edition"}
                                </span>
                            </div>
                        )}
                    </div>
                </header>
            )}

            {/* ── PRODUCT GRID ── */}
            <main className="flex-1 bg-[#f7f4ee] p-8 overflow-hidden flex flex-col justify-center font-sans">
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
                            variant="minimal"
                            accentColor="#b45309"
                            density={rows >= 5 ? 'dense' : rows === 4 ? 'compact' : 'normal'}
                            imageContainerClassName={
                                rows >= 5 ? "max-h-[75px] aspect-auto h-[75px]" :
                                    rows === 4 ? "max-h-[100px] aspect-auto h-[100px]" :
                                        rows === 3 ? "max-h-[140px] aspect-auto h-[140px]" :
                                            "aspect-square max-h-[175px]"
                            }
                            className="h-full border border-stone-200/80 shadow-sm hover:border-amber-700/50"
                        />
                    ))}
                </div>
            </main>

            {/* ── FOOTER ── */}
            <footer className="h-[60px] bg-[#1a1715] text-stone-300 px-10 flex items-center justify-between text-xs font-sans border-t border-amber-900/30 shrink-0 z-10">
                <div className="flex items-center gap-2 max-w-[60%] truncate">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate tracking-wider text-[11px]">
                        {shopData.branches && shopData.branches.length > 0
                            ? `Boutiques: ${shopData.branches.join("  •  ")}`
                            : "Available in all flagship boutiques"}
                    </span>
                </div>

                <div className="flex items-center gap-6 shrink-0 text-[11px] tracking-wider">
                    {shopData.shopPhone && (
                        <div className="flex items-center gap-1.5 text-amber-200">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{shopData.shopPhone}</span>
                        </div>
                    )}
                    <span className="text-amber-400 font-serif italic text-xs">
                        Exquisite Quality
                    </span>
                </div>
            </footer>
        </div>
    );
}
