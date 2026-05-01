/**
 * posterTemplateSchema.ts
 *
 * Defines the TypeScript interfaces for the JSON-based poster template
 * configuration system. Templates are described semantically (header, footer,
 * item grid, theme) rather than as low-level pixel-positioned canvas elements.
 *
 * Canvas dimensions: 794 × 1123 px (A4 portrait)
 */

export type TemplateCategory = 'retail' | 'fashion' | 'tech' | 'food' | 'general' | 'blank';

export interface GradientBackground {
    type: 'gradient' | 'radial';
    direction: 'to-bottom' | 'to-right' | 'diagonal' | 'radial';
    stops: string[];
}

export type Background = string | GradientBackground;

export interface TextStyle {
    x?: number;          // px from left of canvas (or section)
    y?: number;          // px from top of section
    fontSize: number;
    fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    color: string;
    fontFamily?: string;  // optional — falls back to theme / browser default
    letterSpacing?: number;
    textAlign?: 'left' | 'center' | 'right';
    shadow?: string;
}

export interface LogoPlacement {
    x: number;
    y: number;
    w: number;
    h: number;
    shape: 'circle' | 'rect' | 'rounded-rect';
    background: string;
}

export type DecorativeKind = 'circle' | 'rect' | 'diagonal-stripe' | 'dot-grid' | 'burst' | 'wave';

export interface DecorativeElement {
    kind: DecorativeKind;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    opacity?: number;
}

export interface HeaderConfig {
    height: number;                         // px, from top of canvas
    background: Background;
    logo?: LogoPlacement;
    titleStyle: TextStyle;
    subtitleStyle?: TextStyle;
    taglineStyle?: TextStyle;               // third line, e.g. validity / slogan
    accentBar?: {                           // colored bar at bottom of header
        height: number;
        color: string;
    };
    decorative?: DecorativeElement[];
}

export interface FooterConfig {
    height: number;                         // px, from bottom of canvas
    background: Background;
    mainTextStyle: TextStyle;               // branch info / tagline
    secondaryTextStyle?: TextStyle;         // contact / page number
    decorative?: DecorativeElement[];
}

export interface ItemPlaceholder {
    // Explicit override for a single placeholder cell
    background?: string;
    borderRadius?: number;
    borderColor?: string;
}

export interface ItemGridConfig {
    columns: number;
    rows: number;
    gap: number;                            // px between cells
    padding: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    cellBackground: string;
    cellBorderRadius: number;
    cellBorderColor?: string;
    cellShadow?: string;
    showPriceArea?: boolean;               // render a price strip at bottom of each cell
    priceAreaColor?: string;
}

export interface TemplateConfig {
    id: string;
    name: string;
    category: TemplateCategory;
    canvasBackground: Background;

    // Font imports needed (Google Fonts)
    fonts?: string[];

    // Three main zones
    header: HeaderConfig;
    footer: FooterConfig;
    itemGrid: ItemGridConfig;

    // Optional full-canvas decorative elements behind everything
    backgroundElements?: DecorativeElement[];
}
