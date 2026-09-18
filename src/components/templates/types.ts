import React from 'react';

export interface ShopData {
    shopName?: string;
    shopPhone?: string;
    shopEmail?: string;
    branches?: string[];
    logoUrl?: string;
}

export interface CampaignInfo {
    title: string;
    subtitle?: string;
    tagline?: string;
    validFrom?: string;
    validTo?: string;
}

export interface ProductSlotItem {
    id?: string;
    title: string;
    description?: string;
    image?: string;
    oldPrice?: number | string;
    offerPrice: number | string;
    currency?: string;
    discountPercent?: number | string;
    badgeText?: string;
    sourceProductId?: string;
    category?: string;
    subcategories?: string[];
    subcategoryId?: number;
}

export interface GridConfig {
    rows: number;
    columns: number;
}

export interface TemplateProps {
    shopData: ShopData;
    campaignInfo: CampaignInfo;
    products: Record<number, ProductSlotItem>;
    isEditable?: boolean;
    excludeHeader?: boolean;
    onSlotClick?: (slotIndex: number) => void;
    onSlotRemove?: (slotIndex: number) => void;
    onFieldChange?: (field: keyof CampaignInfo, value: string) => void;
    gridConfig?: GridConfig;
}

export interface TemplateMeta {
    id: string;
    name: string;
    category: 'retail' | 'food' | 'tech' | 'fashion' | 'general' | 'blank';
    slotCount: number;
    description?: string;
    previewColors: {
        primary: string;
        secondary: string;
        accent: string;
        bg: string;
    };
    component: React.ComponentType<TemplateProps>;
}

export type OverlayKind = 'badge' | 'text' | 'sticker' | 'shape' | 'image';

export interface PosterOverlayElement {
    id: string;
    kind: OverlayKind;
    x: number;          // relative to canvas (0 - 794)
    y: number;          // relative to canvas (0 - 1123)
    w: number;
    h: number;
    rotation?: number;  // degrees
    zIndex: number;
    // Text properties
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string | number;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    // Badge / Sticker properties
    badgePreset?: string;
    badgeBg?: string;
    badgeTextColor?: string;
    badgeSecondaryText?: string;
    shapeKind?: 'rect' | 'circle' | 'pill' | 'starburst' | 'ribbon';
    // Image properties
    imageUrl?: string;
    opacity?: number;
}

