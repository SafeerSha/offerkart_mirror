"use client";

import React, { useRef, useState, useEffect } from 'react';
import { TemplateMeta } from '../types';

interface TemplatePreviewCardProps {
    meta: TemplateMeta;
    shopName?: string;
    logoUrl?: string;
}

export function TemplatePreviewCard({ meta, shopName, logoUrl }: TemplatePreviewCardProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.24);

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                setScale(width / 794);
            }
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    const Component = meta.component;

    // Sample preview dummy data for the miniature
    const previewShop = {
        shopName: shopName || "YOUR STORE",
        branches: ["Main Branch", "City Center"],
        shopPhone: "+91 98765 43210",
        logoUrl: logoUrl,
    };

    const previewCampaign = {
        title: "SPECIAL OFFERS",
        subtitle: "Exclusive deals and discounts",
        validFrom: "Today",
        validTo: "Sunday",
    };

    // Populate a few dummy products for preview realism
    const previewProducts = {
        0: { title: "Special Deal 1", offerPrice: "499", oldPrice: "799" },
        1: { title: "Special Deal 2", offerPrice: "299", oldPrice: "450" },
        2: { title: "Special Deal 3", offerPrice: "199", oldPrice: "300" },
        3: { title: "Special Deal 4", offerPrice: "899", oldPrice: "1200" },
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-[794/1123] overflow-hidden bg-white select-none rounded-t-xl"
        >
            <div
                style={{
                    width: '794px',
                    height: '1123px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                }}
            >
                <Component
                    shopData={previewShop}
                    campaignInfo={previewCampaign}
                    products={previewProducts}
                    isEditable={false}
                />
            </div>
        </div>
    );
}
