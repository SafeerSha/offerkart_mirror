"use client";

import { useState, Suspense, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import PosterDesigner from "@/components/shop-manager/PosterDesigner";
import { CanvasElement } from "@/components/shop-manager/PosterDesigner";
import { PosterTemplateSelector } from "@/components/shop-manager/PosterTemplateSelector";
import { TemplateConfig } from "@/lib/posterTemplates";
import { templateConfigToCanvasElements, ShopData } from "@/lib/templateToCanvas";
import { useMyShops, useBranches } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { FileText, Plus, X } from "lucide-react";

type PosterPageDraft = {
    id: string;
    template: TemplateConfig;
    elements: CanvasElement[];
    canvasBg: string;
};

export default function PosterDesignerPage() {
    const { data: session } = useSession();
    const [posterPages, setPosterPages] = useState<PosterPageDraft[]>([]);
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [isChoosingTemplate, setIsChoosingTemplate] = useState(true);

    // Fetch shop data
    const { data: shopsResponse } = useMyShops();
    const shops = useMemo(() => {
        if (!shopsResponse?.success || !shopsResponse?.data) return [];
        const result = shopsResponse.data as any;
        return Array.isArray(result) ? result : (result.data || []);
    }, [shopsResponse]);

    const activeShop = shops[0] as any | undefined;
    const activeShopId = useMemo(() => {
        const sid = session?.shopId ?? (session?.user as any)?.shopId;
        if (sid) return String(sid);
        if (shops.length > 0) return String(shops[0].id);
        return null;
    }, [session, shops]);

    // Fetch branches for the active shop
    const { data: branchesResponse } = useBranches(activeShopId || "");
    const branches = useMemo(() => {
        if (!branchesResponse?.success || !branchesResponse?.data) return [];
        const result = branchesResponse.data as any;
        const list = Array.isArray(result) ? result : (result.data || []);
        return Array.isArray(list) ? list : [];
    }, [branchesResponse]);

    // Build ShopData object
    const shopData = useMemo((): ShopData => {
        const shopName =
            activeShop?.shop_name ||
            (session?.user as any)?.business_name ||
            "Your Shop Name";

        const shopPhone = activeShop?.phone || (session?.user as any)?.phone || "";
        const shopEmail =
            (session?.user as any)?.email || activeShop?.email || "";

        const activeBranches = branches
            .filter((b: any) => b.is_active)
            .map((b: any) => b.branch_name || b.city)
            .filter(Boolean) as string[];

        return {
            shopName,
            shopPhone,
            shopEmail,
            branches: activeBranches.length > 0 ? activeBranches : undefined,
            logoUrl: activeShop?.logo_url || undefined,
        };
    }, [activeShop, session, branches]);

    const activePage = useMemo(
        () => posterPages.find((page) => page.id === activePageId) || null,
        [posterPages, activePageId]
    );

    const handleSelectTemplate = (template: TemplateConfig) => {
        const { elements, canvasBg } = templateConfigToCanvasElements(
            template,
            template.id === "blank" ? undefined : shopData
        );
        const pageId = crypto.randomUUID();
        const newPage: PosterPageDraft = {
            id: pageId,
            template,
            elements,
            canvasBg,
        };

        setPosterPages((prev) => [...prev, newPage]);
        setActivePageId(pageId);
        setIsChoosingTemplate(false);
    };

    const handleBackToTemplates = () => {
        setIsChoosingTemplate(true);
    };

    const handleDeletePoster = (e: React.MouseEvent, pageId: string) => {
        e.stopPropagation();
        
        setPosterPages((prev) => {
            const filtered = prev.filter(p => p.id !== pageId);
            
            if (pageId === activePageId) {
                if (filtered.length > 0) {
                    setActivePageId(filtered[filtered.length - 1].id);
                } else {
                    setActivePageId(null);
                    setIsChoosingTemplate(true);
                }
            }
            
            return filtered;
        });
    };

    const handleAddNewPoster = () => {
        if (!activePage) return;
        if (posterPages.length >= 11) return;

        // Add poster with the same theme but without the header
        const { elements, canvasBg } = templateConfigToCanvasElements(
            activePage.template,
            activePage.template.id === "blank" ? undefined : shopData,
            { excludeHeader: true }
        );

        const pageId = crypto.randomUUID();
        const newPage: PosterPageDraft = {
            id: pageId,
            template: activePage.template,
            elements,
            canvasBg,
        };

        setPosterPages((prev) => [...prev, newPage]);
        setActivePageId(pageId);
    };

    const handleSnapshotChange = useCallback((pageId: string, snapshot: { elements: CanvasElement[]; canvasBg: string }) => {
        setPosterPages((prev) =>
            prev.map((page) =>
                page.id === pageId
                    ? { ...page, elements: snapshot.elements, canvasBg: snapshot.canvasBg }
                    : page
            )
        );
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <div className="h-20 lg:h-32" />

            <main className="w-full relative overflow-hidden bg-background min-h-screen">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="mx-auto relative px-2 lg:px-8 py-4 md:py-8 max-w-[1600px]">
                    <Breadcrumbs
                        items={[
                            { label: "Dashboard", href: "/shop-manager" },
                            {
                                label: "Poster Designer",
                                href: !activePage ? "/shop-manager/poster-designer" : undefined,
                            },
                            ...(activePage ? [{ label: activePage.template.name }] : []),
                        ]}
                    />

                    <div className="mt-6 md:mt-10">
                        {isChoosingTemplate ? (
                            <PosterTemplateSelector
                                onSelect={handleSelectTemplate}
                                shopName={shopData.shopName}
                            />
                        ) : activePage ? (
                            <Suspense
                                fallback={
                                    <div className="flex items-center justify-center min-h-[500px]">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Launching Canvas Studio...
                                            </p>
                                        </div>
                                    </div>
                                }
                            >
                                <div className="animate-in fade-in zoom-in-95 duration-500">
                                    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white/80 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                                            {posterPages.map((page, index) => (
                                                <button
                                                    key={page.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setActivePageId(page.id);
                                                        setIsChoosingTemplate(false);
                                                    }}
                                                    className={cn(
                                                        "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all",
                                                        page.id === activePage.id
                                                            ? "border-orange-300 bg-orange-50 text-orange-600 shadow-sm"
                                                            : "border-gray-100 bg-white text-gray-500 hover:border-orange-200 hover:text-orange-500"
                                                    )}
                                                >
                                                    <FileText className="h-4 w-4 shrink-0" />
                                                    <span className="text-[10px] font-black uppercase tracking-wide">
                                                        Poster {index + 1}
                                                    </span>
                                                    {index === 0 && (
                                                        <span className="max-w-[120px] truncate text-[9px] font-bold text-gray-400">
                                                            {page.template.name}
                                                        </span>
                                                    )}
                                                    <div 
                                                        className="ml-1 rounded-full p-0.5 hover:bg-gray-200/50 hover:text-red-500 transition-colors"
                                                        onClick={(e) => handleDeletePoster(e, page.id)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddNewPoster}
                                            disabled={posterPages.length >= 11}
                                            className={cn(
                                                "flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white shadow-lg transition-all",
                                                posterPages.length >= 11
                                                    ? "cursor-not-allowed bg-gray-400 shadow-gray-400/20 opacity-80"
                                                    : "bg-orange-500 shadow-orange-500/20 hover:bg-orange-600 active:scale-95"
                                            )}
                                            title={posterPages.length >= 11 ? "Maximum 11 posters allowed" : ""}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Poster {posterPages.length >= 11 && "(Max)"}
                                        </button>
                                    </div>
                                    <PosterDesigner
                                        key={activePage.id}
                                        shopId={activeShopId || undefined}
                                        initialElements={activePage.elements}
                                        initialBg={activePage.canvasBg}
                                        templateConfig={activePage.template}
                                        onBack={handleBackToTemplates}
                                        onSnapshotChange={(snapshot) => handleSnapshotChange(activePage.id, snapshot)}
                                    />
                                </div>
                            </Suspense>
                        ) : (
                            <PosterTemplateSelector
                                onSelect={handleSelectTemplate}
                                shopName={shopData.shopName}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
