"use client";

import React, { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import {
    Upload,
    Plus,
    Image as ImageIcon,
    MousePointerClick,
    Check,
    ArrowRight,
    ArrowLeft,
    Eye,
    EyeOff,
    RotateCcw,
    Trash2,
    X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Heading, Subheading, Text } from "@/components/shared/Typography";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { storage } from "@/lib/storage";
import Image from "next/image";
import { s3Api } from "@/lib/api/s3";
import { extractS3Url } from "@/lib/common";
import { processPDFFile, isPDFFile, isImageFile } from "@/lib/pdf-processing";
import { MarkedItem, PosterType } from "@/lib/types";

export interface PosterItem {
    id: string;
    file?: File;
    previewUrl: string;
    type: PosterType;
    markedItems?: MarkedItem[];
    uploadPromise?: Promise<string>;
}

export interface PosterPreviewState {
    posters: PosterItem[];
    index: number;
    isPreparing?: boolean;
    onClose: () => void;
    onEditMarking: (index: number) => void;
    onAddMarking: (index: number) => void;
}

interface PosterCardStackProps {
    onComplete: (posters: PosterItem[]) => void;
    onEditingChange?: (isEditing: boolean) => void;
    onPreviewChange?: (state: PosterPreviewState | null) => void;
    maxSizeMB?: number;
    maxPosters?: number;
    initialFiles?: File[];
    initialPosters?: PosterItem[];
    submitButtonText?: string;
    editorReturnTo?: "create-offer" | "edit-offer";
    editorReturnUrl?: string;
    onSaveDraft?: (posters: PosterItem[]) => void;
    onPhaseChange?: (phase: Phase) => void;
}

type Phase = "upload" | "classify" | "summary";

import { HotspotEditor } from "@/components/shop-manager/HotspotEditor";
import { PosterOrderGrid } from "@/components/shop-manager/PosterOrderGrid";

export const PosterCardStack = forwardRef<
    { handleCancel: () => boolean },
    PosterCardStackProps
>(({
    onComplete,
    onEditingChange,
    onPreviewChange,
    maxSizeMB = 5,
    maxPosters = 15,
    initialFiles,
    initialPosters,
    submitButtonText = "Publish",
    editorReturnTo = "create-offer",
    editorReturnUrl,
    onSaveDraft,
    onPhaseChange,
}, ref) => {
    const [phase, setPhase] = useState<Phase>("upload");
    const [posters, setPosters] = useState<PosterItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [animatingOut, setAnimatingOut] = useState<"left" | "right" | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingMore, setIsAddingMore] = useState(false);
    const [existingPostersCount, setExistingPostersCount] = useState(0);
    const [hasProcessedInitial, setHasProcessedInitial] = useState(false);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);
    const [isPreparingRedirection, setIsPreparingRedirection] = useState(false);
    const [postersBackup, setPostersBackup] = useState<PosterItem[] | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useImperativeHandle(ref, () => ({
        handleCancel: () => {
            if (postersBackup !== null) {
                setPosters(postersBackup);
                setPostersBackup(null);
                setPhase("summary");
                return true;
            }
            if (existingPostersCount > 0) {
                setPosters((prev) => prev.slice(0, existingPostersCount));
                setExistingPostersCount(0);
                setPhase("summary");
                setIsAddingMore(false);
                return true;
            }
            return false;
        }
    }));

    // Persistence Effect: Save posters to storage whenever they change in summary phase
    useEffect(() => {
        if (phase === "summary" && posters.length > 0) {
            // Remove Promises before persisting to IndexedDB
            const sanitized = posters.map(({ uploadPromise, ...rest }) => rest);
            storage.setItem("poster_stack_resume", sanitized).catch((err: any) => {
                console.error("Failed to persist poster stack:", err);
            });
        }
    }, [posters, phase]);

    // Resume Effect: Load from storage if resume=true (only for create-offer flow, not edit-offer)
    // When initialPosters are provided by the parent, the parent is the source of truth.
    useEffect(() => {
        const resume = searchParams.get("resume") === "true";
        if (resume && !hasProcessedInitial && !(initialPosters && initialPosters.length > 0)) {
            setHasProcessedInitial(true);
            storage.getItem<PosterItem[]>("poster_stack_resume").then((savedPosters: PosterItem[] | null) => {
                if (savedPosters && savedPosters.length > 0) {
                    // Regenerate previewUrls because blob URLs are session-specific
                    const restored = savedPosters.map((p: PosterItem) => ({
                        ...p,
                        previewUrl: p.file ? URL.createObjectURL(p.file) : p.previewUrl
                    }));
                    setPosters(restored);
                    setPhase("summary");

                    // Handle reopening preview if previewIndex is in URL
                    const pIdx = searchParams.get("previewIndex");
                    if (pIdx !== null) {
                        setPreviewIndex(parseInt(pIdx, 10));
                    }
                }
            });
        }
    }, [searchParams, hasProcessedInitial]);

    // Handle initialPosters from prop
    useEffect(() => {
        if (initialPosters && initialPosters.length > 0 && !hasProcessedInitial) {
            setHasProcessedInitial(true);
            setPosters(initialPosters);
            const allAlreadyClassified = initialPosters.every(p => p.type !== "unclassified");
            setPhase(allAlreadyClassified ? "summary" : "classify");
        }
    }, [initialPosters, hasProcessedInitial]);

    // Preview Re-opening Effect: Trigger onPreviewChange when previewIndex is set (e.g. from URL on resume)
    useEffect(() => {
        if (previewIndex !== null && posters.length > 0 && posters[previewIndex]) {
            onPreviewChange?.({
                posters,
                index: previewIndex,
                onClose: () => {
                    setPreviewIndex(null);
                    onPreviewChange?.(null);
                },
                onEditMarking: handlePreviewEditMarking,
                onAddMarking: handlePreviewAddMarking,
                isPreparing: isPreparingRedirection,
            });
        }
    }, [previewIndex, posters, onPreviewChange, isPreparingRedirection]);

    // Auto-close preview panel when leaving the summary phase
    useEffect(() => {
        if (phase !== "summary") {
            setPreviewIndex(null);
            onPreviewChange?.(null);
        }
    }, [phase, onPreviewChange]);

    // Clear posters backup and reset existingPostersCount when entering the summary phase
    useEffect(() => {
        if (phase === "summary") {
            setPostersBackup(null);
            setExistingPostersCount(0);
        }
    }, [phase]);

    // Notify parent when phase changes
    useEffect(() => {
        onPhaseChange?.(phase);
    }, [phase, onPhaseChange]);

    // Prevent accidental page reloads if user has uploaded posters
    useEffect(() => {
        if (posters.length === 0) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [posters.length]);

    // Note: We avoid cleaning up PDF object URLs on unmount here because
    // we need them to persist across navigation to the editor page.
    // They will be cleaned up when the browser session ends or if explicitly handled.
    // useEffect(() => {
    //     return () => { cleanupPDFObjectUrls(); };
    // }, []);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const unclassifiedPosters = posters.filter((p) => p.type === "unclassified");
    const justPostPosters = posters.filter((p) => p.type === "just_post");
    const markPosters = posters.filter((p) => p.type === "marked_poster");
    const allClassified = posters.length > 0 && posters.every(p => p.type !== "unclassified");

    const processFiles = useCallback(
        async (files: FileList | File[]) => {
            const fileArray = Array.from(files);
            const newPosters: PosterItem[] = [];

            const remainingSlots = maxPosters - posters.length;
            const filesToProcess = fileArray.slice(0, remainingSlots);

            for (const file of filesToProcess) {
                if (isPDFFile(file)) {
                    toast.info(`Processing PDF: ${file.name}...`);
                    const result = await processPDFFile(file, maxSizeMB);

                    if (!result.success) {
                        toast.error(result.error || 'Failed to process PDF');
                        continue;
                    }

                    for (const img of result.images) {
                        if (newPosters.length >= remainingSlots) break;

                        newPosters.push({
                            id: crypto.randomUUID(),
                            file: img.file,
                            previewUrl: img.previewUrl,
                            type: "unclassified",
                        });
                    }

                    if (result.images.length > 0) {
                        toast.success(`Extracted ${result.images.length} page(s) from PDF`);
                    }
                    continue;
                }

                if (!isImageFile(file)) {
                    toast.error(`"${file.name}" is not a supported file type`);
                    continue;
                }
                if (file.size > maxSizeMB * 1024 * 1024) {
                    toast.error(`"${file.name}" exceeds ${maxSizeMB}MB`);
                    continue;
                }
                newPosters.push({
                    id: crypto.randomUUID(),
                    file,
                    previewUrl: URL.createObjectURL(file),
                    type: "unclassified",
                });
            }

            if (newPosters.length > 0) {
                if (isAddingMore) {
                    const currentPostersCount = posters.length;
                    setPosters((prev) => [...prev, ...newPosters]);
                    setCurrentIndex(currentPostersCount);
                    setExistingPostersCount(currentPostersCount);
                    setIsAddingMore(false);
                } else {
                    setPosters(newPosters);
                    setCurrentIndex(0);
                    setExistingPostersCount(0);
                }
                setPhase("classify");
            }
        },
        [maxSizeMB, maxPosters, isAddingMore, posters.length]
    );

    useEffect(() => {
        if (initialFiles && initialFiles.length > 0 && !hasProcessedInitial) {
            setHasProcessedInitial(true);
            processFiles(initialFiles);
        }
    }, [initialFiles, hasProcessedInitial, processFiles]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) processFiles(e.target.files);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
    };

    const classifyCurrentCard = (type: typeof PosterType.JUST_POST | typeof PosterType.MARKED_POSTER) => {
        if (animatingOut || isViewing) return;

        // Start background upload immediately if not already started
        const currentPoster = posters[currentIndex];
        let newUploadPromise = currentPoster.uploadPromise;

        if (!newUploadPromise && currentPoster.file) {
            newUploadPromise = s3Api.uploadImage(currentPoster.file).then((res) => {
                const uploadedUrl = extractS3Url(res);
                if (res.success && uploadedUrl) {
                    return uploadedUrl;
                }
                console.error("S3 Upload Invalid Payload:", res);
                throw new Error(res.message || "Failed to upload to S3 (Missing URL in response)");
            }).catch(err => {
                console.error("S3 Upload Background Error:", err);
                toast.error(`Failed to upload ${currentPoster.file?.name || 'file'}`);
                throw err;
            });
        }

        if (type === "marked_poster") {
            setPosters((prev) => prev.map((p, i) => i === currentIndex ? { ...p, uploadPromise: newUploadPromise } : p));
            setIsEditing(true);
            onEditingChange?.(true);
            return;
        }

        const direction = "left";
        setAnimatingOut(direction);

        setTimeout(() => {
            setPosters((prev) => {
                const updated: PosterItem[] = prev.map((p, i) => {
                    if (i !== currentIndex) return p as PosterItem;
                    // If user switches to just_post, clear any previous markings.
                    if (type === "just_post") {
                        return { ...p, type, markedItems: [], uploadPromise: newUploadPromise } as PosterItem;
                    }
                    return { ...p, type, uploadPromise: newUploadPromise } as PosterItem;
                });
                const nextUnclassified = updated.findIndex((p) => p.type === "unclassified");
                if (nextUnclassified === -1) {
                    setPhase("summary");
                } else {
                    setCurrentIndex(nextUnclassified);
                }
                return updated;
            });
            setAnimatingOut(null);
        }, 400);
    };

    const handleEditorSave = (markedItems: any[]) => {
        setPosters((prev) => {
            const updated: PosterItem[] = prev.map((p, i) => (i === currentIndex ? { ...p, type: "marked_poster", markedItems } : p) as PosterItem);
            const nextUnclassified = updated.findIndex((p) => p.type === "unclassified");
            if (nextUnclassified === -1) {
                setPhase("summary");
            } else {
                setCurrentIndex(nextUnclassified);
            }
            return updated;
        });
        setIsEditing(false);
        setPreviewIndex(null);
        onEditingChange?.(false);
    };

    const handleEditorCancel = () => {
        setIsEditing(false);
        setPreviewIndex(null);
        onEditingChange?.(false);
        setPosters((prev) => {
            const nextUnclassified = prev.findIndex((p) => p.type === "unclassified");
            if (nextUnclassified === -1) {
                setPhase("summary");
            } else {
                setCurrentIndex(nextUnclassified);
            }
            return prev;
        });
    };

    const handleReclassify = () => {
        setPostersBackup(posters);
        setPosters((prev) => prev.map((p) => ({ ...p, type: "unclassified" as const })));
        setCurrentIndex(0);
        setPhase("classify");
        setExistingPostersCount(0);
    };

    const handleContinueToSummary = () => {
        const hasUnclassified = posters.some((p) => p.type === "unclassified");
        if (hasUnclassified) {
            toast.warning("Please classify all posters (as Just Post or Mark Poster) before continuing.");
            return;
        }
        setPhase("summary");
    };

    const handleRemovePoster = (index: number) => {
        if (posters.length === 1) {
            setPosters([]);
            setPhase("upload");
            setCurrentIndex(0);
            setExistingPostersCount(0);
            setPostersBackup(null);
            toast.success("Poster removed");
            return;
        }

        const updated = posters.filter((_, i) => i !== index);
        setPosters(updated);

        if (existingPostersCount > 0) {
            if (index < existingPostersCount) {
                setExistingPostersCount(prev => Math.max(0, prev - 1));
            }
        }

        if (currentIndex >= updated.length) {
            setCurrentIndex(updated.length - 1);
        } else if (currentIndex === index) {
            setCurrentIndex(Math.min(currentIndex, updated.length - 1));
        } else if (currentIndex > index) {
            setCurrentIndex(currentIndex - 1);
        }

        toast.success("Poster removed");
    };

    const handleNext = () => {
        const classified = posters.map((p) => {
            const type = p.type === "unclassified" ? ("just_post" as const) : p.type;
            return {
                ...p,
                type,
                // Ensure markings are never carried when poster is not marked_poster.
                markedItems: type === "marked_poster" ? (p.markedItems || []) : [],
            };
        });
        onComplete(classified);
    };

    const handlePreviewEditMarking = async (index: number, postersOverride?: PosterItem[]) => {
        const currentPosters = postersOverride || posters;
        const poster = currentPosters[index];
        if (!poster) return;

        setIsPreparingRedirection(true);

        // Ensure poster is uploaded or has a promise before editing
        let uploadPromise = poster.uploadPromise;
        if (!uploadPromise && poster.file) {
            uploadPromise = s3Api.uploadImage(poster.file).then((res) => {
                const uploadedUrl = extractS3Url(res);
                if (res.success && uploadedUrl) return uploadedUrl;
                throw new Error(res.message || "Upload failed");
            }).catch(err => {
                setIsPreparingRedirection(false);
                toast.error(`Failed to upload ${poster.file?.name || 'file'}`);
                throw err;
            });

            // Update local state temporarily so it's persisted below
            poster.uploadPromise = uploadPromise;
        }

        try {
            // Persist the entire stack so we can resume later (Sanitize to remove Promises)
            const sanitized = currentPosters.map(({ uploadPromise, ...rest }) => rest);
            await storage.setItem("poster_stack_resume", sanitized);
            await storage.setItem("current_editing_index", index);

            // SYNC with what the editor expects (both plural and singular)
            const editorFormatted = currentPosters.map((p) => ({
                id: p.id,
                posterSrc: p.previewUrl,
                file: p.file,
                markedItems: p.type === "marked_poster" ? (p.markedItems || []) : [],
                type: p.type === "marked_poster" ? "mark_products" : "promotion_only",
                title: (p as any).title || ""
            }));
            await storage.setItem("currentEditingPosters", editorFormatted);
            await storage.setItem("currentEditingPoster", editorFormatted[index]);
            if (editorReturnTo === "edit-offer" && editorReturnUrl) {
                await storage.setItem("edit_offer_return", editorReturnUrl);
            }

            const editorUrl = editorReturnTo === "edit-offer"
                ? `/shop-manager/create-offer/editor?from=preview&index=${index}&returnTo=edit-offer`
                : `/shop-manager/create-offer/editor?from=preview&index=${index}`;

            router.push(editorUrl);
            // We don't set setIsPreparingRedirection(false) here because the navigation 
            // will unmount this component anyway, and we want to keep the loading state
            // visible until the new page takes over.
        } catch (err) {
            setIsPreparingRedirection(false);
            console.error("Failed to prepare for redirection:", err);
            toast.error("Failed to open editor");
        }
    };

    const handlePreviewAddMarking = (index: number) => {
        const updated = posters.map((p, i) => i === index ? { ...p, markedItems: [] as MarkedItem[], type: "marked_poster" as const } : p);
        setPosters(updated);
        handlePreviewEditMarking(index, updated);
    };


    const hiddenInput = (
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf"
            multiple
            className="hidden"
        />
    );

    if (phase === "upload") {
        return (
            <>
                {hiddenInput}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        "relative flex flex-col items-center justify-center cursor-pointer transition-colors duration-200",
                        "min-h-[300px] sm:min-h-[360px] rounded-xl py-8 px-6 sm:py-10 sm:px-8",
                        "border border-border bg-card shadow-sm",
                        isDragging
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "hover:border-primary/40 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                    )}
                >
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200 mb-4",
                        isDragging ? "bg-primary text-white" : "bg-primary/10 text-primary"
                    )}>
                        <Upload className="w-8 h-8" />
                    </div>

                    <Text className="font-semibold text-lg mb-1 text-center text-foreground">
                        {isDragging ? "Drop your files here" : "Upload Offer Posters"}
                    </Text>
                    <Text className="text-muted-foreground text-sm mb-6 max-w-xs text-center">
                        Drag and drop your images or PDF here
                    </Text>

                    <div className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors">
                        Select Files
                    </div>

                    <Text className="text-xs text-muted-foreground mt-6 px-4 text-center">
                        PDF, JPG, PNG, WEBP (Max {maxSizeMB}MB each, Up to {maxPosters} posters)
                    </Text>
                </div>
            </>
        );
    }

    if (phase === "classify") {
        const currentPoster = posters[currentIndex];
        const remaining = posters.length - currentIndex;

        const progress = (currentIndex / posters.length) * 100;

        const behindCards = posters.slice(currentIndex + 1, currentIndex + 4);

        if (isEditing && currentPoster) {
            return (
                <HotspotEditor
                    poster={{
                        id: currentPoster.id,
                        posterSrc: currentPoster.previewUrl,
                        markedItems: currentPoster.markedItems || [],
                    }}
                    onSave={handleEditorSave}
                    onCancel={handleEditorCancel}
                />
            );
        }

        return (
            <div className="flex flex-col items-center gap-5">
                {hiddenInput}

                {/* Progress */}
                <div className="w-full max-w-md">
                    <div className="flex items-center justify-between mb-2">
                        <Text className="text-xs font-bold uppercase tracking-wider opacity-50">
                            {existingPostersCount > 0
                                ? `Adding More (${posters.length - existingPostersCount} new)`
                                : "Classifying Posters"}
                        </Text>
                        <Text className="text-xs font-bold text-primary">
                            {`${currentIndex + 1} of ${posters.length}`}
                        </Text>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full gradient-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Card Stack — visible stacked cards behind */}
                <div
                    className="relative w-full max-w-sm mx-auto"
                // style={{ paddingBottom: `${Math.min(behindCards.length, 3) * 14 + 8}px` }}
                >
                    {behindCards.map((poster, i) => {
                        const offset = (i + 1) * 14;
                        const scaleVal = 1 - (i + 1) * 0.03;
                        return (
                            <div
                                key={poster.id}
                                className="absolute rounded-xl overflow-hidden border border-border/40 bg-card shadow-md"
                                style={{
                                    top: `${offset}px`,
                                    left: `${(i + 1) * 4}px`,
                                    right: `${(i + 1) * 4}px`,
                                    bottom: `${-offset + (behindCards.length * 14 + 8)}px`,
                                    zIndex: 10 - (i + 1),
                                    transform: `scale(${scaleVal})`,
                                    transformOrigin: "top center",
                                }}
                            >
                                <Image
                                    src={poster.previewUrl}
                                    alt=""
                                    fill
                                    unoptimized
                                    className="object-cover"
                                    style={{
                                        opacity: 0.5 - i * 0.15,
                                        filter: `blur(${(i + 1) * 1}px)`,
                                    }}
                                />
                            </div>
                        );
                    })}

                    {/* Active (front) card with overlay buttons */}
                    {currentPoster && (
                        <div
                            className={cn(
                                "relative rounded-xl overflow-hidden border-2 border-primary/30 bg-card shadow-2xl",
                                animatingOut === "left" && "animate-slide-out-left",
                                animatingOut === "right" && "animate-slide-out-right",
                                !animatingOut && "animate-in zoom-in-95 duration-300"
                            )}
                            style={{ zIndex: 20, minHeight: "340px" }}
                        >
                            <Image
                                src={currentPoster.previewUrl}
                                alt="Poster to classify"
                                width={800}
                                height={800}
                                unoptimized
                                className="w-full h-auto block object-contain"
                            />

                            {/* Hotspot Overlays on Big Card */}
                            {currentPoster.markedItems && currentPoster.markedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="absolute border-[1.5px] border-red-500 bg-red-500/10 pointer-events-none z-20 shadow-sm"
                                    style={{
                                        left: `${item.x * 100}%`,
                                        top: `${item.y * 100}%`,
                                        width: `${item.width * 100}%`,
                                        height: `${item.height * 100}%`
                                    }}
                                />
                            ))}

                            {!isViewing && (
                                <div className="absolute inset-0 flex flex-col justify-end">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

                                    <div className="relative z-10 p-4 flex items-center gap-3">
                                        <button
                                            onClick={() => classifyCurrentCard("just_post")}
                                            disabled={!!animatingOut}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 hover:bg-white/25 transition-all duration-200 active:scale-95 cursor-pointer group"
                                        >
                                            <ImageIcon className="w-4 h-4 text-white/90" />
                                            <div className="text-left">
                                                <span className="text-xs font-bold text-white block">Just Post</span>
                                                <span className="text-[9px] text-white/50 block leading-tight">Publish as-is</span>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => classifyCurrentCard("marked_poster")}
                                            disabled={!!animatingOut}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-2xl bg-primary/30 backdrop-blur-xl border border-primary/40 hover:bg-primary/40 transition-all duration-200 active:scale-95 cursor-pointer group shadow-lg shadow-primary/20"
                                        >
                                            <MousePointerClick className="w-4 h-4 text-white" />
                                            <div className="text-left">
                                                <span className="text-xs font-bold text-white block">Mark Poster</span>
                                                <span className="text-[9px] text-white/50 block leading-tight">Tag items</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="absolute top-0 left-0 right-0 py-2 px-1 flex items-center justify-between z-30">
                                <div className="flex items-center gap-2">
                                    {(existingPostersCount > 0 || postersBackup !== null) && (
                                        <button
                                            onClick={() => {
                                                if (postersBackup !== null) {
                                                    setPosters(postersBackup);
                                                    setPostersBackup(null);
                                                    setPhase("summary");
                                                } else {
                                                    setPosters((prev) => prev.slice(0, existingPostersCount));
                                                    setExistingPostersCount(0);
                                                    setPhase("summary");
                                                    setIsAddingMore(false);
                                                }
                                            }}
                                            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/70 transition-colors"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsViewing(!isViewing)}
                                        className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/70 transition-colors"
                                    >
                                        {isViewing ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleRemovePoster(currentIndex)}
                                        className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-rose-600/90 backdrop-blur-md flex items-center justify-center text-white border border-rose-500/20 hover:bg-rose-600 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Thumbnail Strip for navigation during classification */}
                <div className="w-full max-w-md sm:max-w-xl border-t border-border/30 pt-0 flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 overflow-x-auto py-4 px-2 scrollbar-hide">
                        {posters.map((poster, idx) => {
                            const isDone = poster.type !== "unclassified";
                            const isCurrent = idx === currentIndex;

                            return (
                                <button
                                    key={poster.id}
                                    onClick={() => {
                                        if (animatingOut || isViewing) return;
                                        setCurrentIndex(idx);
                                    }}
                                    className={cn(
                                        "relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-visible transition-all duration-300 shrink-0 group p-0",
                                        isCurrent
                                            ? "border border-orange-500 scale-105 z-10 shadow-lg"
                                            : "opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                                        <Image
                                            src={poster.previewUrl}
                                            alt={`Poster ${idx + 1}`}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />

                                        {/* Hotspot Overlays */}
                                        {poster.markedItems && poster.markedItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="absolute border-[1px] border-red-500 bg-red-500/12 pointer-events-none z-10"
                                                style={{
                                                    left: `${item.x * 100}%`,
                                                    top: `${item.y * 100}%`,
                                                    width: `${item.width * 100}%`,
                                                    height: `${item.height * 100}%`
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* Status Badge */}
                                    <div className={cn(
                                        "absolute -bottom-2 left-1 right-1 text-[8px] font-black  text-center py-0.5 rounded-lg backdrop-blur-md shadow-lg border border-white/20 z-20",
                                        poster.type === "marked_poster"
                                            ? "bg-primary text-white"
                                            : poster.type === "just_post"
                                                ? "bg-zinc-800 text-white"
                                                : "bg-white/90 text-zinc-500"
                                    )}>
                                        {poster.type === "marked_poster" ? "Marked" : poster.type === "just_post" ? "Just Post" : "Todo"}
                                    </div>

                                    {/* Done checkmark icon */}
                                    {isDone && !isCurrent && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center border-2 border-background shadow-md z-30 scale-110">
                                            <Check className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    )}

                                    {/* Delete Button */}
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemovePoster(idx);
                                        }}
                                        className="absolute -top-1 -left-0 w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center border border-white/20 shadow-md z-30 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer scale-110"
                                    >
                                        <X className="w-2.5 h-2.5 text-white" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {posters.length < maxPosters && (
                        <button
                            onClick={() => {
                                setIsAddingMore(true);
                                setTimeout(() => {
                                    fileInputRef.current?.click();
                                }, 50);
                            }}
                            className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl border border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all duration-300 shrink-0 flex flex-col items-center justify-center gap-1 group cursor-pointer"
                        >
                            <Plus className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-bold text-primary">Add Poster</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full max-w-sm pt-2 min-w-0">
                    <PremiumButton
                        variant="outline"
                        onClick={() => {
                            if (postersBackup !== null) {
                                setPosters(postersBackup);
                                setPostersBackup(null);
                                setPhase("summary");
                            } else if (existingPostersCount > 0) {
                                setPosters((prev) => prev.slice(0, existingPostersCount));
                                setExistingPostersCount(0);
                                setPhase("summary");
                                setIsAddingMore(false);
                            } else {
                                router.back();
                            }
                        }}
                        leftIcon={ArrowLeft}
                        className="rounded-2xl flex-1 h-12 text-xs sm:text-sm border-primary/20 text-primary hover:bg-primary/5 min-w-0 px-2.5 sm:px-4 shrink"
                    >
                        <span>Go Back</span>
                    </PremiumButton>
                    <PremiumButton
                        onClick={handleContinueToSummary}
                        rightIcon={ArrowRight}
                        className="rounded-2xl flex-[1.2] h-12 text-xs sm:text-sm font-bold shadow-xl shadow-primary/20 group min-w-0 px-2.5 sm:px-4 shrink"
                    >
                        <span>Continue</span>
                    </PremiumButton>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-1 py-2">
            {/* Success header */}
            <div className="flex flex-col items-center gap-2 text-center">
                {/* <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 animate-in zoom-in duration-500">
                    <Check className="w-6 h-6 text-white" />
                </div> */}
                <Subheading className="text-gradient">
                    {posters.length} Poster{posters.length !== 1 ? 's' : ''} Ready!
                </Subheading>
                <p className="opacity-50 text-sm max-w-xs">
                    Review the summary below, or add more posters.
                </p>
            </div>

            {/* Summary cards */}
            <div className="flex flex-wrap items-center gap-3 justify-center w-full max-w-sm">
                {markPosters.length > 0 && (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-2xl bg-primary/5 border border-primary/20">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <MousePointerClick className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex items-baseline gap-1.5 text-primary">
                            <span className="text-sm font-black">{markPosters.length}</span>
                            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest whitespace-nowrap">Marked</span>
                        </div>
                    </div>
                )}

                {justPostPosters.length > 0 && (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-2xl bg-primary/5 border border-primary/20">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex items-baseline gap-1.5 text-primary">
                            <span className="text-sm font-black">{justPostPosters.length}</span>
                            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest whitespace-nowrap">Just Post</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Reorderable Poster List */}
            <PosterOrderGrid
                posters={posters}
                onReorder={setPosters}
                previewIndex={previewIndex}
                onPreviewSelect={setPreviewIndex}
                onPreviewClose={() => setPreviewIndex(null)}
                onEditMarking={handlePreviewEditMarking}
                onAddMarking={handlePreviewAddMarking}
                onPreviewChange={onPreviewChange}
            />

            {posters.length >= maxPosters && (
                <Text className="text-[10px] opacity-40">Maximum {maxPosters} posters reached</Text>
            )}

            <div className="flex flex-col w-full max-w-sm gap-3 mt-4">
                <div className="flex items-center gap-2 w-full min-w-0">
                    <PremiumButton
                        variant="outline"
                        onClick={handleReclassify}
                        leftIcon={RotateCcw}
                        className="rounded-xl flex-1 h-10 text-xs sm:text-sm border-primary/20 text-primary hover:bg-primary/5 min-w-0 px-2.5 sm:px-3.5 shrink"
                    >
                        <span>Re-classify</span>
                    </PremiumButton>
                    <PremiumButton
                        onClick={handleNext}
                        rightIcon={ArrowRight}
                        className="rounded-xl flex-[1.5] h-10 text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 min-w-0 px-2.5 sm:px-3.5 shrink"
                    >
                        <span>{submitButtonText}</span>
                    </PremiumButton>
                </div>

                {onSaveDraft && (
                    <PremiumButton
                        onClick={() => {
                            const classified = posters.map((p) => {
                                const type = p.type === "unclassified" ? ("just_post" as const) : p.type;
                                return {
                                    ...p,
                                    type,
                                    markedItems: type === "marked_poster" ? (p.markedItems || []) : [],
                                };
                            });
                            onSaveDraft(classified);
                        }}
                        className="rounded-xl w-full h-10 text-sm bg-none bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-600/20 border-0"
                    >
                        Save Draft
                    </PremiumButton>
                )}
            </div>
        </div>
    );
});

PosterCardStack.displayName = "PosterCardStack";

