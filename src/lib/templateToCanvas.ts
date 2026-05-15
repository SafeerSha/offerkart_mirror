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
    if (!bg) return 'transparent';
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
    shopData?: ShopData,
    options?: { excludeHeader?: boolean }
): { elements: CanvasElement[]; canvasBg: string } {
    const elements: CanvasElement[] = [];
    let zCounter = 1;
    const z = () => zCounter++;

    const shopName = shopData?.shopName?.toUpperCase() ?? 'YOUR SHOP NAME';

    // Header version (minimal)
    const branchLineHeader = shopData?.branches?.join('  •  ') ?? '';

    const hasSecondary = !!config.footer.secondaryTextStyle;

    const anyConfig = config as any;

    // Footer versions (with labels)
    const branchesLabel = shopData?.branches?.length ? `Branches: ${shopData.branches.join('  •  ')}` : '';
    const phoneLabel = shopData?.shopPhone ? `Mobile: ${shopData.shopPhone}` : '';
    const emailLabel = shopData?.shopEmail ? `Email: ${shopData.shopEmail}` : '';

    const footerContactLine = [phoneLabel, emailLabel].filter(Boolean).join('  •  ');

    let footerMainText: string;
    let footerSecondaryText: string | undefined;

    if (hasSecondary) {
        // Split: Main gets branches, Secondary gets contact
        footerMainText = branchesLabel || 'BRANCHES';
        footerSecondaryText = footerContactLine || 'CONTACT INFO';
    } else {
        // Single slot: show everything
        footerMainText = [branchesLabel, footerContactLine].filter(Boolean).join('  •  ') || 'BRANCHES  •  CONTACT INFO';
    }

    // ── Background decorative elements ──
    if (config.backgroundElements) {
        for (const d of config.backgroundElements) {
            elements.push(decorativeToCanvas(d, 'bg', z()));
        }
    }

    // ── Custom decorations ──
    if ((config as any).decorations?.symbols) {
        for (const s of (config as any).decorations.symbols) {
            elements.push({
                id: `decoration-${s.type}-${s.color}`,
                type: 'shape',
                shapeKind: s.type === 'plus' ? 'plus' : s.type === 'circle' ? 'circle' : 'rect',
                x: 0, y: 0, w: s.size, h: s.size,
                fill: s.color,
                zIndex: z(),
            } as CanvasElement);
        }
    }

    // ──────────────────────────────────────
    // HEADER & FOOTER
    // ──────────────────────────────────────
    const { header, footer } = config;
    const headerBg = backgroundToCSS(header.background);
    const excludeHeader = options?.excludeHeader ?? false;
    const effectiveHeaderHeight = excludeHeader ? 0 : header.height;

    if (!excludeHeader) {
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
        const taglineText = branchLineHeader || 'VALID WHILE STOCKS LAST';
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

    // Custom header elements
    if (anyConfig.header?.title_top) {
        const tt = anyConfig.header.title_top;
        elements.push({
            id: 'custom-header-title-top',
            type: 'text',
            text: tt.text,
            x: 0,
            y: header.height / 2 - 50,
            w: CANVAS_W,
            h: 0,
            fontSize: tt.fontSize,
            fontWeight: tt.fontWeight,
            color: tt.color,
            textAlign: tt.align || 'center',
            zIndex: z(),
        } as CanvasElement);
    }
    if (anyConfig.header?.title_bottom) {
        const tb = anyConfig.header.title_bottom;
        elements.push({
            id: 'custom-header-title-bottom',
            type: 'text',
            text: tb.text,
            x: 0,
            y: header.height / 2 + 20,
            w: CANVAS_W,
            h: 0,
            fontSize: tb.fontSize,
            fontWeight: tb.fontWeight,
            color: tb.color,
            textAlign: tb.align || 'center',
            zIndex: z(),
        } as CanvasElement);
    }
    }

    // ──────────────────────────────────────
    // LEFT BANNER (Specialized Layout)
    // ──────────────────────────────────────
    if (anyConfig.left_banner) {
        const lb = anyConfig.left_banner;
        const padding = lb.padding || 24;
        const sidebarWidth = 320; // Fixed sidebar width from layout
        let currentY = effectiveHeaderHeight + padding;
        const lbX = padding;
        const lbW = sidebarWidth - padding * 2;

        // Add banner background
        elements.push({
            id: 'lb-bg',
            type: 'shape',
            shapeKind: 'rect',
            x: 0,
            y: effectiveHeaderHeight,
            w: sidebarWidth,
            h: CANVAS_H - effectiveHeaderHeight - footer.height,
            fill: lb.background || '#1f7a3f',
            zIndex: z(),
        } as CanvasElement);

        (lb.elements || []).forEach((el: any, idx: number) => {
            const id = `lb-el-${idx}`;
            
            if (el.type === 'logo') {
                elements.push({
                    id: `${id}-text`,
                    type: 'text',
                    text: el.text || 'SHOP',
                    x: lbX + 24,
                    y: currentY,
                    w: lbW - 48,
                    fontSize: el.fontSize || 18,
                    fontWeight: 800,
                    color: el.color || '#ffffff',
                    zIndex: z(),
                } as CanvasElement);
                currentY += 22;
                if (el.subtext) {
                    elements.push({
                        id: `${id}-subtext`,
                        type: 'text',
                        text: el.subtext,
                        x: lbX + 24,
                        y: currentY,
                        w: lbW - 48,
                        fontSize: 10,
                        color: el.color || '#ffffff',
                        zIndex: z(),
                    } as CanvasElement);
                    currentY += 30;
                }
            } else if (el.type === 'title') {
                elements.push({
                    id,
                    type: 'text',
                    text: el.text,
                    x: lbX + 24,
                    y: currentY,
                    w: lbW - 48,
                    fontSize: el.fontSize || 48,
                    fontWeight: el.fontWeight || '800',
                    color: el.color || '#ffd23f',
                    zIndex: z(),
                } as CanvasElement);
                currentY += (el.fontSize || 48) * 0.9 + 20;
            } else if (el.type === 'subtitle' || el.type === 'description') {
                elements.push({
                    id,
                    type: 'text',
                    text: el.text,
                    x: lbX + 24,
                    y: currentY,
                    w: lbW - 48,
                    fontSize: el.fontSize || 14,
                    color: el.color || '#ffffff',
                    zIndex: z(),
                } as CanvasElement);
                currentY += (el.fontSize || 14) + 15;
            } else if (el.type === 'label') {
                elements.push({
                    id: `${id}-bg`,
                    type: 'shape',
                    shapeKind: 'rect',
                    x: lbX + 24,
                    y: currentY,
                    w: 120,
                    h: 30,
                    fill: el.background || '#ffd23f',
                    zIndex: z(),
                } as CanvasElement);
                elements.push({
                    id: `${id}-text`,
                    type: 'text',
                    text: el.text,
                    x: lbX + 34,
                    y: currentY + 6,
                    w: 100,
                    fontSize: 14,
                    fontWeight: 700,
                    color: el.color || '#1f7a3f',
                    zIndex: z(),
                } as CanvasElement);
                currentY += 50;
            } else if (el.type === 'offer_box') {
                elements.push({
                    id: `${id}-bg`,
                    type: 'shape',
                    shapeKind: 'rect',
                    x: lbX + 24,
                    y: currentY,
                    w: lbW - 48,
                    h: 60,
                    fill: el.background || '#2fae60',
                    zIndex: z(),
                } as CanvasElement);
                elements.push({
                    id: `${id}-text`,
                    type: 'text',
                    text: el.text,
                    x: lbX + 39,
                    y: currentY + 16,
                    w: lbW - 78,
                    fontSize: el.fontSize || 22,
                    fontWeight: 800,
                    color: el.color || '#ffffff',
                    zIndex: z(),
                } as CanvasElement);
                currentY += 80;
            } else if (el.type === 'product_card') {
                elements.push({
                    id,
                    type: 'product-card',
                    x: lbX + 24,
                    y: currentY,
                    w: lbW - 48,
                    h: 155,
                    cardStyle: 'retail',
                    cardTitle: el.name || 'Product Name',
                    cardOfferPrice: el.price || '₹00',
                    // Don't set cardImage for template placeholders to avoid broken image loads
                    isTemplateSlot: true,
                    isSidebarSlot: true,
                    borderRadius: 5,
                    zIndex: z(),
                } as CanvasElement);
                currentY += 165;
            } else if (el.type === 'contact') {
                const contactStr = `${el.phone || ''}\n${el.website || ''}`;
                elements.push({
                    id,
                    type: 'text',
                    text: contactStr,
                    x: lbX + 24,
                    y: currentY,
                    w: lbW - 48,
                    fontSize: 12,
                    color: '#ffffff',
                    zIndex: z(),
                } as CanvasElement);
            }
        });
    }

    // ──────────────────────────────────────
    // FOOTER
    // ──────────────────────────────────────
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

    // Footer secondary text (e.g. contact info)
    // Always rendered right-aligned across full canvas width to prevent overflow
    if (footer.secondaryTextStyle) {
        const ss2 = footer.secondaryTextStyle;
        const isRight = !ss2.textAlign || ss2.textAlign === 'right';
        elements.push({
            id: 'footer-secondary',
            type: 'text',
            text: footerSecondaryText || 'CONTACT INFO',
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

    // Custom footer elements
    if (anyConfig.footer?.left_text) {
        const ft = anyConfig.footer;
        // Left text
        elements.push({
            id: 'custom-footer-left1',
            type: 'text',
            text: ft.left_text.line1,
            x: 30,
            y: footerTop + 10,
            w: 0,
            h: 0,
            fontSize: 14,
            color: '#000000',
            zIndex: z(),
        } as CanvasElement);
        elements.push({
            id: 'custom-footer-left2',
            type: 'text',
            text: ft.left_text.line2,
            x: 30,
            y: footerTop + 30,
            w: 0,
            h: 0,
            fontSize: 12,
            color: '#666666',
            zIndex: z(),
        } as CanvasElement);
        // CTA button
        if (ft.cta_button) {
            const btn = ft.cta_button;
            elements.push({
                id: 'custom-footer-cta-bg',
                type: 'shape',
                shapeKind: 'rect',
                x: CANVAS_W / 2 - 100,
                y: footerTop + 10,
                w: 200,
                h: 50,
                fill: btn.background,
                borderRadius: btn.borderRadius,
                zIndex: z(),
            } as CanvasElement);
            elements.push({
                id: 'custom-footer-cta-text',
                type: 'text',
                text: btn.text,
                x: CANVAS_W / 2,
                y: footerTop + 25,
                w: 0,
                h: 0,
                fontSize: 16,
                color: '#ffffff',
                textAlign: 'center',
                zIndex: z(),
            } as CanvasElement);
        }
        // Contact
        if (ft.contact) {
            elements.push({
                id: 'custom-footer-contact-text',
                type: 'text',
                text: ft.contact.text,
                x: CANVAS_W - 200,
                y: footerTop + 10,
                w: 0,
                h: 0,
                fontSize: 14,
                color: '#000000',
                zIndex: z(),
            } as CanvasElement);
            elements.push({
                id: 'custom-footer-contact-phone',
                type: 'text',
                text: ft.contact.phone,
                x: CANVAS_W - 200,
                y: footerTop + 30,
                w: 0,
                h: 0,
                fontSize: 12,
                color: '#666666',
                zIndex: z(),
            } as CanvasElement);
        }
    }

    // ──────────────────────────────────────
    // ITEM GRID or CUSTOM PRODUCT SECTION
    // ──────────────────────────────────────
    if (anyConfig.product_section) {
        // Custom product section
        const ps = anyConfig.product_section;
        const layout = ps.layout;
        if (layout.type === 'row') {
            const gap = layout.gap || 0;
            const cardStyle = ps.product_card_style;
            const totalW = ps.items.length * cardStyle.width + (ps.items.length - 1) * gap;
            let startX = (CANVAS_W - totalW) / 2;
            const startY = effectiveHeaderHeight + 50;
            for (let i = 0; i < ps.items.length; i++) {
                const item = ps.items[i];
                const style = item.style_override || cardStyle;
                const x = startX;
                const y = startY;
                // Card background
                elements.push({
                    id: `product-${item.id}-bg`,
                    type: 'shape',
                    shapeKind: 'rect',
                    x, y, w: style.width, h: style.height,
                    fill: style.background,
                    borderRadius: style.borderRadius,
                    shadow: style.shadow,
                    zIndex: z(),
                } as CanvasElement);
                // Discount badge
                if (style.discount_badge) {
                    elements.push({
                        id: `product-${item.id}-badge`,
                        type: 'shape',
                        shapeKind: style.discount_badge.shape === 'quarter-circle' ? 'circle' : 'rect',
                        x: x + (style.discount_badge.position === 'top-right' ? style.width - 50 : 0), y: y - 20, w: 50, h: 50,
                        fill: style.discount_badge.background,
                        zIndex: z(),
                    } as CanvasElement);
                    elements.push({
                        id: `product-${item.id}-badge-text`,
                        type: 'text',
                        text: item.discount,
                        x: x + (style.discount_badge.position === 'top-right' ? style.width - 25 : 25), y: y - 5, w: 0, h: 0,
                        fontSize: style.discount_badge.fontSize,
                        color: style.discount_badge.color,
                        textAlign: 'center',
                        zIndex: z(),
                    } as CanvasElement);
                }
                // Image placeholder
                const imgY = y + style.padding;
                elements.push({
                    id: `product-${item.id}-image`,
                    type: 'shape',
                    shapeKind: 'rect',
                    x: x + style.padding, y: imgY, w: style.image_placeholder.width, h: style.image_placeholder.height,
                    fill: '#f0f0f0',
                    zIndex: z(),
                } as CanvasElement);
                // Divider
                if (style.divider) {
                    const divY = imgY + style.image_placeholder.height + style.divider.marginTop;
                    elements.push({
                        id: `product-${item.id}-divider`,
                        type: 'shape',
                        shapeKind: 'rect',
                        x: x + style.padding, y: divY, w: style.width - style.padding * 2, h: style.divider.height,
                        fill: style.divider.color,
                        zIndex: z(),
                    } as CanvasElement);
                }
                // Product name
                const nameY = imgY + style.image_placeholder.height + (style.divider ? style.divider.height + style.divider.marginTop : 0) + 10;
                elements.push({
                    id: `product-${item.id}-name`,
                    type: 'text',
                    text: item.name,
                    x: x + style.padding, y: nameY, w: style.width - style.padding * 2, h: 0,
                    fontSize: style.product_name.fontSize,
                    fontWeight: style.product_name.fontWeight,
                    color: item.style_override?.name_color || style.product_name.color,
                    textAlign: style.product_name.align,
                    zIndex: z(),
                } as CanvasElement);
                // Price
                const priceY = nameY + 30;
                elements.push({
                    id: `product-${item.id}-price`,
                    type: 'text',
                    text: item.price,
                    x: x + style.padding, y: priceY, w: style.width - style.padding * 2, h: 0,
                    fontSize: style.price.fontSize,
                    color: style.price.color,
                    textAlign: style.price.align,
                    zIndex: z(),
                } as CanvasElement);
                startX += (item.style_override?.width || style.width) + gap;
            }
        }
    } else {
        // Standard itemGrid
        const { itemGrid } = config;
        const gridTop = effectiveHeaderHeight + itemGrid.padding.top;
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
    }

    return {
        elements,
        canvasBg: (config as any).canvas?.background ? backgroundToCSS((config as any).canvas.background) : backgroundToCSS(config.canvasBackground),
    };
}
