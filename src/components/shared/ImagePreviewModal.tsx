"use client";

import React, { useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ImageOff } from "lucide-react";

import { MarkedItem } from "@/lib/types/offer";
import { MarkedPoster } from "./MarkedPoster";

interface ImagePreviewModalProps {
    src: string;
    alt: string;
    isOpen: boolean;
    onClose: () => void;
    markedItems?: MarkedItem[];
}

export function ImagePreviewModal({ src, alt, isOpen, onClose, markedItems }: ImagePreviewModalProps) {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [src, isOpen]);

    const hasMarkedItems = Boolean(markedItems && markedItems.length > 0);

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content className="fixed inset-0 z-[100] flex flex-col justify-between p-4 sm:p-6 focus:outline-none">
                    <DialogPrimitive.Title className="sr-only">
                        {alt || "Image Preview"}
                    </DialogPrimitive.Title>

                    {/* Top Header Bar: Always visible, never clipped */}
                    <div className="flex items-center justify-between gap-4 w-full max-w-5xl mx-auto shrink-0">
                        <p className="text-white/90 text-sm font-medium truncate">
                            {alt}
                        </p>
                        <DialogPrimitive.Close
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer shrink-0"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </DialogPrimitive.Close>
                    </div>

                    {/* Centered Image Container */}
                    <div className="flex-1 flex items-center justify-center min-h-0 py-4 w-full max-w-5xl mx-auto">
                        {hasMarkedItems ? (
                            <div className="relative w-full h-full max-h-[82vh] flex items-center justify-center bg-black/30 rounded-2xl overflow-hidden ring-1 ring-white/10">
                                <MarkedPoster
                                    src={src}
                                    alt={alt}
                                    markedItems={markedItems}
                                    className="w-full h-full"
                                    showNames={false}
                                />
                            </div>
                        ) : imgError ? (
                            <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-white/5 border border-white/10 text-white/70 text-center">
                                <ImageOff className="w-10 h-10 opacity-60" />
                                <p className="text-sm font-medium">Unable to load image preview</p>
                            </div>
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={src}
                                alt={alt}
                                onError={() => setImgError(true)}
                                className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
                            />
                        )}
                    </div>

                    {/* Bottom spacer for visual balance */}
                    <div className="h-4 shrink-0" />
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
