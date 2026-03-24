"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
    Upload,
    Plus,
    Image as ImageIcon,
    MousePointerClick,
    Check,
    ArrowRight,
    ArrowLeft,
    RotateCcw,
    Sparkles,
    Eye,
    EyeOff,
    FileText,
} from "lucide-react";
import { Heading, Subheading, Text } from "@/components/shared/Typography";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import { s3Api } from "@/lib/api/s3";
import { processPDFFile, isPDFFile, isImageFile, cleanupPDFObjectUrls } from "@/lib/pdf-processing";
import { MarkedItem } from "@/lib/types/offer";

export interface PosterItem {
    id: string;
    file: File;
    previewUrl: string;
    type: "just_post" | "marked_poster" | "unclassified";
    markedItems?: MarkedItem[];
    uploadPromise?: Promise<string>;
}

interface PosterCardStackProps {
    onComplete: (posters: PosterItem[]) => void;
    onEditingChange?: (isEditing: boolean) => void;
    maxSizeMB?: number;
    maxPosters?: number;
    initialFiles?: File[];
    submitButtonText?: string;
}

type Phase = "upload" | "classify" | "summary";

import { HotspotEditor } from "@/components/shop-manager/HotspotEditor";
import { createPortal } from "react-dom";

export const PosterCardStack = ({
    onComplete,
    onEditingChange,
    maxSizeMB = 5,
    maxPosters = 10,
    initialFiles,
    submitButtonText = "Publish",
}: PosterCardStackProps) => {
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

    useEffect(() => {
        return () => { cleanupPDFObjectUrls(); };
    }, []);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const unclassifiedPosters = posters.filter((p) => p.type === "unclassified");
    const justPostPosters = posters.filter((p) => p.type === "just_post");
    const markPosters = posters.filter((p) => p.type === "marked_poster");

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

    const classifyCurrentCard = (type: "just_post" | "marked_poster") => {
        if (animatingOut || isViewing) return;

        // Start background upload immediately if not already started
        const currentPoster = posters[currentIndex];
        let newUploadPromise = currentPoster.uploadPromise;
        if (!newUploadPromise) {
            newUploadPromise = s3Api.uploadImage(currentPoster.file).then((res) => {
                const payload = (res.data as any)?.data || res.data;
                const uploadedUrl = payload?.url || payload?.fileUrl || payload?.imageUrl || (res.data as any)?.imageUrl || (typeof payload === 'string' ? payload : null);
                if (res.success && uploadedUrl) {
                    return uploadedUrl;
                }
                console.error("S3 Upload Invalid Payload:", res);
                throw new Error(res.message || "Failed to upload to S3 (Missing URL in response)");
            }).catch(err => {
                console.error("S3 Upload Background Error:", err);
                toast.error(`Failed to upload ${currentPoster.file.name}`);
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
                const updated: PosterItem[] = prev.map((p, i) => (i === currentIndex ? { ...p, type, uploadPromise: newUploadPromise } : p) as PosterItem);
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
        onEditingChange?.(false);
    };

    const handleEditorCancel = () => {
        setIsEditing(false);
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
        setPosters((prev) => prev.map((p) => ({ ...p, type: "unclassified" as const })));
        setCurrentIndex(0);
        setPhase("classify");
        setIsAddingMore(false);
        setExistingPostersCount(0);
    };

    const handleAddMore = () => {
        setIsAddingMore(true);
        setPhase("upload");
    };

    const handleNext = () => {
        const classified = posters.map((p) => ({
            ...p,
            type: p.type === "unclassified" ? ("just_post" as const) : p.type,
        }));
        onComplete(classified);
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
                        "relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                        "min-h-[360px] rounded-3xl overflow-hidden",
                        "border-2 border-dashed",
                        isDragging
                            ? "border-primary bg-primary/10 scale-[1.01] shadow-glow"
                            : "border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40"
                    )}
                >
                    <div className={cn(
                        "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 mb-5",
                        isDragging ? "bg-primary text-white rotate-12 scale-110" : "bg-primary/10 text-primary"
                    )}>
                        {isDragging ? <Upload className="w-10 h-10 animate-bounce" /> : <Plus className="w-10 h-10" />}
                    </div>

                    <Text className="font-bold text-xl mb-1">
                        {isDragging ? "Drop your files here" : "Upload Offer Posters"}
                    </Text>
                    <Text className="opacity-50 text-sm max-w-xs text-center">
                        Drag & drop
                    </Text>
                    <Text className="text-sm opacity-50 mb-5 max-w-xs text-center">
                        Drop images or PDF
                    </Text>

                    <div className="px-6 py-3 rounded-2xl gradient-primary text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
                        Select Files
                    </div>

                    <Text className="text-xs opacity-30 mt-4">
                        PDF, JPG, PNG, WEBP — Max {maxSizeMB}MB each — Up to {maxPosters} posters
                    </Text>
                </div>
            </>
        );
    }

    if (phase === "classify") {
        const currentPoster = posters[currentIndex];
        const remaining = posters.length - currentIndex;

        const newPostersStartIndex = existingPostersCount;
        const newPostersCount = posters.length - newPostersStartIndex;
        const newPostersCurrentIndex = currentIndex - newPostersStartIndex;
        const progress = newPostersCount > 0
            ? (newPostersCurrentIndex / newPostersCount) * 100
            : ((currentIndex) / posters.length) * 100;

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
            <div className="flex flex-col items-center gap-6">
                {hiddenInput}

                {/* Progress */}
                <div className="w-full max-w-md">
                    <div className="flex items-center justify-between mb-2">
                        <Text className="text-xs font-bold uppercase tracking-wider opacity-50">
                            {existingPostersCount > 0 ? `Adding More (${newPostersCount} new)` : "Classifying Posters"}
                        </Text>
                        <Text className="text-xs font-bold text-primary">
                            {newPostersCount > 0 ? `${newPostersCurrentIndex + 1} of ${newPostersCount}` : `${currentIndex + 1} of ${posters.length}`}
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
                    style={{ paddingBottom: `${Math.min(behindCards.length, 3) * 14 + 8}px` }}
                >
                    {behindCards.map((poster, i) => {
                        const offset = (i + 1) * 14;
                        const scaleVal = 1 - (i + 1) * 0.03;
                        return (
                            <div
                                key={poster.id}
                                className="absolute rounded-3xl overflow-hidden border border-border/40 bg-card shadow-md"
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
                                "relative rounded-3xl overflow-hidden border-2 border-primary/30 bg-card shadow-2xl",
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

                            {!isViewing && (
                                <div className="absolute inset-0 flex flex-col justify-end">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

                                    <div className="relative z-10 p-5 flex items-center gap-3">
                                        <button
                                            onClick={() => classifyCurrentCard("just_post")}
                                            disabled={!!animatingOut}
                                            className="flex-1 flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 hover:bg-white/25 transition-all duration-200 active:scale-95 cursor-pointer group"
                                        >
                                            <ImageIcon className="w-5 h-5 text-white/90" />
                                            <div className="text-left">
                                                <span className="text-sm font-bold text-white block">Just Post</span>
                                                <span className="text-[10px] text-white/50 block leading-tight">Publish as-is</span>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => classifyCurrentCard("marked_poster")}
                                            disabled={!!animatingOut}
                                            className="flex-1 flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl bg-primary/30 backdrop-blur-xl border border-primary/40 hover:bg-primary/40 transition-all duration-200 active:scale-95 cursor-pointer group shadow-lg shadow-primary/20"
                                        >
                                            <MousePointerClick className="w-5 h-5 text-white" />
                                            <div className="text-left">
                                                <span className="text-sm font-bold text-white block">Mark Poster</span>
                                                <span className="text-[10px] text-white/50 block leading-tight">Tag items</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-30">
                                <div className="flex items-center gap-2">
                                    {existingPostersCount > 0 ? (
                                        <button
                                            onClick={() => {
                                                setPhase("summary");
                                                setExistingPostersCount(0);
                                            }}
                                            className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/70 transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        currentIndex > 0 && (
                                            <button
                                                onClick={() => {
                                                    if (animatingOut || isViewing) return;
                                                    setCurrentIndex(currentIndex - 1);
                                                    setPosters((prev) =>
                                                        prev.map((p, i) => (i === currentIndex - 1 ? { ...p, type: "unclassified" } : p))
                                                    );
                                                }}
                                                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/70 transition-colors"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                        )
                                    )}
                                    <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-bold border border-white/10">
                                        {remaining} left
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsViewing(!isViewing)}
                                    className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/70 transition-colors"
                                >
                                    {isViewing ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            {/* Success header */}
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-in zoom-in duration-500">
                    <Check className="w-8 h-8 text-white" />
                </div>
                <Heading className="text-gradient text-2xl">
                    {posters.length} Poster{posters.length !== 1 ? 's' : ''} Ready!
                </Heading>
                <Text className="opacity-50 text-sm max-w-xs">
                    Review the summary below, or add more posters.
                </Text>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {justPostPosters.length > 0 && (
                    <PremiumCard className="p-4 text-center">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-2">
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <Text className="text-2xl font-bold">{justPostPosters.length}</Text>
                        <Text className="text-xs font-semibold opacity-50 uppercase tracking-wider">Just Post</Text>
                    </PremiumCard>
                )}
                {markPosters.length > 0 && (
                    <PremiumCard className="p-4 text-center border-primary/30">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <MousePointerClick className="w-5 h-5 text-primary" />
                        </div>
                        <Text className="text-2xl font-bold text-primary">{markPosters.length}</Text>
                        <Text className="text-xs font-semibold opacity-50 uppercase tracking-wider">Mark Products</Text>
                    </PremiumCard>
                )}
            </div>

            {/* Thumbnail preview strip */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
                {posters.map((poster) => (
                    <div
                        key={poster.id}
                        className={cn(
                            "relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                            poster.type === "marked_poster"
                                ? "border-primary shadow-sm shadow-primary/20"
                                : "border-border/50"
                        )}
                    >
                        <Image src={poster.previewUrl} alt="" fill className="object-cover" unoptimized />

                        {/* Preview Overlay Hotspots */}
                        {poster.markedItems && poster.markedItems.map((item: any) => (
                            <div
                                key={item.id}
                                className="absolute border-[0.5px] border-primary bg-primary/20 pointer-events-none z-10"
                                style={{
                                    left: `${item.x * 100}%`,
                                    top: `${item.y * 100}%`,
                                    width: `${item.width * 100}%`,
                                    height: `${item.height * 100}%`
                                }}
                            />
                        ))}

                        {poster.type === "marked_poster" && (
                            <div className="absolute inset-0 flex items-end justify-end p-0.5 z-20 pointer-events-none">
                                <Sparkles className="w-3 h-3 text-primary" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {posters.length >= maxPosters && (
                <Text className="text-xs opacity-40">Maximum {maxPosters} posters reached</Text>
            )}

            <div className="flex flex-col w-full max-w-sm gap-3">
                {posters.length < maxPosters && (
                    <PremiumButton
                        onClick={handleAddMore}
                        leftIcon={Plus}
                        className="rounded-xl w-full"
                    >
                        Add More Posters
                    </PremiumButton>
                )}
                <div className="flex items-center gap-3">
                    <PremiumButton
                        variant="outline"
                        onClick={handleReclassify}
                        leftIcon={RotateCcw}
                        className="rounded-xl flex-1"
                    >
                        Re-classify
                    </PremiumButton>
                    <PremiumButton
                        onClick={handleNext}
                        rightIcon={ArrowRight}
                        className="rounded-xl flex-1"
                    >
                        {submitButtonText}
                    </PremiumButton>
                </div>
            </div>
        </div>
    );
};

