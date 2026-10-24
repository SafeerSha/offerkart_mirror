"use client";

export const dynamic = "force-dynamic";

// Core React imports
import { useState, useEffect, useRef, Suspense } from "react";

// Next.js
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";

// UI Components (barrel import)
import {
    Heading, Subheading, Text, Breadcrumbs, PremiumCard,
    PremiumButton, PremiumInput, PremiumDatePicker,
    AppModal, MultiSearchableSelect, StatusToggleButton
} from "@/components/shared";

// Types
import { Branch, PosterItem } from "@/lib/types";
import type { PosterPreviewState } from "@/components/shop-manager/PosterCardStack";

// Icons
import { ArrowRight, X, Clock, FileEdit, Trash2, LayoutGrid, Send, Type, GitBranch, Star } from "@/lib/icons";

// Local components
import { PosterCardStack } from "@/components/shop-manager/PosterCardStack";
import { PosterPreviewPanel } from "@/components/shop-manager/PosterPreviewPanel";
import { SocialLinksEditor, type SocialLink } from "@/components/offer/SocialLinksEditor";

// Utils and API
import { storage } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { ensureS3Url } from "@/lib/imageUtils";
import { extractS3Url } from "@/lib/common";
import { formatDateLocal } from "@/lib/utils";
import { toast } from "sonner";

// API functions (barrel import)
import { getBranches, getMyShops, s3Api, createOffer, updateOffer } from "@/lib/api";

interface Draft {
    id: string;
    title: string;
    lastEdited: string;
    posterSrc: string;
    markedItems: any[];
}

export default function CreateOfferPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <CreateOfferContent />
        </Suspense>
    );
}

function CreateOfferContent() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [showPublishModal, setShowPublishModal] = useState(false);
    const [offerTitle, setOfferTitle] = useState("");
    const [offerStatus, setOfferStatus] = useState("active");
    const [isActive, setIsActive] = useState(true);
    const [isFeatured, setIsFeatured] = useState(false);
    const [validFrom, setValidFrom] = useState<Date | undefined>(() => new Date());
    const [validTo, setValidTo] = useState<Date>();
    const [classifiedPosters, setClassifiedPosters] = useState<PosterItem[]>([]);
    const [publishErrors, setPublishErrors] = useState<{ title?: string; validFrom?: string; validTo?: string; branch?: string }>({});
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

    const searchParams = useSearchParams();
    const editBatchId = searchParams.get('edit');
    const isUpdateMode = !!editBatchId;
    const [existingPosters, setExistingPosters] = useState<any[]>([]);

    // Track referrer source in sessionStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const urlSource = searchParams.get('source');
            if (urlSource) {
                sessionStorage.setItem("create_offer_source", urlSource);
            }
        }
    }, [searchParams]);

    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
    const [isBranchesLoading, setIsBranchesLoading] = useState(false);

    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [draftToDiscard, setDraftToDiscard] = useState<string | null>(null);
    const [previewState, setPreviewState] = useState<PosterPreviewState | null>(null);
    const [stackPhase, setStackPhase] = useState<"upload" | "classify" | "summary">("upload");
    const posterStackRef = useRef<{ handleCancel: () => boolean } | null>(null);

    // Fetch branches when page loads or session changes
    useEffect(() => {
        const fetchBranchesWithFallback = async () => {
            setIsBranchesLoading(true);
            try {
                let shopId = session?.shopId ?? (session?.user as any)?.shopId;

                if (!shopId) {
                    const shopRes = await getMyShops();
                    if (shopRes.success && shopRes.data) {
                        const shopList = Array.isArray(shopRes.data) ? shopRes.data : (shopRes.data as any).data || [];
                        if (shopList.length > 0) shopId = shopList[0].id;
                    }
                }

                if (!shopId) {
                    setBranches([]);
                    return;
                }

                const res = await getBranches(shopId);
                if (res.success && res.data) {
                    const list = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
                    setBranches(Array.isArray(list) ? list : []);
                }
            } catch (error) {
                console.error("Failed to load branches:", error);
            } finally {
                setIsBranchesLoading(false);
            }
        };

        fetchBranchesWithFallback();
    }, [session?.shopId, (session?.user as any)?.shopId, session?.user?.email]);

    useEffect(() => {
        if (editBatchId) {
            storage.getItem<any[]>("markedPosters").then(all => {
                const target = all?.find(o => o.batchId === editBatchId);
                if (target) {
                    setOfferTitle(target.title || "");
                    setValidFrom(target.validFrom ? new Date(target.validFrom) : undefined);
                    setValidTo(target.validTo ? new Date(target.validTo) : undefined);
                    setSelectedBranchIds(target.branchIds ? target.branchIds.map(String) : []);
                    setOfferStatus(target.status || "active");
                    setIsActive(target.status === 'active');
                    setExistingPosters(target.posters || []);
                    setSocialLinks(target.socialLinks || []);
                }
            });
        }
    }, [editBatchId]);

    // Handle Resumption from Editor
    useEffect(() => {
        if (searchParams.get('resume') === 'true') {
            const loadResumedStack = async () => {
                try {
                    const stack = await storage.getItem<any[]>("poster_stack_resume");
                    if (stack && stack.length > 0) {
                        setClassifiedPosters(stack);

                        const previewIdx = parseInt(searchParams.get('previewIndex') || '0', 10);
                        setPreviewState({
                            posters: stack,
                            index: previewIdx,
                            onClose: () => setPreviewState(null),
                            onEditMarking: (idx) => {
                                // Redirection logic matching PosterCardStack
                                storage.setItem("poster_stack_resume", stack.map(({ uploadPromise, ...rest }: any) => rest));
                                router.push(`/shop-manager/create-offer/editor?from=preview&index=${idx}`);
                            },
                            onAddMarking: (idx) => {
                                const updated = stack.map((p, i) => i === idx ? { ...p, markedItems: [], type: "marked_poster" } as PosterItem : p);
                                storage.setItem("poster_stack_resume", updated.map(({ uploadPromise, ...rest }: any) => rest));
                                router.push(`/shop-manager/create-offer/editor?from=preview&index=${idx}`);
                            }
                        });
                    }
                } catch (err) {
                    console.error("Failed to resume poster stack:", err);
                }
            };
            loadResumedStack();
        }
    }, [searchParams, router]);

    useEffect(() => {
        const loadDrafts = async () => {
            try {
                const saved = await storage.getItem<Draft[]>("offerDrafts");
                if (saved) setDrafts(saved);
            } catch (err) {
                console.error("Failed to load drafts:", err);
            }
        };
        loadDrafts();
    }, []);

    const autoUpdateExistingOffer = async (posters: PosterItem[]) => {
        const toastId = toast.loading("Adding posters to Offer...");
        setIsPublishing(true);
        try {
            const posterData = await Promise.all(
                posters.map(async (poster) => {
                    let s3Url = "";
                    if (poster.uploadPromise) {
                        s3Url = await poster.uploadPromise;
                    } else if (poster.file) {
                        const res = await s3Api.uploadImage(poster.file).catch(() => null);
                        const uploadedUrl = extractS3Url(res);
                        if (!res || !res.success || !uploadedUrl) throw new Error("Upload failed");
                        s3Url = uploadedUrl;
                    }
                    return {
                        id: poster.id,
                        posterSrc: s3Url,
                        type: poster.type,
                        markedItems: poster.markedItems || [],
                    };
                })
            );

            const allPosters = await storage.getItem<any[]>("markedPosters") || [];
            const targetIndex = allPosters.findIndex(o => o.batchId === editBatchId);

            if (targetIndex !== -1) {
                const updatedTarget = { ...allPosters[targetIndex] };
                const newPostersList = [...(updatedTarget.posters || []), ...posterData];
                updatedTarget.posters = newPostersList.map((p, i) => ({ ...p, displayOrder: i + 1 }));

                try {
                    let shopId = session?.shopId ?? (session?.user as any)?.shopId;
                    if (!shopId && session) {
                        const shopRes = await getMyShops();
                        if (shopRes.success && shopRes.data) {
                            const shopList = Array.isArray(shopRes.data) ? shopRes.data : (shopRes.data as any).data || [];
                            if (shopList.length > 0) shopId = shopList[0].id;
                        }
                    }

                    if (shopId) {
                        await updateOffer(String(editBatchId), updatedTarget, String(shopId));
                    }
                } catch (networkError) {
                    console.warn("API Error:", networkError);
                }

                allPosters[targetIndex] = updatedTarget;
                await storage.setItem("markedPosters", allPosters);
            }

            posters.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            toast.success("Posters added successfully!", { id: toastId });
            router.push(`/shop-manager?editModal=${editBatchId}`);
        } catch (err) {
            console.error("AutoUpdate error:", err);
            toast.error("Failed to add posters.", { id: toastId });
        } finally {
            setIsPublishing(false);
        }
    };

    const handleClassificationComplete = (posters: PosterItem[]) => {
        setClassifiedPosters(posters);

        if (isUpdateMode) {
            autoUpdateExistingOffer(posters);
        } else {
            setOfferTitle("");
            setShowPublishModal(true);
        }
    };

    const handlePublishSubmit = () => {
        const errors: { title?: string; validFrom?: string; validTo?: string; branch?: string } = {};
        if (!offerTitle.trim()) errors.title = "Offer title is required";
        if (!validFrom) errors.validFrom = "Start date is required";
        if (!validTo) errors.validTo = "End date is required";
        if (validFrom && validTo && validTo < validFrom) errors.validTo = "End date must be after start date";
        if (selectedBranchIds.length === 0) errors.branch = "Please select at least one branch";
        setPublishErrors(errors);
        if (Object.keys(errors).length === 0) confirmPublish();
    };

    const confirmPublish = async () => {
        if (!offerTitle.trim()) {
            toast.error("Please enter a offer title");
            return;
        }
        if (!validFrom || !validTo) {
            toast.error("Please select the validity period");
            return;
        }

        setIsPublishing(true);
        try {
            const posterData = await Promise.all(
                classifiedPosters.map(async (poster) => {
                    let s3Url = "";
                    if (poster.uploadPromise) {
                        s3Url = await poster.uploadPromise;
                    } else {
                        if (!poster.file) {
                            throw new Error("Missing poster file or S3 url for upload.");
                        }
                        const res = await s3Api.uploadImage(poster.file).catch(() => null);
                        const uploadedUrl = extractS3Url(res);
                        if (!res || !res.success || !uploadedUrl) {
                            throw new Error(`Failed to upload poster: ${poster.file.name}`);
                        }
                        s3Url = uploadedUrl;
                    }

                    const processedMarkedItems = await Promise.all(
                        (poster.markedItems || []).map(async (item: any) => {
                            if (item.productImage && typeof item.productImage === 'string' && item.productImage.startsWith("data:")) {
                                const cleanUrl = await ensureS3Url(item.productImage);
                                return { ...item, productImage: cleanUrl || "" };
                            }
                            return item;
                        })
                    );

                    return {
                        id: poster.id,
                        posterSrc: s3Url,
                        type: poster.type,
                        markedItems: processedMarkedItems,
                    };
                })
            );

            const existing = await storage.getItem<any[]>("markedPosters");
            let allPosters = existing || [];

            let finalPosters = isUpdateMode ? [...existingPosters, ...posterData] : posterData;
            finalPosters = finalPosters.map((p, i) => ({ ...p, displayOrder: i + 1 }));

            if (isUpdateMode && editBatchId) {
                allPosters = allPosters.filter(o => o.batchId !== editBatchId);
            }

            const selectedBranches = branches.filter((b) => selectedBranchIds.includes(String(b.id)));

            const payload = {
                batchId: (isUpdateMode && editBatchId) ? editBatchId : crypto.randomUUID(),
                title: offerTitle,
                validFrom: formatDateLocal(validFrom),
                validTo: formatDateLocal(validTo),
                branchIds: selectedBranches.map(b => b.id),
                branchNames: selectedBranches.map(b => b.branch_name),
                branchCity: selectedBranches[0]?.city,
                createdAt: (isUpdateMode && editBatchId && allPosters.find(o => o.batchId === editBatchId)?.createdAt) || new Date().toISOString(),
                status: isActive ? 'active' : 'paused',
                isActive: isActive,
                isFeatured: isFeatured,
                posters: finalPosters,
                socialLinks: socialLinks,
                type: "UPLOAD",
                isDraft: false,
            };

            try {
                let shopId = session?.shopId ?? (session?.user as any)?.shopId;
                if (!shopId && session) {
                    const shopRes = await getMyShops();
                    if (shopRes.success && shopRes.data) {
                        const shopList = Array.isArray(shopRes.data) ? shopRes.data : (shopRes.data as any).data || [];
                        if (shopList.length > 0) shopId = shopList[0].id;
                    }
                }

                if (shopId) {
                    if (isUpdateMode && editBatchId) {
                        await updateOffer(String(editBatchId), payload, String(shopId));
                    } else {
                        await createOffer(payload, String(shopId));
                    }
                    // Invalidate caches to ensure new offer shows up immediately on home and search pages
                    queryClient.invalidateQueries({ queryKey: ["infiniteUserOffers"] });
                    queryClient.invalidateQueries({ queryKey: ["featuredOffers"] });
                    queryClient.invalidateQueries({ queryKey: ["featuredShops"] });
                    queryClient.invalidateQueries({ queryKey: ["allOffers"] });
                    queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
                }
            } catch (networkError) {
                console.warn("API Error:", networkError);
            }

            allPosters.push(payload);
            await storage.setItem("markedPosters", allPosters);

            classifiedPosters.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            toast.success("All posters published successfully!");
            setShowPublishModal(false);
            const source = typeof window !== "undefined" ? sessionStorage.getItem("create_offer_source") : null;
            if (source) {
                sessionStorage.removeItem("create_offer_source");
            }
            if (isUpdateMode || source === "dashboard") {
                router.push("/shop-manager");
            } else if (source === "offers") {
                router.push("/shop-manager/offers");
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error("Publish error:", err);
            toast.error("Failed to publish");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleSaveDraftSubmit = async (postersOverride?: PosterItem[]) => {
        setIsPublishing(true);
        const toastId = toast.loading("Saving draft...");

        try {
            const activePosters = postersOverride || classifiedPosters;
            const posterData = await Promise.all(
                activePosters.map(async (poster) => {
                    let s3Url = "";
                    if (poster.uploadPromise) {
                        s3Url = await poster.uploadPromise;
                    } else {
                        if (!poster.file) {
                            throw new Error("Missing poster file for upload.");
                        }
                        const res = await s3Api.uploadImage(poster.file).catch(() => null);
                        const uploadedUrl = extractS3Url(res);
                        if (!res || !res.success || !uploadedUrl) {
                            throw new Error(`Failed to upload poster: ${poster.file.name}`);
                        }
                        s3Url = uploadedUrl;
                    }

                    const processedMarkedItems = await Promise.all(
                        (poster.markedItems || []).map(async (item: any) => {
                            if (item.productImage && typeof item.productImage === 'string' && item.productImage.startsWith("data:")) {
                                const cleanUrl = await ensureS3Url(item.productImage);
                                return { ...item, productImage: cleanUrl || "" };
                            }
                            return item;
                        })
                    );

                    return {
                        id: poster.id,
                        posterSrc: s3Url,
                        type: poster.type,
                        markedItems: processedMarkedItems,
                    };
                })
            );

            const existing = await storage.getItem<any[]>("markedPosters");
            let allPosters = existing || [];

            let finalPosters = isUpdateMode ? [...existingPosters, ...posterData] : posterData;
            finalPosters = finalPosters.map((p, i) => ({ ...p, displayOrder: i + 1 }));

            if (isUpdateMode && editBatchId) {
                allPosters = allPosters.filter(o => o.batchId !== editBatchId);
            }

            const selectedBranches = branches.filter((b) => selectedBranchIds.includes(String(b.id)));
            const branchesToUse = selectedBranches.length > 0 ? selectedBranches : (branches.length > 0 ? [branches[0]] : []);

            const payload = {
                batchId: (isUpdateMode && editBatchId) ? editBatchId : crypto.randomUUID(),
                title: offerTitle.trim() || `Draft Offer - ${formatDateLocal(new Date())}`,
                validFrom: validFrom ? formatDateLocal(validFrom) : formatDateLocal(new Date()),
                validTo: validTo ? formatDateLocal(validTo) : formatDateLocal(new Date(Date.now() + 86400000 * 7)),
                branchIds: branchesToUse.map(b => b.id),
                branchNames: branchesToUse.map(b => b.branch_name),
                branchCity: branchesToUse[0]?.city || "Default City",
                createdAt: (isUpdateMode && editBatchId && allPosters.find(o => o.batchId === editBatchId)?.createdAt) || new Date().toISOString(),
                status: 'draft',
                isActive: false,
                posters: finalPosters,
                socialLinks: socialLinks,
                type: "UPLOAD",
                isDraft: true,
            };

            try {
                let shopId = session?.shopId ?? (session?.user as any)?.shopId;
                if (!shopId && session) {
                    const shopRes = await getMyShops();
                    if (shopRes.success && shopRes.data) {
                        const shopList = Array.isArray(shopRes.data) ? shopRes.data : (shopRes.data as any).data || [];
                        if (shopList.length > 0) shopId = shopList[0].id;
                    }
                }

                if (shopId) {
                    if (isUpdateMode && editBatchId) {
                        await updateOffer(String(editBatchId), payload, String(shopId));
                    } else {
                        await createOffer(payload, String(shopId));
                    }
                }
            } catch (networkError) {
                console.warn("API Error:", networkError);
            }

            allPosters.push(payload);
            await storage.setItem("markedPosters", allPosters);

            activePosters.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            toast.success("Draft saved successfully!", { id: toastId });
            setShowPublishModal(false);
            const source = typeof window !== "undefined" ? sessionStorage.getItem("create_offer_source") : null;
            if (source) {
                sessionStorage.removeItem("create_offer_source");
            }
            if (isUpdateMode || source === "dashboard") {
                router.push("/shop-manager");
            } else if (source === "offers") {
                router.push("/shop-manager/offers");
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error("Draft save error:", err);
            toast.error("Failed to save draft", { id: toastId });
        } finally {
            setIsPublishing(false);
        }
    };

    const handleResumeDraft = (draft: Draft) => {
        localStorage.setItem(
            "currentEditingPoster",
            JSON.stringify({
                id: draft.id,
                posterSrc: draft.posterSrc,
                markedItems: draft.markedItems,
                title: draft.title,
            })
        );
        router.push("/shop-manager/create-offer/editor");
    };

    const handleDiscardClick = (id: string) => {
        setDraftToDiscard(id);
        setShowDiscardModal(true);
    };

    const handleConfirmDiscard = async () => {
        if (!draftToDiscard) return;
        try {
            const updated = drafts.filter((d) => d.id !== draftToDiscard);
            setDrafts(updated);
            await storage.setItem("offerDrafts", updated);
            toast.success("Draft discarded");
        } catch {
            toast.error("Failed to discard draft");
        } finally {
            setShowDiscardModal(false);
            setDraftToDiscard(null);
        }
    };

    const formatRelativeTime = (iso: string) => {
        const diff = Math.floor(
            (Date.now() - new Date(iso).getTime()) / 1000
        );
        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="h-20 lg:h-24" />

            <main className="w-full relative bg-background min-h-screen border-t border-border/40">
                <div className={cn(
                    "mx-auto relative px-4 lg:px-8 pt-2 md:pt-3 pb-8 md:pb-12 transition-all duration-300",
                    isEditing ? "max-w-[1400px]" : previewState ? "max-w-full" : (drafts.length > 0 ? "max-w-6xl" : "max-w-4xl")
                )}>
                    {!isEditing && (
                        <Breadcrumbs
                            items={[
                                { label: "Dashboard", href: "/shop-manager" },
                                { label: isUpdateMode ? "Update Offer" : "New Offer" },
                            ]}
                        />
                    )}

                    <div className={cn(
                        "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col gap-10",
                        isEditing ? "mt-0" : (previewState ? "mt-4 lg:flex-row" : drafts.length > 0 ? "mt-8 lg:flex-row" : "mt-8"),
                        !isEditing && "lg:items-start"
                    )}>
                        <div className={cn(
                            "space-y-6 flex flex-col min-h-0 w-full transition-all duration-300",
                            isEditing ? "w-full" : previewState ? "lg:flex-1" : (drafts.length > 0 ? "lg:flex-[2]" : "w-full")
                        )}>
                            {!isEditing && (
                                <div className="space-y-1 border-b border-border/40 pb-4 mb-2">
                                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gradient">
                                        {isUpdateMode ? "Update Offer" : "Create Offer"}
                                    </h1>
                                    <p className="text-muted-foreground text-base">
                                        {isUpdateMode ? "Upload additional posters, classify them, and save." : "Upload posters, classify them, and publish."}
                                    </p>
                                </div>
                            )}

                            <div className={cn(
                                "transition-all duration-300",
                                isEditing ? "p-0 bg-transparent" : "p-0 rounded-xl bg-card border border-border shadow-sm overflow-hidden"
                            )}>
                                <PosterCardStack
                                    ref={posterStackRef}
                                    onComplete={handleClassificationComplete}
                                    onEditingChange={setIsEditing}
                                    onPreviewChange={setPreviewState}
                                    onPhaseChange={setStackPhase}
                                    submitButtonText={isUpdateMode ? "Continue to Update" : "Publish"}
                                    onSaveDraft={handleSaveDraftSubmit}
                                />
                            </div>

                            {!isEditing && stackPhase !== "classify" && (
                                <PremiumButton
                                    variant="outline"
                                    className="w-full rounded-2xl h-14"
                                    onClick={() => {
                                        const handled = posterStackRef.current?.handleCancel?.();
                                        if (!handled) {
                                            router.back();
                                        }
                                    }}
                                    leftIcon={X}
                                >
                                    Cancel & Go Back
                                </PremiumButton>
                            )}
                        </div>

                        {!isEditing && (previewState || drafts.length > 0) && (
                            <div className={cn(
                                "transition-all w-full flex flex-col relative",
                                previewState ? "lg:flex-1 lg:sticky lg:top-20 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" : "space-y-6 lg:flex-1 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                            )}>
                                {previewState ? (
                                    <div className="hidden lg:block w-full h-[calc(100dvh-9rem)] min-h-[460px] max-h-[820px] relative">
                                        <PosterPreviewPanel
                                            posters={previewState.posters}
                                            initialIndex={previewState.index}
                                            isPreparing={previewState.isPreparing}
                                            onClose={() => { previewState.onClose(); setPreviewState(null); }}
                                            onEditMarking={(i) => { previewState.onEditMarking(i); }}
                                            onAddMarking={(i) => { previewState.onAddMarking(i); }}
                                            variant="inline"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-2">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-muted-foreground" />
                                                <h2 className="text-lg font-semibold text-foreground whitespace-nowrap">
                                                    Drafted Posters
                                                </h2>
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border">
                                                {drafts.length}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {drafts.map((draft) => (
                                                <div
                                                    key={draft.id}
                                                    className="group relative flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors shadow-sm overflow-hidden"
                                                >
                                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-border">
                                                        <Image
                                                            src={draft.posterSrc}
                                                            alt={draft.title}
                                                            fill
                                                            unoptimized
                                                            className="object-cover"
                                                        />
                                                    </div>

                                                    <div className="flex flex-col justify-between flex-1 relative z-10 py-1">
                                                        <div>
                                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
                                                                {draft.title}
                                                            </h3>
                                                            <div className="flex items-center gap-1.5 mt-1 opacity-50">
                                                                <Clock className="w-3 h-3" />
                                                                <span className="text-xs font-medium">
                                                                    {formatRelativeTime(
                                                                        draft.lastEdited
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() =>
                                                                    handleResumeDraft(draft)
                                                                }
                                                                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                                            >
                                                                <FileEdit className="w-3.5 h-3.5" />
                                                                Resume
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDiscardClick(draft.id)
                                                                }
                                                                className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Discard
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center pr-2">
                                                        <div
                                                            onClick={() =>
                                                                handleResumeDraft(draft)
                                                            }
                                                            className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 translate-x-4 group-hover:translate-x-0 cursor-pointer"
                                                        >
                                                            <ArrowRight className="w-4 h-4 text-primary" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <div className="py-12" />

            <AppModal
                open={showPublishModal}
                onOpenChange={setShowPublishModal}
                title={isUpdateMode ? "Update Offer" : "Publish Offer"}
                description={isUpdateMode ? "Review and update your offer details." : "Give your offer a name before publishing."}
                footer={
                    <div className="flex flex-col gap-3 w-full">
                        <div className="flex items-center gap-2">
                            <StatusToggleButton status={isActive ? "active" : "paused"} onChange={(newStatus) => setIsActive(newStatus === "active")} />
                            <span className={cn(
                                "text-[13px] font-bold uppercase tracking-wider",
                                isActive ? "text-slate-800" : "text-gray-400"
                            )}>
                                {isActive ? "Online" : "Paused"}
                            </span>
                            <div className="w-px h-5 bg-border mx-1" />
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isFeatured}
                                onClick={() => setIsFeatured(f => !f)}
                                className={cn(
                                    "relative flex items-center w-[38px] h-5 rounded-full cursor-pointer transition-all duration-300 shadow-inner shrink-0 outline-none hover:ring-2 hover:ring-amber-400/20",
                                    isFeatured ? "bg-amber-400" : "bg-gray-200"
                                )}
                            >
                                <div
                                    className={cn(
                                        "absolute left-0.5 w-[16px] h-[16px] bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.2)] transform transition-transform duration-300",
                                        isFeatured ? "translate-x-[18px]" : "translate-x-0"
                                    )}
                                />
                            </button>
                            <span className={cn(
                                "text-[13px] font-bold uppercase tracking-wider",
                                isFeatured ? "text-amber-500" : "text-gray-400"
                            )}>
                                Featured
                            </span>
                        </div>
                        <div className="flex gap-2 w-full">
                            <PremiumButton
                                variant="outline"
                                onClick={() => setShowPublishModal(false)}
                                className="rounded-xl flex-1"
                            >
                                Cancel
                            </PremiumButton>
                            <PremiumButton
                                onClick={() => handleSaveDraftSubmit()}
                                isLoading={isPublishing}
                                className="rounded-xl flex-1 bg-none bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-600/20 border-0"
                                disabled={isPublishing}
                            >
                                Save Draft
                            </PremiumButton>
                            <PremiumButton
                                onClick={handlePublishSubmit}
                                isLoading={isPublishing}
                                leftIcon={Send}
                                className="rounded-xl flex-1"
                                disabled={isPublishing}
                            >
                                {isUpdateMode ? "Update" : "Publish"}
                            </PremiumButton>
                        </div>
                    </div>
                }
            >
                <div className="space-y-5">
                    <PremiumInput
                        label="Offer Title"
                        icon={Type}
                        type="text"
                        value={offerTitle}
                        onChange={(e) => {
                            setOfferTitle(e.target.value);
                            if (publishErrors.title) setPublishErrors((p) => ({ ...p, title: undefined }));
                        }}
                        placeholder="e.g. Weekend Mega Sale 2024"
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
                            Branch
                        </label>
                        {isBranchesLoading ? (
                            <div className="h-11 rounded-xl border border-primary/10 bg-background/40 animate-pulse" />
                        ) : branches.length === 0 ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm text-amber-700">
                                    <GitBranch className="w-4 h-4 shrink-0" />
                                    <span>No branches yet. Create one to link with this offer.</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const shopId = session?.shopId ?? (session?.user as any)?.shopId;
                                        if (shopId) {
                                            window.open(`/shop-manager/${shopId}/add-branch?returnTo=/shop-manager/create-offer`, "_blank");
                                        } else {
                                            toast.error("You need to create a shop first before adding branches");
                                            window.open("/shop-manager/add-shop?returnTo=/shop-manager/create-offer", "_blank");
                                        }
                                    }}
                                    className="shrink-0 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors px-3 py-1.5 rounded-lg cursor-pointer"
                                >
                                    + Add Branch
                                </button>
                            </div>
                        ) : (
                            <MultiSearchableSelect
                                options={branches.map((b) => ({ label: b.branch_name, value: String(b.id) }))}
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
                            <p className="text-xs font-medium text-red-500 text-destructive ml-1 animate-in fade-in slide-in-from-top-1">
                                {publishErrors.branch}
                            </p>
                        )}
                    </div>

                    <SocialLinksEditor socialLinks={socialLinks} onChange={setSocialLinks} />

                    <div className="p-2 rounded-xl bg-muted/50 border border-border/50 text-sm">
                        <div className="flex justify-between">
                            <span className="opacity-60">Total posters</span>
                            <span className="font-bold">
                                {isUpdateMode ? existingPosters.length + classifiedPosters.length : classifiedPosters.length}
                            </span>
                        </div>
                    </div>
                </div>
            </AppModal>

            <AppModal
                open={showDiscardModal}
                onOpenChange={setShowDiscardModal}
                title="Discard Draft?"
                description="This action cannot be undone."
            >
                <div className="flex gap-3 justify-end">
                    <PremiumButton
                        variant="outline"
                        onClick={() => setShowDiscardModal(false)}
                        className="rounded-xl"
                    >
                        Cancel
                    </PremiumButton>
                    <PremiumButton
                        variant="destructive"
                        onClick={handleConfirmDiscard}
                        className="rounded-xl"
                        leftIcon={Trash2}
                    >
                        Discard
                    </PremiumButton>
                </div>
            </AppModal>
            {/* Mobile Preview Overlay */}
            {previewState && (
                <div className="lg:hidden">
                    <PosterPreviewPanel
                        posters={previewState.posters}
                        initialIndex={previewState.index}
                        isPreparing={previewState.isPreparing}
                        onClose={() => { previewState.onClose(); setPreviewState(null); }}
                        onEditMarking={(i) => { previewState.onEditMarking(i); }}
                        onAddMarking={(i) => { previewState.onAddMarking(i); }}
                        variant="overlay"
                    />
                </div>
            )}
        </div>
    );
}
