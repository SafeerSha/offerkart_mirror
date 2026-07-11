"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    CalendarDays,
    Check,
    GitBranch,
    Loader2,
    Tag,
    Bell,
    CheckCircle2,
    ArrowLeft,
    Type,
    Send
} from "lucide-react";
import { Heading, Text, Subheading } from "@/components/shared/Typography";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { PremiumDatePicker } from "@/components/shared/PremiumDatePicker";
import { MultiSearchableSelect } from "@/components/shared/MultiSearchableSelect";
import { StatusToggleButton } from "@/components/shared/StatusToggleButton";
import { AppModal } from "@/components/shared/AppModal";
import { cn, formatDateLocal } from "@/lib/utils";
import { extractS3Url } from "@/lib/common";
import { getOfferById, getAllOffers, updateOffer } from "@/lib/api/offers";
import { getBranches } from "@/lib/api/branch";
import { getMyShops } from "@/lib/api/shop";
import { s3Api } from "@/lib/api/s3";
import { Branch } from "@/lib/types/branch";
import { storage } from "@/lib/storage";
import { PosterCardStack, PosterItem } from "@/components/shop-manager/PosterCardStack";
import type { PosterPreviewState } from "@/components/shop-manager/PosterCardStack";
import { PosterPreviewPanel } from "@/components/shop-manager/PosterPreviewPanel";
import { SocialLinksEditor, type SocialLink } from "@/components/offer/SocialLinksEditor";

// ─── Types ────────────────────────────────────────────────────────────────────
// Local type for API data before mapping to PosterItem
interface EditPoster {
    id?: string;
    posterSrc: string;
    type: "just_post" | "marked_poster" | "unclassified";
    markedItems?: any[];
    displayOrder?: number;
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────
export default function EditOfferPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        }>
            <EditOfferContent />
        </Suspense>
    );
}

// ─── Main content ─────────────────────────────────────────────────────────────
function EditOfferContent() {
    const params = useParams();
    const offerId = String(params.id);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    // Loading / saving
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [validFrom, setValidFrom] = useState<Date | undefined>();
    const [validTo, setValidTo] = useState<Date | undefined>();
    const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [posters, setPosters] = useState<PosterItem[]>([]);
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

    // Branch data
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isBranchesLoading, setIsBranchesLoading] = useState(false);

    // Validation errors
    const [errors, setErrors] = useState<{ title?: string; dates?: string; branch?: string }>({});

    // UI state mirroring create-offer
    const [isEditing, setIsEditing] = useState(false);
    const [previewState, setPreviewState] = useState<PosterPreviewState | null>(null);

    // ── Load offer from local storage, list API, or detail API ────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                let offer = null;
                let isLoadedFromLocalStorageDraft = false;

                // 1. Try local storage first (covers locally-saved drafts)
                const localOffers = await storage.getItem<any[]>("markedPosters");
                if (localOffers && localOffers.length > 0) {
                    const localOffer = localOffers.find(o =>
                        String(o.batchId) === String(offerId) ||
                        String(o.id) === String(offerId) ||
                        String(o.offerId) === String(offerId)
                    );
                    if (localOffer) {
                        if (localOffer.isDraft) {
                            offer = localOffer;
                            isLoadedFromLocalStorageDraft = true;
                            if (process.env.NODE_ENV === "development") {
                                console.log("Loaded offer as a draft from local storage:", offer);
                            }
                        } else {
                            // If it's not a draft, hold onto it as a backup
                            offer = localOffer;
                        }
                    }
                }

                // 2. Try fetching from the detail endpoint directly if NOT a local storage draft
                // (Works for all published offers and always includes full posters/hotspots)
                if (!isLoadedFromLocalStorageDraft) {
                    try {
                        const res = await getOfferById(offerId);
                        if (res.success && res.data) {
                            const raw = res.data as any;
                            offer = raw?.data ?? raw;
                            if (process.env.NODE_ENV === "development") {
                                console.log("Loaded offer from detail API:", offer);
                            }
                        }
                    } catch (detailErr) {
                        console.warn("getOfferById failed:", detailErr);
                    }
                }

                // 3. Fallback: Try fetching from getAllOffers list endpoint if not successfully loaded from detail API
                if (!isLoadedFromLocalStorageDraft && (!offer || !offer.posters || offer.posters.length === 0)) {
                    try {
                        let shopId = (session as any)?.shopId ?? (session?.user as any)?.shopId;
                        if (!shopId) {
                            const shopRes = await getMyShops();
                            if (shopRes.success && shopRes.data) {
                                const list = Array.isArray(shopRes.data) ? shopRes.data : (shopRes.data as any).data || [];
                                if (list.length > 0) shopId = list[0].id;
                            }
                        }
                        if (shopId) {
                            const allRes = await getAllOffers(String(shopId));
                            if (allRes.success && allRes.data) {
                                const allList = Array.isArray(allRes.data) ? allRes.data : (allRes.data as any).data || [];
                                const listOffer = allList.find((o: any) =>
                                    String(o.offerId) === String(offerId) ||
                                    String(o.id) === String(offerId) ||
                                    String(o.batchId) === String(offerId)
                                );
                                if (listOffer) {
                                    if (!offer) {
                                        offer = listOffer;
                                    } else {
                                        offer = { ...listOffer, ...offer };
                                    }
                                    if (process.env.NODE_ENV === "development") {
                                        console.log("Merged/Loaded offer from allOffers list:", offer);
                                    }
                                }
                            }
                        }
                    } catch (listErr) {
                        console.warn("getAllOffers fallback failed:", listErr);
                    }
                }

                if (offer) {
                    // Ultra-resilient title extraction
                    setTitle(offer.title || offer.offerName || offer.offer_name || "");

                    // Ultra-resilient dates
                    const fromDate = offer.validFrom || offer.valid_from || offer.startDate || offer.start_date;
                    const toDate = offer.validTo || offer.valid_to || offer.endDate || offer.end_date;
                    setValidFrom(fromDate ? new Date(fromDate) : undefined);
                    setValidTo(toDate ? new Date(toDate) : undefined);

                    setIsActive(offer.status === "active" || offer.isActive || offer.is_active || false);
                    setSocialLinks(offer.socialLinks || offer.social_links || []);

                    // Ultra-resilient branch ID extraction
                    let bIdsRaw = offer.branchIds || offer.branch_ids || offer.branches || offer.offerBranches || offer.offer_branches || offer.offer_branch_links || [];

                    // If we got an empty array but there are other potential sources, try them
                    if (Array.isArray(bIdsRaw) && bIdsRaw.length === 0) {
                        bIdsRaw = offer.offerBranches || offer.offer_branches || offer.branchIds || offer.branch_ids || offer.offer_branch_links || [];
                    }

                    if (typeof bIdsRaw === 'string') {
                        bIdsRaw = bIdsRaw.split(',').map(s => s.trim());
                    }

                    const bIds = (Array.isArray(bIdsRaw) ? bIdsRaw : [bIdsRaw])
                        .map((item: any) => {
                            if (!item) return null;
                            if (typeof item === 'object') {
                                // Prioritize branchId/branch_id as "id" in join tables is often the link ID, not the branch ID
                                return item.branchId || item.branch_id || item.id || item.value;
                            }
                            return item;
                        })
                        .filter(Boolean)
                        .map(String);

                    setSelectedBranchIds(bIds);

                    // Ultra-resilient poster extraction
                    let postersRaw = offer.posters || offer.poster_links || offer.offer_posters;

                    if (typeof postersRaw === 'string') {
                        try {
                            postersRaw = JSON.parse(postersRaw);
                        } catch (e) {
                            console.warn("Failed to parse posters string:", e);
                        }
                    }

                    // If no posters array, try to construct one from single image fields
                    if (postersRaw && !Array.isArray(postersRaw) && Array.isArray(postersRaw.data)) {
                        postersRaw = postersRaw.data;
                    }

                    if (!postersRaw || (Array.isArray(postersRaw) && postersRaw.length === 0)) {
                        const singleOfferImage = offer.posterSrc || offer.poster_src || offer.image || offer.imageUrl || offer.image_url || offer.url;
                        if (singleOfferImage && typeof singleOfferImage === 'string') {
                            postersRaw = [{
                                id: offer.id || '1',
                                posterSrc: singleOfferImage,
                                type: 'just_post',
                                markedItems: []
                            }];
                        } else {
                            postersRaw = [];
                        }
                    }

                    const apiPosters: PosterItem[] = (Array.isArray(postersRaw) ? postersRaw : [])
                        .filter((p: any) => !!(p.posterSrc || p.poster_src || p.imageUrl || p.image_url || p.url || p.previewUrl))
                        .map((p: any, i: number) => {
                            // Extract marked items from API structure (offerProducts -> areas)
                            let marked: any[] = p.markedItems || p.marked_items || [];

                            if (marked.length === 0 && p.offerProducts && Array.isArray(p.offerProducts)) {
                                marked = p.offerProducts.flatMap((prod: any) => {
                                    const areas = prod.areas || prod.offerProductAreas || [];
                                    return areas.map((area: any) => ({
                                        id: String(area.id || Math.random().toString(36).substr(2, 9)),
                                        x: area.xPercent ?? area.x_percent ?? 0,
                                        y: area.yPercent ?? area.y_percent ?? 0,
                                        width: area.widthPercent ?? area.width_percent ?? 0,
                                        height: area.heightPercent ?? area.height_percent ?? 0,
                                        name: prod.displayName || prod.display_name || '',
                                        description: prod.displayDescription || prod.display_description || '',
                                        oldPrice: prod.originalPrice || prod.original_price || 0,
                                        offerPrice: prod.offerPrice || prod.offer_price || 0,
                                        productImage: prod.imageUrl || prod.image_url || '',
                                        currency: '₹',
                                        mainCategory: prod.mainCategory || prod.main_category || '',
                                        subcategories: prod.subcategories || prod.sub_categories || [],
                                        productUrl: prod.productUrl || prod.product_url || ''
                                    }));
                                });
                            }

                            return {
                                id: String(p.id || i),
                                previewUrl: p.previewUrl || p.posterSrc || p.poster_src || p.imageUrl || p.image_url || p.url,
                                type: (marked.length > 0 || p.type === "marked_poster" || p.type === "mark_products") 
                                    ? "marked_poster" 
                                    : "just_post",
                                markedItems: marked,
                                file: p.file // retain file if it's a local draft
                            };
                        });

                    const isResume = searchParams.get("resume") === "true";
                    if (isResume) {
                        try {
                            const returnUrl = await storage.getItem<string>("edit_offer_return");
                            const currentEditing = await storage.getItem<any[]>("currentEditingPosters");

                            if (returnUrl && returnUrl.includes(`/shop-manager/edit-offer/${offerId}`) && currentEditing && currentEditing.length > 0) {
                                const resumeStack = await storage.getItem<any[]>("poster_stack_resume") || [];
                                const mappedPosters: PosterItem[] = currentEditing.map((p: any) => {
                                    const matchingResume = resumeStack.find((r: any) => String(r.id) === String(p.id));
                                    return {
                                        id: String(p.id),
                                        previewUrl: p.posterSrc,
                                        type: (p.type === "marked_poster" || p.type === "mark_products" || (p.markedItems && p.markedItems.length > 0)) ? "marked_poster" : "just_post",
                                        markedItems: p.markedItems || [],
                                        file: matchingResume?.file
                                    };
                                });
                                console.log("Loaded Posters from currentEditingPosters:", mappedPosters);
                                setPosters(mappedPosters);
                            } else {
                                console.log("Mapped Posters (Fallback):", apiPosters);
                                setPosters(apiPosters);
                            }
                        } catch (resumeErr) {
                            console.error("Failed to load resumed posters:", resumeErr);
                            setPosters(apiPosters);
                        }
                    } else {
                        console.log("Mapped Posters:", apiPosters);
                        setPosters(apiPosters);
                    }
                } else {
                    toast.error("Failed to load offer");
                    router.push("/shop-manager");
                    return;
                }
            } catch (err) {
                console.error(err);
                toast.error("Network error loading offer");
                router.push("/shop-manager");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [offerId, session, searchParams]);

    // ── Load branches ────────────────────────────────────────────────────────
    useEffect(() => {
        const loadBranches = async () => {
            setIsBranchesLoading(true);
            try {
                let shopId = (session as any)?.shopId ?? (session?.user as any)?.shopId;
                if (!shopId) {
                    const shopRes = await getMyShops();
                    if (shopRes.success && shopRes.data) {
                        const list = Array.isArray(shopRes.data) ? shopRes.data : (shopRes.data as any).data || [];
                        if (list.length > 0) shopId = list[0].id;
                    }
                }
                if (!shopId) return;
                const res = await getBranches(shopId);
                if (res.success && res.data) {
                    const list = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
                    setBranches(Array.isArray(list) ? list : []);
                }
            } catch (err) {
                console.error("Failed to load branches", err);
            } finally {
                setIsBranchesLoading(false);
            }
        };
        if (session) loadBranches();
    }, [session]);

    // ── Validation ───────────────────────────────────────────────────────────
    const validate = () => {
        const e: typeof errors = {};
        if (!title.trim()) e.title = "Offer title is required";
        if (!validFrom || !validTo) e.dates = "Both dates are required";
        else if (validFrom > validTo) e.dates = "Start date must be before end date";
        if (selectedBranchIds.length === 0) e.branch = "Select at least one branch";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate()) return;

        setIsSaving(true);
        try {
            let shopId = (session as any)?.shopId ?? (session?.user as any)?.shopId;
            const selectedBranches = branches.filter(b => selectedBranchIds.includes(String(b.id)));

            const posterData = await Promise.all(
                posters.map(async (poster, i) => {
                    let s3Url = poster.previewUrl || "";
                    if (poster.uploadPromise) {
                        s3Url = await poster.uploadPromise;
                    } else if (poster.file) {
                        const res = await s3Api.uploadImage(poster.file).catch(() => null);
                        const uploadedUrl = extractS3Url(res);
                        if (!res || !res.success || !uploadedUrl) throw new Error("Upload failed for one of the new posters.");
                        s3Url = uploadedUrl;
                    }
                    return {
                        posterSrc: s3Url,
                        type: poster.type,
                        displayOrder: i + 1,
                        // STRICT WHITE-LIST: Rebuild markedItems from scratch to omit ALL DB metadata
                        markedItems: (poster.markedItems || []).map((item: any) => ({
                            name: item.name,
                            description: item.description,
                            x: item.x,
                            y: item.y,
                            width: item.width,
                            height: item.height,
                            offerPrice: item.offerPrice,
                            oldPrice: item.oldPrice,
                            currency: item.currency,
                            productImage: item.productImage,
                            productUrl: item.productUrl,
                            mainCategory: item.mainCategory,
                            subcategories: item.subcategories
                        }))
                    };
                })
            );

            const payload = {
                title: title.trim(),
                isActive,
                status: isActive ? "active" : "paused",
                validFrom: validFrom ? formatDateLocal(validFrom) : "",
                validTo: validTo ? formatDateLocal(validTo) : "",
                branchIds: selectedBranches.map(b => b.id),
                branchNames: selectedBranches.map(b => b.branch_name),
                branchCity: selectedBranches[0]?.city ?? "",
                posters: posterData,
                socialLinks: socialLinks,
            };

            // Try to update on the server if possible (or fallback if it fails for local drafts)
            let success = false;
            try {
                const res = await updateOffer(offerId, payload as any, String(shopId));
                success = res.success;
            } catch (apiErr) {
                console.warn("API Update failed, updating locally only:", apiErr);
            }

            // Always update local storage so local list is in sync
            const localOffers = await storage.getItem<any[]>("markedPosters");
            if (localOffers && localOffers.length > 0) {
                const updatedOffers = localOffers.map(o => {
                    if (String(o.batchId || o.id || o.offerId) === String(offerId)) {
                        return {
                            ...o,
                            ...payload,
                            isDraft: o.isDraft ? false : o.isDraft, // mark as published if it was draft
                        };
                    }
                    return o;
                });
                await storage.setItem("markedPosters", updatedOffers);
                success = true;
            }

            if (success) {
                await storage.removeItem("currentEditingPosters");
                await storage.removeItem("edit_offer_return");
                toast.success("Offer updated successfully!");
                router.push("/shop-manager");
            } else {
                throw new Error("Update failed");
            }
        } catch (err: any) {
            toast.error(`Failed to save: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinish = (finalPosters: PosterItem[]) => {
        setPosters(finalPosters);
        setShowDetailsModal(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <Text className="opacity-50 font-bold uppercase tracking-widest text-[10px]">Loading offer...</Text>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="h-14" />

            <main className="w-full relative overflow-hidden bg-background min-h-screen">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

                <div className={cn(
                    "mx-auto relative px-4 lg:px-8 py-4 md:py-12 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    isEditing ? "max-w-[1400px]" : previewState ? "max-w-full" : "max-w-6xl"
                )}>
                    {!isEditing && (
                        <Breadcrumbs items={[
                            { label: "Dashboard", href: "/shop-manager" },
                            { label: "Edit Offer" },
                        ]} />
                    )}

                    <div className={cn(
                        "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col gap-10",
                        isEditing ? "mt-0" : "mt-8 lg:flex-row",
                        !isEditing && (previewState ? "lg:items-stretch" : "lg:items-start")
                    )}>
                        <div className={cn(
                            "space-y-1 flex flex-col min-h-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] w-full",
                            isEditing ? "w-full" : previewState ? "lg:flex-1" : "lg:flex-[2]"
                        )}>
                            {!isEditing && (
                                <div className="space-y-1">
                                    <Subheading className="text-gradient font-bold tracking-tight">
                                        Edit Offer
                                    </Subheading>
                                    <Text className="opacity-50 text-base">
                                        Update posters, adjust tags, and save changes.
                                    </Text>
                                </div>
                            )}

                            <PremiumCard className={cn(
                                isEditing ? "p-0 border-0 bg-transparent shadow-none" : "p-4 sm:p-6 overflow-visible"
                            )}>
                                <PosterCardStack
                                    initialPosters={posters}
                                    onComplete={handleFinish}
                                    onEditingChange={setIsEditing}
                                    onPreviewChange={setPreviewState}
                                    submitButtonText="Review & Save Updates"
                                    editorReturnTo="edit-offer"
                                    editorReturnUrl={`/shop-manager/edit-offer/${offerId}`}
                                />
                            </PremiumCard>

                            {!isEditing && (
                                <PremiumButton
                                    variant="outline"
                                    className="w-full rounded-2xl h-14"
                                    onClick={() => router.back()}
                                    leftIcon={ArrowLeft}
                                >
                                    Cancel & Go Back
                                </PremiumButton>
                            )}
                        </div>

                        {!isEditing && (
                            <div className={cn(
                                "transition-all w-full flex flex-col relative",
                                previewState ? "lg:flex-1 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" : "space-y-6 lg:flex-1 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                            )}>
                                {previewState && (
                                    <div className="hidden lg:block h-full min-h-[500px] relative">
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
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

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

            {/* Final Details & Save Modal */}
            <AppModal
                open={showDetailsModal}
                onOpenChange={setShowDetailsModal}
                title="Update Offer"
                description="Review and update your campaign details."
                footer={
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 hidden sm:flex">
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    isActive ? "bg-[#1cc080]" : "bg-gray-400"
                                )} />
                                <span className={cn(
                                    "text-[13px] font-bold uppercase tracking-wider",
                                    isActive ? "text-slate-800" : "text-gray-500"
                                )}>
                                    {isActive ? "Active" : "Paused"}
                                </span>
                            </div>
                            <StatusToggleButton status={isActive ? "active" : "paused"} onChange={(newStatus) => setIsActive(newStatus === "active")} />
                        </div>
                        <div className="flex gap-3">
                            <PremiumButton
                                variant="outline"
                                onClick={() => setShowDetailsModal(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </PremiumButton>
                            <PremiumButton
                                onClick={handleSave}
                                isLoading={isSaving}
                                leftIcon={Send}
                                className="rounded-xl"
                                disabled={isSaving || isLoading || isBranchesLoading}
                            >
                                {isSaving ? "Updating Offer..." : (isLoading || isBranchesLoading) ? "Synchronizing... ⏳" : "Update"}
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
                        value={title}
                        onChange={e => {
                            setTitle(e.target.value);
                            if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
                        }}
                        placeholder="e.g. Weekend Mega Sale 2024"
                        error={errors.title}
                        autoFocus
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <PremiumDatePicker
                            label="Valid From"
                            date={validFrom}
                            setDate={d => {
                                setValidFrom(d);
                                if (errors.dates) setErrors(prev => ({ ...prev, dates: undefined }));
                            }}
                            placeholder="Select start date"
                            error={errors.dates}
                            minDate={new Date()}
                        />
                        <PremiumDatePicker
                            label="Valid To"
                            date={validTo}
                            setDate={d => {
                                setValidTo(d);
                                if (errors.dates) setErrors(prev => ({ ...prev, dates: undefined }));
                            }}
                            placeholder="Select end date"
                            error={errors.dates}
                            minDate={validFrom || new Date()}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-foreground ml-1">
                            <GitBranch className="w-4 h-4 text-muted-foreground" />
                            Branches
                        </label>
                        {isBranchesLoading ? (
                            <div className="h-11 rounded-xl border border-primary/10 bg-background/40 animate-pulse" />
                        ) : (
                            <MultiSearchableSelect
                                options={branches.map(b => ({
                                    label: b.branch_name,
                                    value: String(b.id)
                                }))}
                                selectedValues={selectedBranchIds}
                                onChange={vals => {
                                    setSelectedBranchIds(vals);
                                    if (vals.length > 0 && errors.branch) setErrors(prev => ({ ...prev, branch: undefined }));
                                }}
                                placeholder="Select branches"
                            />
                        )}
                        {errors.branch && <p className="text-xs font-medium text-destructive ml-1">{errors.branch}</p>}
                    </div>

                    <SocialLinksEditor socialLinks={socialLinks} onChange={setSocialLinks} />

                    <div className="py-2 px-4 rounded-xl bg-muted/50 border border-border/50 text-sm">
                        <div className="flex justify-between">
                            <span className="opacity-60">Total posters</span>
                            <span className="font-bold">{posters.length}</span>
                        </div>
                    </div>
                </div>
            </AppModal>
        </div>
    );
}
