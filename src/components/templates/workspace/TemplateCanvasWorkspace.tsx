"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getTemplateComponent } from '../registry';
import { CampaignInfo, GridConfig, ProductSlotItem, ShopData } from '../types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ZoomIn, ZoomOut, RotateCcw, LayoutGrid, Plus, Minus, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PosterPageDraft {
    id: string;
    templateId: string;
    campaignInfo: CampaignInfo;
    products: Record<number, ProductSlotItem>;
    gridConfig?: GridConfig;
}

interface TemplateCanvasWorkspaceProps {
    page: PosterPageDraft;
    pageIndex: number;
    shopData: ShopData;
    onSlotClick: (slotIdx: number) => void;
    onSlotRemove: (slotIdx: number) => void;
    onFieldChange: (field: keyof CampaignInfo, value: string) => void;
    onGridConfigChange?: (gridConfig: GridConfig) => void;
    canvasRef: React.RefObject<HTMLDivElement | null>;
}

export const PRESET_GRIDS: { label: string; rows: number; columns: number; slots: number }[] = [
    { label: "3 × 2 (6 slots)", rows: 2, columns: 3, slots: 6 },
    { label: "2 × 3 (6 slots)", rows: 3, columns: 2, slots: 6 },
    { label: "3 × 3 (9 slots)", rows: 3, columns: 3, slots: 9 },
    { label: "4 × 2 (8 slots)", rows: 4, columns: 2, slots: 8 },
    { label: "4 × 3 (12 slots)", rows: 4, columns: 3, slots: 12 },
    { label: "5 × 3 (15 slots)", rows: 5, columns: 3, slots: 15 },
    { label: "5 × 4 (20 slots)", rows: 5, columns: 4, slots: 20 },
    { label: "6 × 4 (24 slots)", rows: 6, columns: 4, slots: 24 },
    { label: "5 × 5 (25 slots)", rows: 5, columns: 5, slots: 25 },
];

export function getDefaultGridConfig(templateId: string): GridConfig {
    switch (templateId) {
        case 'hypermarket-red':
            return { rows: 4, columns: 3 }; // 12
        case 'fresh-deals-green':
            return { rows: 3, columns: 3 }; // 9
        case 'mega-weekend-sale':
            return { rows: 4, columns: 2 }; // 8
        case 'elegant-fashion':
            return { rows: 3, columns: 2 }; // 6
        case 'blank':
            return { rows: 3, columns: 3 }; // 9
        default:
            return { rows: 2, columns: 3 }; // 6
    }
}

export function TemplateCanvasWorkspace({
    page,
    pageIndex,
    shopData,
    onSlotClick,
    onSlotRemove,
    onFieldChange,
    onGridConfigChange,
    canvasRef,
}: TemplateCanvasWorkspaceProps) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(0.75);

    const defaultGrid = getDefaultGridConfig(page.templateId);
    const currentGrid: GridConfig = page.gridConfig || defaultGrid;
    const { rows, columns } = currentGrid;
    const totalSlots = rows * columns;

    const handleUpdateRows = (newRows: number) => {
        const clamped = Math.max(1, Math.min(newRows, 8));
        onGridConfigChange?.({ rows: clamped, columns });
    };

    const handleUpdateCols = (newCols: number) => {
        const clamped = Math.max(1, Math.min(newCols, 5));
        onGridConfigChange?.({ rows, columns: clamped });
    };

    const matchedPreset = PRESET_GRIDS.find(p => p.rows === rows && p.columns === columns);

    // Auto-fit zoom on mount / window resize
    useEffect(() => {
        const handleFitZoom = () => {
            if (viewportRef.current) {
                const availableWidth = viewportRef.current.offsetWidth - 64; // padding
                const availableHeight = viewportRef.current.offsetHeight - 64;
                const scaleW = availableWidth / 794;
                const scaleH = availableHeight / 1123;
                const autoScale = Math.min(scaleW, scaleH, 0.95);
                setZoom(Math.max(0.35, Math.min(autoScale, 1.2)));
            }
        };

        handleFitZoom();
        window.addEventListener('resize', handleFitZoom);
        return () => window.removeEventListener('resize', handleFitZoom);
    }, []);

    const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 1.5));
    const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));
    const handleResetZoom = () => setZoom(0.85);

    const TemplateComponent = getTemplateComponent(page.templateId);

    return (
        <div className="relative w-full h-full flex flex-col bg-card rounded-2xl overflow-hidden shadow-2xl border border-border">
            {/* Top Workspace Toolbar */}
            <div className="min-h-12 py-2 bg-background/90 backdrop-blur border-b border-border/80 px-4 flex flex-wrap items-center justify-between z-20 shrink-0 gap-3">
                {/* Left: Canvas Title */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Canvas Editor
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        A4 (794 × 1123)
                    </span>
                </div>

                {/* Center: Slot Count & Grid Controller */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Predefined Presets Dropdown using App Design Theme */}
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="h-8 px-3 flex items-center gap-2 bg-background hover:bg-muted/70 border border-border/80 rounded-xl text-xs font-bold text-foreground shadow-sm hover:border-orange-500/40 active:scale-[0.98] transition-all outline-none group"
                            >
                                <LayoutGrid className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                <span className="text-[11px] text-muted-foreground font-semibold">Grid:</span>
                                <span className="text-xs font-black text-foreground">
                                    {matchedPreset ? `${matchedPreset.rows} × ${matchedPreset.columns}` : `Custom (${rows} × ${columns})`}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                    {totalSlots} slots
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform group-data-[state=open]:rotate-180" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="bg-popover/95 backdrop-blur-md border border-border/80 rounded-2xl p-1.5 shadow-2xl min-w-[230px] z-50">
                            <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1">
                                Choose Grid Layout
                            </div>
                            {PRESET_GRIDS.map((p) => {
                                const isSelected = p.rows === rows && p.columns === columns;
                                return (
                                    <DropdownMenuItem
                                        key={`${p.rows}x${p.columns}`}
                                        onClick={() => onGridConfigChange?.({ rows: p.rows, columns: p.columns })}
                                        className={cn(
                                            "rounded-xl cursor-pointer py-2 px-3 text-xs font-bold flex items-center justify-between transition-colors my-0.5",
                                            isSelected
                                                ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 font-black"
                                                : "hover:bg-muted text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isSelected ? (
                                                <Check className="w-3.5 h-3.5 text-orange-500 shrink-0 stroke-[3]" />
                                            ) : (
                                                <div className="w-3.5 h-3.5 rounded-full border-2 border-border/80 shrink-0" />
                                            )}
                                            <span>{p.rows} rows × {p.columns} cols</span>
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black px-2 py-0.5 rounded-full",
                                            isSelected
                                                ? "bg-orange-500 text-white"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {p.slots}
                                        </span>
                                    </DropdownMenuItem>
                                );
                            })}
                            {!matchedPreset && (
                                <div className="mt-1 pt-1.5 border-t border-border/60 px-3 py-1.5 text-[11px] font-bold text-orange-600 dark:text-orange-400 flex items-center justify-between bg-orange-500/5 rounded-xl">
                                    <span>Custom: {rows} × {columns}</span>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500 text-white">
                                        {totalSlots} slots
                                    </span>
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Row Stepper */}
                    <div className="flex items-center bg-background border border-border/70 rounded-xl p-0.5 shadow-sm">
                        <button
                            type="button"
                            onClick={() => handleUpdateRows(rows - 1)}
                            disabled={rows <= 1}
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                            title="Decrease Rows"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold px-2 min-w-[50px] text-center select-none">
                            {rows} <span className="text-[10px] font-normal text-muted-foreground">Rows</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => handleUpdateRows(rows + 1)}
                            disabled={rows >= 8}
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                            title="Increase Rows (max 8)"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Column Stepper (max 5) */}
                    <div className="flex items-center bg-background border border-border/70 rounded-xl p-0.5 shadow-sm">
                        <button
                            type="button"
                            onClick={() => handleUpdateCols(columns - 1)}
                            disabled={columns <= 1}
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                            title="Decrease Columns"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold px-2 min-w-[50px] text-center select-none">
                            {columns} <span className="text-[10px] font-normal text-muted-foreground">Cols</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => handleUpdateCols(columns + 1)}
                            disabled={columns >= 5}
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                            title="Increase Columns (max 5)"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Total Slots Counter Badge */}
                    <div className="px-3 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-black text-xs flex items-center gap-1.5 shrink-0">
                        <span>{totalSlots} Slots</span>
                    </div>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1.5 bg-background border border-border/60 rounded-xl p-1 shadow-inner shrink-0">
                    <button
                        type="button"
                        onClick={handleZoomOut}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>

                    <span className="text-xs font-mono font-bold text-foreground px-2 min-w-[50px] text-center select-none">
                        {Math.round(zoom * 100)}%
                    </span>

                    <button
                        type="button"
                        onClick={handleZoomIn}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>

                    <div className="w-[1px] h-4 bg-border mx-1" />

                    <button
                        type="button"
                        onClick={handleResetZoom}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Reset Zoom (85%)"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Scrollable / Centered Canvas Viewport */}
            <div
                ref={viewportRef}
                className="flex-1 w-full overflow-auto relative bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px]"
            >
                <div className="min-w-full min-h-full w-max h-max flex items-center justify-center p-8">
                    <div
                        style={{
                            width: `${794 * zoom}px`,
                            height: `${1123 * zoom}px`,
                            position: 'relative',
                            transition: 'width 0.15s ease-out, height 0.15s ease-out',
                        }}
                        className="shrink-0 flex items-center justify-center"
                    >
                        <div
                            style={{
                                width: '794px',
                                height: '1123px',
                                transform: `scale(${zoom})`,
                                transformOrigin: 'top left',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                            }}
                            className="shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] rounded-none"
                        >
                            {/* THE ACTUAL POSTER CANVAS */}
                            <div ref={canvasRef} className="w-[794px] h-[1123px] relative bg-white">
                                <TemplateComponent
                                    shopData={shopData}
                                    campaignInfo={page.campaignInfo}
                                    products={page.products}
                                    isEditable={true}
                                    excludeHeader={pageIndex > 0}
                                    onSlotClick={onSlotClick}
                                    onSlotRemove={onSlotRemove}
                                    onFieldChange={onFieldChange}
                                    gridConfig={currentGrid}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
