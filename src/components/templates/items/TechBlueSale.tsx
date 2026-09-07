"use client";

import React from 'react';
import { TemplateProps } from '../types';
import { ProductSlot } from '../shared/ProductSlot';
import { EditableText } from '../shared/EditableText';
import { Phone, MapPin, Cpu, ShieldCheck } from 'lucide-react';

export function TechBlueSaleTemplate({
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
            className="w-[794px] h-[1123px] max-w-[794px] max-h-[1123px] shrink-0 relative flex flex-col overflow-hidden bg-slate-950 select-none font-sans"
            style={{ width: '794px', height: '1123px' }}
        >
            {/* ── HEADER ── */}
            {!excludeHeader && (
                <header className="h-[220px] bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-8 py-6 flex flex-col justify-between relative shadow-2xl shrink-0 border-b border-blue-500/30 overflow-hidden">
                    {/* Futuristic Grid Line Effects */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

                    <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-4">
                            {shopData.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={shopData.logoUrl}
                                    alt="Shop Logo"
                                    className="w-20 h-20 object-contain bg-white/10 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-cyan-400/40"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 backdrop-blur-md border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
                                    <Cpu className="w-8 h-8" />
                                </div>
                            )}

                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-wider text-white drop-shadow">
                                    {shopData.shopName || "TECH MEGASTORE"}
                                </h2>
                                <p className="text-xs font-semibold text-cyan-300 tracking-widest uppercase flex items-center gap-1.5 mt-0.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                                    100% Genuine Tech & Brand Warranty
                                </p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg shadow-cyan-500/25 border border-cyan-300/30">
                            TECH EXPO DEALS
                        </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-slate-800 pt-3 z-10">
                        <div className="flex-1 mr-4">
                            <EditableText
                                as="h1"
                                value={campaignInfo.title || "SMART TECH BONANZA"}
                                onChange={(val) => onFieldChange?.('title', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit campaign title..."
                                className="text-4xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 drop-shadow leading-none"
                            />
                            <EditableText
                                as="p"
                                value={campaignInfo.subtitle || "Upgrade your digital lifestyle with unbeatable prices on latest gadgets!"}
                                onChange={(val) => onFieldChange?.('subtitle', val)}
                                isEditable={isEditable}
                                placeholder="Click to edit subtitle..."
                                className="text-xs font-medium text-slate-300 mt-1"
                            />
                        </div>

                        {(campaignInfo.validFrom || campaignInfo.validTo) && (
                            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/30 text-right shrink-0">
                                <span className="text-[10px] uppercase text-cyan-400 block font-bold tracking-wider">Expo Dates</span>
                                <span className="text-xs font-black text-white">
                                    {campaignInfo.validFrom || "Now On"} - {campaignInfo.validTo || "Hurry"}
                                </span>
                            </div>
                        )}
                    </div>
                </header>
            )}

            {/* ── PRODUCT GRID ── */}
            <main className="flex-1 bg-slate-950 p-7 overflow-hidden flex flex-col justify-center">
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
                            variant="dark"
                            accentColor="#06b6d4"
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
            <footer className="h-[65px] bg-slate-900 text-slate-300 px-8 flex items-center justify-between text-xs font-medium border-t border-cyan-500/30 shrink-0 z-10">
                <div className="flex items-center gap-2 max-w-[60%] truncate">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate">
                        {shopData.branches && shopData.branches.length > 0
                            ? `Experience Centers: ${shopData.branches.join("  •  ")}`
                            : "Available across all official experience stores"}
                    </span>
                </div>

                <div className="flex items-center gap-6 shrink-0 font-bold">
                    {shopData.shopPhone && (
                        <div className="flex items-center gap-1.5 text-cyan-400">
                            <Phone className="w-4 h-4" />
                            <span>{shopData.shopPhone}</span>
                        </div>
                    )}
                    <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-black px-3 py-1 rounded uppercase tracking-wider">
                        EMI Available
                    </span>
                </div>
            </footer>
        </div>
    );
}
