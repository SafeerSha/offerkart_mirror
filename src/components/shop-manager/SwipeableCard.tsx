"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "@/lib/icons";

interface SwipeableCardProps {
    children: React.ReactNode;
    onEdit: () => void;
    onDelete: () => void;
    editTitle?: string;
    deleteTitle?: string;
}

export function SwipeableCard({ children, onEdit, onDelete, editTitle = "Edit", deleteTitle = "Delete" }: SwipeableCardProps) {
    const [startX, setStartX] = useState<number | null>(null);
    const [currentX, setCurrentX] = useState<number | null>(null);
    const [isSwiped, setIsSwiped] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX);
        setCurrentX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX === null) return;
        setCurrentX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (startX === null || currentX === null) return;
        const diff = startX - currentX;

        // If swiped left more than 50px, reveal actions
        if (diff > 50) {
            setIsSwiped(true);
        }
        // If swiped right more than 30px, hide actions
        else if (diff < -30) {
            setIsSwiped(false);
        }

        setStartX(null);
        setCurrentX(null);
    };

    // Auto-close actions if user taps on the card content when swiped
    const handleContentClick = (e: React.MouseEvent) => {
        if (isSwiped) {
            e.preventDefault();
            e.stopPropagation();
            setIsSwiped(false);
        }
    };

    return (
        <div
            ref={cardRef}
            className="relative overflow-hidden rounded-xl w-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Slideable Card Content */}
            <div
                onClick={handleContentClick}
                className={cn(
                    "transition-transform duration-300 ease-out select-none w-full relative z-10",
                    isSwiped ? "-translate-x-[110px]" : "translate-x-0"
                )}
            >
                {children}
            </div>

            {/* Hidden Action Panel behind the card (revealed on swipe left) */}
            <div
                className={cn(
                    "absolute right-0 top-0 bottom-0 flex items-center gap-2 px-3 bg-gradient-to-l from-orange-500/10 to-transparent border-l border-primary/10 rounded-r-xl transition-all duration-300 z-0",
                    isSwiped ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                )}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsSwiped(false);
                        onEdit();
                    }}
                    className="flex items-center justify-center p-2.5 rounded-xl bg-white border border-primary/10 text-primary hover:bg-primary hover:text-white shadow-lg active:scale-95 transition-all pointer-events-auto"
                    title={editTitle}
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsSwiped(false);
                        onDelete();
                    }}
                    className="flex items-center justify-center p-2.5 rounded-xl bg-white border border-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white shadow-lg active:scale-95 transition-all pointer-events-auto"
                    title={deleteTitle}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
