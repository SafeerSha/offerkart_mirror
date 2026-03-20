"use client";

import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImagePreviewModalProps {
    src: string;
    alt: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ImagePreviewModal({ src, alt, isOpen, onClose }: ImagePreviewModalProps) {
    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[95vw] md:max-w-[80vw] lg:max-w-[70vw] translate-x-[-50%] translate-y-[-50%] gap-4 border-none bg-transparent p-0 shadow-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] focus:outline-none">
                    <div className="relative flex items-center justify-center min-h-[50vh]">
                        <DialogPrimitive.Close className="absolute -top-12 right-0 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white/20">
                            <X className="h-6 h-6" />
                            <span className="sr-only">Close</span>
                        </DialogPrimitive.Close>

                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl">
                            <Image
                                src={src}
                                alt={alt}
                                width={1200}
                                height={1200}
                                unoptimized
                                className="max-w-full max-h-[80vh] object-contain rounded-xl select-none"
                                onContextMenu={(e) => e.preventDefault()}
                            />
                        </div>

                        <div className="absolute -bottom-10 left-0 right-0 text-center">
                            <p className="text-white/60 text-sm font-medium">{alt}</p>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
