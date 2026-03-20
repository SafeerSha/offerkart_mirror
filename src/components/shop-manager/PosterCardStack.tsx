"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
    Upload,
    Plus,
    Image as ImageIcon,
    MousePointerClick,
    Check,
    ArrowRight,
    RotateCcw,
    Sparkles,
    Eye,
    EyeOff,
} from "lucide-react";
import { Heading, Subheading, Text } from "@/components/shared/Typography";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

// --- Types ---
export interface PosterItem {
    id: string;
    file: File;
    previewUrl: string;
    type: "just_post" | "mark_products" | "unclassified";
    markedItems?: any[];
}

interface PosterCardStackProps {
    onComplete: (posters: PosterItem[]) => void;
    onEditingChange?: (isEditing: boolean) => void;
    maxSizeMB?: number;
    maxPosters?: number;
}

type Phase = "upload" | "classify" | "summary";

import { HotspotEditor } from "@/components/shop-manager/HotspotEditor";
import { createPortal } from "react-dom";

// --- Component ---
export const PosterCardStack = ({
    onComplete,
    onEditingChange,
    maxSizeMB = 5,
    maxPosters = 10,
}: PosterCardStackProps) => {
    const [phase, setPhase] = useState<Phase>("upload");
    const [posters, setPosters] = useState<PosterItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [animatingOut, setAnimatingOut] = useState<"left" | "right" | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const unclassifiedPosters = posters.filter((p) => p.type === "unclassified");
    const justPostPosters = posters.filter((p) => p.type === "just_post");
    const markPosters = posters.filter((p) => p.type === "mark_products");

    // --- File handling ---
    const processFiles = useCallback(
        (files: FileList | File[]) => {
            const fileArray = Array.from(files);
            const newPosters: PosterItem[] = [];

            fileArray.slice(0, maxPosters).forEach((file) => {
                if (!file.type.startsWith("image/")) {
                    toast.error(`"${file.name}" is not an image`);
                    return;
                }
                if (file.size > maxSizeMB * 1024 * 1024) {
                    toast.error(`"${file.name}" exceeds ${maxSizeMB}MB`);
                    return;
                }
                newPosters.push({
                    id: crypto.randomUUID(),
                    file,
                    previewUrl: URL.createObjectURL(file),
                    type: "unclassified",
                });
            });

            if (newPosters.length > 0) {
                setPosters(newPosters);
                setCurrentIndex(0);
                setPhase("classify");
            }
        },
        [maxSizeMB, maxPosters]
    );

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

    // --- Classification ---
    const classifyCurrentCard = (type: "just_post" | "mark_products") => {
        if (animatingOut || isViewing) return;

        if (type === "mark_products") {
            setIsEditing(true);
            onEditingChange?.(true);
            return;
        }

        const direction = "left";
        setAnimatingOut(direction);

        setTimeout(() => {
            setPosters((prev) => {
                const updated: PosterItem[] = prev.map((p, i) => (i === currentIndex ? { ...p, type } : p) as PosterItem);
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
            const updated: PosterItem[] = prev.map((p, i) => (i === currentIndex ? { ...p, type: "mark_products", markedItems } : p) as PosterItem);
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
    };

    const handleNext = () => {
        const classified = posters.map((p) => ({
            ...p,
            type: p.type === "unclassified" ? ("just_post" as const) : p.type,
        }));
        onComplete(classified);
    };

    const hiddenInput = (
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
    );

    // ═══════════════════════════════════════════
    // Phase 1: Upload
    // ═══════════════════════════════════════════
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
                    <Text className="text-sm opacity-50 mb-5 max-w-xs text-center">
                        Select one or more poster images. You&apos;ll classify each one next.
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

    // ═══════════════════════════════════════════
    // Phase 2: Card Stack Classification
    // ═══════════════════════════════════════════
    if (phase === "classify") {
        const currentPoster = posters[currentIndex];
        const remaining = posters.length - currentIndex;
        const progress = ((currentIndex) / posters.length) * 100;
        // How many cards to show behind (max 3)
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
                            Classifying Posters
                        </Text>
                        <Text className="text-xs font-bold text-primary">
                            {currentIndex + 1} of {posters.length}
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
                    {/* Background stacked cards — poke out from bottom/right */}
                    {behindCards.map((poster, i) => {
                        const offset = (i + 1) * 14;  // px offset downward
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

                            {/* --- Overlay with blur (when NOT viewing) --- */}
                            {!isViewing && (
                                <div className="absolute inset-0 flex flex-col justify-end">
                                    {/* Gradient for readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

                                    {/* Action buttons inside overlay */}
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
                                            onClick={() => classifyCurrentCard("mark_products")}
                                            disabled={!!animatingOut}
                                            className="flex-1 flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl bg-primary/30 backdrop-blur-xl border border-primary/40 hover:bg-primary/40 transition-all duration-200 active:scale-95 cursor-pointer group shadow-lg shadow-primary/20"
                                        >
                                            <MousePointerClick className="w-5 h-5 text-white" />
                                            <div className="text-left">
                                                <span className="text-sm font-bold text-white block">Mark Products</span>
                                                <span className="text-[10px] text-white/50 block leading-tight">Tag items</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Top bar: counter + view toggle + Back button */}
                            <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-30">
                                <div className="flex items-center gap-2">
                                    {currentIndex > 0 && (
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

    // ═══════════════════════════════════════════
    // Phase 3: Summary
    // ═══════════════════════════════════════════
    return (
        <div className="flex flex-col items-center gap-6 py-4">
            {/* Success header */}
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-in zoom-in duration-500">
                    <Check className="w-8 h-8 text-white" />
                </div>
                <Heading className="text-gradient text-2xl">All Posters Classified!</Heading>
                <Text className="opacity-50 text-sm max-w-xs">
                    Review the summary below, then proceed.
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
                            poster.type === "mark_products"
                                ? "border-primary shadow-sm shadow-primary/20"
                                : "border-border/50"
                        )}
                    >
                        <Image src={poster.previewUrl} alt="" fill className="object-cover" unoptimized />
                        {poster.type === "mark_products" && (
                            <div className="absolute inset-0 flex items-end justify-end p-0.5">
                                <Sparkles className="w-3 h-3 text-primary" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 w-full max-w-sm">
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
                    Publish
                </PremiumButton>
            </div>
        </div>
    );
};

