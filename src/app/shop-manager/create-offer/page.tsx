"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Zap, ArrowRight, X, Image as ImageIcon, Clock, FileEdit, Trash2, LayoutGrid } from "lucide-react";
import { Heading, Subheading, Text } from "@/components/shared/Typography";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { FileUpload } from "@/components/shared/FileUpload";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { AppModal } from "@/components/shared/AppModal";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";

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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [publishMethod, setPublishMethod] = useState<'direct' | 'hotspot' | null>(null);
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [draftToDiscard, setDraftToDiscard] = useState<string | null>(null);
    const [offerTitle, setOfferTitle] = useState("");

    // Load drafts from localStorage
    useEffect(() => {
        const loadDrafts = async () => {
            try {
                const savedDrafts = await storage.getItem<Draft[]>('offerDrafts');
                if (savedDrafts) {
                    setDrafts(savedDrafts);
                }
            } catch (error) {
                console.error("Failed to load drafts:", error);
            }
        };
        loadDrafts();
    }, []);

    const handleResumeDraft = (draft: Draft) => {
        localStorage.setItem('currentEditingPoster', JSON.stringify({
            id: draft.id,
            posterSrc: draft.posterSrc,
            markedItems: draft.markedItems,
            title: draft.title
        }));
        router.push('/shop-manager/create-offer/editor');
    };

    const handleDiscardClick = (id: string) => {
        setDraftToDiscard(id);
        setShowDiscardModal(true);
    };

    const handleConfirmDiscard = async () => {
        if (!draftToDiscard) return;

        try {
            const updatedDrafts = drafts.filter(d => d.id !== draftToDiscard);
            setDrafts(updatedDrafts);
            await storage.setItem('offerDrafts', updatedDrafts);
            toast.success("Draft discarded successfully");
        } catch (error) {
            console.error("Failed to discard draft:", error);
            toast.error("Failed to discard draft");
        } finally {
            setShowDiscardModal(false);
            setDraftToDiscard(null);
        }
    };

    const formatRelativeTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Spacer for Fixed Header */}
            <div className="h-20 lg:h-32" />

            <main className="container mx-auto px-4 py-4 md:py-12 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-6xl mx-auto relative">
                    <Breadcrumbs
                        items={[
                            { label: "Dashboard", href: "/shop-manager" },
                            { label: "New Offer" }
                        ]}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start mt-8">
                        {/* Left Side: Uploader & Control */}
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <Heading className="text-gradient font-bold tracking-tight">Upload Poster</Heading>
                                <Text className="opacity-60 text-base">Select or drag an image to create your offer poster.</Text>
                            </div>

                            <PremiumCard className="p-1 sm:p-2 overflow-visible">
                                <FileUpload
                                    onFileSelect={(file) => {
                                        setSelectedFile(file);
                                        if (!file) setPublishMethod(null);
                                    }}
                                    label=""
                                    className="w-full"
                                    showTitleInput={true}
                                    title={offerTitle}
                                    onTitleChange={setOfferTitle}
                                >
                                    {/* Publication Options inside hover overlay */}
                                    <div className="w-full space-y-4 max-w-md mx-auto">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Zap className="w-4 h-4 text-primary" />
                                            <Text className="text-sm font-bold uppercase tracking-wider text-white">Select Action</Text>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {/* Option 1: Direct Post */}
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!offerTitle.trim()) {
                                                        toast.error("Please enter a campaign title first");
                                                        return;
                                                    }
                                                    setPublishMethod('direct');
                                                    // Simulate navigation to details form
                                                    setTimeout(() => router.push('/shop-manager/create-offer/details'), 400);
                                                }}
                                                className={cn(
                                                    "cursor-pointer p-4 rounded-3xl border-2 transition-all duration-300 flex items-center gap-4 text-left",
                                                    publishMethod === 'direct'
                                                        ? "border-primary bg-primary/20 scale-[1.02] shadow-lg shadow-primary/20"
                                                        : "border-white/20 bg-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                    publishMethod === 'direct' ? "bg-primary text-white" : "bg-white/10 text-white"
                                                )}>
                                                    <ImageIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-white text-sm">Direct Post</h4>
                                                        {publishMethod === 'direct' && <ArrowRight className="w-3 h-3 text-primary animate-pulse" />}
                                                    </div>
                                                    <p className="text-xs text-white/60 leading-tight">Post as it is.</p>
                                                </div>
                                            </div>

                                            {/* Option 2: Mark the Items */}
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!offerTitle.trim()) {
                                                        toast.error("Please enter a campaign title first");
                                                        return;
                                                    }
                                                    setPublishMethod('hotspot');

                                                    // Save image to localStorage for the editor
                                                    if (selectedFile) {
                                                        const reader = new FileReader();
                                                        reader.onload = () => {
                                                            localStorage.setItem('currentEditingPoster', JSON.stringify({
                                                                posterSrc: reader.result as string,
                                                                markedItems: [],
                                                                title: offerTitle
                                                            }));
                                                            router.push('/shop-manager/create-offer/editor');
                                                        };
                                                        reader.readAsDataURL(selectedFile);
                                                    }
                                                }}
                                                className={cn(
                                                    "cursor-pointer p-4 rounded-3xl border-2 transition-all duration-300 flex items-center gap-4 text-left",
                                                    publishMethod === 'hotspot'
                                                        ? "border-primary bg-primary/20 scale-[1.02] shadow-lg shadow-primary/20"
                                                        : "border-white/20 bg-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                    publishMethod === 'hotspot' ? "bg-primary text-white" : "bg-white/10 text-white"
                                                )}>
                                                    <LayoutGrid className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-white text-sm">Mark the Items</h4>
                                                        {publishMethod === 'hotspot' && <ArrowRight className="w-3 h-3 text-primary animate-pulse" />}
                                                    </div>
                                                    <p className="text-xs text-white/60 leading-tight">User can click on each item and see specifically.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </FileUpload>
                            </PremiumCard>

                            <div className="flex gap-4">
                                <PremiumButton
                                    variant="outline"
                                    className="w-full rounded-2xl h-14"
                                    onClick={() => router.back()}
                                    leftIcon={X}
                                >
                                    Cancel & Start Over
                                </PremiumButton>
                            </div>
                        </div>

                        {/* Right Side: Drafted Offers */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-primary" />
                                    </div>
                                    <Subheading className=" whitespace-nowrap">Drafted Posters</Subheading>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-primary/60 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                                    {drafts.length} Drafts
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {drafts.length > 0 ? drafts.map((draft) => (
                                    <div
                                        key={draft.id}
                                        className="group relative flex gap-4 p-4 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
                                    >
                                        {/* Background Glow on Hover */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Image Preview */}
                                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-border/50">
                                            <img
                                                src={draft.posterSrc}
                                                alt={draft.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                                        </div>

                                        {/* Draft Info */}
                                        <div className="flex flex-col justify-between flex-1 relative z-10 py-1">
                                            <div>
                                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{draft.title}</h3>
                                                <div className="flex items-center gap-1.5 mt-1 opacity-50">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="text-xs font-medium">Edited {formatRelativeTime(draft.lastEdited)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleResumeDraft(draft)}
                                                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/70 transition-colors"
                                                >
                                                    <FileEdit className="w-3 h-3" />
                                                    Resume
                                                </button>
                                                <button
                                                    onClick={() => handleDiscardClick(draft.id)}
                                                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-destructive hover:text-destructive/70 transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Discard
                                                </button>
                                            </div>
                                        </div>

                                        {/* Arrow Icon */}
                                        <div className="flex items-center pr-2">
                                            <div
                                                onClick={() => handleResumeDraft(draft)}
                                                className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 translate-x-4 group-hover:translate-x-0 cursor-pointer"
                                            >
                                                <ArrowRight className="w-4 h-4 text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 rounded-3xl border-2 border-dashed border-primary/10 bg-primary/5 flex flex-col items-center justify-center text-center space-y-3 mt-4">
                                        {/* Empty State Suggestion */}
                                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center shadow-sm">
                                            <LayoutGrid className="w-6 h-6 text-primary/40" />
                                        </div>
                                        <div>
                                            <Text className="text-sm font-semibold opacity-60">No drafts found</Text>
                                            {/* <Text className="text-xs opacity-40">Your partially completed posters will automatically appear here.</Text> */}
                                        </div>
                                    </div>
                                )}


                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Spacer */}
            <div className="py-12" />

            {/* Discard Confirmation Modal */}
            <AppModal
                open={showDiscardModal}
                onOpenChange={setShowDiscardModal}
                title="Discard Draft?"
                description="Are you sure you want to discard this draft? This action cannot be undone."
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
                        Discard Draft
                    </PremiumButton>
                </div>
            </AppModal>
        </div>
    );
}
