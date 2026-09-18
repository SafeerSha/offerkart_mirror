"use client";

import { useState, useRef } from "react";
import { TEMPLATE_METAS } from "@/components/templates/registry";
import { TemplatePreviewCard } from "@/components/templates/shared/TemplatePreviewCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { id: "all", label: "All Templates" },
    { id: "retail", label: "Retail & Supermarket" },
    { id: "food", label: "Food & Fresh Market" },
    { id: "tech", label: "Tech & Electronics" },
    { id: "fashion", label: "Fashion & Luxury" },
    { id: "general", label: "Flash Sales" },
    { id: "blank", label: "Blank Modular" },
];

interface PosterTemplateSelectorProps {
    onSelect: (template: any) => void;
    shopName?: string;
    logoUrl?: string;
}

export function PosterTemplateSelector({ onSelect, shopName, logoUrl }: PosterTemplateSelectorProps) {
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const filteredTemplates = TEMPLATE_METAS.filter((t) =>
        activeCategory === "all" ? true : t.category === activeCategory
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto px-4 py-6">
            <Breadcrumbs items={[{ label: "Manage Shop", href: "/shop-manager" }, { label: "Poster Designer" }]} className="mb-0" />
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                        Choose a <span className="text-orange-600">Poster Template</span>
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Select a professionally crafted, self-contained template for your store flyer.
                    </p>
                </div>
            </div>

            {/* Categories filter */}
            <div className="relative group">
                {/* Left Gradient & Button */}
                <div className="absolute left-0 top-0 bottom-2 w-16 bg-gradient-to-r from-background to-transparent z-10 flex items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <button
                        type="button"
                        onClick={() => scroll('left')}
                        className="w-8 h-8 flex items-center justify-center bg-card border border-border shadow-md rounded-full text-foreground hover:bg-muted transition-colors pointer-events-auto -ml-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>

                <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide px-1"
                >
                {CATEGORIES.map((cat) => {
                    const count = TEMPLATE_METAS.filter(t => cat.id === "all" ? true : t.category === cat.id).length;
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 flex items-center gap-2",
                                activeCategory === cat.id
                                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                                    : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"
                            )}
                        >
                            {cat.label}
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.2 rounded-full",
                                activeCategory === cat.id ? "bg-background/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                {count}
                            </span>
                        </button>
                    );
                })}
                </div>

                {/* Right Gradient & Button */}
                <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent z-10 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <button
                        type="button"
                        onClick={() => scroll('right')}
                        className="w-8 h-8 flex items-center justify-center bg-card border border-border shadow-md rounded-full text-foreground hover:bg-muted transition-colors pointer-events-auto -mr-2"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map((template) => (
                    <div
                        key={template.id}
                        className="group relative bg-card border border-border hover:border-primary/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
                        onClick={() => onSelect(template)}
                    >
                        <div className="relative overflow-hidden bg-muted/30 border-b border-border">
                            {/* Live Scaled Preview */}
                            <TemplatePreviewCard meta={template} shopName={shopName} logoUrl={logoUrl} />

                            {/* Hover Action Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                                <PremiumButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(template);
                                    }}
                                    className="scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 text-xs py-2 px-4 rounded-xl shadow-xl"
                                >
                                    Use Template
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </PremiumButton>
                            </div>

                            {/* Category Badge */}
                            <div className="absolute top-3 left-3 z-10">
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20 shadow">
                                    {template.category}
                                </span>
                            </div>

                            {/* Slot Count Pill */}
                            <div className="absolute top-3 right-3 z-10">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-background/90 text-foreground shadow">
                                    {template.slotCount} Products
                                </span>
                            </div>
                        </div>

                        {/* Card Info Details */}
                        <div className="p-4">
                            <h3 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug">
                                {template.name}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                {template.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
