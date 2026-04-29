/**
 * posterTemplates.ts  (v2 — JSON-driven)
 *
 * All poster templates are defined as TemplateConfig objects.
 * No PNG thumbnails — previews are rendered dynamically via TemplateThumbnail.tsx
 * Use templateConfigToCanvasElements() from templateToCanvas.ts to load into PosterDesigner.
 */

import { TemplateConfig } from './posterTemplateSchema';

export type { TemplateConfig };

// ─────────────────────────────────────────────
// TEMPLATE REGISTRY
// ─────────────────────────────────────────────

export const POSTER_TEMPLATES: TemplateConfig[] = [

    // ═══════════════════════════════════════════
    // RETAIL
    // ═══════════════════════════════════════════

    {
        id: 'hypermarket-red',
        name: 'Grand Hypermarket',
        category: 'retail',
        canvasBackground: '#ffffff',
        fonts: ['Staatliches', 'Inter'],
        header: {
            height: 200,
            background: '#dc2626',
            logo: { x: 30, y: 30, w: 140, h: 140, shape: 'rect', background: '#ffffff' },
            titleStyle: {
                x: 200, y: 30,
                fontSize: 56, fontWeight: 900, color: '#ffffff',
                fontFamily: "'Staatliches', cursive",
            },
            subtitleStyle: {
                x: 200, y: 90,
                fontSize: 64, fontWeight: 900, color: '#facc15',
                fontFamily: "'Staatliches', cursive",
                shadow: '3px 3px 0px rgba(0,0,0,0.2)',
            },
            taglineStyle: {
                x: 200, y: 160,
                fontSize: 14, fontWeight: 600, color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
            },
        },
        footer: {
            height: 60,
            background: '#dc2626',
            mainTextStyle: {
                x: 100, y: 14,
                fontSize: 16, fontWeight: 700, color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
            },
            secondaryTextStyle: {
                x: 720, y: 14,
                fontSize: 16, fontWeight: 900, color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
            },
        },
        itemGrid: {
            columns: 3, rows: 4, gap: 12,
            padding: { top: 20, right: 16, bottom: 20, left: 16 },
            cellBackground: '#fff9f9',
            cellBorderRadius: 0,
            cellBorderColor: '#fca5a5',
            cellShadow: '0 2px 8px rgba(220,38,38,0.08)',
            showPriceArea: true,
            priceAreaColor: '#dc2626',
        },
    },

    {
        id: 'fresh-deals-green',
        name: 'Fresh Market Deals',
        category: 'food',
        canvasBackground: '#ffffff',
        fonts: ['Outfit', 'Inter'],
        header: {
            height: 220,
            background: '#15803d',
            logo: { x: 594, y: 20, w: 180, h: 80, shape: 'rect', background: '#166534' },
            titleStyle: {
                x: 50, y: 30,
                fontSize: 80, fontWeight: 900, color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
            },
            subtitleStyle: {
                x: 55, y: 120,
                fontSize: 26, fontWeight: 500, color: '#dcfce7',
                fontFamily: "'Inter', sans-serif",
            },
            taglineStyle: {
                x: 55, y: 170,
                fontSize: 18, fontWeight: 700, color: '#bbf7d0',
                fontFamily: "'Inter', sans-serif",
            },
        },
        footer: {
            height: 80,
            background: '#15803d',
            mainTextStyle: {
                x: 120, y: 24,
                fontSize: 18, fontWeight: 600, color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
            },
            secondaryTextStyle: {
                x: 560, y: 48,
                fontSize: 14, fontWeight: 700, color: '#bbf7d0',
                fontFamily: "'Inter', sans-serif",
            },
        },
        itemGrid: {
            columns: 3, rows: 3, gap: 14,
            padding: { top: 18, right: 18, bottom: 18, left: 18 },
            cellBackground: '#f0fdf4',
            cellBorderRadius: 0,
            cellBorderColor: '#86efac',
            cellShadow: '0 2px 10px rgba(21,128,61,0.08)',
            showPriceArea: true,
            priceAreaColor: '#15803d',
        },
    },

    {
        id: 'one-day-prices',
        name: 'Al Baladi Style',
        category: 'retail',
        canvasBackground: '#ffffff',
        fonts: ['Staatliches', 'Inter'],
        header: {
            height: 200,
            background: '#ffffff',
            logo: { x: 20, y: 20, w: 200, h: 120, shape: 'rect', background: '#15803d' },
            titleStyle: {
                x: 260, y: 15,
                fontSize: 80, fontWeight: 900, color: '#facc15',
                fontFamily: "'Staatliches', cursive",
                shadow: '4px 4px 0px #15803d',
            },
            subtitleStyle: {
                x: 260, y: 95,
                fontSize: 90, fontWeight: 900, color: '#facc15',
                fontFamily: "'Staatliches', cursive",
                shadow: '4px 4px 0px #15803d',
            },
            taglineStyle: {
                x: 30, y: 160,
                fontSize: 18, fontWeight: 700, color: '#15803d',
                fontFamily: "'Inter', sans-serif",
            },
            accentBar: { height: 3, color: '#15803d' },
        },
        footer: {
            height: 40,
            background: '#f97316',
            mainTextStyle: {
                x: 30, y: 10,
                fontSize: 13, fontWeight: 700, color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
            },
            secondaryTextStyle: {
                x: 730, y: 10,
                fontSize: 16, fontWeight: 900, color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
            },
        },
        itemGrid: {
            columns: 3, rows: 4, gap: 10,
            padding: { top: 16, right: 16, bottom: 16, left: 16 },
            cellBackground: '#fefce8',
            cellBorderRadius: 0,
            cellBorderColor: '#fde68a',
            showPriceArea: true,
            priceAreaColor: '#15803d',
        },
    },

    {
        id: 'mega-weekend-sale',
        name: 'Weekend Mega Store',
        category: 'retail',
        canvasBackground: { type: 'gradient', direction: 'diagonal', stops: ['#ffffff', '#fefce8'] },
        fonts: ['Outfit', 'Inter'],
        header: {
            height: 240,
            background: '#facc15',
            titleStyle: {
                x: 40, y: 35,
                fontSize: 96, fontWeight: 900, color: '#000000',
                fontFamily: "'Outfit', sans-serif",
                shadow: '4px 4px 0px rgba(0,0,0,0.1)',
            },
            subtitleStyle: {
                x: 60, y: 155,
                fontSize: 42, fontWeight: 900, color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
            },
            accentBar: { height: 10, color: '#000000' },
            decorative: [
                { kind: 'burst', x: 600, y: 110, w: 150, h: 150, color: '#ef4444', opacity: 1 },
            ],
        },
        footer: {
            height: 80,
            background: '#000000',
            mainTextStyle: {
                x: 0, y: 20,
                fontSize: 24, fontWeight: 900, color: '#facc15',
                fontFamily: "'Inter', sans-serif",
                textAlign: 'center',
                letterSpacing: 2,
            },
        },
        itemGrid: {
            columns: 3, rows: 3, gap: 12,
            padding: { top: 20, right: 20, bottom: 20, left: 20 },
            cellBackground: '#ffffff',
            cellBorderRadius: 0,
            cellBorderColor: '#fde68a',
            cellShadow: '4px 4px 0px rgba(0,0,0,0.08)',
            showPriceArea: true,
            priceAreaColor: '#dc2626',
        },
    },

    {
        id: 'orange-flash-sale',
        name: 'Flash Sale Orange',
        category: 'retail',
        canvasBackground: '#fff7ed',
        fonts: ['Outfit', 'Inter'],
        header: {
            height: 210,
            background: '#ea580c',
            logo: { x: 30, y: 30, w: 130, h: 130, shape: 'rect', background: '#ffffff' },
            titleStyle: {
                x: 190, y: 35,
                fontSize: 70, fontWeight: 900, color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
            },
            subtitleStyle: {
                x: 190, y: 110,
                fontSize: 36, fontWeight: 700, color: '#fed7aa',
                fontFamily: "'Outfit', sans-serif",
            },
            taglineStyle: {
                x: 190, y: 158,
                fontSize: 16, fontWeight: 600, color: '#ffedd5',
                fontFamily: "'Inter', sans-serif",
            },
            accentBar: { height: 6, color: '#c2410c' },
            decorative: [
                { kind: 'burst', x: 630, y: 30, w: 120, h: 120, color: '#fbbf24', opacity: 0.9 },
            ],
        },
        footer: {
            height: 65,
            background: '#c2410c',
            mainTextStyle: {
                x: 0, y: 18,
                fontSize: 18, fontWeight: 700, color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
                textAlign: 'center',
            },
        },
        itemGrid: {
            columns: 2, rows: 4, gap: 14,
            padding: { top: 18, right: 18, bottom: 18, left: 18 },
            cellBackground: '#ffffff',
            cellBorderRadius: 0,
            cellBorderColor: '#fed7aa',
            cellShadow: '0 4px 12px rgba(234,88,12,0.1)',
            showPriceArea: true,
            priceAreaColor: '#ea580c',
        },
    },

    // ═══════════════════════════════════════════
    // TECH
    // ═══════════════════════════════════════════

    {
        id: 'tech-blue-sale',
        name: 'Tech Blue Sale',
        category: 'tech',
        canvasBackground: { type: 'gradient', direction: 'diagonal', stops: ['#f8fafc', '#e2e8f0'] },
        fonts: ['Outfit', 'Inter'],
        header: {
            height: 220,
            background: '#1e3a8a',
            titleStyle: {
                x: 50, y: 40,
                fontSize: 68, fontWeight: 900, color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                shadow: '0 10px 20px rgba(0,0,0,0.2)',
            },
            subtitleStyle: {
                x: 50, y: 115,
                fontSize: 32, fontWeight: 600, color: '#93c5fd',
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: 2,
            },
            taglineStyle: {
                x: 50, y: 165,
                fontSize: 16, fontWeight: 700, color: '#bfdbfe',
                letterSpacing: 1,
            },
            logo: { x: 580, y: 40, w: 160, h: 40, shape: 'rect', background: 'rgba(255,255,255,0.15)' },
            accentBar: { height: 10, color: '#3b82f6' },
            decorative: [
                { kind: 'rect', x: 600, y: -50, w: 300, h: 300, color: '#1e40af', opacity: 0.08 },
            ],
        },
        footer: {
            height: 80,
            background: '#0f172a',
            mainTextStyle: {
                x: 0, y: 22,
                fontSize: 18, fontWeight: 800, color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                textAlign: 'center',
                letterSpacing: 1,
            },
        },
        backgroundElements: [
            { kind: 'rect', x: -100, y: 800, w: 400, h: 400, color: '#3b82f6', opacity: 0.04 },
        ],
        itemGrid: {
            columns: 2, rows: 3, gap: 16,
            padding: { top: 20, right: 24, bottom: 20, left: 24 },
            cellBackground: '#ffffff',
            cellBorderRadius: 0,
            cellBorderColor: '#bfdbfe',
            cellShadow: '0 4px 16px rgba(30,58,138,0.08)',
            showPriceArea: true,
            priceAreaColor: '#1e40af',
        },
    },

    {
        id: 'dark-tech-pro',
        name: 'Dark Tech Pro',
        category: 'tech',
        canvasBackground: '#0f172a',
        fonts: ['Outfit'],
        header: {
            height: 230,
            background: '#1e293b',
            logo: { x: 30, y: 30, w: 120, h: 120, shape: 'rect', background: '#334155' },
            titleStyle: {
                x: 180, y: 40,
                fontSize: 64, fontWeight: 900, color: '#f1f5f9',
                fontFamily: "'Outfit', sans-serif",
            },
            subtitleStyle: {
                x: 180, y: 115,
                fontSize: 28, fontWeight: 600, color: '#38bdf8',
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: 3,
            },
            taglineStyle: {
                x: 180, y: 165,
                fontSize: 14, fontWeight: 500, color: '#94a3b8',
                letterSpacing: 1,
            },
            accentBar: { height: 4, color: '#0ea5e9' },
            decorative: [
                { kind: 'rect', x: 600, y: -20, w: 200, h: 200, color: '#0ea5e9', opacity: 0.1 },
            ],
        },
        footer: {
            height: 70,
            background: '#020617',
            mainTextStyle: {
                x: 0, y: 18,
                fontSize: 16, fontWeight: 700, color: '#94a3b8',
                textAlign: 'center',
            },
            secondaryTextStyle: {
                x: 0, y: 40,
                fontSize: 12, fontWeight: 600, color: '#38bdf8',
                textAlign: 'center',
            },
        },
        itemGrid: {
            columns: 2, rows: 3, gap: 14,
            padding: { top: 16, right: 20, bottom: 16, left: 20 },
            cellBackground: '#1e293b',
            cellBorderRadius: 0,
            cellBorderColor: '#334155',
            cellShadow: '0 4px 20px rgba(0,0,0,0.3)',
            showPriceArea: true,
            priceAreaColor: '#0ea5e9',
        },
    },

    // ═══════════════════════════════════════════
    // FASHION
    // ═══════════════════════════════════════════

    {
        id: 'elegant-fashion',
        name: 'Elegant Boutique',
        category: 'fashion',
        canvasBackground: { type: 'gradient', direction: 'to-bottom', stops: ['#fffcf9', '#fff5eb'] },
        fonts: ['Playfair Display', 'Inter'],
        header: {
            height: 240,
            background: '#fdf2f2',
            titleStyle: {
                x: 0, y: 60,
                fontSize: 64, fontWeight: 400, color: '#111827',
                fontFamily: "'Playfair Display', serif",
                textAlign: 'center',
            },
            subtitleStyle: {
                x: 0, y: 140,
                fontSize: 18, fontWeight: 600, color: '#9ca3af',
                textAlign: 'center',
                letterSpacing: 6,
            },
            accentBar: { height: 2, color: '#9ca3af' },
        },
        footer: {
            height: 80,
            background: '#fdf2f2',
            mainTextStyle: {
                x: 0, y: 28,
                fontSize: 14, fontWeight: 700, color: '#4b5563',
                textAlign: 'center',
                letterSpacing: 3,
            },
        },
        itemGrid: {
            columns: 2, rows: 3, gap: 16,
            padding: { top: 20, right: 24, bottom: 20, left: 24 },
            cellBackground: '#ffffff',
            cellBorderRadius: 0,
            cellBorderColor: '#e5e7eb',
            cellShadow: '0 2px 8px rgba(0,0,0,0.06)',
            showPriceArea: false,
        },
    },

    {
        id: 'luxury-black',
        name: 'Luxury Black',
        category: 'fashion',
        canvasBackground: '#0a0a0a',
        fonts: ['Playfair Display', 'Inter'],
        header: {
            height: 250,
            background: '#111111',
            logo: { x: 30, y: 30, w: 110, h: 110, shape: 'rect', background: '#1a1a1a' },
            titleStyle: {
                x: 170, y: 50,
                fontSize: 60, fontWeight: 400, color: '#f5f5f5',
                fontFamily: "'Playfair Display', serif",
            },
            subtitleStyle: {
                x: 170, y: 125,
                fontSize: 16, fontWeight: 400, color: '#d4af37',
                letterSpacing: 8,
            },
            taglineStyle: {
                x: 170, y: 170,
                fontSize: 12, fontWeight: 300, color: '#6b7280',
                letterSpacing: 4,
            },
            accentBar: { height: 1, color: '#d4af37' },
        },
        footer: {
            height: 70,
            background: '#111111',
            mainTextStyle: {
                x: 0, y: 22,
                fontSize: 12, fontWeight: 400, color: '#6b7280',
                textAlign: 'center',
                letterSpacing: 6,
            },
        },
        itemGrid: {
            columns: 2, rows: 3, gap: 12,
            padding: { top: 20, right: 20, bottom: 20, left: 20 },
            cellBackground: '#1a1a1a',
            cellBorderRadius: 0,
            cellBorderColor: '#2a2a2a',
            showPriceArea: false,
        },
    },

    // ═══════════════════════════════════════════
    // FOOD
    // ═══════════════════════════════════════════

    {
        id: 'food-festival',
        name: 'Food Festival',
        category: 'food',
        canvasBackground: '#fef3c7',
        fonts: ['Outfit', 'Inter'],
        header: {
            height: 220,
            background: '#d97706',
            logo: { x: 610, y: 20, w: 160, h: 90, shape: 'rect', background: '#b45309' },
            titleStyle: {
                x: 30, y: 30,
                fontSize: 72, fontWeight: 900, color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
            },
            subtitleStyle: {
                x: 30, y: 115,
                fontSize: 28, fontWeight: 600, color: '#fef3c7',
                fontFamily: "'Outfit', sans-serif",
            },
            taglineStyle: {
                x: 30, y: 165,
                fontSize: 16, fontWeight: 500, color: '#fde68a',
                fontFamily: "'Inter', sans-serif",
            },
            accentBar: { height: 8, color: '#92400e' },
            decorative: [
                { kind: 'rect', x: 0, y: 180, w: 794, h: 40, color: '#fef3c7', opacity: 0.3 },
            ],
        },
        footer: {
            height: 70,
            background: '#92400e',
            mainTextStyle: {
                x: 0, y: 20,
                fontSize: 18, fontWeight: 700, color: '#fef3c7',
                textAlign: 'center',
            },
        },
        itemGrid: {
            columns: 3, rows: 3, gap: 12,
            padding: { top: 16, right: 16, bottom: 16, left: 16 },
            cellBackground: '#ffffff',
            cellBorderRadius: 0,
            cellBorderColor: '#fde68a',
            cellShadow: '0 4px 12px rgba(217,119,6,0.12)',
            showPriceArea: true,
            priceAreaColor: '#d97706',
        },
    },

    // ═══════════════════════════════════════════
    // GENERAL
    // ═══════════════════════════════════════════

    {
        id: 'clean-minimal',
        name: 'Clean Minimal',
        category: 'general',
        canvasBackground: '#f8fafc',
        fonts: ['Inter'],
        header: {
            height: 180,
            background: '#1e293b',
            logo: { x: 30, y: 25, w: 130, h: 130, shape: 'rect', background: '#334155' },
            titleStyle: {
                x: 185, y: 35,
                fontSize: 52, fontWeight: 800, color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
            },
            subtitleStyle: {
                x: 185, y: 100,
                fontSize: 22, fontWeight: 500, color: '#94a3b8',
                fontFamily: "'Inter', sans-serif",
            },
            taglineStyle: {
                x: 185, y: 140,
                fontSize: 14, fontWeight: 400, color: '#64748b',
            },
        },
        footer: {
            height: 60,
            background: '#1e293b',
            mainTextStyle: {
                x: 0, y: 18,
                fontSize: 14, fontWeight: 600, color: '#94a3b8',
                textAlign: 'center',
            },
        },
        itemGrid: {
            columns: 3, rows: 4, gap: 12,
            padding: { top: 20, right: 20, bottom: 20, left: 20 },
            cellBackground: '#ffffff',
            cellBorderRadius: 0,
            cellBorderColor: '#e2e8f0',
            cellShadow: '0 2px 8px rgba(0,0,0,0.06)',
            showPriceArea: true,
            priceAreaColor: '#1e293b',
        },
    },

    {
        id: 'purple-glow',
        name: 'Purple Glow',
        category: 'general',
        canvasBackground: { type: 'gradient', direction: 'to-bottom', stops: ['#f5f3ff', '#ede9fe'] },
        fonts: ['Outfit', 'Inter'],
        header: {
            height: 220,
            background: '#7c3aed',
            logo: { x: 30, y: 30, w: 140, h: 140, shape: 'rect', background: 'rgba(255,255,255,0.15)' },
            titleStyle: {
                x: 196, y: 38,
                fontSize: 60, fontWeight: 900, color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
            },
            subtitleStyle: {
                x: 196, y: 110,
                fontSize: 28, fontWeight: 600, color: '#ddd6fe',
                fontFamily: "'Outfit', sans-serif",
            },
            taglineStyle: {
                x: 196, y: 162,
                fontSize: 14, fontWeight: 500, color: '#c4b5fd',
            },
            accentBar: { height: 6, color: '#6d28d9' },
            decorative: [
                { kind: 'rect', x: 660, y: -40, w: 220, h: 220, color: '#a78bfa', opacity: 0.2 },
            ],
        },
        footer: {
            height: 70,
            background: '#4c1d95',
            mainTextStyle: {
                x: 0, y: 20,
                fontSize: 16, fontWeight: 700, color: '#ddd6fe',
                textAlign: 'center',
            },
        },
        itemGrid: {
            columns: 3, rows: 3, gap: 12,
            padding: { top: 18, right: 18, bottom: 18, left: 18 },
            cellBackground: '#ffffff',
            cellBorderRadius: 0,
            cellBorderColor: '#ddd6fe',
            cellShadow: '0 4px 14px rgba(124,58,237,0.08)',
            showPriceArea: true,
            priceAreaColor: '#7c3aed',
        },
    },

    // ═══════════════════════════════════════════
    // PREMIUM STITCH COLLECTION
    // ═══════════════════════════════════════════

    {
        id: 'neon-protocol',
        name: 'Neon Protocol',
        category: 'tech',
        canvasBackground: '#0a0a0a',
        fonts: ['Space Grotesk'],
        header: {
            height: 220,
            background: '#131313',
            logo: { x: 30, y: 40, w: 120, h: 120, shape: 'rect', background: '#00f3ff' },
            titleStyle: {
                x: 180, y: 45,
                fontSize: 64, fontWeight: 800, color: '#ffffff',
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: -2,
            },
            subtitleStyle: {
                x: 180, y: 120,
                fontSize: 32, fontWeight: 700, color: '#00f3ff',
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: 4,
                shadow: '0 0 15px rgba(0,243,255,0.5)',
            },
            taglineStyle: {
                x: 180, y: 170,
                fontSize: 12, fontWeight: 500, color: '#ff00ff',
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: 2,
            },
            accentBar: { height: 2, color: '#00f3ff' },
        },
        footer: {
            height: 70,
            background: '#0e0e0e',
            mainTextStyle: {
                x: 30, y: 15,
                fontSize: 14, fontWeight: 600, color: '#00f3ff',
                fontFamily: "'Space Grotesk', sans-serif",
            },
            secondaryTextStyle: {
                x: 0, y: 15,
                fontSize: 14, fontWeight: 600, color: '#ff00ff',
                fontFamily: "'Space Grotesk', sans-serif",
                textAlign: 'right',
            },
        },
        backgroundElements: [
            { kind: 'diagonal-stripe', x: 0, y: 0, w: 794, h: 1123, color: '#ffffff', opacity: 0.02 },
        ],
        itemGrid: {
            columns: 2, rows: 3, gap: 16,
            padding: { top: 20, right: 24, bottom: 20, left: 24 },
            cellBackground: 'rgba(255,255,255,0.03)',
            cellBorderRadius: 0,
            cellBorderColor: 'rgba(0,243,255,0.2)',
            cellShadow: '0 0 20px rgba(0,243,255,0.05)',
            showPriceArea: true,
            priceAreaColor: '#ff00ff',
        },
    },

    {
        id: 'nordic-minimalist',
        name: 'Nordic Minimalist',
        category: 'fashion',
        canvasBackground: '#f9f9f9',
        fonts: ['Noto Serif', 'Manrope'],
        header: {
            height: 240,
            background: '#f9f9f9',
            titleStyle: {
                x: 0, y: 60,
                fontSize: 56, fontWeight: 400, color: '#1a1c1c',
                fontFamily: "'Noto Serif', serif",
                textAlign: 'center',
            },
            subtitleStyle: {
                x: 0, y: 145,
                fontSize: 18, fontWeight: 600, color: '#9caf88',
                fontFamily: "'Manrope', sans-serif",
                textAlign: 'center',
                letterSpacing: 6,
            },
            accentBar: { height: 1, color: '#eeeeee' },
        },
        footer: {
            height: 80,
            background: '#ffffff',
            mainTextStyle: {
                x: 0, y: 25,
                fontSize: 12, fontWeight: 600, color: '#44483f',
                fontFamily: "'Manrope', sans-serif",
                textAlign: 'center',
                letterSpacing: 2,
            },
            secondaryTextStyle: {
                x: 0, y: 50,
                fontSize: 11, fontWeight: 500, color: '#75786e',
                fontFamily: "'Manrope', sans-serif",
                textAlign: 'center',
            },
        },
        itemGrid: {
            columns: 2, rows: 3, gap: 24,
            padding: { top: 30, right: 40, bottom: 30, left: 40 },
            cellBackground: '#ffffff',
            cellBorderRadius: 0,
            cellBorderColor: '#eeeeee',
            showPriceArea: false,
        },
    },

    {
        id: 'harvest-hearth',
        name: 'Harvest & Hearth',
        category: 'food',
        canvasBackground: '#fdf9e9',
        fonts: ['Plus Jakarta Sans', 'Manrope'],
        header: {
            height: 220,
            background: '#166534',
            logo: { x: 30, y: 30, w: 140, h: 140, shape: 'rect', background: '#fdf9e9' },
            titleStyle: {
                x: 200, y: 40,
                fontSize: 60, fontWeight: 800, color: '#ffffff',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: -1,
            },
            subtitleStyle: {
                x: 200, y: 115,
                fontSize: 32, fontWeight: 700, color: '#f8f4e4',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
            },
            taglineStyle: {
                x: 200, y: 165,
                fontSize: 16, fontWeight: 500, color: '#a6f4b5',
                fontFamily: "'Manrope', sans-serif",
            },
            accentBar: { height: 8, color: '#004c22' },
        },
        footer: {
            height: 80,
            background: '#166534',
            mainTextStyle: {
                x: 30, y: 18,
                fontSize: 15, fontWeight: 700, color: '#ffffff',
                fontFamily: "'Manrope', sans-serif",
            },
            secondaryTextStyle: {
                x: 0, y: 18,
                fontSize: 14, fontWeight: 600, color: '#a6f4b5',
                fontFamily: "'Manrope', sans-serif",
                textAlign: 'right',
            },
        },
        itemGrid: {
            columns: 3, rows: 3, gap: 12,
            padding: { top: 20, right: 20, bottom: 20, left: 20 },
            cellBackground: '#ffffff',
            cellBorderRadius: 0,
            cellBorderColor: '#ece8d9',
            cellShadow: '0 4px 12px rgba(22,101,52,0.06)',
            showPriceArea: true,
            priceAreaColor: '#ea580c',
        },
    },


    // ═══════════════════════════════════════════
    // BLANK
    // ═══════════════════════════════════════════

    {
        id: 'blank',
        name: 'Blank Canvas',
        category: 'blank',
        canvasBackground: '#ffffff',
        header: {
            height: 200,
            background: '#f8fafc',
            titleStyle: { fontSize: 40, fontWeight: 700, color: '#cbd5e1' },
        },
        footer: {
            height: 60,
            background: '#f1f5f9',
            mainTextStyle: { fontSize: 14, fontWeight: 500, color: '#cbd5e1' },
        },
        itemGrid: {
            columns: 3, rows: 4, gap: 12,
            padding: { top: 20, right: 20, bottom: 20, left: 20 },
            cellBackground: '#f8fafc',
            cellBorderRadius: 0,
            cellBorderColor: '#e2e8f0',
        },
    },
];

// Convenience: get templates by category
export function getTemplatesByCategory(category: string): TemplateConfig[] {
    if (category === 'all') return POSTER_TEMPLATES;
    return POSTER_TEMPLATES.filter(t => t.category === category);
}

export const TEMPLATE_CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'retail', label: 'Retail' },
    { id: 'food', label: 'Food' },
    { id: 'tech', label: 'Tech' },
    { id: 'fashion', label: 'Fashion' },
    { id: 'general', label: 'General' },
    { id: 'blank', label: 'Blank' },
] as const;
