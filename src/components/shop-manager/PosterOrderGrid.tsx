"use client";

import React, { useState } from "react";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PosterItem, PosterPreviewState } from "./PosterCardStack";
import { MarkedItem } from "@/lib/types/offer";

interface PosterOrderGridProps {
    posters: PosterItem[];
    onReorder: (newPosters: PosterItem[]) => void;
    previewIndex: number | null;
    onPreviewSelect: (posterIdx: number) => void;
    onPreviewClose: () => void;
    onEditMarking: (index: number) => void;
    onAddMarking: (index: number) => void;
    onPreviewChange?: (state: PosterPreviewState | null) => void;
}

export const PosterOrderGrid = ({
    posters,
    onReorder,
    previewIndex,
    onPreviewSelect,
    onPreviewClose,
    onEditMarking,
    onAddMarking,
    onPreviewChange,
}: PosterOrderGridProps) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const movePoster = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= posters.length) return;
        const newPosters = [...posters];
        const [movedItem] = newPosters.splice(fromIndex, 1);
        newPosters.splice(toIndex, 0, movedItem);
        onReorder(newPosters);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDragEnter = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) return;
        movePoster(draggedIndex, targetIndex);
        setDraggedIndex(targetIndex);
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
    };

    const handleThumbnailClick = (posterIdx: number) => {
        onPreviewSelect(posterIdx);
        onPreviewChange?.({
            posters,
            index: posterIdx,
            onClose: () => {
                onPreviewClose();
                onPreviewChange?.(null);
            },
            onEditMarking,
            onAddMarking,
        });
    };

    return (
        <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-border/10">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto scrollbar-hide py-3 px-3">
                {posters.map((poster, posterIdx) => (
                    <div
                        key={poster.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, posterIdx)}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, posterIdx)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, posterIdx)}
                        className={cn(
                            "group relative flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-200",
                            draggedIndex !== null && draggedIndex !== posterIdx ? "opacity-30 scale-95" : "opacity-100",
                            draggedIndex === posterIdx
                                ? "bg-white shadow-2xl z-50 border-orange-500 scale-[1.02] cursor-grabbing"
                                : previewIndex === posterIdx && draggedIndex === null
                                    ? "bg-orange-50/50 border-orange-500 border-2 shadow-sm"
                                    : "bg-card/50 border-border/50 hover:border-primary/30"
                        )}
                    >
                        {/* Drag Handle */}
                        <div className="cursor-grab active:cursor-grabbing p-0.5 opacity-30 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Thumbnail */}
                        <div
                            onClick={() => handleThumbnailClick(posterIdx)}
                            className="relative w-12 h-12 rounded-lg overflow-hidden border border-border/50 shrink-0 cursor-pointer"
                        >
                            <Image src={poster.previewUrl} alt="" fill className="object-cover" unoptimized />
                            <div className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[8px] font-bold px-1 py-0.5 rounded backdrop-blur-md">
                                {posterIdx + 1}
                            </div>

                            {/* Hotspots Overlay */}
                            {poster.markedItems && poster.markedItems.map((item: MarkedItem) => (
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
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                                <label className="text-[11px] font-black uppercase truncate">
                                    {poster.type === "marked_poster" ? "Marked" : "Standard"}
                                </label>
                            </div>
                            <label className="text-[12px] opacity-40 font-medium">
                                {poster.markedItems?.length || 0} marked
                            </label>
                        </div>

                        {/* Up/Down Controls */}
                        <div className="flex flex-col gap-0.5">
                            <button
                                onClick={(e) => { e.stopPropagation(); movePoster(posterIdx, posterIdx - 1); }}
                                disabled={posterIdx === 0}
                                className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-20 transition-all"
                                title="Move Up"
                            >
                                <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); movePoster(posterIdx, posterIdx + 1); }}
                                disabled={posterIdx === posters.length - 1}
                                className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-20 transition-all"
                                title="Move Down"
                            >
                                <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Fade Overlay — shows when more than 10 posters (5 rows) */}
            {posters.length > 10 && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20" />
            )}
        </div>
    );
};
