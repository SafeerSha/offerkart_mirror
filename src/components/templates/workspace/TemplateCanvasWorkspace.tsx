"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getTemplateComponent } from '../registry';
import { CampaignInfo, GridConfig, ProductSlotItem, ShopData, PosterOverlayElement } from '../types';
import { CanvaDock, CanvaDockTab } from './CanvaDock';
import { ContextualToolbar } from './ContextualToolbar';
import { CanvasOverlayLayer } from './CanvasOverlayLayer';
import { StickerPreset } from './stickerPresets';
import { toast } from 'sonner';
import { extractS3Url } from '@/lib/common';

export interface PosterPageDraft {
    id: string;
    templateId: string;
    campaignInfo: CampaignInfo;
    products: Record<number, ProductSlotItem>;
    gridConfig?: GridConfig;
    overlayElements?: PosterOverlayElement[];
}

interface TemplateCanvasWorkspaceProps {
    page: PosterPageDraft;
    pageIndex: number;
    allPages?: PosterPageDraft[];
    usedProductIds?: Set<string>;
    usedProductTitles?: Set<string>;
    shopData: ShopData;
    shopId?: string | null;
    onSlotClick: (slotIdx: number) => void;
    onSlotRemove: (slotIdx: number) => void;
    onFieldChange: (field: keyof CampaignInfo, value: string) => void;
    onGridConfigChange?: (gridConfig: GridConfig) => void;
    onUpdatePage?: (pageUpdates: Partial<PosterPageDraft>) => void;
    onSelectTemplate?: (templateId: string) => void;
    onOpenCreateProductModal?: () => void;
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
    allPages,
    usedProductIds,
    usedProductTitles,
    shopData,
    shopId,
    onSlotClick,
    onSlotRemove,
    onFieldChange,
    onGridConfigChange,
    onUpdatePage,
    onSelectTemplate,
    onOpenCreateProductModal,
    canvasRef,
}: TemplateCanvasWorkspaceProps) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(0.75);

    // Canva Dock state
    const [activeDockTab, setActiveDockTab] = useState<CanvaDockTab | null>('templates');

    // Selection state
    const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

    // Undo / Redo history
    const [history, setHistory] = useState<PosterPageDraft[]>([page]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const isHistoryActionRef = useRef(false);

    // Sync history on page change from external
    const pushHistory = useCallback((nextDraft: PosterPageDraft) => {
        if (isHistoryActionRef.current) {
            isHistoryActionRef.current = false;
            return;
        }
        setHistory((prev) => {
            const nextHistory = prev.slice(0, historyIndex + 1);
            return [...nextHistory, nextDraft];
        });
        setHistoryIndex((prev) => prev + 1);
    }, [historyIndex]);

    const handleUndo = () => {
        if (historyIndex > 0) {
            isHistoryActionRef.current = true;
            const prevIndex = historyIndex - 1;
            const targetState = history[prevIndex];
            setHistoryIndex(prevIndex);
            onUpdatePage?.(targetState);
            toast.info('Undo');
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            isHistoryActionRef.current = true;
            const nextIndex = historyIndex + 1;
            const targetState = history[nextIndex];
            setHistoryIndex(nextIndex);
            onUpdatePage?.(targetState);
            toast.info('Redo');
        }
    };

    // Keyboard shortcuts for undo/redo and delete
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing inside an input or textarea
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            } else if (
                ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
            ) {
                e.preventDefault();
                handleRedo();
            } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedOverlayId) {
                e.preventDefault();
                handleDeleteOverlay(selectedOverlayId);
            } else if (e.key === 'Escape') {
                setSelectedOverlayId(null);
                setSelectedSlotIndex(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo, selectedOverlayId]);

    const defaultGrid = getDefaultGridConfig(page.templateId);
    const currentGrid: GridConfig = page.gridConfig || defaultGrid;
    const { rows, columns } = currentGrid;

    // Auto-fit zoom on mount / window resize
    useEffect(() => {
        const handleFitZoom = () => {
            if (viewportRef.current) {
                const availableWidth = viewportRef.current.offsetWidth - 64;
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

    // ─────────────────────────────────────────────
    // OVERLAY MANAGEMENT HANDLERS
    // ─────────────────────────────────────────────

    const handleAddSticker = (preset: StickerPreset) => {
        const newOverlay: PosterOverlayElement = {
            id: `overlay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            kind: 'badge',
            x: Math.round((794 - preset.w) / 2),
            y: Math.round((1123 - preset.h) / 2),
            w: preset.w,
            h: preset.h,
            rotation: preset.rotation || 0,
            zIndex: (page.overlayElements?.length || 0) + 10,
            text: preset.text,
            badgeSecondaryText: preset.secondaryText,
            badgeBg: preset.badgeBg,
            badgeTextColor: preset.badgeTextColor,
            shapeKind: preset.shapeKind,
        };

        const nextElements = [...(page.overlayElements || []), newOverlay];
        const nextDraft = { ...page, overlayElements: nextElements };
        onUpdatePage?.({ overlayElements: nextElements });
        pushHistory(nextDraft);
        setSelectedOverlayId(newOverlay.id);
        setSelectedSlotIndex(null);
        toast.success(`Added ${preset.label}`);
    };

    const handleAddText = (textConfig: any) => {
        const newOverlay: PosterOverlayElement = {
            id: `overlay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            kind: 'text',
            x: Math.round((794 - (textConfig.w || 280)) / 2),
            y: Math.round((1123 - (textConfig.h || 50)) / 2),
            w: textConfig.w || 280,
            h: textConfig.h || 50,
            zIndex: (page.overlayElements?.length || 0) + 10,
            text: textConfig.text || 'Add Headline',
            fontSize: textConfig.fontSize || 24,
            fontWeight: textConfig.fontWeight || 800,
            fontFamily: textConfig.fontFamily || "'Inter', sans-serif",
            color: textConfig.color || '#1e293b',
            textAlign: 'center',
        };

        const nextElements = [...(page.overlayElements || []), newOverlay];
        const nextDraft = { ...page, overlayElements: nextElements };
        onUpdatePage?.({ overlayElements: nextElements });
        pushHistory(nextDraft);
        setSelectedOverlayId(newOverlay.id);
        setSelectedSlotIndex(null);
        toast.success('Text added');
    };

    const handleAddImageOverlay = (imageUrl: string) => {
        const newOverlay: PosterOverlayElement = {
            id: `overlay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            kind: 'image',
            x: 297,
            y: 461,
            w: 200,
            h: 200,
            zIndex: (page.overlayElements?.length || 0) + 10,
            imageUrl,
        };

        const nextElements = [...(page.overlayElements || []), newOverlay];
        const nextDraft = { ...page, overlayElements: nextElements };
        onUpdatePage?.({ overlayElements: nextElements });
        pushHistory(nextDraft);
        setSelectedOverlayId(newOverlay.id);
        setSelectedSlotIndex(null);
        toast.success('Image overlay added');
    };

    const handleUpdateOverlay = (id: string, updates: Partial<PosterOverlayElement>) => {
        const nextElements = (page.overlayElements || []).map((el) =>
            el.id === id ? { ...el, ...updates } : el
        );
        onUpdatePage?.({ overlayElements: nextElements });
    };

    const handleDeleteOverlay = (id: string) => {
        const nextElements = (page.overlayElements || []).filter((el) => el.id !== id);
        const nextDraft = { ...page, overlayElements: nextElements };
        onUpdatePage?.({ overlayElements: nextElements });
        pushHistory(nextDraft);
        if (selectedOverlayId === id) setSelectedOverlayId(null);
        toast.info('Deleted');
    };

    const handleDuplicateOverlay = (id: string) => {
        const target = (page.overlayElements || []).find((el) => el.id === id);
        if (!target) return;

        const cloned: PosterOverlayElement = {
            ...target,
            id: `overlay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            x: Math.min(794 - target.w, target.x + 20),
            y: Math.min(1123 - target.h, target.y + 20),
            zIndex: (page.overlayElements?.length || 0) + 10,
        };

        const nextElements = [...(page.overlayElements || []), cloned];
        const nextDraft = { ...page, overlayElements: nextElements };
        onUpdatePage?.({ overlayElements: nextElements });
        pushHistory(nextDraft);
        setSelectedOverlayId(cloned.id);
        toast.success('Duplicated');
    };

    const handleBringForward = (id: string) => {
        const elements = [...(page.overlayElements || [])];
        const idx = elements.findIndex(e => e.id === id);
        if (idx !== -1 && idx < elements.length - 1) {
            const temp = elements[idx];
            elements[idx] = elements[idx + 1];
            elements[idx + 1] = temp;
            elements.forEach((el, i) => { el.zIndex = i + 10; });
            onUpdatePage?.({ overlayElements: elements });
        }
    };

    const handleSendBackward = (id: string) => {
        const elements = [...(page.overlayElements || [])];
        const idx = elements.findIndex(e => e.id === id);
        if (idx > 0) {
            const temp = elements[idx];
            elements[idx] = elements[idx - 1];
            elements[idx - 1] = temp;
            elements.forEach((el, i) => { el.zIndex = i + 10; });
            onUpdatePage?.({ overlayElements: elements });
        }
    };

    // ─────────────────────────────────────────────
    // PRODUCT SLOT INSERTION & DRAG AND DROP
    // ─────────────────────────────────────────────

    // Helper to find the next available empty slot on the canvas
    const getNextAvailableSlot = (products: Record<number, ProductSlotItem>, totalSlots: number, startAfter: number = -1): number | null => {
        // First look forward from startAfter + 1 to totalSlots - 1
        for (let i = startAfter + 1; i < totalSlots; i++) {
            const p = products[i];
            if (!p || (!p.title && !p.image)) {
                return i;
            }
        }
        // Then wrap around from 0 to startAfter
        for (let i = 0; i <= startAfter && i < totalSlots; i++) {
            const p = products[i];
            if (!p || (!p.title && !p.image)) {
                return i;
            }
        }
        return null;
    };

    const isProductAlreadyUsed = (
        candidate: any,
        excludeSlotIndex: number | null = null
    ): { isUsed: boolean; slotIdx?: number; pageNum?: number } => {
        if (!candidate) return { isUsed: false };
        const candId = String(candidate.id || candidate.productId || candidate._id || candidate.sourceProductId || '');
        const candTitle = (candidate.title || candidate.name || candidate.displayName || candidate.product_name || '').trim().toLowerCase();

        // Check across allPages if provided, otherwise check current page
        const pagesToCheck = allPages && allPages.length > 0 ? allPages : [page];

        for (let pIdx = 0; pIdx < pagesToCheck.length; pIdx++) {
            const pDraft = pagesToCheck[pIdx];
            const isCurrentPage = pDraft.id === page.id;

            for (const [slotStr, item] of Object.entries(pDraft.products)) {
                const sIdx = Number(slotStr);
                if (isCurrentPage && excludeSlotIndex !== null && sIdx === excludeSlotIndex) {
                    continue; // Skip the slot currently being replaced/edited
                }
                if (!item) continue;

                const itemId = String(item.id || '');
                const itemSourceId = String(item.sourceProductId || '');
                const itemTitle = (item.title || '').trim().toLowerCase();

                const idMatch = Boolean(candId && (candId === itemId || candId === itemSourceId));
                const titleMatch = Boolean(candTitle && candTitle === itemTitle);

                if (idMatch || titleMatch) {
                    return { isUsed: true, slotIdx: sIdx, pageNum: pIdx + 1 };
                }
            }
        }

        return { isUsed: false };
    };

    const handleAssignProductToSlot = (slotIdx: number, productData: any, advanceToNextEmpty: boolean = true) => {
        const check = isProductAlreadyUsed(productData, slotIdx);
        if (check.isUsed) {
            const prodName = productData.name || productData.title || productData.displayName || 'This product';
            toast.error(`"${prodName}" is already added in Slot ${(check.slotIdx ?? 0) + 1}${allPages && allPages.length > 1 ? ` (Page ${check.pageNum})` : ''}.`);
            return;
        }

        const rawImg = productData.image || productData.imageUrl || productData.image_url || productData.product_image || (Array.isArray(productData.images) && productData.images.length > 0 ? productData.images[0] : '');
        const item: ProductSlotItem = {
            id: String(productData.id || productData.productId || productData._id || ''),
            sourceProductId: String(productData.id || productData.productId || productData._id || ''),
            title: productData.name || productData.title || productData.displayName || productData.product_name || 'Product',
            description: productData.description || productData.displayDescription || '',
            image: extractS3Url(rawImg) || rawImg || '',
            offerPrice: productData.offer_price ?? productData.offerPrice ?? productData.price ?? 0,
            oldPrice: productData.original_price ?? productData.originalPrice ?? productData.oldPrice ?? productData.old_price ?? undefined,
            category: typeof productData.category === 'string' ? productData.category : (productData.category?.name || 'General'),
            subcategoryId: productData.subcategoryId || productData.subcategory_id,
        };

        const nextProducts = { ...page.products, [slotIdx]: item };
        const nextDraft = { ...page, products: nextProducts };
        onUpdatePage?.({ products: nextProducts });
        pushHistory(nextDraft);

        const totalSlots = currentGrid.rows * currentGrid.columns;

        if (advanceToNextEmpty) {
            // Find the next empty slot after slotIdx
            const nextEmpty = getNextAvailableSlot(nextProducts, totalSlots, slotIdx);
            setSelectedSlotIndex(nextEmpty);
        } else {
            setSelectedSlotIndex(slotIdx);
        }

        toast.success(`Assigned to Slot ${slotIdx + 1}`);
    };

    // Clicking a product from the drawer inserts into selected slot (if empty), or first empty slot
    const handleInsertProductFromDrawer = (productData: any) => {
        const check = isProductAlreadyUsed(productData, null);
        if (check.isUsed) {
            const prodName = productData.name || productData.title || productData.displayName || 'This product';
            toast.error(`"${prodName}" is already added in Slot ${(check.slotIdx ?? 0) + 1}${allPages && allPages.length > 1 ? ` (Page ${check.pageNum})` : ''}.`);
            return;
        }

        const totalSlots = currentGrid.rows * currentGrid.columns;

        let targetSlot: number | null = null;

        // If a slot is currently selected and it is currently empty, use it
        if (selectedSlotIndex !== null && selectedSlotIndex < totalSlots) {
            const currentSlotProduct = page.products[selectedSlotIndex];
            const isEmpty = !currentSlotProduct || (!currentSlotProduct.title && !currentSlotProduct.image);
            if (isEmpty) {
                targetSlot = selectedSlotIndex;
            }
        }

        // If no empty selected slot, find the first available empty slot on the canvas
        if (targetSlot === null) {
            targetSlot = getNextAvailableSlot(page.products, totalSlots, -1);
        }

        // If all slots are already filled on this page
        if (targetSlot === null) {
            if (selectedSlotIndex !== null && selectedSlotIndex < totalSlots) {
                targetSlot = selectedSlotIndex;
            } else {
                toast.error("All slots are filled on this page. Click a slot to replace, or add a new page.");
                return;
            }
        }

        handleAssignProductToSlot(targetSlot, productData, true);
    };

    // Canvas Drag & Drop Listeners
    const handleCanvasDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        const slotEl = (e.target as HTMLElement).closest('[data-slot-index]');
        if (slotEl) {
            slotEl.classList.add('ring-4', 'ring-orange-500/80');
        }
    };

    const handleCanvasDragLeave = (e: React.DragEvent) => {
        const slotEl = (e.target as HTMLElement).closest('[data-slot-index]');
        if (slotEl) {
            slotEl.classList.remove('ring-4', 'ring-orange-500/80');
        }
    };

    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const slotEl = (e.target as HTMLElement).closest('[data-slot-index]');
        if (!slotEl) return;
        slotEl.classList.remove('ring-4', 'ring-orange-500/80');

        const slotIdx = Number(slotEl.getAttribute('data-slot-index'));
        const dataStr = e.dataTransfer.getData('application/json');
        if (dataStr) {
            try {
                const product = JSON.parse(dataStr);
                const check = isProductAlreadyUsed(product, slotIdx);
                if (check.isUsed) {
                    const prodName = product.title || product.name || product.displayName || 'This product';
                    toast.error(`"${prodName}" is already added in Slot ${(check.slotIdx ?? 0) + 1}${allPages && allPages.length > 1 ? ` (Page ${check.pageNum})` : ''}.`);
                    return;
                }
                handleAssignProductToSlot(slotIdx, product);
            } catch {
                // ignore
            }
        }
    };

    // Selected element
    const activeOverlay = (page.overlayElements || []).find(e => e.id === selectedOverlayId);
    const TemplateComponent = getTemplateComponent(page.templateId);

    return (
        <div className="relative w-full h-full flex flex-row bg-card rounded-2xl overflow-hidden shadow-2xl border border-border">
            {/* ── CANVA LEFT DOCK ── */}
            <CanvaDock
                activeTab={activeDockTab}
                onTabChange={setActiveDockTab}
                currentTemplateId={page.templateId}
                onSelectTemplate={(templateId) => {
                    onSelectTemplate?.(templateId);
                    onUpdatePage?.({ templateId });
                }}
                shopId={shopId || null}
                usedProductIds={usedProductIds}
                usedProductTitles={usedProductTitles}
                onInsertProduct={handleInsertProductFromDrawer}
                onAddSticker={handleAddSticker}
                onAddText={handleAddText}
                onAddImageOverlay={handleAddImageOverlay}
                onOpenCreateProductModal={onOpenCreateProductModal || (() => {})}
            />

            {/* ── MAIN WORKSPACE AREA ── */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
                {/* ── TOP CONTEXTUAL TOOLBAR ── */}
                <ContextualToolbar
                    selectedElement={activeOverlay}
                    onUpdateElement={handleUpdateOverlay}
                    onDeleteElement={handleDeleteOverlay}
                    onDuplicateElement={handleDuplicateOverlay}
                    onBringForward={handleBringForward}
                    onSendBackward={handleSendBackward}
                    selectedSlotIndex={selectedSlotIndex}
                    selectedSlotProduct={selectedSlotIndex !== null ? page.products[selectedSlotIndex] : undefined}
                    onOpenSlotPicker={(slotIdx) => onSlotClick(slotIdx)}
                    onClearSlot={(slotIdx) => onSlotRemove(slotIdx)}
                    onDeselectAll={() => {
                        setSelectedOverlayId(null);
                        setSelectedSlotIndex(null);
                    }}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    currentGrid={currentGrid}
                    onGridConfigChange={onGridConfigChange}
                    zoom={zoom}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onResetZoom={handleResetZoom}
                />

                {/* ── SCROLLABLE CANVAS VIEWPORT ── */}
                <div
                    ref={viewportRef}
                    onClick={(e) => {
                        // Only deselect if user clicks on the gray/dot workspace background OUTSIDE the poster canvas
                        if (canvasRef.current && !canvasRef.current.contains(e.target as Node)) {
                            setSelectedOverlayId(null);
                            setSelectedSlotIndex(null);
                        }
                    }}
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
                                {/* ── THE ACTUAL POSTER CANVAS ── */}
                                <div
                                    ref={canvasRef}
                                    onDragOver={handleCanvasDragOver}
                                    onDragLeave={handleCanvasDragLeave}
                                    onDrop={handleCanvasDrop}
                                    onClick={(e) => {
                                        // Deselect only if clicking the canvas background itself
                                        if (e.target === canvasRef.current) {
                                            setSelectedOverlayId(null);
                                            setSelectedSlotIndex(null);
                                        }
                                    }}
                                    className="w-[794px] h-[1123px] relative bg-white select-none"
                                >
                                    {/* 1. Base React Template Component */}
                                    <TemplateComponent
                                        shopData={shopData}
                                        campaignInfo={page.campaignInfo}
                                        products={page.products}
                                        isEditable={true}
                                        excludeHeader={pageIndex > 0}
                                        onSlotClick={(slotIdx) => {
                                            setSelectedSlotIndex(slotIdx);
                                            setSelectedOverlayId(null);
                                            onSlotClick(slotIdx);
                                        }}
                                        onSlotRemove={onSlotRemove}
                                        onFieldChange={onFieldChange}
                                        gridConfig={currentGrid}
                                    />

                                    {/* 2. Canva Freeform Sticker & Overlay Layer */}
                                    <CanvasOverlayLayer
                                        elements={page.overlayElements || []}
                                        selectedId={selectedOverlayId}
                                        onSelectElement={(id) => {
                                            setSelectedOverlayId(id);
                                            if (id) setSelectedSlotIndex(null);
                                        }}
                                        onUpdateElement={handleUpdateOverlay}
                                        onDeleteElement={handleDeleteOverlay}
                                        onDuplicateElement={handleDuplicateOverlay}
                                        onBringForward={handleBringForward}
                                        onSendBackward={handleSendBackward}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
