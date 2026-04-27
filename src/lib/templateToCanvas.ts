/**
 * templateToCanvas.ts
 *
 * Converts a TemplateConfig (JSON definition) into:
 * - CanvasElement[]  — fed directly into PosterDesigner
 * - canvasBg string — the background CSS value for the canvas
 *
 * Also handles optional shop data injection (name, branches, contact).
 */

import { TemplateConfig, Background, DecorativeElement } from './posterTemplateSchema';
import { CanvasElement } from '@/components/shop-manager/PosterDesigner';

const CANVAS_W = 794;
const CANVAS_H = 1123;

// ─────────────────────────────────────────────
// Background CSS helper
// ─────────────────────────────────────────────

export function backgroundToCSS(bg: Background): string {
    if (typeof bg === 'string') return bg;
    const { direction, stops } = bg;
    const dir =
        direction === 'to-bottom' ? 'to bottom' :
        direction === 'to-right' ? 'to right' :
        direction === 'diagonal' ? '135deg' :
        'circle at center';
    if (direction === 'radial') {
        return `radial-gradient(${dir}, ${stops.join(', ')})`;
    }
    return `linear-gradient(${dir}, ${stops.join(', ')})`;
}

// ─────────────────────────────────────────────
// Decorative element → CanvasElement
// ─────────────────────────────────────────────

function decorativeToCanvas(d: DecorativeElement, idPrefix: string, zIndex = 0): CanvasElement {
    const shapeMap: Record<string, any> = {
        circle: 'circle',
        rect: 'rect',
        burst: 'burst',
        wave: 'wave',
        'diagonal-stripe': 'rect',
        'dot-grid': 'rect',
    };
    return {
        id: `${idPrefix}-${d.kind}-${d.x}`,
        type: 'shape',
        shapeKind: shapeMap[d.kind] ?? 'rect',
        x: d.x,
        y: d.y,
        w: d.w,
        h: d.h,
        fill: d.color,
        opacity: d.opacity ?? 1,
        zIndex,
    } as CanvasElement;
}

// ─────────────────────────────────────────────
// Shop data injection interface
// ─────────────────────────────────────────────

export interface ShopData {
    shopName?: string;
    shopPhone?: string;
    shopEmail?: string;
    branches?: string[];       // branch names/cities
    logoUrl?: string;
}

// ─────────────────────────────────────────────
// Main converter
// ─────────────────────────────────────────────

export function templateConfigToCanvasElements(
    config: TemplateConfig,
    shopData?: ShopData
): { elements: CanvasElement[]; canvasBg: string } {
    const elements: CanvasElement[] = [];
    let zCounter = 1;
    const z = () => zCounter++;

    const shopName = shopData?.shopName?.toUpperCase() ?? 'YOUR SHOP NAME';
    const branchLine = shopData?.branches?.join('  •  ') ?? '';
    const contactParts = [shopData?.shopPhone, shopData?.shopEmail].filter(Boolean);
    const contactLine = contactParts.join('  •  ');
    const footerMainText = [branchLine, contactLine].filter(Boolean).join('  •  ') || 'YOUR BRANCHES  •  CONTACT INFO';

    // ── Background decorative elements ──
    if (config.backgroundElements) {
        for (const d of config.backgroundElements) {
            elements.push(decorativeToCanvas(d, 'bg', z()));
        }
    }

    // ──────────────────────────────────────
    // HEADER
    // ──────────────────────────────────────
    const { header } = config;
    const headerBg = backgroundToCSS(header.background);

    // Header background rect
    elements.push({
        id: 'header-bg',
        type: 'shape',
        shapeKind: 'rect',
        x: 0,
        y: 0,
        w: CANVAS_W,
        h: header.height,
        fill: typeof header.background === 'string' ? header.background : '#ffffff',
        zIndex: z(),
    } as CanvasElement);

    // Logo placeholder
    if (header.logo) {
        const { logo } = header;
        elements.push({
            id: 'header-logo',
            type: 'shape',
            shapeKind: logo.shape === 'circle' ? 'circle' : 'rect',
            x: logo.x,
            y: logo.y,
            w: logo.w,
            h: logo.h,
            fill: logo.background,
            zIndex: z(),
            // If a real logo URL is provided
            ...(shopData?.logoUrl ? { imageSrc: shopData.logoUrl } : {}),
        } as CanvasElement);
    }

    // Header title (shop name)
    if (header.titleStyle) {
        const ts = header.titleStyle;
        elements.push({
            id: 'header-title',
            type: 'text',
            text: config.id === 'blank' ? 'YOUR SHOP NAME' : shopName,
            x: ts.x ?? 30,
            y: ts.y ?? 30,
            w: 0,
            h: 0,
            fontSize: ts.fontSize,
            fontWeight: ts.fontWeight,
            color: ts.color,
            fontFamily: ts.fontFamily,
            letterSpacing: ts.letterSpacing,
            textAlign: ts.textAlign,
            shadow: ts.shadow,
            zIndex: z(),
        } as CanvasElement);
    }

    // Header subtitle (generic tagline)
    if (header.subtitleStyle) {
        const ss = header.subtitleStyle;
        const subtitleText =
            config.id === 'one-day-prices' ? 'OFFERS' :
            config.id === 'hypermarket-red' ? 'MEGA SAVINGS' :
            config.id === 'elegant-fashion' ? 'EXCLUSIVE COLLECTION' :
            config.id === 'luxury-black' ? 'PREMIUM SELECTION' :
            'SPECIAL OFFERS';
        elements.push({
            id: 'header-subtitle',
            type: 'text',
            text: subtitleText,
            x: ss.x ?? 30,
            y: ss.y ?? 90,
            w: ss.textAlign === 'center' ? CANVAS_W : 0,
            h: 0,
            fontSize: ss.fontSize,
            fontWeight: ss.fontWeight,
            color: ss.color,
            fontFamily: ss.fontFamily,
            letterSpacing: ss.letterSpacing,
            textAlign: ss.textAlign,
            shadow: ss.shadow,
            zIndex: z(),
        } as CanvasElement);
    }

    // Header tagline (branch info or validity)
    if (header.taglineStyle) {
        const tl = header.taglineStyle;
        const taglineText = branchLine || 'VALID WHILE STOCKS LAST';
        elements.push({
            id: 'header-tagline',
            type: 'text',
            text: taglineText,
            x: tl.x ?? 30,
            y: tl.y ?? 160,
            w: tl.textAlign === 'center' ? CANVAS_W : 0,
            h: 0,
            fontSize: tl.fontSize,
            fontWeight: tl.fontWeight,
            color: tl.color,
            fontFamily: tl.fontFamily,
            letterSpacing: tl.letterSpacing,
            textAlign: tl.textAlign,
            zIndex: z(),
        } as CanvasElement);
    }

    // Accent bar (bottom edge of header)
    if (header.accentBar) {
        elements.push({
            id: 'header-accent-bar',
            type: 'shape',
            shapeKind: 'rect',
            x: 0,
            y: header.height - header.accentBar.height,
            w: CANVAS_W,
            h: header.accentBar.height,
            fill: header.accentBar.color,
            zIndex: z(),
        } as CanvasElement);
    }

    // Header decorative elements
    if (header.decorative) {
        for (const d of header.decorative) {
            elements.push(decorativeToCanvas(d, 'hdr', z()));
        }
    }

    // ──────────────────────────────────────
    // FOOTER
    // ──────────────────────────────────────
    const { footer } = config;
    const footerTop = CANVAS_H - footer.height;

    elements.push({
        id: 'footer-bg',
        type: 'shape',
        shapeKind: 'rect',
        x: 0,
        y: footerTop,
        w: CANVAS_W,
        h: footer.height,
        fill: typeof footer.background === 'string' ? footer.background : '#1e293b',
        zIndex: z(),
    } as CanvasElement);

    // Footer main text
    const ms = footer.mainTextStyle;
    elements.push({
        id: 'footer-main',
        type: 'text',
        text: footerMainText,
        x: ms.x ?? 0,
        y: footerTop + (ms.y ?? 14),
        w: ms.textAlign === 'center' ? CANVAS_W : 0,
        h: 0,
        fontSize: ms.fontSize,
        fontWeight: ms.fontWeight,
        color: ms.color,
        fontFamily: ms.fontFamily,
        textAlign: ms.textAlign,
        letterSpacing: ms.letterSpacing,
        zIndex: z(),
    } as CanvasElement);

    // Footer secondary text (e.g. page number / contact)
    // Always rendered right-aligned across full canvas width to prevent overflow
    if (footer.secondaryTextStyle) {
        const ss2 = footer.secondaryTextStyle;
        const isRight = !ss2.textAlign || ss2.textAlign === 'right';
        elements.push({
            id: 'footer-secondary',
            type: 'text',
            text: contactLine || 'PAGE 1',
            x: isRight ? 0 : (ss2.x ?? 16),
            y: footerTop + (ss2.y ?? 14),
            w: isRight ? CANVAS_W - 16 : (ss2.textAlign === 'center' ? CANVAS_W : 0),
            h: 0,
            fontSize: ss2.fontSize,
            fontWeight: ss2.fontWeight,
            color: ss2.color,
            fontFamily: ss2.fontFamily,
            textAlign: isRight ? 'right' : ss2.textAlign,
            letterSpacing: ss2.letterSpacing,
            zIndex: z(),
        } as CanvasElement);
    }

    // Footer decorative
    if (footer.decorative) {
        for (const d of footer.decorative) {
            const el = decorativeToCanvas(d, 'ftr', z());
            el.y = footerTop + d.y;
            elements.push(el);
        }
    }

    // ──────────────────────────────────────
    // ITEM GRID — product card placeholders
    // ──────────────────────────────────────
    const { itemGrid } = config;
    const gridTop = header.height + itemGrid.padding.top;
    const gridBottom = footerTop - itemGrid.padding.bottom;
    const gridLeft = itemGrid.padding.left;
    const gridRight = CANVAS_W - itemGrid.padding.right;
    const gridWidth = gridRight - gridLeft;
    const gridHeight = gridBottom - gridTop;

    const cellW = (gridWidth - (itemGrid.columns - 1) * itemGrid.gap) / itemGrid.columns;
    const cellH = (gridHeight - (itemGrid.rows - 1) * itemGrid.gap) / itemGrid.rows;

    for (let row = 0; row < itemGrid.rows; row++) {
        for (let col = 0; col < itemGrid.columns; col++) {
            const cellX = gridLeft + col * (cellW + itemGrid.gap);
            const cellY = gridTop + row * (cellH + itemGrid.gap);
            const cellId = `item-${row}-${col}`;

            // Main cell background / placeholder card
            elements.push({
                id: `${cellId}-bg`,
                type: 'product-card',
                x: cellX,
                y: cellY,
                w: cellW,
                h: cellH,
                cardBg: itemGrid.cellBackground,
                cardStyle: 'retail',
                cardTitle: 'Product Name',
                cardDesc: 'Description',
                cardOfferPrice: '₹00',
                cardOldPrice: '₹00',
                isTemplateSlot: true,   // marks this as a persistent grid slot
                zIndex: z(),
            } as CanvasElement);
        }
    }

    return {
        elements,
        canvasBg: backgroundToCSS(config.canvasBackground),
    };
}
