"use client";

/**
 * TemplateThumbnail.tsx
 *
 * Renders a fully dynamic, CSS-based miniature A4 poster preview from a
 * TemplateConfig. Zero image files. Scales to any container width.
 *
 * Canvas proportions: 794 × 1123 (A4 portrait) = aspect ratio ~0.707
 */

import React from 'react';
import { TemplateConfig, Background, DecorativeElement } from '@/lib/posterTemplateSchema';
import { backgroundToCSS } from '@/lib/templateToCanvas';

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface TemplateThumbnailProps {
    config: TemplateConfig;
    shopName?: string;
}

// ─────────────────────────────────────────────
// Helper: % of canvas height
// ─────────────────────────────────────────────

const CANVAS_H = 1123;
const CANVAS_W = 794;
const pctH = (px: number) => `${(px / CANVAS_H) * 100}%`;
const pctW = (px: number) => `${(px / CANVAS_W) * 100}%`;

// ─────────────────────────────────────────────
// Decorative element renderer
// ─────────────────────────────────────────────

function DecorEl({ d, sectionHeight = CANVAS_H }: { d: DecorativeElement; sectionHeight?: number }) {
    const style: React.CSSProperties = {
        position: 'absolute',
        left: pctW(d.x),
        top: pctH(d.y),
        width: pctW(d.w),
        height: pctH(d.h),
        backgroundColor: d.color,
        opacity: d.opacity ?? 1,
        pointerEvents: 'none',
        borderRadius: d.kind === 'circle' ? '50%' : d.kind === 'burst' ? '50%' : undefined,
        transform: d.kind === 'burst' ? 'rotate(15deg) scale(1.2)' : undefined,
        clipPath: d.kind === 'burst'
            ? 'polygon(50% 2%, 55% 25%, 78% 18%, 68% 40%, 95% 50%, 68% 60%, 78% 82%, 55% 75%, 50% 98%, 45% 75%, 22% 82%, 32% 60%, 5% 50%, 32% 40%, 22% 18%, 45% 25%)'
            : d.kind === 'wave'
            ? 'polygon(0% 50%, 10% 40%, 20% 35%, 40% 40%, 60% 60%, 80% 65%, 90% 60%, 100% 50%, 100% 100%, 0% 100%)'
            : undefined,
    };
    return <div style={style} />;
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export function TemplateThumbnail({ config, shopName = 'SHOP NAME' }: TemplateThumbnailProps) {
    const { header, footer, itemGrid, backgroundElements } = config;

    const headerHeightPct = pctH(header.height);
    const footerHeightPct = pctH(footer.height);
    const footerTopPct = pctH(CANVAS_H - footer.height);

    // Item grid geometry (as % of canvas)
    const gridTopPx = header.height + itemGrid.padding.top;
    const gridBottomPx = CANVAS_H - footer.height - itemGrid.padding.bottom;
    const gridLeftPx = itemGrid.padding.left;
    const gridRightPx = CANVAS_W - itemGrid.padding.right;
    const gridWidthPx = gridRightPx - gridLeftPx;
    const gridHeightPx = gridBottomPx - gridTopPx;
    const gapPx = itemGrid.gap;

    const cellWpx = (gridWidthPx - (itemGrid.columns - 1) * gapPx) / itemGrid.columns;
    const cellHpx = (gridHeightPx - (itemGrid.rows - 1) * gapPx) / itemGrid.rows;

    const cells = [];
    for (let row = 0; row < itemGrid.rows; row++) {
        for (let col = 0; col < itemGrid.columns; col++) {
            const cellXpx = gridLeftPx + col * (cellWpx + gapPx);
            const cellYpx = gridTopPx + row * (cellHpx + gapPx);
            cells.push({ row, col, cellXpx, cellYpx });
        }
    }

    const canvasBg = backgroundToCSS(config.canvasBackground);

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
                background: canvasBg,
                overflow: 'hidden',
                borderRadius: '4px',
            }}
        >
            {/* ── Background decorative elements ── */}
            {backgroundElements?.map((d, i) => (
                <DecorEl key={i} d={d} />
            ))}

            {/* ── HEADER ── */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: headerHeightPct,
                    background: backgroundToCSS(header?.background),
                    overflow: 'hidden',
                }}
            >
                {/* Logo */}
                {header?.logo && (
                    <div
                        style={{
                            position: 'absolute',
                            left: pctW(header.logo.x),
                            top: `${(header.logo.y / (header.height || 1)) * 100}%`,
                            width: pctW(header.logo.w),
                            height: `${(header.logo.h / (header.height || 1)) * 100}%`,
                            background: header.logo.background,
                            borderRadius:
                                header.logo.shape === 'circle' ? '50%' :
                                header.logo.shape === 'rounded-rect' ? '20%' :
                                '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {config.id === 'mega-savers' ? (
                            <div style={{
                                fontSize: '38%',
                                fontWeight: 800,
                                color: '#278b2f',
                                letterSpacing: '0.5px',
                                whiteSpace: 'nowrap',
                            }}>
                                TALAL MARKET
                            </div>
                        ) : (
                            /* Tiny logo icon hint */
                            <div style={{
                                width: '40%',
                                height: '40%',
                                background: header.titleStyle?.color || '#cccccc',
                                opacity: 0.3,
                                borderRadius: '50%',
                            }} />
                        )}
                    </div>
                )}

                {/* Title text */}
                {header.titleStyle && (
                    <div
                        style={{
                            position: 'absolute',
                            left: header.titleStyle.textAlign === 'center' ? 0 : pctW(header.titleStyle.x ?? 30),
                            top: `${((header.titleStyle.y ?? 30) / header.height) * 100}%`,
                            right: header.titleStyle.textAlign === 'center' ? 0 : undefined,
                            fontSize: `${(header.titleStyle.fontSize / CANVAS_W) * 100}vw`,
                            fontWeight: header.titleStyle.fontWeight,
                            color: header.titleStyle.color,
                            fontFamily: header.titleStyle.fontFamily,
                            letterSpacing: header.titleStyle.letterSpacing
                                ? `${header.titleStyle.letterSpacing * 0.01}em`
                                : undefined,
                            textAlign: header.titleStyle.textAlign ?? 'left',
                            lineHeight: 1.1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                        }}
                    >
                        {config.id === 'blank' ? 'YOUR SHOP NAME' : shopName}
                    </div>
                )}

                {/* Subtitle */}
                {header.subtitleStyle && (
                    <div
                        style={{
                            position: 'absolute',
                            left: header.subtitleStyle.textAlign === 'center' ? 0 : pctW(header.subtitleStyle.x ?? 30),
                            top: `${((header.subtitleStyle.y ?? 90) / header.height) * 100}%`,
                            right: header.subtitleStyle.textAlign === 'center' ? 0 : undefined,
                            fontSize: `${(header.subtitleStyle.fontSize / CANVAS_W) * 100}vw`,
                            fontWeight: header.subtitleStyle.fontWeight,
                            color: header.subtitleStyle.color,
                            fontFamily: header.subtitleStyle.fontFamily,
                            letterSpacing: header.subtitleStyle.letterSpacing
                                ? `${header.subtitleStyle.letterSpacing * 0.01}em`
                                : undefined,
                            textAlign: header.subtitleStyle.textAlign ?? 'left',
                            lineHeight: 1.1,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {config.id === 'one-day-prices' ? 'OFFERS' :
                         config.id === 'hypermarket-red' ? 'MEGA SAVINGS' :
                         config.id === 'elegant-fashion' ? 'EXCLUSIVE COLLECTION' :
                         config.id === 'luxury-black' ? 'PREMIUM SELECTION' :
                         config.id === 'mega-savers' ? 'HUGE DISCOUNTS' :
                         'SPECIAL OFFERS'}
                    </div>
                )}

                {/* Accent bar */}
                {header.accentBar && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${(header.accentBar.height / header.height) * 100}%`,
                            background: header.accentBar.color,
                        }}
                    />
                )}

                {/* Header decorative */}
                {header.decorative?.map((d, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: pctW(d.x),
                            top: `${(d.y / header.height) * 100}%`,
                            width: pctW(d.w),
                            height: `${(d.h / header.height) * 100}%`,
                            backgroundColor: d.color,
                            opacity: d.opacity ?? 1,
                            borderRadius: d.kind === 'circle' ? '50%' : undefined,
                            clipPath: d.kind === 'burst'
                                ? 'polygon(50% 2%, 55% 25%, 78% 18%, 68% 40%, 95% 50%, 68% 60%, 78% 82%, 55% 75%, 50% 98%, 45% 75%, 22% 82%, 32% 60%, 5% 50%, 32% 40%, 22% 18%, 45% 25%)'
                                : undefined,
                        }}
                    />
                ))}
            </div>

            {/* ── ITEM GRID ── */}
            {cells.map(({ row, col, cellXpx, cellYpx }) => {
                const key = `${row}-${col}`;
                return (
                    <div
                        key={key}
                        style={{
                            position: 'absolute',
                            left: pctW(cellXpx),
                            top: pctH(cellYpx),
                            width: pctW(cellWpx),
                            height: pctH(cellHpx),
                            background: itemGrid.cellBackground,
                            borderRadius: `${(itemGrid.cellBorderRadius / cellWpx) * 50}%`,
                            border: itemGrid.cellBorderColor
                                ? `1px solid ${itemGrid.cellBorderColor}`
                                : undefined,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* Product image area */}
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8%',
                                gap: '8%',
                            }}
                        >
                            {/* Mock product image */}
                            <div style={{
                                width: '60%',
                                aspectRatio: '1',
                                background: itemGrid.cellBorderColor ?? '#e5e7eb',
                                borderRadius: '8%',
                                opacity: 0.4,
                            }} />
                            {/* Mock name line */}
                            <div style={{
                                width: '80%',
                                height: `${pctH(cellHpx * 0.06)}`,
                                background: '#6b7280',
                                borderRadius: '4px',
                                opacity: 0.25,
                                minHeight: '2px',
                            }} />
                            {/* Mock price - old */}
                            <div style={{
                                width: '50%',
                                height: `${pctH(cellHpx * 0.04)}`,
                                background: '#9ca3af',
                                borderRadius: '4px',
                                opacity: 0.2,
                                minHeight: '2px',
                            }} />
                        </div>
                    </div>
                );
            })}

            {/* ── FOOTER ── */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: footerHeightPct,
                    background: backgroundToCSS(footer?.background),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                        footer?.mainTextStyle?.textAlign === 'center' ? 'center' : 'flex-start',
                    paddingLeft: footer?.mainTextStyle?.textAlign !== 'center'
                        ? pctW(footer?.mainTextStyle?.x ?? 16)
                        : undefined,
                    overflow: 'hidden',
                }}
            >
                {/* Footer text placeholder bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12%', width: '70%' }}>
                    <div style={{
                        height: '10%',
                        background: footer?.mainTextStyle?.color || '#cccccc',
                        borderRadius: '2px',
                        opacity: 0.5,
                        minHeight: '1px',
                    }} />
                    {footer?.secondaryTextStyle && (
                        <div style={{
                            height: '8%',
                            background: footer.secondaryTextStyle.color,
                            borderRadius: '2px',
                            opacity: 0.35,
                            width: '60%',
                            minHeight: '1px',
                        }} />
                    )}
                </div>
            </div>

            {/* Blank canvas overlay hint */}
            {config.id === 'blank' && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '8px',
                }}>
                    <div style={{
                        width: '20%',
                        aspectRatio: '1',
                        borderRadius: '50%',
                        border: '2px dashed #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <div style={{
                            fontSize: '200%',
                            color: '#94a3b8',
                            lineHeight: 1,
                        }}>+</div>
                    </div>
                    <div style={{
                        fontSize: '90%',
                        color: '#94a3b8',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                    }}>FREESTYLE</div>
                </div>
            )}
        </div>
    );
}
