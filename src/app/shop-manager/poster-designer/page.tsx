"use client";

import { useState, Suspense, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import PosterDesigner from "@/components/shop-manager/PosterDesigner";
import { CanvasElement } from "@/components/shop-manager/PosterDesigner";
import { PosterTemplateSelector } from "@/components/shop-manager/PosterTemplateSelector";
import { TemplateConfig } from "@/lib/posterTemplates";
import { templateConfigToCanvasElements, ShopData } from "@/lib/templateToCanvas";
import { useMyShops, useBranches } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { AppModal } from "@/components/shared/AppModal";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { FileText, Plus, X, AlertTriangle } from "lucide-react";

type PosterPageDraft = {
    id: string;
    template: TemplateConfig;
    elements: CanvasElement[];
    canvasBg: string;
    initialElements: CanvasElement[];
    initialCanvasBg: string;
};

export default function PosterDesignerPage() {
    const { data: session } = useSession();
    const [posterPages, setPosterPages] = useState<PosterPageDraft[]>([]);
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [isChoosingTemplate, setIsChoosingTemplate] = useState(true);

    const router = useRouter();
    const [forceLeave, setForceLeave] = useState(false);

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

    // Unsaved changes guard (must be before handlers that reference them)
    const [showLeaveWarning, setShowLeaveWarning] = useState(false);
    const [pendingLeaveAction, setPendingLeaveAction] = useState<(() => void) | null>(null);

    const isPageDirty = useCallback((page: PosterPageDraft) => {
        if (!page.initialElements) return false;
        try {
            return (
                JSON.stringify(page.elements) !== JSON.stringify(page.initialElements) ||
                page.canvasBg !== page.initialCanvasBg
            );
        } catch {
            return false;
        }
    }, []);

    const confirmLeave = () => {
        if (pendingLeaveAction) {
            pendingLeaveAction();
        }
        setShowLeaveWarning(false);
        setPendingLeaveAction(null);
        // forceLeave is intentionally left true only for the navigation path
    };

    const cancelLeave = () => {
        setShowLeaveWarning(false);
        setPendingLeaveAction(null);
        setForceLeave(false);
    };

    // Stable boolean — only flips when dirty status actually changes (not on every keystroke)
    const isDesignerDirty = useMemo(() => {
        if (isChoosingTemplate) return false;
        return posterPages.some(isPageDirty);
    }, [posterPages, isChoosingTemplate, isPageDirty]);

    // Browser back / close warning (tab close or refresh) — only when actually dirty in designer
    useEffect(() => {
        if (!isDesignerDirty) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "You have unsaved changes in the poster designer. Leave anyway?";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDesignerDirty]);

    // Intercept real browser back button + mobile swipe-back gesture
    useEffect(() => {
        if (!isDesignerDirty || forceLeave) return;

        const onPopState = () => {
            // Stay on the page
            history.pushState(null, "", window.location.pathname + window.location.search);

            setPendingLeaveAction(() => () => {
                setForceLeave(true);
                setTimeout(() => router.back(), 10);
            });
            setShowLeaveWarning(true);
        };

        // Ensure we have a history entry to intercept
        history.pushState(null, "", window.location.pathname + window.location.search);

        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, [isDesignerDirty, forceLeave, router]);

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
            initialElements: JSON.parse(JSON.stringify(elements)),
            initialCanvasBg: canvasBg,
        };

        setPosterPages((prev) => [...prev, newPage]);
        setActivePageId(pageId);
        setIsChoosingTemplate(false);
    };

    const handleBackToTemplates = () => {
        if (activePage && isPageDirty(activePage)) {
            setPendingLeaveAction(() => () => {
                setIsChoosingTemplate(true);
            });
            setShowLeaveWarning(true);
            return;
        }
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
            initialElements: JSON.parse(JSON.stringify(elements)),
            initialCanvasBg: canvasBg,
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
                                        allPagesElements={posterPages.map(p => p.elements)}
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

            {/* Unsaved changes warning modal */}
            <AppModal
                open={showLeaveWarning}
                onOpenChange={(open) => {
                    if (!open) {
                        cancelLeave();
                    }
                }}
                title="Unsaved Changes"
                description="You will lose the changes you made if you leave the designer now."
            >
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-sm text-orange-700 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Changes will be lost</p>
                            <p className="mt-1 text-xs opacity-80">Your current poster edits have not been exported or saved yet.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <PremiumButton variant="outline" onClick={cancelLeave} className="rounded-xl">
                            Stay here
                        </PremiumButton>
                        <PremiumButton
                            onClick={confirmLeave}
                            className="rounded-xl px-6 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                        >
                            Leave anyway
                        </PremiumButton>
                    </div>
                </div>
            </AppModal>
        </div>
    );
}
