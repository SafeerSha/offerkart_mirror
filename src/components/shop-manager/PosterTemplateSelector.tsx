"use client";

import React, { useState } from "react";
import { POSTER_TEMPLATES, TEMPLATE_CATEGORIES, getTemplatesByCategory, TemplateConfig } from "@/lib/posterTemplates";
import { TemplateThumbnail } from "@/components/shop-manager/TemplateThumbnail";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PosterTemplateSelectorProps {
    onSelect: (template: TemplateConfig) => void;
    shopName?: string;
}

export function PosterTemplateSelector({ onSelect, shopName }: PosterTemplateSelectorProps) {
    const [activeCategory, setActiveCategory] = useState<string>("all");

    const templates = getTemplatesByCategory(activeCategory);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ── Page header ── */}
            <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight text-gradient">Choose a Template</h2>
                <p className="text-muted-foreground text-sm">
                    {POSTER_TEMPLATES.length} templates available · No downloads required
                </p>
            </div>

            {/* ── Category tabs ── */}
            <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {TEMPLATE_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200",
                                activeCategory === cat.id
                                    ? "bg-primary text-muted-foreground border-primary shadow-md shadow-primary/20"
                                    : "bg-background text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                            )}
                        >
                            {cat.label}
                            {cat.id !== "all" && (
                                <span className="ml-1.5 opacity-50 text-[11px]">
                                    ({getTemplatesByCategory(cat.id).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                {/* Right fade indicator to show more content */}
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background via-background/70 to-transparent pointer-events-none sm:hidden" />
            </div>

            {/* ── Template grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        className="group relative bg-card border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 border-border/50 cursor-pointer"
                        onClick={() => onSelect(template)}
                    >
                        {/* Live thumbnail */}
                        <div className="relative overflow-hidden">
                            <TemplateThumbnail
                                config={template}
                                shopName={shopName?.toUpperCase() ?? "YOUR SHOP"}
                            />

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                                <PremiumButton
                                    onClick={(e) => { e.stopPropagation(); onSelect(template); }}
                                    className="scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 delay-75 text-sm py-2 px-4 rounded-xl"
                                >
                                    Use Template
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </PremiumButton>
                            </div>

                            {/* Category badge */}
                            <div className="absolute top-2 left-2">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                                    template.category === 'blank'
                                        ? "bg-white/90 text-gray-700"
                                        : "bg-black/50 text-white backdrop-blur-sm"
                                )}>
                                    {template.category === 'blank' ? 'FREESTYLE' : template.category}
                                </span>
                            </div>
                        </div>

                        {/* Card footer */}
                        <div className="px-3 py-2.5 border-t border-border/40">
                            <p className="text-sm font-bold text-foreground leading-tight truncate">
                                {template.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {template.itemGrid.columns} × {template.itemGrid.rows} grid
                            </p>
                        </div>

                        {/* Mobile tap overlay */}
                        <button
                            onClick={() => onSelect(template)}
                            className="absolute inset-0 z-10 md:hidden"
                            aria-label={`Select ${template.name}`}
                        />
                    </div>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                    <p className="text-lg font-semibold">No templates in this category yet.</p>
                </div>
            )}
        </div>
    );
}
