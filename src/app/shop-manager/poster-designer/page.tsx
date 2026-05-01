"use client";

import { useState, Suspense, useMemo } from "react";
import { useSession } from "next-auth/react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import PosterDesigner from "@/components/shop-manager/PosterDesigner";
import { CanvasElement } from "@/components/shop-manager/PosterDesigner";
import { PosterTemplateSelector } from "@/components/shop-manager/PosterTemplateSelector";
import { TemplateConfig } from "@/lib/posterTemplates";
import { templateConfigToCanvasElements, ShopData } from "@/lib/templateToCanvas";
import { useMyShops, useBranches } from "@/hooks/useApi";

export default function PosterDesignerPage() {
    const { data: session } = useSession();
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);
    const [injectedElements, setInjectedElements] = useState<CanvasElement[]>([]);
    const [injectedBg, setInjectedBg] = useState<string>("#ffffff");

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

    const handleSelectTemplate = (template: TemplateConfig) => {
        const { elements, canvasBg } = templateConfigToCanvasElements(
            template,
            template.id === "blank" ? undefined : shopData
        );
        setInjectedElements(elements);
        setInjectedBg(canvasBg);
        setSelectedTemplate(template);
    };

    const handleBackToTemplates = () => {
        setSelectedTemplate(null);
        setInjectedElements([]);
        setInjectedBg("#ffffff");
    };

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
                                href: selectedTemplate ? undefined : "/shop-manager/poster-designer",
                            },
                            ...(selectedTemplate ? [{ label: selectedTemplate.name }] : []),
                        ]}
                    />

                    <div className="mt-6 md:mt-10">
                        {!selectedTemplate ? (
                            <PosterTemplateSelector
                                onSelect={handleSelectTemplate}
                                shopName={shopData.shopName}
                            />
                        ) : (
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
                                    <PosterDesigner
                                        key={selectedTemplate.id}
                                        initialElements={injectedElements}
                                        initialBg={injectedBg}
                                        templateConfig={selectedTemplate}
                                        onBack={handleBackToTemplates}
                                    />
                                </div>
                            </Suspense>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
