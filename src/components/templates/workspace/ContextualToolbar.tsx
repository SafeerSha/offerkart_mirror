"use client";

import React from 'react';
import {
    Undo2,
    Redo2,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    LayoutGrid,
    Plus,
    Minus,
    Bold,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Trash2,
    Copy,
    ChevronDown,
    Check,
    Palette,
    Package,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GridConfig, PosterOverlayElement, ProductSlotItem } from '../types';
import { PRESET_GRIDS } from './TemplateCanvasWorkspace';
import { cn } from '@/lib/utils';

interface ContextualToolbarProps {
    // Selection state
    selectedElement?: PosterOverlayElement;
    onUpdateElement?: (id: string, updates: Partial<PosterOverlayElement>) => void;
    onDeleteElement?: (id: string) => void;
    onDuplicateElement?: (id: string) => void;
    onBringForward?: (id: string) => void;
    onSendBackward?: (id: string) => void;

    // Slot selection state
    selectedSlotIndex: number | null;
    selectedSlotProduct?: ProductSlotItem;
    onOpenSlotPicker?: (slotIdx: number) => void;
    onClearSlot?: (slotIdx: number) => void;
    onDeselectAll?: () => void;

    // Undo / Redo
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;

    // Grid config
    currentGrid: GridConfig;
    onGridConfigChange?: (gridConfig: GridConfig) => void;

    // Zoom
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
}

const FONT_OPTIONS = [
    { label: 'Inter', value: "'Inter', sans-serif" },
    { label: 'Oswald', value: "'Oswald', sans-serif" },
    { label: 'Montserrat', value: "'Montserrat', sans-serif" },
    { label: 'Poppins', value: "'Poppins', sans-serif" },
    { label: 'Playfair', value: "'Playfair Display', serif" },
    { label: 'Impact', value: "'Impact', 'Arial Black', sans-serif" },
];

const COLOR_PALETTE = [
    '#ffffff', '#000000', '#dc2626', '#ea580c', '#f59e0b',
    '#16a34a', '#06b6d4', '#2563eb', '#7c3aed', '#db2777',
    '#fef08a', '#bbf7d0', '#f1f5f9', '#334155',
];

export function ContextualToolbar({
    selectedElement,
    onUpdateElement,
    onDeleteElement,
    onDuplicateElement,
    onBringForward,
    onSendBackward,
    selectedSlotIndex,
    selectedSlotProduct,
    onOpenSlotPicker,
    onClearSlot,
    onDeselectAll,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    currentGrid,
    onGridConfigChange,
    zoom,
    onZoomIn,
    onZoomOut,
    onResetZoom,
}: ContextualToolbarProps) {
    const { rows, columns } = currentGrid;
    const totalSlots = rows * columns;
    const matchedPreset = PRESET_GRIDS.find(p => p.rows === rows && p.columns === columns);

    const handleUpdateRows = (newRows: number) => {
        const clamped = Math.max(1, Math.min(newRows, 8));
        onGridConfigChange?.({ rows: clamped, columns });
    };

    const handleUpdateCols = (newCols: number) => {
        const clamped = Math.max(1, Math.min(newCols, 5));
        onGridConfigChange?.({ rows, columns: clamped });
    };

    return (
        <div className="min-h-12 py-2 bg-background/95 backdrop-blur-md border-b border-border/80 px-4 flex flex-wrap items-center justify-between z-20 shrink-0 gap-3 select-none">
            {/* ── LEFT SECTION: DYNAMIC CONTEXTUAL CONTROLS OR UNDO/REDO ── */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Global Undo / Redo Buttons */}
                <div className="flex items-center bg-card border border-border/80 rounded-xl p-0.5 shadow-sm">
                    <button
                        type="button"
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="w-[1px] h-5 bg-border/80 mx-1 hidden sm:block" />

                {/* ── CASE 1: OVERLAY ELEMENT SELECTED ── */}
                {selectedElement && onUpdateElement && (
                    <div className="flex items-center gap-2 flex-wrap animate-in fade-in duration-150">
                        {/* Direct Content / Text Input */}
                        {selectedElement.kind !== 'image' && (
                            <div className="flex items-center bg-card border border-border/80 rounded-xl px-2.5 h-8 shadow-sm gap-1.5">
                                <span className="text-[10px] font-black uppercase text-orange-500 shrink-0">Text:</span>
                                <input
                                    type="text"
                                    value={selectedElement.text || ''}
                                    onChange={(e) => onUpdateElement(selectedElement.id, { text: e.target.value })}
                                    className="bg-transparent text-xs font-bold text-foreground outline-none w-28 sm:w-32 placeholder:text-muted-foreground truncate"
                                    placeholder="Badge text..."
                                />
                            </div>
                        )}

                        {/* Secondary Text / Subtitle Input (for badges) */}
                        {selectedElement.badgeSecondaryText !== undefined && (
                            <div className="flex items-center bg-card border border-border/80 rounded-xl px-2.5 h-8 shadow-sm gap-1.5">
                                <span className="text-[10px] font-black uppercase text-muted-foreground shrink-0">Sub:</span>
                                <input
                                    type="text"
                                    value={selectedElement.badgeSecondaryText || ''}
                                    onChange={(e) => onUpdateElement(selectedElement.id, { badgeSecondaryText: e.target.value })}
                                    className="bg-transparent text-xs font-bold text-foreground outline-none w-20 sm:w-24 placeholder:text-muted-foreground truncate"
                                    placeholder="Subtext..."
                                />
                            </div>
                        )}

                        {/* Font Family Dropdown */}
                        {selectedElement.kind === 'text' && (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="h-8 px-2.5 bg-card hover:bg-muted border border-border/80 rounded-xl text-xs font-bold text-foreground flex items-center gap-2 shadow-sm outline-none"
                                    >
                                        <span className="truncate max-w-[90px]">
                                            {FONT_OPTIONS.find(f => f.value === selectedElement.fontFamily)?.label || 'Font'}
                                        </span>
                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="bg-popover border border-border/80 rounded-xl p-1 shadow-xl z-50">
                                    {FONT_OPTIONS.map((f) => (
                                        <DropdownMenuItem
                                            key={f.label}
                                            onClick={() => onUpdateElement(selectedElement.id, { fontFamily: f.value })}
                                            className="text-xs font-semibold cursor-pointer rounded-lg py-1.5 px-2"
                                            style={{ fontFamily: f.value }}
                                        >
                                            {f.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Font Size Stepper */}
                        {selectedElement.kind === 'text' && (
                            <div className="flex items-center bg-card border border-border/80 rounded-xl p-0.5 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => onUpdateElement(selectedElement.id, { fontSize: Math.max(10, (selectedElement.fontSize || 20) - 2) })}
                                    className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-xs font-bold px-1.5 min-w-[32px] text-center">
                                    {selectedElement.fontSize || 20}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onUpdateElement(selectedElement.id, { fontSize: Math.min(100, (selectedElement.fontSize || 20) + 2) })}
                                    className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Bold Toggle */}
                        {selectedElement.kind === 'text' && (
                            <button
                                type="button"
                                onClick={() => onUpdateElement(selectedElement.id, {
                                    fontWeight: selectedElement.fontWeight === 800 || selectedElement.fontWeight === 'bold' ? 400 : 800
                                })}
                                className={cn(
                                    "p-1.5 rounded-xl border border-border/80 text-xs font-bold transition-colors shadow-sm",
                                    (selectedElement.fontWeight === 800 || selectedElement.fontWeight === 'bold')
                                        ? "bg-orange-500 text-white border-orange-500"
                                        : "bg-card hover:bg-muted text-foreground"
                                )}
                                title="Bold"
                            >
                                <Bold className="w-4 h-4" />
                            </button>
                        )}

                        {/* Color Picker Dropdown (Badge Bg or Text Color) */}
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="h-8 px-2 bg-card hover:bg-muted border border-border/80 rounded-xl flex items-center gap-1.5 shadow-sm"
                                    title={selectedElement.kind === 'text' ? "Text Color" : "Badge Color"}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full border border-black/20 shadow-sm"
                                        style={{ background: selectedElement.color || selectedElement.badgeBg || '#ef4444' }}
                                    />
                                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-popover border border-border/80 rounded-xl p-2 shadow-2xl z-50 w-44">
                                <div className="text-[10px] font-black uppercase text-muted-foreground mb-1.5 px-1">
                                    {selectedElement.kind === 'text' ? "Text Color" : "Badge Color"}
                                </div>
                                <div className="grid grid-cols-7 gap-1.5">
                                    {COLOR_PALETTE.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => {
                                                if (selectedElement.kind === 'text') {
                                                    onUpdateElement(selectedElement.id, { color: c });
                                                } else {
                                                    onUpdateElement(selectedElement.id, { badgeBg: c });
                                                }
                                            }}
                                            className="w-5 h-5 rounded-full border border-black/20 hover:scale-115 transition-transform"
                                            style={{ background: c }}
                                        />
                                    ))}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Badge Text Color Picker */}
                        {selectedElement.kind !== 'text' && selectedElement.kind !== 'image' && (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="h-8 px-2 bg-card hover:bg-muted border border-border/80 rounded-xl flex items-center gap-1 shadow-sm"
                                        title="Badge Text Color"
                                    >
                                        <span className="text-[11px] font-black text-muted-foreground mr-0.5">T</span>
                                        <div
                                            className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-sm"
                                            style={{ background: selectedElement.badgeTextColor || '#ffffff' }}
                                        />
                                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="bg-popover border border-border/80 rounded-xl p-2 shadow-2xl z-50 w-44">
                                    <div className="text-[10px] font-black uppercase text-muted-foreground mb-1.5 px-1">
                                        Text Color
                                    </div>
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {COLOR_PALETTE.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => onUpdateElement(selectedElement.id, { badgeTextColor: c })}
                                                className="w-5 h-5 rounded-full border border-black/20 hover:scale-115 transition-transform"
                                                style={{ background: c }}
                                            />
                                        ))}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Text Alignment */}
                        {selectedElement.kind === 'text' && (
                            <div className="flex items-center bg-card border border-border/80 rounded-xl p-0.5 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'left' })}
                                    className={cn(
                                        "p-1 rounded-lg transition-colors",
                                        selectedElement.textAlign === 'left' ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <AlignLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'center' })}
                                    className={cn(
                                        "p-1 rounded-lg transition-colors",
                                        (!selectedElement.textAlign || selectedElement.textAlign === 'center') ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <AlignCenter className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'right' })}
                                    className={cn(
                                        "p-1 rounded-lg transition-colors",
                                        selectedElement.textAlign === 'right' ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <AlignRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Duplicate */}
                        {onDuplicateElement && (
                            <button
                                type="button"
                                onClick={() => onDuplicateElement(selectedElement.id)}
                                className="p-1.5 bg-card hover:bg-muted border border-border/80 rounded-xl text-muted-foreground hover:text-foreground transition-colors shadow-sm"
                                title="Duplicate"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        )}

                        {/* Delete */}
                        {onDeleteElement && (
                            <button
                                type="button"
                                onClick={() => onDeleteElement(selectedElement.id)}
                                className="p-1.5 bg-card hover:bg-red-500/10 border border-border/80 hover:border-red-500/40 rounded-xl text-muted-foreground hover:text-red-500 transition-colors shadow-sm"
                                title="Delete Element"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* ── CASE 2: PRODUCT SLOT SELECTED ── */}
                {selectedSlotIndex !== null && !selectedElement && (
                    <div className="flex items-center gap-2 flex-wrap animate-in fade-in duration-150">
                        <div className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 rounded-xl text-xs font-black text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5" />
                            <span>Slot {selectedSlotIndex + 1}</span>
                            {selectedSlotProduct?.title && (
                                <span className="font-semibold text-foreground truncate max-w-[120px]">
                                    : {selectedSlotProduct.title}
                                </span>
                            )}
                        </div>

                        {onOpenSlotPicker && (
                            <button
                                type="button"
                                onClick={() => onOpenSlotPicker(selectedSlotIndex)}
                                className="h-8 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                            >
                                <span>{selectedSlotProduct?.title ? 'Replace Product' : 'Pick Product'}</span>
                            </button>
                        )}

                        {selectedSlotProduct?.title && onClearSlot && (
                            <button
                                type="button"
                                onClick={() => onClearSlot(selectedSlotIndex)}
                                className="p-1.5 bg-card hover:bg-red-500/10 border border-border/80 hover:border-red-500/40 rounded-xl text-muted-foreground hover:text-red-500 transition-colors shadow-sm"
                                title="Clear Slot"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}

                        {onDeselectAll && (
                            <button
                                type="button"
                                onClick={onDeselectAll}
                                className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2"
                            >
                                Done
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── CENTER / RIGHT SECTION: GRID CONTROLS & ZOOM ── */}
            <div className="flex items-center gap-2 flex-wrap ml-auto">
                {/* Grid Preset Dropdown */}
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="h-8 px-2.5 flex items-center gap-1.5 bg-card hover:bg-muted border border-border/80 rounded-xl text-xs font-bold text-foreground shadow-sm outline-none"
                        >
                            <LayoutGrid className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="text-[11px] text-muted-foreground font-semibold">Grid:</span>
                            <span className="text-xs font-black">
                                {matchedPreset ? `${matchedPreset.rows} × ${matchedPreset.columns}` : `${rows} × ${columns}`}
                            </span>
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="bg-popover border border-border/80 rounded-2xl p-1.5 shadow-2xl min-w-[210px] z-50">
                        <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1">
                            Grid Presets
                        </div>
                        {PRESET_GRIDS.map((p) => {
                            const isSelected = p.rows === rows && p.columns === columns;
                            return (
                                <DropdownMenuItem
                                    key={`${p.rows}x${p.columns}`}
                                    onClick={() => onGridConfigChange?.({ rows: p.rows, columns: p.columns })}
                                    className={cn(
                                        "rounded-xl cursor-pointer py-1.5 px-2.5 text-xs font-bold flex items-center justify-between my-0.5",
                                        isSelected ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 font-black" : "hover:bg-muted text-foreground"
                                    )}
                                >
                                    <span>{p.rows} rows × {p.columns} cols</span>
                                    <span className={cn(
                                        "text-[10px] font-black px-1.5 py-0.5 rounded-full",
                                        isSelected ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
                                    )}>
                                        {p.slots}
                                    </span>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Row Stepper */}
                <div className="flex items-center bg-card border border-border/80 rounded-xl p-0.5 shadow-sm">
                    <button
                        type="button"
                        onClick={() => handleUpdateRows(rows - 1)}
                        disabled={rows <= 1}
                        className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        title="Decrease Rows"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold px-1.5 min-w-[44px] text-center select-none">
                        {rows} <span className="text-[10px] font-normal text-muted-foreground">R</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => handleUpdateRows(rows + 1)}
                        disabled={rows >= 8}
                        className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        title="Increase Rows"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Col Stepper */}
                <div className="flex items-center bg-card border border-border/80 rounded-xl p-0.5 shadow-sm">
                    <button
                        type="button"
                        onClick={() => handleUpdateCols(columns - 1)}
                        disabled={columns <= 1}
                        className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        title="Decrease Columns"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold px-1.5 min-w-[44px] text-center select-none">
                        {columns} <span className="text-[10px] font-normal text-muted-foreground">C</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => handleUpdateCols(columns + 1)}
                        disabled={columns >= 5}
                        className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        title="Increase Columns"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="w-[1px] h-5 bg-border/80 mx-1 hidden sm:block" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-card border border-border/80 rounded-xl p-0.5 shadow-sm">
                    <button
                        type="button"
                        onClick={onZoomOut}
                        className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-xs font-mono font-bold px-1 min-w-[40px] text-center select-none">
                        {Math.round(zoom * 100)}%
                    </span>

                    <button
                        type="button"
                        onClick={onZoomIn}
                        className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={onResetZoom}
                        className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Reset Zoom"
                    >
                        <RotateCcw className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
