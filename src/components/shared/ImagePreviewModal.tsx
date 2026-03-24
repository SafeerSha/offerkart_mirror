"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { MarkedItem } from "@/lib/types/offer";

interface ImagePreviewModalProps {
    src: string;
    alt: string;
    isOpen: boolean;
    onClose: () => void;
    markedItems?: MarkedItem[];
}

export function ImagePreviewModal({ src, alt, isOpen, onClose, markedItems }: ImagePreviewModalProps) {
    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-[100] grid w-full max-w-[95vw] md:max-w-[80vw] lg:max-w-[70vw] translate-x-[-50%] translate-y-[-50%] gap-4 border-none bg-transparent p-0 shadow-none focus:outline-none">
                    <DialogPrimitive.Title className="sr-only">
                        Image Preview
                    </DialogPrimitive.Title>
                    <div className="relative flex flex-col items-center justify-center min-h-[50vh]">
                        <DialogPrimitive.Close className="absolute -top-12 right-0 md:right-auto md:-right-12 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white/20">
                            <X className="w-6 h-6" />
                            <span className="sr-only">Close</span>
                        </DialogPrimitive.Close>

                        <div className="relative inline-block max-w-full max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
                            {/* Native img tag is used instead of next/image so the DOM container perfectly wraps the intrinsic aspect ratio, ensuring absolute overlay positioning correctly aligns! */}
                            <img
                                src={src}
                                alt={alt}
                                className="max-w-full max-h-[80vh] object-contain block select-none"
                                onContextMenu={(e) => e.preventDefault()}
                            />

                            {/* Exact Projection Overlay logic */}
                            {markedItems && markedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="absolute border-2 border-primary bg-primary/20 pointer-events-none z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                    style={{
                                        left: `${item.x * 100}%`,
                                        top: `${item.y * 100}%`,
                                        width: `${item.width * 100}%`,
                                        height: `${item.height * 100}%`
                                    }}
                                />
                            ))}
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-white/80 text-sm font-medium">{alt}</p>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
