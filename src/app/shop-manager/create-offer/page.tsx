"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    ArrowRight,
    X,
    Clock,
    FileEdit,
    Trash2,
    LayoutGrid,
    Send,
    Type,
    GitBranch,
} from "lucide-react";
import { Heading, Subheading, Text } from "@/components/shared/Typography";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { PremiumDatePicker } from "@/components/shared/PremiumDatePicker";
import { AppModal } from "@/components/shared/AppModal";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { getBranches } from "@/lib/api/branch";
import Image from "next/image";
import { Branch } from "@/lib/types/branch";
import { MultiSearchableSelect } from "@/components/shared/MultiSearchableSelect";
import {
    PosterCardStack,
    PosterItem,
} from "@/components/shop-manager/PosterCardStack";

// --- Types ---
interface Draft {
    id: string;
    title: string;
    lastEdited: string;
    posterSrc: string;
    markedItems: any[];
}

export default function CreateOfferPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Publish modal
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [offerTitle, setOfferTitle] = useState("");
    const [validFrom, setValidFrom] = useState<Date>();
    const [validTo, setValidTo] = useState<Date>();
    const [classifiedPosters, setClassifiedPosters] = useState<PosterItem[]>([]);
    const [publishErrors, setPublishErrors] = useState<{ title?: string; validFrom?: string; validTo?: string; branch?: string }>({});

    // Branch state
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
    const [isBranchesLoading, setIsBranchesLoading] = useState(false);

    // Discard modal
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [draftToDiscard, setDraftToDiscard] = useState<string | null>(null);

    // Fetch branches when publish modal opens
    useEffect(() => {
        if (!showPublishModal) return;
        const shopId = session?.shopId ?? (session?.user as any)?.shopId;
        if (!shopId) return;
        setIsBranchesLoading(true);
        getBranches(shopId)
            .then((res) => {
                if (res.success && res.data) {
                    const list = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
                    setBranches(Array.isArray(list) ? list : []);
                }
            })
            .catch(() => toast.error("Failed to load branches"))
            .finally(() => setIsBranchesLoading(false));
    }, [showPublishModal, session]);

    // Load drafts
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

    // --- Card stack completion handler ---
    const handleClassificationComplete = (posters: PosterItem[]) => {
        setClassifiedPosters(posters);

        // The sequence has already been handled inline via PosterCardStack and HotspotEditor.
        // So at this point, all posters are classified and data is in posters[i].markedItems.
        // Just show the publish modal.
        setOfferTitle("");
        setShowPublishModal(true);
    };

    const handlePublishSubmit = () => {
        const errors: { title?: string; validFrom?: string; validTo?: string; branch?: string } = {};
        if (!offerTitle.trim()) errors.title = "Campaign title is required";
        if (!validFrom) errors.validFrom = "Start date is required";
        if (!validTo) errors.validTo = "End date is required";
        if (validFrom && validTo && validTo < validFrom) errors.validTo = "End date must be after start date";
        if (selectedBranchIds.length === 0) errors.branch = "Please select at least one branch";
        setPublishErrors(errors);
        if (Object.keys(errors).length === 0) confirmPublish();
    };

    // --- Publish (all just_post) ---
    const confirmPublish = async () => {
        if (!offerTitle.trim()) {
            toast.error("Please enter a campaign title");
            return;
        }
        if (!validFrom || !validTo) {
            toast.error("Please select the validity period");
            return;
        }

        setIsPublishing(true);
        try {
            const posterData = await Promise.all(
                classifiedPosters.map(
                    (poster) =>
                        new Promise<{
                            id: string;
                            posterSrc: string;
                            type: string;
                            markedItems: any[];
                        }>((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () =>
                                resolve({
                                    id: poster.id,
                                    posterSrc: reader.result as string,
                                    type: poster.type,
                                    markedItems: [],
                                });
                            reader.readAsDataURL(poster.file);
                        })
                )
            );

            const existing = await storage.getItem<any[]>("markedPosters");
            const allPosters = existing || [];
            const selectedBranches = branches.filter((b) => selectedBranchIds.includes(String(b.id)));
            allPosters.push({
                batchId: crypto.randomUUID(),
                title: offerTitle,
                validFrom: validFrom.toISOString().split('T')[0],
                validTo: validTo.toISOString().split('T')[0],
                branchIds: selectedBranches.map(b => b.id),
                branchNames: selectedBranches.map(b => b.branch_name),
                branchCity: selectedBranches[0]?.city, // Optional: tracking primary city if needed
                createdAt: new Date().toISOString(),
                status: "active",
                posters: posterData,
            });
            await storage.setItem("markedPosters", allPosters);

            classifiedPosters.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            toast.success("All posters published successfully!");
            setShowPublishModal(false);
            router.push("/shop-manager");
        } catch (err) {
            console.error("Publish error:", err);
            toast.error("Failed to publish");
        } finally {
            setIsPublishing(false);
        }
    };

    // --- Draft handlers ---
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
            <div className="h-20 lg:h-32" />

            <main className="container mx-auto px-4 py-4 md:py-12 relative overflow-hidden">
                {/* Background decor */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

                <div className={cn("mx-auto relative", isEditing ? "max-w-[1400px]" : "max-w-6xl")}>
                    {!isEditing && (
                        <Breadcrumbs
                            items={[
                                { label: "Dashboard", href: "/shop-manager" },
                                { label: "New Offer" },
                            ]}
                        />
                    )}

                    <div className={cn("items-start", isEditing ? "mt-0" : "grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8")}>
                        {/* ──── Left: Card Stack ──── */}
                        <div className={cn("space-y-6", isEditing ? "w-full" : "lg:col-span-2")}>
                            {!isEditing && (
                                <div className="space-y-1">
                                    <Heading className="text-gradient font-bold tracking-tight">
                                        Create Offer
                                    </Heading>
                                    <Text className="opacity-50 text-base">
                                        Upload posters, classify them, and publish.
                                    </Text>
                                </div>
                            )}

                            <PremiumCard className={cn(
                                isEditing ? "p-0 border-0 bg-transparent shadow-none" : "p-4 sm:p-6 overflow-visible"
                            )}>
                                <PosterCardStack
                                    onComplete={handleClassificationComplete}
                                    onEditingChange={setIsEditing}
                                />
                            </PremiumCard>

                            {!isEditing && (
                                <PremiumButton
                                variant="outline"
                                className="w-full rounded-2xl h-14"
                                onClick={() => router.back()}
                                leftIcon={X}
                            >
                                Cancel & Go Back
                            </PremiumButton>
                            )}
                        </div>

                        {/* ──── Right: Drafts ──── */}
                        {!isEditing && (
                            <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-primary" />
                                    </div>
                                    <Subheading className="whitespace-nowrap">
                                        Drafted Posters
                                    </Subheading>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-primary/60 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                                    {drafts.length}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {drafts.length > 0 ? (
                                    drafts.map((draft) => (
                                        <div
                                            key={draft.id}
                                            className="group relative flex gap-4 p-4 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-border/50">
                                                <Image
                                                    src={draft.posterSrc}
                                                    alt={draft.title}
                                                    fill
                                                    unoptimized
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
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
                                                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/70 transition-colors"
                                                    >
                                                        <FileEdit className="w-3 h-3" />
                                                        Resume
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDiscardClick(draft.id)
                                                        }
                                                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-destructive hover:text-destructive/70 transition-colors"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
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
                                    ))
                                ) : (
                                    <div className="p-8 rounded-3xl border-2 border-dashed border-primary/10 bg-primary/5 flex flex-col items-center justify-center text-center space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center shadow-sm">
                                            <LayoutGrid className="w-6 h-6 text-primary/40" />
                                        </div>
                                        <Text className="text-sm font-semibold opacity-60">
                                            No drafts yet
                                        </Text>
                                        <Text className="text-xs opacity-30">
                                            Posters marked for product tagging will appear here
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </main>

            <div className="py-12" />

            {/* ──── Publish Modal ──── */}
            <AppModal
                open={showPublishModal}
                onOpenChange={setShowPublishModal}
                title="Publish Offer"
                description="Give your campaign a name before publishing."
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
                                            router.push("/shop-manager/add-shop?returnTo=/shop-manager/create-offer");
                                        }
                                    }}
                                    className="shrink-0 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors px-3 py-1.5 rounded-lg cursor-pointer"
                                >
                                    + Add Branch
                                </button>
                            </div>
                        ) : (
                            <MultiSearchableSelect
                                options={branches.map((b) => ({ label: `${b.branch_name} — ${b.city}`, value: String(b.id) }))}
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

                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-sm">
                        <div className="flex justify-between">
                            <span className="opacity-60">Total posters</span>
                            <span className="font-bold">
                                {classifiedPosters.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
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
                            className="rounded-xl"
                            disabled={isPublishing}
                        >
                            Confirm & Publish
                        </PremiumButton>
                    </div>
                </div>
            </AppModal>

            {/* ──── Discard Modal ──── */}
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
        </div>
    );
}
