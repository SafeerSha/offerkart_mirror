"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { PosterTemplateSelector } from "@/components/shop-manager/PosterTemplateSelector";
import { TemplateMeta, ShopData, CampaignInfo, ProductSlotItem, GridConfig } from "@/components/templates/types";
import { getTemplateMeta } from "@/components/templates/registry";
import { TemplateCanvasWorkspace, PosterPageDraft } from "@/components/templates/workspace/TemplateCanvasWorkspace";
import { SlotProductPickerModal } from "@/components/templates/shared/SlotProductPickerModal";
import { ProductModal } from "@/components/shop-manager/ProductModal";
import { useMyShops, useBranches, useCreateOffer, useUpdateOffer, useOfferById, useCreateProduct } from "@/hooks/useApi";
import { cn, formatDateLocal } from "@/lib/utils";
import { AppModal } from "@/components/shared/AppModal";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { PremiumDatePicker } from "@/components/shared/PremiumDatePicker";
import { MultiSearchableSelect } from "@/components/shared/MultiSearchableSelect";
import { StatusToggleButton } from "@/components/shared/StatusToggleButton";
import { FileText, Plus, X, Send, Sparkles, Check, ArrowLeft, LayoutTemplate } from "lucide-react";
import { s3Api } from "@/lib/api";
import { extractS3Url } from "@/lib/common";
import { toast } from "sonner";
import type { MarkedItem } from "@/lib/types/offer";
import { storage } from "@/lib/storage";
import { SocialLinksEditor, type SocialLink } from "@/components/offer/SocialLinksEditor";
import { capturePosterAsImage } from "@/lib/capturePoster";
import { resolveShopLogoUrl } from "@/lib/imageUtils";

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
    const router = useRouter();
    const searchParams = useSearchParams();
    const draftId = searchParams.get('draftId');

    const [posterPages, setPosterPages] = useState<PosterPageDraft[]>([]);
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [isChoosingTemplate, setIsChoosingTemplate] = useState(true);
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);

    // Product picking state
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
    const [showSlotPickerModal, setShowSlotPickerModal] = useState(false);
    const [showCustomProductModal, setShowCustomProductModal] = useState(false);

    // Publish state
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showDraftNameModal, setShowDraftNameModal] = useState(false);
    const [offerTitle, setOfferTitle] = useState("");
    const [validFrom, setValidFrom] = useState<Date | undefined>(new Date());
    const [validTo, setValidTo] = useState<Date | undefined>(undefined);
    const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishErrors, setPublishErrors] = useState<{ title?: string; validFrom?: string; validTo?: string; branch?: string }>({});
    const [capturedPosters, setCapturedPosters] = useState<{ pageId: string; posterFile: File; markedItems: MarkedItem[] }[]>([]);

    const canvasRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const { mutateAsync: createOfferMutation } = useCreateOffer();
    const { mutateAsync: updateOfferMutation } = useUpdateOffer();
    const { mutateAsync: createProductMutation } = useCreateProduct();

    // Fetch Shop Data
    const { data: shopsResponse } = useMyShops();
    const shops = useMemo(() => {
        if (!shopsResponse?.success || !shopsResponse?.data) return [];
        const result = shopsResponse.data as any;
        return Array.isArray(result) ? result : (result.data || []);
    }, [shopsResponse]);

    const activeShopId = useMemo(() => {
        const sid = session?.shopId ?? (session?.user as any)?.shopId;
        if (sid) return String(sid);
        if (shops.length > 0) return String(shops[0].id ?? shops[0]._id ?? shops[0].shopId ?? '');
        return null;
    }, [session, shops]);

    const activeShop = useMemo(() => {
        if (!shops.length) return undefined;
        if (activeShopId) {
            const match = shops.find((s: any) => String(s.id ?? s._id ?? s.shopId) === String(activeShopId));
            if (match) return match;
        }
        return shops[0];
    }, [shops, activeShopId]);

    // Fetch Branches
    const { data: branchesResponse } = useBranches(activeShopId || "");
    const branches = useMemo(() => {
        if (!branchesResponse?.success || !branchesResponse?.data) return [];
        const result = branchesResponse.data as any;
        const list = Array.isArray(result) ? result : (result.data || []);
        return Array.isArray(list) ? list : [];
    }, [branchesResponse]);

    // Build ShopData
    const shopData = useMemo((): ShopData => {
        const shopName =
            activeShop?.shop_name ||
            (session?.user as any)?.business_name ||
            "Your Shop Name";

        const shopPhone = activeShop?.phone || (session?.user as any)?.phone || "";
        const shopEmail = (session?.user as any)?.email || activeShop?.email || "";

        const activeBranches = branches
            .filter((b: any) => b.is_active)
            .map((b: any) => b.branch_name || b.city)
            .filter(Boolean) as string[];

        return {
            shopName,
            shopPhone,
            shopEmail,
            branches: activeBranches.length > 0 ? activeBranches : undefined,
            logoUrl: resolveShopLogoUrl(activeShop, session?.user),
        };
    }, [activeShop, session, branches]);

    // Load Draft from API or LocalStorage
    const { data: draftOfferResponse } = useOfferById(draftId && !searchParams.get('fromLocalStorage') ? draftId : "");

    useEffect(() => {
        if (!draftId || isDraftLoaded) return;

        const loadDraft = (offer: any) => {
            if (offer.title) setOfferTitle(offer.title);
            if (offer.validFrom) setValidFrom(new Date(offer.validFrom));
            if (offer.validTo) setValidTo(new Date(offer.validTo));
            if (offer.branches) {
                setSelectedBranchIds(offer.branches.map((b: any) => String(b.id || b.branchId || b.branch_id)));
            }
            if (offer.socialLinks) setSocialLinks(offer.socialLinks);

            if (offer.rawDesigner) {
                try {
                    const parsed = typeof offer.rawDesigner === 'string'
                        ? parseRawDesigner(offer.rawDesigner)
                        : offer.rawDesigner;

                    // Check for Component format v1
                    if (parsed?.format === "component-v1" && Array.isArray(parsed.pages)) {
                        setPosterPages(parsed.pages);
                        if (parsed.pages.length > 0) {
                            setActivePageId(parsed.pages[0].id);
                            setIsChoosingTemplate(false);
                        }
                    } else if (Array.isArray(parsed)) {
                        // Legacy format fallback: map each page
                        const migratedPages: PosterPageDraft[] = parsed.map((p: any, idx: number) => ({
                            id: p.id || crypto.randomUUID(),
                            templateId: p.template?.id || 'hypermarket-red',
                            campaignInfo: {
                                title: offer.title || "SPECIAL OFFERS",
                                subtitle: "Exclusive discounts",
                            },
                            products: {},
                        }));
                        setPosterPages(migratedPages);
                        if (migratedPages.length > 0) {
                            setActivePageId(migratedPages[0].id);
                            setIsChoosingTemplate(false);
                        }
                    }
                    toast.success("Draft design loaded successfully");
                } catch (e: any) {
                    console.error("Failed to parse rawDesigner", e);
                }
            }
            setIsDraftLoaded(true);
        };

        if (draftOfferResponse?.success && draftOfferResponse?.data) {
            loadDraft(draftOfferResponse.data);
        } else if (searchParams.get('fromLocalStorage') === 'true') {
            const stored = localStorage.getItem('designer_draft_data');
            if (stored) {
                try {
                    const parsed = parseRawDesigner(stored);
                    loadDraft({ rawDesigner: parsed });
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }, [draftId, draftOfferResponse, isDraftLoaded, searchParams]);

    // Active page
    const activePage = useMemo(
        () => posterPages.find((p) => p.id === activePageId) || null,
        [posterPages, activePageId]
    );

    const activePageIndex = useMemo(
        () => posterPages.findIndex((p) => p.id === activePageId),
        [posterPages, activePageId]
    );

    // Used product IDs & titles across all pages to prevent duplicate additions
    const { usedProductIds, usedProductTitles } = useMemo(() => {
        const ids = new Set<string>();
        const titles = new Set<string>();

        posterPages.forEach((page) => {
            const isCurrent = page.id === activePageId;
            Object.entries(page.products).forEach(([slotStr, p]) => {
                const sIdx = Number(slotStr);
                if (isCurrent && selectedSlotIndex !== null && sIdx === selectedSlotIndex) {
                    return;
                }
                if (p.sourceProductId) ids.add(String(p.sourceProductId));
                if (p.id) ids.add(String(p.id));
                if (p.title) titles.add(p.title.trim().toLowerCase());
            });
        });

        return { usedProductIds: ids, usedProductTitles: titles };
    }, [posterPages, activePageId, selectedSlotIndex]);

    // Handlers: Template Selection
    const handleSelectTemplate = (template: TemplateMeta | any) => {
        const templateId = template.id || "hypermarket-red";
        const pageId = crypto.randomUUID();

        const newPage: PosterPageDraft = {
            id: pageId,
            templateId,
            campaignInfo: {
                title: offerTitle || "SPECIAL PROMOTIONAL OFFERS",
                subtitle: "Exclusive deals and massive savings for a limited time!",
                validFrom: validFrom ? formatDateLocal(validFrom) : "",
                validTo: validTo ? formatDateLocal(validTo) : "",
            },
            products: {},
        };

        setPosterPages([newPage]);
        setActivePageId(pageId);
        setIsChoosingTemplate(false);
    };

    // Multi-page handlers
    const handleAddNewPage = () => {
        if (posterPages.length >= 11 || !activePage) return;
        const pageId = crypto.randomUUID();
        const selectedThemeId = posterPages[0]?.templateId || activePage.templateId || "hypermarket-red";
        const newPage: PosterPageDraft = {
            id: pageId,
            templateId: selectedThemeId,
            campaignInfo: { ...activePage.campaignInfo },
            gridConfig: activePage.gridConfig ? { ...activePage.gridConfig } : undefined,
            products: {},
        };
        setPosterPages((prev) => [...prev, newPage]);
        setActivePageId(pageId);
    };

    const handleDeletePage = (e: React.MouseEvent, pageId: string) => {
        e.stopPropagation();
        setPosterPages((prev) => {
            const filtered = prev.filter((p) => p.id !== pageId);
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

    // Slot Editing Handlers
    const handleSlotClick = (slotIdx: number) => {
        setSelectedSlotIndex(slotIdx);
        setShowSlotPickerModal(true);
    };

    const handleSelectProduct = (product: ProductSlotItem) => {
        if (selectedSlotIndex === null || !activePageId) return;

        const candId = String(product.sourceProductId || product.id || '');
        const candTitle = (product.title || '').trim().toLowerCase();

        // Check if product is already assigned to another slot across all pages
        for (let pIdx = 0; pIdx < posterPages.length; pIdx++) {
            const pDraft = posterPages[pIdx];
            const isCurrentPage = pDraft.id === activePageId;
            for (const [slotStr, item] of Object.entries(pDraft.products)) {
                const sIdx = Number(slotStr);
                if (isCurrentPage && sIdx === selectedSlotIndex) {
                    continue; // replacing current slot with same or new product
                }
                if (!item) continue;
                const itemId = String(item.sourceProductId || item.id || '');
                const itemTitle = (item.title || '').trim().toLowerCase();

                const idMatch = Boolean(candId && (candId === itemId || candId === String(item.id)));
                const titleMatch = Boolean(candTitle && candTitle === itemTitle);

                if (idMatch || titleMatch) {
                    toast.error(`"${product.title}" is already added in Slot ${sIdx + 1}${posterPages.length > 1 ? ` (Page ${pIdx + 1})` : ''}.`);
                    return;
                }
            }
        }

        setPosterPages((prev) =>
            prev.map((page) => {
                if (page.id !== activePageId) return page;
                return {
                    ...page,
                    products: {
                        ...page.products,
                        [selectedSlotIndex]: product,
                    },
                };
            })
        );
        setSelectedSlotIndex(null);
    };

    const handleSlotRemove = (slotIdx: number) => {
        if (!activePageId) return;
        setPosterPages((prev) =>
            prev.map((page) => {
                if (page.id !== activePageId) return page;
                const nextProducts = { ...page.products };
                delete nextProducts[slotIdx];
                return { ...page, products: nextProducts };
            })
        );
    };

    const handleUpdateCampaignField = (field: keyof CampaignInfo, value: string) => {
        if (!activePageId) return;
        setPosterPages((prev) =>
            prev.map((page) => {
                if (page.id !== activePageId) return page;
                return {
                    ...page,
                    campaignInfo: {
                        ...page.campaignInfo,
                        [field]: value,
                    },
                };
            })
        );
        if (field === 'title') {
            setOfferTitle(value);
        }
    };

    const handleUpdateGridConfig = (pageId: string, gridConfig: GridConfig) => {
        setPosterPages((prev) =>
            prev.map((page) =>
                page.id === pageId
                    ? {
                        ...page,
                        gridConfig,
                    }
                    : page
            )
        );
    };

    const handleUpdatePage = (pageId: string, updates: Partial<PosterPageDraft>) => {
        setPosterPages((prev) =>
            prev.map((page) => (page.id === pageId ? { ...page, ...updates } : page))
        );
    };

    const handleSwitchTemplate = (_pageId: string, templateId: string) => {
        // Theme selection applies cohesively across all pages of the poster flyer
        setPosterPages((prev) =>
            prev.map((page) => ({ ...page, templateId }))
        );
    };


    // Custom Product Submission
    const handleCustomProductSubmit = async (payload: any) => {
        try {
            const res = await createProductMutation({
                shopId: activeShopId || "",
                payload,
            });

            if (res.success && res.data) {
                const p = res.data as any;
                const item: ProductSlotItem = {
                    id: crypto.randomUUID(),
                    sourceProductId: String(p.id),
                    title: p.name || p.title,
                    description: p.description || "",
                    image: p.image || p.imageUrl || "",
                    offerPrice: p.price || "0",
                    oldPrice: p.originalPrice || undefined,
                    currency: "₹",
                    category: p.category || "General",
                };
                handleSelectProduct(item);
                setShowCustomProductModal(false);
                toast.success("Custom product created and added to slot!");
            }
        } catch (e: any) {
            console.error("Custom product creation error", e);
            toast.error("Failed to create product: " + (e.message || e));
        }
    };

    // Capture Posters & Extract Hotspots
    const captureAllPosters = async (): Promise<{ pageId: string; posterFile: File; markedItems: MarkedItem[] }[]> => {
        const results = [];

        for (const page of posterPages) {
            const canvasEl = canvasRefs.current[page.id];
            if (!canvasEl) continue;

            const canvasBounds = canvasEl.getBoundingClientRect();
            const slotElements = canvasEl.querySelectorAll<HTMLElement>('[data-slot-index]');
            const markedItems: MarkedItem[] = [];

            slotElements.forEach((el) => {
                const slotIdx = Number(el.getAttribute('data-slot-index'));
                const p = page.products[slotIdx];
                if (!p || (!p.title && !p.image)) return;

                const b = el.getBoundingClientRect();
                markedItems.push({
                    id: crypto.randomUUID(),
                    x: (b.left - canvasBounds.left) / canvasBounds.width,
                    y: (b.top - canvasBounds.top) / canvasBounds.height,
                    width: b.width / canvasBounds.width,
                    height: b.height / canvasBounds.height,
                    name: p.title || "Product",
                    description: p.description || "",
                    productImage: p.image || "",
                    currency: p.currency || "₹",
                    oldPrice: typeof p.oldPrice === 'number' ? p.oldPrice : parseFloat(String(p.oldPrice || "0").replace(/[^\d.]/g, "")) || 0,
                    offerPrice: typeof p.offerPrice === 'number' ? p.offerPrice : parseFloat(String(p.offerPrice || "0").replace(/[^\d.]/g, "")) || 0,
                    mainCategory: p.category || "General",
                    subcategories: p.subcategories || ["General"],
                    subcategoryId: p.subcategoryId,
                });
            });

            const dataUrl = await capturePosterAsImage(canvasEl);

            // Convert base64 dataUrl to File
            const arr = dataUrl.split(',');
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : 'image/png';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            const posterFile = new File([blob], `poster-${page.id}.png`, { type: 'image/png' });

            results.push({ pageId: page.id, posterFile, markedItems });
        }

        return results;
    };

    // Save Draft
    const handleSaveDraft = async () => {
        if (!offerTitle.trim()) {
            toast.error("Please enter a offer name before saving a draft.");
            return;
        }

        setShowDraftNameModal(false);

        const toastId = toast.loading("Saving draft...");
        setIsPublishing(true);

        try {
            const captured = await captureAllPosters();
            if (captured.length === 0) {
                toast.error("Failed to capture poster canvas", { id: toastId });
                setIsPublishing(false);
                return;
            }

            const posterData = captured.map((cp, index) => ({
                id: crypto.randomUUID(),
                posterSrc: "",
                type: "marked_poster" as const,
                displayOrder: index + 1,
                markedItems: cp.markedItems,
            }));

            const selectedBranches = branches.filter((b: any) => selectedBranchIds.includes(String(b.id)));
            const branchesToUse = selectedBranches.length > 0 ? selectedBranches : (branches.length > 0 ? [branches[0]] : []);
            const batchId = draftId || crypto.randomUUID();

            const now = new Date();
            const formattedDateTime = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
            const draftedTitle = `${offerTitle.trim()} - ${formattedDateTime}`;

            const offerPayload = {
                batchId,
                title: draftedTitle,
                validFrom: validFrom ? formatDateLocal(validFrom) : formatDateLocal(new Date()),
                validTo: validTo ? formatDateLocal(validTo) : formatDateLocal(new Date(Date.now() + 86400000 * 7)),
                branchIds: branchesToUse.map((b: any) => b.id),
                branchNames: branchesToUse.map((b: any) => b.branch_name || b.name || "Default Branch"),
                branchCity: branchesToUse[0]?.city || "Default City",
                createdAt: new Date().toISOString(),
                status: 'draft',
                isActive: false,
                posters: posterData,
                socialLinks,
                isDraft: true,
                type: "BUILDER",
                rawDesigner: JSON.stringify({
                    format: "component-v1",
                    pages: posterPages,
                }),
            };

            const res = draftId
                ? await updateOfferMutation({ id: draftId, payload: offerPayload, shopId: activeShopId || "" })
                : await createOfferMutation({ payload: offerPayload, shopId: activeShopId || "" });

            if (res.success) {
                toast.success("Draft saved successfully!", { id: toastId });
                setShowPublishModal(false);
                router.push("/shop-manager");
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

    // Initiate Finish / Open Modal
    const handleInitiatePublish = async () => {
        const toastId = toast.loading(`Preparing ${posterPages.length > 1 ? posterPages.length + ' posters' : 'poster'}...`);
        try {
            const captured = await captureAllPosters();
            if (captured.length > 0) {
                setCapturedPosters(captured);
                toast.success("Posters prepared!", { id: toastId });
                setShowPublishModal(true);
            } else {
                toast.error("Failed to capture posters", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to capture posters", { id: toastId });
        }
    };

    // Final Publish
    const handlePublishSubmit = async () => {
        const errors: { title?: string; validFrom?: string; validTo?: string; branch?: string } = {};
        if (!offerTitle.trim()) errors.title = "Offer title is required";
        if (!validFrom) errors.validFrom = "Start date is required";
        if (!validTo) errors.validTo = "End date is required";
        if (validFrom && validTo && validTo < validFrom) errors.validTo = "End date must be after start date";
        if (selectedBranchIds.length === 0) errors.branch = "Please select at least one branch";

        setPublishErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setIsPublishing(true);
        const toastId = toast.loading("Publishing offer...");

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
                        displayOrder: index + 1,
                        markedItems: cp.markedItems,
                    };
                })
            );

            const selectedBranches = branches.filter((b: any) => selectedBranchIds.includes(String(b.id)));
            const batchId = draftId || crypto.randomUUID();

            const offerPayload = {
                batchId,
                title: offerTitle,
                validFrom: validFrom ? formatDateLocal(validFrom) : "",
                validTo: validTo ? formatDateLocal(validTo) : "",
                branchIds: selectedBranches.map((b: any) => b.id),
                branchNames: selectedBranches.map((b: any) => b.branch_name),
                branchCity: selectedBranches[0]?.city,
                createdAt: new Date().toISOString(),
                status: isActive ? 'active' : 'paused',
                isActive,
                posters: posterData,
                socialLinks,
                isDraft: false,
                type: "BUILDER",
                rawDesigner: JSON.stringify({
                    format: "component-v1",
                    pages: posterPages,
                }),
            };

            const res = draftId
                ? await updateOfferMutation({ id: draftId, payload: offerPayload, shopId: activeShopId || "" })
                : await createOfferMutation({ payload: offerPayload, shopId: activeShopId || "" });

            if (res.success) {
                try {
                    const existing = await storage.getItem<any[]>("markedPosters");
                    const allPosters = existing || [];
                    allPosters.push({
                        ...offerPayload,
                        posters: offerPayload.posters.map((p, idx) => ({ ...p, displayOrder: idx + 1 })),
                    });
                    await storage.setItem("markedPosters", allPosters);
                } catch (storageErr) {
                    console.warn("Storage sync failed:", storageErr);
                }

                toast.success("Offer published successfully!", { id: toastId });
                setShowPublishModal(false);
                router.push("/shop-manager");
            } else {
                toast.error((res as any).message || "Failed to publish offer", { id: toastId });
            }
        } catch (err: any) {
            console.error("Publish error", err);
            toast.error("Failed to publish: " + (err.message || err), { id: toastId });
        } finally {
            setIsPublishing(false);
        }
    };

    const currentTemplateMeta = activePage ? getTemplateMeta(activePage.templateId) : undefined;

    return (
        <div className="h-[100dvh] pt-16 lg:pt-20 bg-background text-foreground flex flex-col overflow-hidden">
            {/* Top Navigation Bar */}
            {!isChoosingTemplate && (
                <header className="h-16 glass-header border-b border-border px-4 lg:px-8 flex items-center justify-between z-30 shrink-0">
                    <Breadcrumbs
                        items={[
                            { label: "Shop Manager", href: "/shop-manager" },
                            { label: "Poster Designer", href: "/shop-manager/poster-designer" },
                        ]}
                        className="mb-0"
                    />

                    {/* Right Actions */}
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setIsChoosingTemplate(true)}
                            className="px-3.5 py-1.5 rounded-xl border border-border hover:border-primary/50 bg-card text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                            <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
                            Change Template
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowDraftNameModal(true)}
                            disabled={isPublishing}
                            className="px-3.5 py-1.5 rounded-xl border border-accent hover:bg-accent/10 text-accent text-xs font-bold transition-colors"
                        >
                            Save Draft
                        </button>

                        <button
                            type="button"
                            onClick={handleInitiatePublish}
                            disabled={isPublishing}
                            className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-primary/25 transition-all"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Publish Flyer
                        </button>
                    </div>
                </header>
            )}

            {/* Main Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {isChoosingTemplate ? (
                    <div className="flex-1 overflow-y-auto bg-background">
                        <PosterTemplateSelector
                            onSelect={handleSelectTemplate}
                            shopName={shopData.shopName}
                            logoUrl={shopData.logoUrl}
                        />
                    </div>
                ) : activePage ? (
                    <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden max-w-[1600px] w-full mx-auto">
                        {/* Multi-page Flyer Tabs Bar */}
                        <div className="mb-3 flex items-center justify-between gap-3 shrink-0">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                {posterPages.map((page, index) => {
                                    const meta = getTemplateMeta(page.templateId);
                                    const isActiveTab = page.id === activePage.id;
                                    return (
                                        <button
                                            key={page.id}
                                            type="button"
                                            onClick={() => setActivePageId(page.id)}
                                            className={cn(
                                                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 border",
                                                isActiveTab
                                                    ? "bg-primary/15 border-primary text-primary shadow-md shadow-primary/10"
                                                    : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                            )}
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>Page {index + 1}</span>
                                            {meta && (
                                                <span className="text-[10px] text-muted-foreground font-normal">
                                                    ({meta.name.split(" ")[0]})
                                                </span>
                                            )}
                                            {posterPages.length > 1 && (
                                                <div
                                                    onClick={(e) => handleDeletePage(e, page.id)}
                                                    className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                                                    title="Delete Page"
                                                >
                                                    <X className="w-3 h-3" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}

                                {posterPages.length < 11 && (
                                    <button
                                        type="button"
                                        onClick={handleAddNewPage}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary text-xs font-bold transition-colors shrink-0"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Page
                                    </button>
                                )}
                            </div>

                            <span className="text-xs font-medium text-muted-foreground shrink-0 hidden sm:inline">
                                Double-click text or click slots to edit
                            </span>
                        </div>

                        {/* Interactive Canvas Viewport */}
                        <div className="flex-1 w-full h-full min-h-0 relative overflow-hidden">
                            {posterPages.map((page, idx) => (
                                <div
                                    key={page.id}
                                    className={cn(
                                        "w-full h-full bg-background",
                                        page.id === activePageId ? "relative block" : "absolute top-[-9999px] left-[-9999px] block"
                                    )}
                                >
                                    <TemplateCanvasWorkspace
                                        page={page}
                                        pageIndex={idx}
                                        allPages={posterPages}
                                        usedProductIds={usedProductIds}
                                        usedProductTitles={usedProductTitles}
                                        shopData={shopData}
                                        shopId={activeShopId}
                                        onSlotClick={handleSlotClick}
                                        onSlotRemove={handleSlotRemove}
                                        onFieldChange={handleUpdateCampaignField}
                                        onGridConfigChange={(newGrid) => handleUpdateGridConfig(page.id, newGrid)}
                                        onUpdatePage={(updates) => handleUpdatePage(page.id, updates)}
                                        onSelectTemplate={(templateId) => handleSwitchTemplate(page.id, templateId)}
                                        onOpenCreateProductModal={() => setShowCustomProductModal(true)}
                                        canvasRef={{
                                            get current() {
                                                return canvasRefs.current[page.id] || null;
                                            },
                                            set current(val) {
                                                canvasRefs.current[page.id] = val;
                                            },
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </main>

            {/* Product Picker Modal */}
            <SlotProductPickerModal
                open={showSlotPickerModal}
                onOpenChange={setShowSlotPickerModal}
                slotIndex={selectedSlotIndex}
                shopId={activeShopId}
                usedProductIds={usedProductIds}
                usedProductTitles={usedProductTitles}
                onSelectProduct={handleSelectProduct}
                onOpenCustomProductModal={() => setShowCustomProductModal(true)}
            />

            {/* Custom Product Modal */}
            <ProductModal
                open={showCustomProductModal}
                onOpenChange={setShowCustomProductModal}
                product={null}
                onSubmit={handleCustomProductSubmit}
                availableBranches={branches}
            />

            {/* Offer Publish Modal */}
            <AppModal
                open={showPublishModal}
                onOpenChange={setShowPublishModal}
                title="Publish Offer"
                description="Finalize offer schedule and target branches before publishing."
                className="max-w-xl"
                footer={
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center sm:justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    isActive ? "bg-emerald-500" : "bg-gray-400"
                                )} />
                                <span className="text-xs font-bold text-gray-700">
                                    {isActive ? "Active" : "Paused"}
                                </span>
                            </div>
                            <StatusToggleButton
                                status={isActive ? "active" : "paused"}
                                onChange={(newStatus) => setIsActive(newStatus === "active")}
                            />
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                            <PremiumButton
                                variant="outline"
                                onClick={() => setShowPublishModal(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </PremiumButton>
                            <PremiumButton
                                onClick={handlePublishSubmit}
                                isLoading={isPublishing}
                                leftIcon={Send}
                                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                                disabled={isPublishing}
                            >
                                {isPublishing ? "Publishing..." : "Confirm & Publish"}
                            </PremiumButton>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4 py-2">
                    <PremiumInput
                        label="Offer Title"
                        placeholder="e.g. Weekend Mega Savings Bonanza"
                        value={offerTitle}
                        onChange={(e) => setOfferTitle(e.target.value)}
                        error={publishErrors.title}
                        required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <PremiumDatePicker
                            label="Start Date"
                            date={validFrom}
                            setDate={setValidFrom}
                            error={publishErrors.validFrom}
                        />
                        <PremiumDatePicker
                            label="End Date"
                            date={validTo}
                            setDate={setValidTo}
                            error={publishErrors.validTo}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Select Branches <span className="text-red-500">*</span>
                        </label>
                        <MultiSearchableSelect
                            placeholder="Select branches..."
                            options={branches.map((b: any) => ({
                                value: String(b.id),
                                label: b.branch_name || b.name || "Main Branch",
                            }))}
                            selectedValues={selectedBranchIds}
                            onChange={(vals) => {
                                setSelectedBranchIds(vals);
                                if (vals.length > 0 && publishErrors.branch) {
                                    setPublishErrors((p) => ({ ...p, branch: undefined }));
                                }
                            }}
                        />
                        {publishErrors.branch && (
                            <p className="text-xs font-medium text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">
                                {publishErrors.branch}
                            </p>
                        )}
                    </div>

                    <SocialLinksEditor
                        socialLinks={socialLinks}
                        onChange={setSocialLinks}
                    />
                </div>
            </AppModal>

            {/* Draft Name Modal */}
            <AppModal
                open={showDraftNameModal}
                onOpenChange={setShowDraftNameModal}
                title="Save Draft"
                description="Give your draft offer a name so you can find it later."
                className="max-w-md"
                footer={
                    <div className="flex items-center gap-2 justify-end w-full">
                        <PremiumButton
                            variant="outline"
                            onClick={() => setShowDraftNameModal(false)}
                            className="rounded-xl"
                        >
                            Cancel
                        </PremiumButton>
                        <PremiumButton
                            onClick={handleSaveDraft}
                            isLoading={isPublishing}
                            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                            disabled={isPublishing}
                        >
                            {isPublishing ? "Saving..." : "Continue & Save Draft"}
                        </PremiumButton>
                    </div>
                }
            >
                <div className="py-2">
                    <PremiumInput
                        label="Offer Title"
                        placeholder="e.g. Weekend Mega Savings"
                        value={offerTitle}
                        onChange={(e) => setOfferTitle(e.target.value)}
                        required
                    />
                </div>
            </AppModal>
        </div>
    );
}

export default function PosterDesignerPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
                </div>
            }
        >
            <PosterDesignerInner />
        </Suspense>
    );
}
