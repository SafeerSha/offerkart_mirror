"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PosterOverlayElement } from '../types';
import { Trash2, Copy, ArrowUp, ArrowDown, Move } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CanvasOverlayLayerProps {
    elements: PosterOverlayElement[];
    selectedId: string | null;
    onSelectElement: (id: string | null) => void;
    onUpdateElement: (id: string, updates: Partial<PosterOverlayElement>) => void;
    onDeleteElement: (id: string) => void;
    onDuplicateElement: (id: string) => void;
    onBringForward?: (id: string) => void;
    onSendBackward?: (id: string) => void;
}

type DragMode = 'move' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw' | null;

export function CanvasOverlayLayer({
    elements,
    selectedId,
    onSelectElement,
    onUpdateElement,
    onDeleteElement,
    onDuplicateElement,
    onBringForward,
    onSendBackward,
}: CanvasOverlayLayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragMode, setDragMode] = useState<DragMode>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isEditingText, setIsEditingText] = useState(false);

    const dragStartRef = useRef<{
        startX: number;
        startY: number;
        origX: number;
        origY: number;
        origW: number;
        origH: number;
    }>({
        startX: 0,
        startY: 0,
        origX: 0,
        origY: 0,
        origW: 0,
        origH: 0,
    });

    const activeEl = elements.find(el => el.id === selectedId);

    // Global click listener to deselect when clicking blank canvas
    const handleContainerClick = (e: React.MouseEvent) => {
        if (e.target === containerRef.current) {
            onSelectElement(null);
            setIsEditingText(false);
        }
    };

    // Pointer down handler for moving
    const handleStartMove = (e: React.PointerEvent, el: PosterOverlayElement) => {
        e.stopPropagation();
        onSelectElement(el.id);
        setActiveId(el.id);
        setDragMode('move');

        dragStartRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: el.x,
            origY: el.y,
            origW: el.w,
            origH: el.h,
        };

        try {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    };

    // Pointer down handler for resizing
    const handleStartResize = (e: React.PointerEvent, mode: DragMode, el: PosterOverlayElement) => {
        e.stopPropagation();
        onSelectElement(el.id);
        setActiveId(el.id);
        setDragMode(mode);

        dragStartRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: el.x,
            origY: el.y,
            origW: el.w,
            origH: el.h,
        };

        try {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    };

    // Pointer move
    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragMode || !activeId) return;
        e.stopPropagation();

        const deltaX = e.clientX - dragStartRef.current.startX;
        const deltaY = e.clientY - dragStartRef.current.startY;
        const { origX, origY, origW, origH } = dragStartRef.current;

        if (dragMode === 'move') {
            const nextX = Math.round(Math.max(-50, Math.min(794 - origW + 50, origX + deltaX)));
            const nextY = Math.round(Math.max(-50, Math.min(1123 - origH + 50, origY + deltaY)));
            onUpdateElement(activeId, { x: nextX, y: nextY });
        } else if (dragMode === 'resize-se') {
            const nextW = Math.round(Math.max(40, origW + deltaX));
            const nextH = Math.round(Math.max(20, origH + deltaY));
            onUpdateElement(activeId, { w: nextW, h: nextH });
        } else if (dragMode === 'resize-sw') {
            const nextW = Math.round(Math.max(40, origW - deltaX));
            const nextX = Math.round(origX + (origW - nextW));
            const nextH = Math.round(Math.max(20, origH + deltaY));
            onUpdateElement(activeId, { x: nextX, w: nextW, h: nextH });
        } else if (dragMode === 'resize-ne') {
            const nextW = Math.round(Math.max(40, origW + deltaX));
            const nextH = Math.round(Math.max(20, origH - deltaY));
            const nextY = Math.round(origY + (origH - nextH));
            onUpdateElement(activeId, { y: nextY, w: nextW, h: nextH });
        } else if (dragMode === 'resize-nw') {
            const nextW = Math.round(Math.max(40, origW - deltaX));
            const nextH = Math.round(Math.max(20, origH - deltaY));
            const nextX = Math.round(origX + (origW - nextW));
            const nextY = Math.round(origY + (origH - nextH));
            onUpdateElement(activeId, { x: nextX, y: nextY, w: nextW, h: nextH });
        }
    }, [dragMode, activeId, onUpdateElement]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (dragMode) {
            setDragMode(null);
            try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch {
                // ignore
            }
        }
    }, [dragMode]);

    return (
        <div
            ref={containerRef}
            onClick={handleContainerClick}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute inset-0 w-full h-full pointer-events-none z-30 select-none overflow-hidden"
        >
            {elements.map((el) => {
                const isSelected = el.id === selectedId;

                return (
                    <div
                        key={el.id}
                        style={{
                            transform: `translate(${el.x}px, ${el.y}px) rotate(${el.rotation || 0}deg)`,
                            width: `${el.w}px`,
                            height: `${el.h}px`,
                            zIndex: el.zIndex,
                            opacity: el.opacity ?? 1,
                        }}
                        onPointerDown={(e) => handleStartMove(e, el)}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement(el.id);
                        }}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            setIsEditingText(true);
                        }}
                        className={cn(
                            "absolute top-0 left-0 pointer-events-auto cursor-move group transition-shadow",
                            isSelected && "ring-2 ring-orange-500 ring-offset-2 ring-offset-transparent shadow-xl"
                        )}
                    >
                        {/* ── ELEMENT CONTENT RENDER ── */}
                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            {renderElementGraphic(
                                el,
                                isSelected && isEditingText,
                                (newText) => onUpdateElement(el.id, { text: newText }),
                                (newSubText) => onUpdateElement(el.id, { badgeSecondaryText: newSubText }),
                                () => setIsEditingText(false)
                            )}
                        </div>

                        {/* ── SELECTION BOX & HANDLES ── */}
                        {isSelected && (
                            <>
                                {/* Floating Quick Toolbar (Canva Style) */}
                                <div
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute -top-11 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white rounded-xl px-2 py-1 flex items-center gap-1 shadow-2xl border border-slate-700 pointer-events-auto z-50 text-xs whitespace-nowrap"
                                >
                                    {/* Edit Text Button */}
                                    {el.kind !== 'image' && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsEditingText((prev) => !prev);
                                            }}
                                            className={cn(
                                                "px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]",
                                                isEditingText ? "bg-orange-500 text-white" : "hover:bg-slate-800 text-slate-300 hover:text-white"
                                            )}
                                            title="Edit Text Content"
                                        >
                                            <Move className="w-3 h-3 text-orange-400" />
                                            <span>{isEditingText ? "Done" : "Edit Text"}</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDuplicateElement(el.id);
                                        }}
                                        className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                                        title="Duplicate"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>

                                    {onBringForward && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onBringForward(el.id);
                                            }}
                                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                                            title="Bring Forward"
                                        >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    {onSendBackward && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSendBackward(el.id);
                                            }}
                                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                                            title="Send Backward"
                                        >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteElement(el.id);
                                        }}
                                        className="p-1 hover:bg-red-950/80 hover:text-red-400 rounded-lg text-slate-300 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* 4 Corner Resize Handles */}
                                <div
                                    onPointerDown={(e) => handleStartResize(e, 'resize-nw', el)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-orange-500 rounded-full cursor-nwse-resize shadow-md pointer-events-auto"
                                />
                                <div
                                    onPointerDown={(e) => handleStartResize(e, 'resize-ne', el)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-orange-500 rounded-full cursor-nesw-resize shadow-md pointer-events-auto"
                                />
                                <div
                                    onPointerDown={(e) => handleStartResize(e, 'resize-sw', el)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-orange-500 rounded-full cursor-nesw-resize shadow-md pointer-events-auto"
                                />
                                <div
                                    onPointerDown={(e) => handleStartResize(e, 'resize-se', el)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-orange-500 rounded-full cursor-nwse-resize shadow-md pointer-events-auto"
                                />
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function renderElementGraphic(
    el: PosterOverlayElement,
    isEditing: boolean,
    onTextChange: (val: string) => void,
    onSecondaryTextChange?: (val: string) => void,
    onFinishEdit?: () => void
) {
    if (el.kind === 'text') {
        if (isEditing) {
            return (
                <input
                    type="text"
                    value={el.text || ''}
                    autoFocus
                    onChange={(e) => onTextChange(e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onFinishEdit?.();
                    }}
                    className="w-full h-full bg-white/90 text-slate-900 border-2 border-orange-500 rounded px-1 outline-none font-bold"
                    style={{
                        fontSize: `${el.fontSize || 20}px`,
                        fontFamily: el.fontFamily,
                        fontWeight: el.fontWeight,
                        textAlign: el.textAlign || 'center',
                    }}
                />
            );
        }

        return (
            <div
                className="w-full h-full flex items-center justify-center select-none"
                style={{
                    fontSize: `${el.fontSize || 20}px`,
                    fontFamily: el.fontFamily || "'Inter', sans-serif",
                    fontWeight: el.fontWeight || 700,
                    color: el.color || '#1e293b',
                    textAlign: el.textAlign || 'center',
                    lineHeight: 1.1,
                }}
            >
                {el.text || 'Add Text'}
            </div>
        );
    }

    if (el.kind === 'image' && el.imageUrl) {
        return (
            <img
                src={el.imageUrl}
                alt="sticker"
                className="w-full h-full object-contain pointer-events-none"
            />
        );
    }

    // Badge / Sticker Presets
    const bgStyle = el.badgeBg || '#ef4444';
    const textColor = el.badgeTextColor || '#ffffff';

    const renderBadgeInputs = () => (
        <div
            className="w-full flex flex-col items-center justify-center px-1.5 z-20"
            onClick={(e) => e.stopPropagation()}
        >
            <input
                type="text"
                value={el.text || ''}
                autoFocus
                onChange={(e) => onTextChange(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onFinishEdit?.();
                }}
                className="w-[90%] bg-black/60 text-white font-black text-center rounded px-1 outline-none border border-white/70 leading-tight uppercase text-[0.85em] shadow-md"
            />
            {el.badgeSecondaryText !== undefined && (
                <input
                    type="text"
                    value={el.badgeSecondaryText || ''}
                    onChange={(e) => onSecondaryTextChange?.(e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onFinishEdit?.();
                    }}
                    placeholder="Subtext"
                    className="w-[85%] bg-black/50 text-white font-bold text-center rounded px-1 outline-none border border-white/50 text-[0.55em] tracking-wider mt-1 uppercase shadow"
                />
            )}
        </div>
    );

    if (el.shapeKind === 'starburst') {
        return (
            <div
                className="relative w-full h-full flex flex-col items-center justify-center p-2 text-center drop-shadow-lg"
                style={{
                    background: bgStyle,
                    color: textColor,
                    clipPath: 'polygon(50% 0%, 63% 18%, 82% 10%, 82% 31%, 100% 38%, 89% 55%, 98% 74%, 78% 78%, 73% 98%, 54% 88%, 35% 98%, 30% 78%, 10% 74%, 19% 55%, 8% 38%, 26% 31%, 26% 10%, 45% 18%)',
                }}
            >
                {isEditing ? (
                    renderBadgeInputs()
                ) : (
                    <>
                        <span className="font-black leading-tight uppercase tracking-tight text-[1.1em] drop-shadow-sm">
                            {el.text || 'OFFER'}
                        </span>
                        {el.badgeSecondaryText && (
                            <span className="text-[0.6em] font-bold opacity-90 uppercase tracking-widest mt-0.5">
                                {el.badgeSecondaryText}
                            </span>
                        )}
                    </>
                )}
            </div>
        );
    }

    if (el.shapeKind === 'circle') {
        return (
            <div
                className="w-full h-full rounded-full flex flex-col items-center justify-center p-2 text-center shadow-lg border-2 border-dashed border-white/60"
                style={{
                    background: bgStyle,
                    color: textColor,
                }}
            >
                {isEditing ? (
                    renderBadgeInputs()
                ) : (
                    <>
                        <span className="font-black leading-tight uppercase tracking-tight text-[1.15em] drop-shadow-sm">
                            {el.text || 'SALE'}
                        </span>
                        {el.badgeSecondaryText && (
                            <span className="text-[0.65em] font-bold opacity-90 uppercase tracking-widest mt-0.5">
                                {el.badgeSecondaryText}
                            </span>
                        )}
                    </>
                )}
            </div>
        );
    }

    if (el.shapeKind === 'ribbon') {
        return (
            <div
                className="relative w-full h-full flex items-center justify-center px-4 py-1 text-center shadow-md font-black tracking-wide uppercase drop-shadow"
                style={{
                    background: bgStyle,
                    color: textColor,
                    clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)',
                }}
            >
                {isEditing ? (
                    renderBadgeInputs()
                ) : (
                    <span className="text-[0.95em]">{el.text || 'SPECIAL'}</span>
                )}
            </div>
        );
    }

    // Default: Pill badge
    return (
        <div
            className="w-full h-full rounded-full flex flex-col items-center justify-center px-4 py-1 text-center shadow-lg border border-white/40 font-black tracking-wide"
            style={{
                background: bgStyle,
                color: textColor,
            }}
        >
            {isEditing ? (
                renderBadgeInputs()
            ) : (
                <>
                    <span className="text-[1em] leading-tight uppercase drop-shadow-sm">
                        {el.text || 'OFFER'}
                    </span>
                    {el.badgeSecondaryText && (
                        <span className="text-[0.65em] font-bold opacity-90 uppercase tracking-wider">
                            {el.badgeSecondaryText}
                        </span>
                    )}
                </>
            )}
        </div>
    );
}
