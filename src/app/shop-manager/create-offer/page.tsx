"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Heading, Subheading, Text } from "@/components/shared/Typography";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { AppModal } from "@/components/shared/AppModal";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
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
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);

    // Publish modal
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [offerTitle, setOfferTitle] = useState("");
    const [classifiedPosters, setClassifiedPosters] = useState<PosterItem[]>([]);

    // Discard modal
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [draftToDiscard, setDraftToDiscard] = useState<string | null>(null);

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

        const markPosters = posters.filter((p) => p.type === "mark_products");

        if (markPosters.length > 0) {
            // Has interactive posters → convert all to data URLs and navigate to editor
            navigateToEditor(posters);
        } else {
            // All just_post → show publish modal
            setOfferTitle("");
            setShowPublishModal(true);
        }
    };

    const navigateToEditor = async (posters: PosterItem[]) => {
        try {
            // Convert all poster files to data URLs
            const posterData = await Promise.all(
                posters.map(
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

            // Save to IndexedDB (asynchronous) for the editor to pick up
            await storage.setItem(
                "currentEditingPosters",
                posterData
            );

            // Also set the first interactive poster as the current editing poster for the existing editor
            const firstInteractive = posterData.find(
                (p) => p.type === "mark_products"
            );
            if (firstInteractive) {
                await storage.setItem(
                    "currentEditingPoster",
                    {
                        posterSrc: firstInteractive.posterSrc,
                        markedItems: [],
                        title: "",
                    }
                );
            }

            // Clean up preview URLs
            posters.forEach((p) => URL.revokeObjectURL(p.previewUrl));

            router.push("/shop-manager/create-offer/editor");
        } catch (err) {
            console.error("Failed to prepare editor data:", err);
            toast.error("Failed to prepare posters. Please try again.");
        }
    };

    // --- Publish (all just_post) ---
    const confirmPublish = async () => {
        if (!offerTitle.trim()) {
            toast.error("Please enter a campaign title");
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
            allPosters.push({
                batchId: crypto.randomUUID(),
                title: offerTitle,
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

                <div className="max-w-6xl mx-auto relative">
                    <Breadcrumbs
                        items={[
                            { label: "Dashboard", href: "/shop-manager" },
                            { label: "New Offer" },
                        ]}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start mt-8">
                        {/* ──── Left: Card Stack ──── */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="space-y-1">
                                <Heading className="text-gradient font-bold tracking-tight">
                                    Create Offer
                                </Heading>
                                <Text className="opacity-50 text-base">
                                    Upload posters, classify them, and publish.
                                </Text>
                            </div>

                            <PremiumCard className="p-4 sm:p-6 overflow-visible">
                                <PosterCardStack
                                    onComplete={handleClassificationComplete}
                                />
                            </PremiumCard>

                            <PremiumButton
                                variant="outline"
                                className="w-full rounded-2xl h-14"
                                onClick={() => router.back()}
                                leftIcon={X}
                            >
                                Cancel & Go Back
                            </PremiumButton>
                        </div>

                        {/* ──── Right: Drafts ──── */}
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
                                                <img
                                                    src={draft.posterSrc}
                                                    alt={draft.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Type className="w-3.5 h-3.5" />
                            Campaign Title
                        </label>
                        <input
                            type="text"
                            value={offerTitle}
                            onChange={(e) => setOfferTitle(e.target.value)}
                            placeholder="e.g. Weekend Mega Sale 2024"
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-lg placeholder:opacity-30"
                            autoFocus
                        />
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
                            onClick={confirmPublish}
                            isLoading={isPublishing}
                            leftIcon={Send}
                            className="rounded-xl"
                            disabled={isPublishing || !offerTitle.trim()}
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
