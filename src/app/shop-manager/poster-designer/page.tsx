"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import PosterDesigner, { PosterDesignerRef, DesignerPosterData } from "@/components/shop-manager/PosterDesigner";
import { CanvasElement } from "@/components/shop-manager/PosterDesigner";
import { PosterTemplateSelector } from "@/components/shop-manager/PosterTemplateSelector";
import { TemplateConfig } from "@/lib/posterTemplates";
import { templateConfigToCanvasElements, ShopData } from "@/lib/templateToCanvas";
import { useMyShops, useBranches, useCreateOffer, useUpdateOffer, useOfferById } from "@/hooks/useApi";
import { cn, formatDateLocal } from "@/lib/utils";
import { AppModal } from "@/components/shared/AppModal";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { PremiumDatePicker } from "@/components/shared/PremiumDatePicker";
import { MultiSearchableSelect } from "@/components/shared/MultiSearchableSelect";
import { StatusToggleButton } from "@/components/shared/StatusToggleButton";
import { FileText, Plus, X, AlertTriangle, Type, GitBranch, Send } from "lucide-react";
import { s3Api } from "@/lib/api";
import { extractS3Url } from "@/lib/common";
import { toast } from "sonner";
import type { MarkedItem } from "@/lib/types/offer";
import { storage } from "@/lib/storage";
import { SocialLinksEditor, type SocialLink } from "@/components/offer/SocialLinksEditor";

type PosterPageDraft = {
    id: string;
    template: TemplateConfig;
    elements: CanvasElement[];
    canvasBg: string;
    initialElements: CanvasElement[];
    initialCanvasBg: string;
};

function parseRawDesigner(data: string) {
    try {
        return JSON.parse(data);
    } catch (firstError) {
        try {
            const decoded = data
                .replace(/&amp;quot;/g, '"')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&');
            return JSON.parse(decoded);
        } catch (secondError) {
            throw firstError;
        }
    }
}

function PosterDesignerInner() {
    const { data: session } = useSession();
    const [posterPages, setPosterPages] = useState<PosterPageDraft[]>([]);
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [isChoosingTemplate, setIsChoosingTemplate] = useState(true);

    const router = useRouter();
    const searchParams = useSearchParams();
    const draftId = searchParams.get('draftId');
    const [forceLeave, setForceLeave] = useState(false);
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);

    const { data: draftOfferResponse } = useOfferById(draftId && !searchParams.get('fromLocalStorage') ? draftId : "");

    useEffect(() => {
        const fromLocalStorage = searchParams.get('fromLocalStorage') === 'true';

        // 1. Try loading from LocalStorage first (Frontend workaround)
        if (draftId && fromLocalStorage && !isDraftLoaded) {
            const storedDesigner = localStorage.getItem('designer_draft_data');
            if (storedDesigner) {
                try {
                    const parsedPages = parseRawDesigner(storedDesigner);
                    if (!Array.isArray(parsedPages)) {
                        toast.error("LocalStorage rawDesigner is not an array!");
                    } else {
                        setPosterPages(parsedPages);
                        setIsChoosingTemplate(false);
                        if (parsedPages.length > 0) {
                            setActivePageId(parsedPages[0].id);
                        }
                        toast.success("Draft design loaded from browser!");
                    }
                    setIsDraftLoaded(true);
                } catch (e: any) {
                    console.error("Failed to parse designer_draft_data", e);
                    toast.error(`Draft Load Error: ${e.message}`);
                    setIsDraftLoaded(true);
                }
                return; // Exit early if we loaded from local storage
            } else {
                toast.error("Error: LocalStorage missing design data. The backend might not be sending it.");
                setIsDraftLoaded(true); // Stop trying to load
                return;
            }
        }

        // 2. Fallback to API if not loaded from LocalStorage
        if (draftId && draftOfferResponse?.success && draftOfferResponse?.data && !isDraftLoaded) {
            const offer = draftOfferResponse.data as any;
            if (offer.rawDesigner) {
                try {
                    const parsedPages = typeof offer.rawDesigner === 'string'
                        ? parseRawDesigner(offer.rawDesigner)
                        : offer.rawDesigner;

                    if (!Array.isArray(parsedPages)) {
                        toast.error("rawDesigner is not an array!");
                        console.error("rawDesigner is not an array:", parsedPages);
                    } else {
                        setPosterPages(parsedPages);
                        setIsChoosingTemplate(false);
                        if (parsedPages.length > 0) {
                            setActivePageId(parsedPages[0].id);
                        }
                        setOfferTitle(offer.title || "");
                        setValidFrom(offer.validFrom ? new Date(offer.validFrom) : undefined);
                        setValidTo(offer.validTo ? new Date(offer.validTo) : undefined);
                        if (offer.branches) {
                            setSelectedBranchIds(offer.branches.map((b: any) => String(b.id || b.branchId || b.branch_id)));
                        }
                        setSocialLinks(offer.socialLinks || []);
                        toast.success("Draft design loaded from API successfully");
                    }
                    setIsDraftLoaded(true);
                } catch (e: any) {
                    console.error("Failed to parse rawDesigner from draft", e);
                    toast.error(`Draft Load Error: ${e.message}`);
                }
            } else {
                toast.error("Draft API response missing rawDesigner property!");
                setIsDraftLoaded(true);
            }
        }
    }, [draftId, draftOfferResponse, isDraftLoaded, searchParams]);

    // ── Publish Modal State ──────────────────────────────────────────────
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [offerTitle, setOfferTitle] = useState("");
    const [validFrom, setValidFrom] = useState<Date | undefined>(undefined);
    const [validTo, setValidTo] = useState<Date | undefined>(undefined);
    const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishErrors, setPublishErrors] = useState<{ title?: string; validFrom?: string; validTo?: string; branch?: string }>({});
    const [capturedPosters, setCapturedPosters] = useState<{ pageId: string; posterFile: File; markedItems: MarkedItem[] }[]>([]);
    const { mutateAsync: createOfferMutation } = useCreateOffer();
    const { mutateAsync: updateOfferMutation } = useUpdateOffer();
    const designerRefs = useRef<Record<string, PosterDesignerRef | null>>({});

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

    const handleSaveDraft = async () => {
        const toastId = toast.loading(`Saving draft...`);
        setIsPublishing(true);

        try {
            const results = [];
            for (const page of posterPages) {
                const ref = designerRefs.current[page.id];
                if (ref) {
                    const data = await ref.captureAsImage();
                    if (data) {
                        results.push({ pageId: page.id, posterFile: data.posterFile, markedItems: data.markedItems });
                    }
                }
            }

            if (results.length === 0) {
                toast.error("Failed to capture posters for draft", { id: toastId });
                setIsPublishing(false);
                return;
            }

            const posterData = results.map((cp, index) => {
                return {
                    id: crypto.randomUUID(),
                    posterSrc: "", // Skip S3 upload for drafts
                    type: "marked_poster" as const,
                    order: index + 1,
                    markedItems: cp.markedItems,
                };
            });

            const selectedBranches = branches.filter((b: any) => selectedBranchIds.includes(String(b.id)));
            const branchesToUse = selectedBranches.length > 0 ? selectedBranches : (branches.length > 0 ? [branches[0]] : []);
            const batchId = draftId || crypto.randomUUID();

            const offerPayload = {
                batchId: batchId,
                title: offerTitle.trim() || `Draft Offer - ${formatDateLocal(new Date())}`,
                validFrom: validFrom ? formatDateLocal(validFrom) : formatDateLocal(new Date()),
                validTo: validTo ? formatDateLocal(validTo) : formatDateLocal(new Date(Date.now() + 86400000 * 7)),
                branchIds: branchesToUse.map((b: any) => b.id),
                branchNames: branchesToUse.map((b: any) => b.branch_name || b.name || "Default Branch"),
                branchCity: branchesToUse[0]?.city || "Default City",
                createdAt: new Date().toISOString(),
                status: 'draft',
                isActive: false,
                posters: posterData,
                socialLinks: socialLinks,
                isDraft: true,
                type: "BUILDER",
                rawDesigner: JSON.stringify(posterPages),
            };

            const res = draftId
                ? await updateOfferMutation({ id: draftId, payload: offerPayload, shopId: activeShopId || "" })
                : await createOfferMutation({ payload: offerPayload, shopId: activeShopId || "" });
            if (res.success) {
                toast.success("Draft saved successfully!", { id: toastId });
                setShowLeaveWarning(false);
                if (pendingLeaveAction) {
                    setForceLeave(true);
                    pendingLeaveAction();
                } else {
                    router.push("/shop-manager");
                }
            } else {
                toast.error((res as any).message || "Failed to save draft", { id: toastId });
            }
        } catch (err: any) {
            console.error("Save draft error", err);
            toast.error("Failed to save draft: " + (err.message || err), { id: toastId });
        } finally {
            setIsPublishing(false);
        }
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

    // ── Finish / Publish Handlers ────────────────────────────────────────
    const handleFinishAll = useCallback(async () => {
        const toastId = toast.loading(`Preparing ${posterPages.length > 1 ? posterPages.length + ' posters' : 'poster'}...`);
        const results = [];
        try {
            for (const page of posterPages) {
                const ref = designerRefs.current[page.id];
                if (ref) {
                    const data = await ref.captureAsImage();
                    if (data) {
                        results.push({ pageId: page.id, posterFile: data.posterFile, markedItems: data.markedItems });
                    }
                }
            }
            if (results.length > 0) {
                setCapturedPosters(results);
                toast.success("Design completed!", { id: toastId });
                setShowPublishModal(true);
            } else {
                toast.error("Failed to capture posters", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to capture posters", { id: toastId });
        }
    }, [posterPages]);

    const handlePublishSubmit = async () => {
        const errors: { title?: string; validFrom?: string; validTo?: string; branch?: string } = {};
        if (!offerTitle.trim()) errors.title = "Campaign title is required";
        if (!validFrom) errors.validFrom = "Start date is required";
        if (!validTo) errors.validTo = "End date is required";
        if (validFrom && validTo && validTo < validFrom) errors.validTo = "End date must be after start date";
        if (selectedBranchIds.length === 0) errors.branch = "Please select at least one branch";

        setPublishErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setIsPublishing(true);
        const toastId = toast.loading("Publishing campaign...");

        try {
            // Upload all captured poster images to S3
            const posterData = await Promise.all(
                capturedPosters.map(async (cp, index) => {
                    const res = await s3Api.uploadImage(cp.posterFile, "offers");
                    const uploadedUrl = extractS3Url(res);
                    if (!res?.success || !uploadedUrl) {
                        throw new Error(`Failed to upload poster ${index + 1}`);
                    }
                    return {
                        id: crypto.randomUUID(),
                        posterSrc: uploadedUrl,
                        type: "marked_poster" as const,
                        order: index + 1,
                        markedItems: cp.markedItems,
                    };
                })
            );

            const selectedBranches = branches.filter((b: any) => selectedBranchIds.includes(String(b.id)));

            const batchId = draftId || crypto.randomUUID();
            const offerPayload = {
                batchId: batchId,
                title: offerTitle,
                validFrom: validFrom ? formatDateLocal(validFrom) : "",
                validTo: validTo ? formatDateLocal(validTo) : "",
                branchIds: selectedBranches.map((b: any) => b.id),
                branchNames: selectedBranches.map((b: any) => b.branch_name),
                branchCity: selectedBranches[0]?.city,
                createdAt: new Date().toISOString(),
                status: isActive ? 'active' : 'paused',
                isActive: isActive,
                posters: posterData,
                socialLinks: socialLinks,
                isDraft: false,
                type: "BUILDER",
                rawDesigner: JSON.stringify(posterPages),
            };

            const res = draftId
                ? await updateOfferMutation({ id: draftId, payload: offerPayload, shopId: activeShopId || "" })
                : await createOfferMutation({ payload: offerPayload, shopId: activeShopId || "" });
            if (res.success) {
                // Sync with local storage markedPosters for dashboard list / offline cache consistency
                try {
                    const existing = await storage.getItem<any[]>("markedPosters");
                    const allPosters = existing || [];
                    allPosters.push({
                        ...offerPayload,
                        posters: offerPayload.posters.map((p, idx) => ({ ...p, order: idx + 1 })),
                    });
                    await storage.setItem("markedPosters", allPosters);
                } catch (storageErr) {
                    console.warn("Storage sync failed:", storageErr);
                }

                toast.success("Offer published successfully!", { id: toastId });
                setShowPublishModal(false);
                setOfferTitle("");
                setValidFrom(undefined);
                setValidTo(undefined);
                setSelectedBranchIds([]);
                setCapturedPosters([]);
                router.push("/shop-manager");
            } else {
                toast.error((res as any).message || "Failed to publish campaign", { id: toastId });
            }
        } catch (err: any) {
            console.error("Publish error", err);
            toast.error("Failed to publish: " + (err.message || err), { id: toastId });
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="h-40 lg:h-32" />

            <main className="w-full relative overflow-hidden bg-background min-h-screen">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="mx-auto relative px-2 lg:px-8 py-4 md:py-8 max-w-[1600px]">
                    <Breadcrumbs
                        items={[
                            { label: "Dashboard", href: "/shop-manager" },
                            {
                                label: "Templates",
                                href: "/shop-manager/poster-designer",
                                onClick: (e) => {
                                    if (activePage) {
                                        e.preventDefault();
                                        handleBackToTemplates();
                                    }
                                }
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
                                    <div className="relative h-[calc(100vh-140px)] w-full">
                                        {posterPages.map(page => (
                                            <div
                                                key={page.id}
                                                className={cn(
                                                    "absolute inset-0 h-full w-full",
                                                    page.id === activePageId ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none top-[-9999px] left-[-9999px]"
                                                )}
                                            >
                                                <PosterDesigner
                                                    ref={(el) => { designerRefs.current[page.id] = el; }}
                                                    shopId={activeShopId || undefined}
                                                    initialElements={page.elements}
                                                    initialBg={page.canvasBg}
                                                    templateConfig={page.template}
                                                    onBack={handleBackToTemplates}
                                                    onSnapshotChange={(snapshot) => handleSnapshotChange(page.id, snapshot)}
                                                    onInitiateFinish={handleFinishAll}
                                                    allPagesElements={posterPages.map(p => p.elements)}
                                                />
                                            </div>
                                        ))}
                                    </div>
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

            {/* Publish Offer Modal */}
            <AppModal
                open={showPublishModal}
                onOpenChange={setShowPublishModal}
                title="Publish Offer"
                description="Give your campaign a name before publishing."
                footer={
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center sm:justify-between w-full">
                        <div className="flex items-center justify-between sm:justify-start gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    isActive ? "bg-[#1cc080]" : "bg-gray-400"
                                )} />
                                <span className={cn(
                                    "text-[11px] font-bold uppercase tracking-wider",
                                    isActive ? "text-slate-800" : "text-gray-500"
                                )}>
                                    {isActive ? "Active" : "Paused"}
                                </span>
                            </div>
                            <StatusToggleButton status={isActive ? "active" : "paused"} onChange={(newStatus) => setIsActive(newStatus === "active")} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2.5 sm:justify-end">
                            <PremiumButton
                                variant="outline"
                                onClick={() => setShowPublishModal(false)}
                                className="rounded-xl w-full sm:w-auto order-3 sm:order-1"
                            >
                                Cancel
                            </PremiumButton>
                            <PremiumButton
                                onClick={handleSaveDraft}
                                isLoading={isPublishing}
                                className="rounded-xl bg-none bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-600/20 border-0 w-full sm:w-auto order-2 sm:order-2"
                                disabled={isPublishing}
                            >
                                Save Draft
                            </PremiumButton>
                            <PremiumButton
                                onClick={handlePublishSubmit}
                                isLoading={isPublishing}
                                leftIcon={Send}
                                className="rounded-xl w-full sm:w-auto order-1 sm:order-3"
                                disabled={isPublishing}
                            >
                                {isPublishing ? "Publishing..." : "Publish"}
                            </PremiumButton>
                        </div>
                    </div>
                }
            >
                <div className="space-y-5">
                    <PremiumInput
                        label="Campaign Title"
                        icon={Type}
                        type="text"
                        value={offerTitle}
                        onChange={(e) => {
                            setOfferTitle(e.target.value);
                            if (publishErrors.title) setPublishErrors((p) => ({ ...p, title: undefined }));
                        }}
                        placeholder="e.g. Weekend Mega Sale 2026"
                        error={publishErrors.title}
                        autoFocus
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <PremiumDatePicker
                            label="Valid From"
                            date={validFrom}
                            setDate={(d) => {
                                setValidFrom(d);
                                if (publishErrors.validFrom) setPublishErrors((p) => ({ ...p, validFrom: undefined }));
                            }}
                            placeholder="Select start date"
                            error={publishErrors.validFrom}
                            minDate={new Date()}
                        />
                        <PremiumDatePicker
                            label="Valid To"
                            date={validTo}
                            setDate={(d) => {
                                setValidTo(d);
                                if (publishErrors.validTo) setPublishErrors((p) => ({ ...p, validTo: undefined }));
                            }}
                            placeholder="Select end date"
                            error={publishErrors.validTo}
                            minDate={validFrom || new Date()}
                        />
                    </div>

                    {/* Branch Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-foreground ml-1">
                            <GitBranch className="w-4 h-4 text-muted-foreground" />
                            Branches
                        </label>
                        {branches.length === 0 ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm text-amber-700">
                                    <GitBranch className="w-4 h-4 shrink-0" />
                                    <span>No branches yet. Create one to link with this offer.</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (activeShopId) {
                                            window.open(`/shop-manager/${activeShopId}/add-branch?returnTo=/shop-manager/poster-designer`, "_blank");
                                        } else {
                                            toast.error("You need to create a shop first before adding branches");
                                        }
                                    }}
                                    className="shrink-0 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors px-3 py-1.5 rounded-lg cursor-pointer"
                                >
                                    + Add Branch
                                </button>
                            </div>
                        ) : (
                            <MultiSearchableSelect
                                options={branches.map((b: any) => ({ label: `${b.branch_name || b.name} — ${b.city}`, value: String(b.id) }))}
                                selectedValues={selectedBranchIds}
                                onChange={(vals) => {
                                    setSelectedBranchIds(vals);
                                    if (vals.length > 0 && publishErrors.branch) {
                                        setPublishErrors((p) => ({ ...p, branch: undefined }));
                                    }
                                }}
                                placeholder="Select branches"
                            />
                        )}
                        {publishErrors.branch && (
                            <p className="text-xs font-medium text-destructive ml-1 animate-in fade-in slide-in-from-top-1">
                                {publishErrors.branch}
                            </p>
                        )}
                    </div>

                    <SocialLinksEditor socialLinks={socialLinks} onChange={setSocialLinks} />

                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-sm">
                        <div className="flex justify-between">
                            <span className="opacity-60">Total posters</span>
                            <span className="font-bold">{capturedPosters.length}</span>
                        </div>
                    </div>
                </div>
            </AppModal>

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
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:justify-end">
                        <PremiumButton
                            variant="outline"
                            onClick={cancelLeave}
                            disabled={isPublishing}
                            className="rounded-xl w-full sm:w-auto order-3 sm:order-1"
                        >
                            Stay here
                        </PremiumButton>
                        <PremiumButton
                            onClick={handleSaveDraft}
                            disabled={isPublishing}
                            className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 border-0 w-full sm:w-auto order-2 sm:order-2"
                        >
                            {isPublishing ? "Saving..." : "Save Draft"}
                        </PremiumButton>
                        <PremiumButton
                            onClick={confirmLeave}
                            disabled={isPublishing}
                            className="rounded-xl px-6 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 w-full sm:w-auto order-1 sm:order-3"
                        >
                            Leave anyway
                        </PremiumButton>
                    </div>
                </div>
            </AppModal>
        </div>
    );
}

export default function PosterDesignerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <PosterDesignerInner />
        </Suspense>
    );
}
