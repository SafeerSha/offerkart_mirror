"use client";

import React from 'react';
import { TemplateProps } from '../types';
import { ProductSlot } from '../shared/ProductSlot';
import { EditableText } from '../shared/EditableText';
import { ShopLogo } from '../shared/ShopLogo';
import { Phone, MapPin, Store } from 'lucide-react';

export function BlankCanvasTemplate({
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
            className="w-[794px] h-[1123px] max-w-[794px] max-h-[1123px] shrink-0 relative flex flex-col overflow-hidden bg-white select-none font-sans"
            style={{ width: '794px', height: '1123px' }}
        >
            {/* ── HEADER ── */}
            {!excludeHeader && (
                <header className="h-[200px] bg-slate-900 text-white px-8 py-5 flex flex-col justify-between relative shadow-md shrink-0">
                    <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-4">
                            <ShopLogo
                                logoUrl={shopData.logoUrl}
                                shopName={shopData.shopName}
                                className="w-18 h-18 object-contain bg-white rounded-xl p-1.5 shadow"
                                fallback={
                                    <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                                        <Store className="w-8 h-8" />
                                    </div>
                                }
                            />

                            <div>
                                <h2 className="text-3xl font-extrabold uppercase tracking-tight text-white">
                                    {shopData.shopName || "STORE NAME"}
                                </h2>
                                <p className="text-xs font-medium text-slate-400 mt-0.5">
                                    Exclusive Deals & Special Offers
                                </p>
                            </div>
                        </div>

                        <div className="bg-indigo-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg uppercase tracking-wider shadow">
                            SPECIAL OFFERS
                        </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-slate-800 pt-2 z-10">
                        <div className="flex-1 mr-4">
                            <EditableText
                                as="h1"
                                value={campaignInfo.title || "SPECIAL PROMOTIONAL OFFERS"}
                                onChange={(val) => onFieldChange?.('title', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit offer title..."
                                className="text-3xl font-extrabold uppercase tracking-tight text-indigo-400 drop-shadow leading-none"
                            />
                            <EditableText
                                as="p"
                                value={campaignInfo.subtitle || "Check out our latest handpicked offers with huge savings!"}
                                onChange={(val) => onFieldChange?.('subtitle', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit subtitle..."
                                className="text-xs font-normal text-slate-300 mt-1"
                            />
                        </div>

                        {(campaignInfo.validFrom || campaignInfo.validTo) && (
                            <div className="bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700 text-right shrink-0">
                                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Validity</span>
                                <span className="text-xs font-bold text-white">
                                    {campaignInfo.validFrom || "Start"} - {campaignInfo.validTo || "End"}
                                </span>
                            </div>
                        )}
                    </div>
                </header>
            )}

            {/* ── PRODUCT GRID ── */}
            <main className="flex-1 bg-slate-50/70 p-6 overflow-hidden flex flex-col justify-center">
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
                            variant="modern"
                            accentColor="#4f46e5"
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
            <footer className="h-[60px] bg-slate-900 text-slate-300 px-8 flex items-center justify-between text-xs font-medium border-t border-slate-800 shrink-0 z-10">
                <div className="flex items-center gap-2 max-w-[60%] truncate">
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">
                        {shopData.branches && shopData.branches.length > 0
                            ? `Branches: ${shopData.branches.join("  •  ")}`
                            : "Visit our store today"}
                    </span>
                </div>

                <div className="flex items-center gap-6 shrink-0 font-medium">
                    {shopData.shopPhone && (
                        <div className="flex items-center gap-1.5 text-indigo-300">
                            <Phone className="w-4 h-4" />
                            <span>{shopData.shopPhone}</span>
                        </div>
                    )}
                    <span className="text-slate-400 text-[11px]">
                        Limited Stocks
                    </span>
                </div>
            </footer>
        </div>
    );
}
