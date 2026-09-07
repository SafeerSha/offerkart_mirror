import React from 'react';
import { TemplateMeta, TemplateProps } from './types';
import { HypermarketRedTemplate } from './items/HypermarketRed';
import { FreshDealsGreenTemplate } from './items/FreshDealsGreen';
import { MegaWeekendSaleTemplate } from './items/MegaWeekendSale';
import { TechBlueSaleTemplate } from './items/TechBlueSale';
import { ElegantFashionTemplate } from './items/ElegantFashion';
import { BlankCanvasTemplate } from './items/BlankCanvasTemplate';
import { EverydayEssentialsPosterTemplate } from './items/EverydayEssentialsPoster';
import { FreshDealsPosterTemplate } from './items/FreshDealsPoster';
import { OnamSpecialOffersPosterTemplate } from './items/OnamSpecialOffersPoster';
import { SchoolOffersPosterTemplate } from './items/SchoolOffersPoster';
import { SpecialOffersPosterTemplate } from './items/SpecialOffersPoster';
import { SuperOffersPosterTemplate } from './items/SuperOffersPoster';

export const TEMPLATE_METAS: TemplateMeta[] = [
    {
        id: 'hypermarket-red',
        name: 'Grand Hypermarket',
        category: 'retail',
        slotCount: 12,
        description: 'Vibrant retail flyer with 12 product slots, bold red branding and high-impact price tags.',
        previewColors: {
            primary: '#dc2626',
            secondary: '#facc15',
            accent: '#b91c1c',
            bg: '#ffffff',
        },
        component: HypermarketRedTemplate,
    },
    {
        id: 'fresh-deals-green',
        name: 'Fresh Market Deals',
        category: 'food',
        slotCount: 9,
        description: 'Clean emerald green flyer tailored for organic groceries, fruits and fresh produce with 9 spacious slots.',
        previewColors: {
            primary: '#15803d',
            secondary: '#a3e635',
            accent: '#166534',
            bg: '#f0fdf4',
        },
        component: FreshDealsGreenTemplate,
    },
    {
        id: 'mega-weekend-sale',
        name: 'Mega Weekend Sale',
        category: 'general',
        slotCount: 8,
        description: 'High-energy orange & amber gradient with 8 large showcase cards for weekend flash deals.',
        previewColors: {
            primary: '#ea580c',
            secondary: '#fbbf24',
            accent: '#c2410c',
            bg: '#fffbeb',
        },
        component: MegaWeekendSaleTemplate,
    },
    {
        id: 'super-offers-red',
        name: 'Super Mega Deals',
        category: 'retail',
        slotCount: 6,
        description: 'Bold supermarket red & yellow blockbuster flyer with high-impact 3D typography and 6 deals cards.',
        previewColors: {
            primary: '#ed1324',
            secondary: '#ffd619',
            accent: '#101010',
            bg: '#ed1324',
        },
        component: SuperOffersPosterTemplate,
    },
    {
        id: 'special-offers-orange',
        name: 'Dynamic Special Offers',
        category: 'retail',
        slotCount: 6,
        description: 'High-energy orange & red promotional flyer with sweeping wave accents and 6 product highlight cards.',
        previewColors: {
            primary: '#ff7410',
            secondary: '#f04a1a',
            accent: '#ff941f',
            bg: '#fff8eb',
        },
        component: SpecialOffersPosterTemplate,
    },
    {
        id: 'everyday-essentials',
        name: 'Everyday Essentials',
        category: 'retail',
        slotCount: 6,
        description: 'Warm botanical cream & evergreen poster with 6 showcase slots for daily essentials and lifestyle goods.',
        previewColors: {
            primary: '#17383d',
            secondary: '#5c7d61',
            accent: '#173f45',
            bg: '#f7f5ef',
        },
        component: EverydayEssentialsPosterTemplate,
    },
    {
        id: 'fresh-deals-poster',
        name: 'Farm Fresh Market',
        category: 'food',
        slotCount: 6,
        description: 'Handcrafted organic market flyer with playful cursive typography and 6 vibrant slots for fresh produce.',
        previewColors: {
            primary: '#174b27',
            secondary: '#2d8c3c',
            accent: '#15863b',
            bg: '#fbfff7',
        },
        component: FreshDealsPosterTemplate,
    },
    {
        id: 'onam-special-offers',
        name: 'Onam Festive Special',
        category: 'general',
        slotCount: 6,
        description: 'Traditional Kerala festival flyer in rich gold and emerald tones with floral motifs and 6 festive offer slots.',
        previewColors: {
            primary: '#19703a',
            secondary: '#f2c13c',
            accent: '#a44722',
            bg: '#fff9e8',
        },
        component: OnamSpecialOffersPosterTemplate,
    },
    {
        id: 'school-offers',
        name: 'Back to School Special',
        category: 'general',
        slotCount: 6,
        description: 'Energetic stationery & student flyer with playful notebook doodles, bold sticker badges and 6 product slots.',
        previewColors: {
            primary: '#102e59',
            secondary: '#ffdc19',
            accent: '#ef4d23',
            bg: '#f8fbff',
        },
        component: SchoolOffersPosterTemplate,
    },
    {
        id: 'tech-blue-sale',
        name: 'Smart Tech Bonanza',
        category: 'tech',
        slotCount: 6,
        description: 'Futuristic cyber navy & electric cyan dark flyer with 6 prominent gadget cards and warranty badges.',
        previewColors: {
            primary: '#0f172a',
            secondary: '#06b6d4',
            accent: '#2563eb',
            bg: '#020617',
        },
        component: TechBlueSaleTemplate,
    },
    {
        id: 'elegant-fashion',
        name: 'Maison Fashion Edit',
        category: 'fashion',
        slotCount: 6,
        description: 'Refined warm cream & gold boutique theme with 6 elegant cards for apparel and luxury collections.',
        previewColors: {
            primary: '#1a1715',
            secondary: '#d97706',
            accent: '#78350f',
            bg: '#faf8f5',
        },
        component: ElegantFashionTemplate,
    },
    {
        id: 'blank',
        name: 'Modern Modular Blank',
        category: 'blank',
        slotCount: 9,
        description: 'Versatile neutral canvas with 9 product slots suitable for any store or custom promotion.',
        previewColors: {
            primary: '#0f172a',
            secondary: '#4f46e5',
            accent: '#334155',
            bg: '#ffffff',
        },
        component: BlankCanvasTemplate,
    },
];

export const TEMPLATE_COMPONENTS: Record<string, React.ComponentType<TemplateProps>> = {
    'hypermarket-red': HypermarketRedTemplate,
    'fresh-deals-green': FreshDealsGreenTemplate,
    'mega-weekend-sale': MegaWeekendSaleTemplate,
    'super-offers-red': SuperOffersPosterTemplate,
    'special-offers-orange': SpecialOffersPosterTemplate,
    'everyday-essentials': EverydayEssentialsPosterTemplate,
    'fresh-deals-poster': FreshDealsPosterTemplate,
    'onam-special-offers': OnamSpecialOffersPosterTemplate,
    'school-offers': SchoolOffersPosterTemplate,
    'tech-blue-sale': TechBlueSaleTemplate,
    'elegant-fashion': ElegantFashionTemplate,
    'blank': BlankCanvasTemplate,
};

export function getTemplateMeta(id: string): TemplateMeta | undefined {
    return TEMPLATE_METAS.find((t) => t.id === id);
}

export function getTemplateComponent(id: string): React.ComponentType<TemplateProps> {
    return TEMPLATE_COMPONENTS[id] || HypermarketRedTemplate;
}
