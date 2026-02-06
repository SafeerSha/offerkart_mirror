"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Plus, CheckCircle2, RefreshCw, Eye } from "lucide-react";
import { Text } from "@/components/shared/Typography";
import { cn } from "@/lib/utils";
import { PremiumButton } from "./PremiumButton";

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
    currentFile?: File | null;
    label?: string;
    acceptedTypes?: string;
    maxSizeMB?: number;
    className?: string;
    children?: React.ReactNode;
}

export const FileUpload = ({
    onFileSelect,
    currentFile,
    label = "Offer Image",
    acceptedTypes = "image/*",
    maxSizeMB = 5,
    className,
    children
}: FileUploadProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showOverlay, setShowOverlay] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file.");
            return;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File size should be less than ${maxSizeMB}MB.`);
            return;
        }

        setError(null);
        onFileSelect(file);
        setShowOverlay(true); // Auto-show options after upload

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Simulate upload progress
        setIsUploading(true);
        setUploadProgress(0);
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsUploading(false);
                    return 100;
                }
                return prev + 10;
            });
        }, 100);
    }, [maxSizeMB, onFileSelect]);

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewUrl(null);
        onFileSelect(null);
        setError(null);
        setShowOverlay(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            {label && (
                <label className="text-sm font-medium flex items-center gap-2 text-foreground/80">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    {label}
                </label>
            )}

            <div
                onClick={() => {
                    if (!previewUrl) {
                        fileInputRef.current?.click();
                    } else {
                        setShowOverlay(!showOverlay);
                    }
                }}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={cn(
                    "relative group cursor-pointer transition-all duration-300",
                    "min-h-[220px] rounded-3xl overflow-hidden",
                    "border-2 border-dashed",
                    isDragging
                        ? "border-primary bg-primary/10 scale-[1.01] shadow-glow"
                        : previewUrl
                            ? "border-primary/20 bg-background"
                            : "border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40",
                )}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept={acceptedTypes}
                    className="hidden"
                />

                {previewUrl ? (
                    <div className={cn(
                        "relative w-full h-full min-h-[220px] group/preview animate-fade-in",
                        showOverlay && "overlay-active"
                    )}>
                        {/* Image Preview */}
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-[1.4rem]"
                        />

                        {/* Options Overlay (Blurred Backdrop) */}
                        <div className={cn(
                            "absolute inset-0 bg-black/75 flex flex-col items-center justify-center backdrop-blur-md p-6 text-center transition-all duration-300 z-20",
                            showOverlay
                                ? "opacity-100 pointer-events-auto"
                                : "opacity-0 pointer-events-none",
                        )}>
                            <div className={cn("transition-all duration-300", !showOverlay && "opacity-0 scale-95")}>
                                {children}
                            </div>
                        </div>

                        {/* Persistent Action Buttons Overlay */}
                        <div className={cn(
                            "absolute top-4 right-4 flex gap-2 z-30 transition-all duration-300",
                            !showOverlay && "opacity-100"
                        )}>
                            <button
                                type="button"
                                className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors border border-white/20 flex items-center gap-2 px-3 text-xs font-medium backdrop-blur-sm shadow-lg"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowOverlay(!showOverlay);
                                }}
                                title={showOverlay ? "View Poster" : "View Options"}
                            >
                                {showOverlay ? (
                                    <>
                                        <Eye className="w-4 h-4" />
                                        <span>View Poster</span>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="w-4 h-4" />
                                        <span>View Options</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors border border-white/20 flex items-center gap-2 px-3 text-xs font-medium backdrop-blur-sm shadow-lg"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                                title="Change Image"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Change</span>
                            </button>
                            <button
                                type="button"
                                className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors border border-white/20 backdrop-blur-sm shadow-lg"
                                onClick={clearFile}
                                title="Remove Image"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Upload Status Check Mark - only visible when overlay is hidden */}
                        {!isUploading && (
                            <div className={cn(
                                "absolute top-4 left-4 bg-background/80 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-primary/20 z-10 transition-opacity duration-300",
                                showOverlay ? "opacity-0" : "opacity-100"
                            )}>
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                        )}

                        {/* Progress Bar for Upload */}
                        {isUploading && (
                            <div className="absolute inset-x-4 bottom-4 bg-background/20 backdrop-blur-md rounded-full h-2 overflow-hidden border border-white/20">
                                <div
                                    className="h-full bg-primary transition-all duration-300 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4 h-full min-h-[220px]">
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                            isDragging ? "bg-primary text-white rotate-12" : "bg-primary/10 text-primary group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-primary/5"
                        )}>
                            {isDragging ? <Upload className="w-8 h-8 animate-bounce" /> : <Plus className="w-8 h-8" />}
                        </div>

                        <div className="text-center space-y-1">
                            <Text className="font-semibold text-lg">
                                {isDragging ? "Drop your image here" : "Click or drag image to upload"}
                            </Text>
                            <Text className="text-sm opacity-60">
                                Support for JPG, PNG and WEBP. Max size {maxSizeMB}MB
                            </Text>
                        </div>

                        <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-xs font-medium text-primary uppercase tracking-wider group-hover:bg-primary transition-colors duration-300">
                            Select File
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-destructive text-sm font-medium animate-slide-in">
                    <X className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
};
