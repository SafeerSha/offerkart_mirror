"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Camera,
    X,
    RefreshCw,
    AlertCircle,
    Check,
    SwitchCamera,
    Navigation,
    ShieldCheck
} from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { cn } from "@/lib/utils";

interface LiveCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
    title: string;
    description: string;
    categoryKey: string;
    gpsCoords?: {
        latitude: number | null;
        longitude: number | null;
        accuracyMeters: number | null;
    };
}

export function LiveCameraModal({
    isOpen,
    onClose,
    onCapture,
    title,
    description,
    categoryKey,
    gpsCoords
}: LiveCameraModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const nativeInputRef = useRef<HTMLInputElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [isStarting, setIsStarting] = useState(true);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    // Stop all media tracks
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    }, [stream]);

    // Start video stream from user device
    const startCamera = useCallback(
        async (mode: "environment" | "user") => {
            setIsStarting(true);
            setCameraError(null);

            // Clean up existing stream
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }

            try {
                if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
                    throw new Error("Live camera is not supported by your browser");
                }

                const constraints: MediaStreamConstraints = {
                    video: {
                        facingMode: { ideal: mode },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false
                };

                const newStream = await navigator.mediaDevices.getUserMedia(constraints);
                setStream(newStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                    await videoRef.current.play().catch(() => {});
                }

                // Check device count for flip camera support
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter((d) => d.kind === "videoinput");
                setHasMultipleCameras(videoInputs.length > 1);
            } catch (err: any) {
                console.warn("Camera start failed:", err);
                const msg =
                    err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
                        ? "Camera access was denied. Please allow camera permissions in your browser."
                        : err.message || "Failed to start camera.";
                setCameraError(msg);
            } finally {
                setIsStarting(false);
            }
        },
        [stream]
    );

    // Switch between front and rear cameras
    const toggleFacingMode = () => {
        const nextMode = facingMode === "environment" ? "user" : "environment";
        setFacingMode(nextMode);
        startCamera(nextMode);
    };

    // Trigger on open/close
    useEffect(() => {
        if (isOpen) {
            startCamera(facingMode);
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Capture the photo from current video frame
    const handleSnapPhoto = () => {
        if (!videoRef.current || isCapturing) return;

        setIsCapturing(true);
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            setIsCapturing(false);
            return;
        }

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
            (blob) => {
                setIsCapturing(false);
                if (!blob) return;

                const fileName = `${categoryKey.toLowerCase().replace(/_/g, "-")}-${Date.now()}.jpg`;
                const file = new File([blob], fileName, { type: "image/jpeg" });

                stopCamera();
                onCapture(file);
                onClose();
            },
            "image/jpeg",
            0.92
        );
    };

    // Fallback: If device prefers native OS camera app directly
    const handleNativeCameraFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            stopCamera();
            onCapture(file);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex flex-col justify-between items-center text-white select-none animate-in fade-in duration-200">
            {/* Header */}
            <div className="w-full max-w-2xl px-4 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-orange-600/90 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold tracking-tight text-white">{title}</h3>
                        <p className="text-[11px] text-gray-400 line-clamp-1">{description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {hasMultipleCameras && (
                        <button
                            type="button"
                            onClick={toggleFacingMode}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                            title="Switch Camera (Front/Rear)"
                        >
                            <SwitchCamera className="w-4 h-4" />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            stopCamera();
                            onClose();
                        }}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Close Camera"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Viewfinder Viewport */}
            <div className="relative w-full max-w-2xl flex-1 flex items-center justify-center overflow-hidden px-4">
                {cameraError ? (
                    <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 text-center max-w-md space-y-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white">Camera Access Required</h4>
                            <p className="text-xs text-gray-400">{cameraError}</p>
                        </div>

                        <div className="pt-2 flex flex-col gap-2">
                            <PremiumButton
                                type="button"
                                onClick={() => startCamera(facingMode)}
                                className="w-full rounded-xl bg-orange-600 hover:bg-orange-700"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry Camera Permission
                            </PremiumButton>

                            <button
                                type="button"
                                onClick={() => nativeInputRef.current?.click()}
                                className="text-xs text-gray-400 hover:text-white underline py-1 cursor-pointer"
                            >
                                Launch Native Device Camera
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full h-full max-h-[70vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-2xl">
                        <video
                            ref={videoRef}
                            playsInline
                            autoPlay
                            muted
                            className="w-full h-full object-cover"
                        />

                        {isStarting && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                                <span className="text-xs text-gray-300">Starting Live Camera...</span>
                            </div>
                        )}

                        {/* Viewfinder Corner Overlays */}
                        <div className="absolute inset-6 pointer-events-none border border-white/20 rounded-xl">
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-orange-500 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-orange-500 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-orange-500 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-orange-500 rounded-br-lg" />
                        </div>

                        {/* Live Geotag Chip on Viewfinder */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-emerald-400 font-mono">
                            <Navigation className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>
                                📍 {gpsCoords?.latitude?.toFixed(4) ?? "9.1234"},{" "}
                                {gpsCoords?.longitude?.toFixed(4) ?? "76.1234"}
                            </span>
                        </div>

                        {/* Live instruction pill */}
                        <div className="absolute top-3 inset-x-0 mx-auto w-fit px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-medium text-white/90">
                            Live on-premise verification • File upload disabled
                        </div>
                    </div>
                )}
            </div>

            {/* Shutter Controls Footer */}
            <div className="w-full max-w-2xl px-4 py-6 flex flex-col items-center justify-center gap-3 z-10">
                <div className="flex items-center justify-center gap-6 w-full">
                    <button
                        type="button"
                        onClick={handleSnapPhoto}
                        disabled={isStarting || !!cameraError || isCapturing}
                        className="group relative w-18 h-18 rounded-full border-4 border-white/80 p-1 flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50 cursor-pointer shadow-lg"
                        title="Capture Photo"
                    >
                        <div className="w-full h-full rounded-full bg-orange-600 group-hover:bg-orange-500 transition-colors shadow-inner flex items-center justify-center">
                            <Camera className="w-7 h-7 text-white" />
                        </div>
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400">
                        Tap button to capture live on-premise photo
                    </span>

                    {/* Direct mobile OS camera trigger */}
                    <button
                        type="button"
                        onClick={() => nativeInputRef.current?.click()}
                        className="text-[11px] text-orange-400 hover:text-orange-300 underline cursor-pointer"
                    >
                        Device Camera App
                    </button>
                </div>
            </div>

            {/* Hidden native input with capture="environment" for devices that prefer native OS camera app */}
            <input
                ref={nativeInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleNativeCameraFallback}
            />
        </div>
    );
}

