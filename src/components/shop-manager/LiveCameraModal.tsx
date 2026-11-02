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
    UploadCloud,
    RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LiveCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
    title: string;
    description: string;
    categoryKey: string;
    onFallbackToGallery?: () => void;
    gpsCoords?: {
        latitude: number | null;
        longitude: number | null;
        accuracyMeters: number | null;
    };
}

interface CapturedState {
    file: File;
    previewUrl: string;
}

export function LiveCameraModal({
    isOpen,
    onClose,
    onCapture,
    title,
    description,
    categoryKey,
    onFallbackToGallery,
    gpsCoords
}: LiveCameraModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [isStarting, setIsStarting] = useState(true);
    const [cameraError, setCameraError] = useState<{
        type: "permission" | "unsupported" | "busy" | "notfound" | "generic";
        message: string;
    } | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<CapturedState | null>(null);

    // Stop all media tracks and release references
    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                try {
                    track.stop();
                } catch {}
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    // Clean up captured preview URL
    const clearCapturedPhoto = useCallback(() => {
        setCapturedPhoto((prev) => {
            if (prev?.previewUrl) {
                try {
                    URL.revokeObjectURL(prev.previewUrl);
                } catch {}
            }
            return null;
        });
    }, []);

    // Start in-browser camera stream
    const startCamera = useCallback(
        async (targetFacingMode: "environment" | "user") => {
            setIsStarting(true);
            setCameraError(null);
            clearCapturedPhoto();
            stopStream();

            // 1. Check secure context (HTTPS or localhost required for getUserMedia)
            if (typeof window !== "undefined") {
                const isLocalhost =
                    window.location.hostname === "localhost" ||
                    window.location.hostname === "127.0.0.1";
                if (!window.isSecureContext && !isLocalhost) {
                    setCameraError({
                        type: "unsupported",
                        message: "Camera access requires a secure connection (HTTPS). Please open this site via HTTPS."
                    });
                    setIsStarting(false);
                    return;
                }
            }

            // 2. Check browser WebRTC support
            if (
                typeof navigator === "undefined" ||
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                setCameraError({
                    type: "unsupported",
                    message: "In-browser camera is not supported by your browser. Please use the 'Choose from Gallery' option."
                });
                setIsStarting(false);
                return;
            }

            // 3. Moderate resolution constraints to prevent Android memory pressure
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: { ideal: targetFacingMode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            try {
                let newStream: MediaStream;
                try {
                    newStream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch (firstErr: any) {
                    const errName = firstErr?.name || "";
                    if (
                        errName === "OverconstrainedError" ||
                        errName === "ConstraintNotSatisfiedError" ||
                        errName === "TypeError"
                    ) {
                        try {
                            newStream = await navigator.mediaDevices.getUserMedia({
                                video: { facingMode: { ideal: targetFacingMode } },
                                audio: false
                            });
                        } catch {
                            newStream = await navigator.mediaDevices.getUserMedia({
                                video: true,
                                audio: false
                            });
                        }
                    } else {
                        throw firstErr;
                    }
                }

                streamRef.current = newStream;

                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                    await videoRef.current.play().catch((playErr) => {
                        console.warn("Autoplay was prevented:", playErr);
                    });
                }

                // Check available cameras to decide if Switch Camera button should appear
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter((d) => d.kind === "videoinput");
                    setHasMultipleCameras(videoDevices.length > 1);
                } catch {
                    setHasMultipleCameras(true); // Fallback: allow toggling on mobile
                }
            } catch (err: any) {
                console.warn("getUserMedia failed:", err);
                const errName = err?.name || "";

                if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
                    setCameraError({
                        type: "permission",
                        message: "Camera permission was denied. Please allow camera permissions in your browser to take live photos."
                    });
                } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
                    setCameraError({
                        type: "notfound",
                        message: "No camera device found on this device."
                    });
                } else if (errName === "NotReadableError" || errName === "TrackStartError") {
                    setCameraError({
                        type: "busy",
                        message: "The camera is currently in use by another app or tab. Please close other camera apps and retry."
                    });
                } else {
                    setCameraError({
                        type: "generic",
                        message: err?.message || "Failed to start camera. Please try again or choose from gallery."
                    });
                }
            } finally {
                setIsStarting(false);
            }
        },
        [stopStream, clearCapturedPhoto]
    );

    // Switch between front and rear cameras
    const toggleFacingMode = () => {
        const nextMode = facingMode === "environment" ? "user" : "environment";
        setFacingMode(nextMode);
        startCamera(nextMode);
    };

    // Close modal and release all resources
    const handleClose = useCallback(() => {
        stopStream();
        clearCapturedPhoto();
        onClose();
    }, [stopStream, clearCapturedPhoto, onClose]);

    // Snapshot photo from current video frame
    const handleSnapPhoto = () => {
        if (!videoRef.current || isCapturing) return;

        setIsCapturing(true);
        const video = videoRef.current;

        try {
            const canvas = document.createElement("canvas");
            const w = video.videoWidth || 1280;
            const h = video.videoHeight || 720;
            canvas.width = w;
            canvas.height = h;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                setIsCapturing(false);
                return;
            }

            // Draw current video frame to canvas
            ctx.drawImage(video, 0, 0, w, h);

            // Convert to JPEG blob at 85% quality without Base64 overhead
            canvas.toBlob(
                (blob) => {
                    // Release canvas buffer immediately
                    canvas.width = 0;
                    canvas.height = 0;
                    setIsCapturing(false);

                    if (!blob) {
                        setCameraError({
                            type: "generic",
                            message: "Failed to generate image from camera frame. Please retry."
                        });
                        return;
                    }

                    // Stop the live camera stream now that we have captured the frame
                    stopStream();

                    const fileName = `${categoryKey.toLowerCase().replace(/_/g, "-")}-${Date.now()}.jpg`;
                    const file = new File([blob], fileName, { type: "image/jpeg", lastModified: Date.now() });
                    const previewUrl = URL.createObjectURL(blob);

                    setCapturedPhoto({ file, previewUrl });
                },
                "image/jpeg",
                0.85
            );
        } catch (captureErr) {
            console.error("Frame capture error:", captureErr);
            setIsCapturing(false);
            setCameraError({
                type: "generic",
                message: "Error capturing photograph frame. Please retry."
            });
        }
    };

    // Retake photograph (restarts live camera)
    const handleRetake = () => {
        clearCapturedPhoto();
        startCamera(facingMode);
    };

    // Confirm photograph (passes File to parent callback)
    const handleConfirm = () => {
        if (!capturedPhoto) return;
        const fileToPass = capturedPhoto.file;
        clearCapturedPhoto();
        stopStream();
        onCapture(fileToPass);
        onClose();
    };

    // Lifecycle: open/close management
    useEffect(() => {
        if (isOpen) {
            clearCapturedPhoto();
            startCamera(facingMode);
        } else {
            stopStream();
            clearCapturedPhoto();
        }

        return () => {
            stopStream();
            clearCapturedPhoto();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Handle tab visibility change: stop camera if user switches tabs to preserve memory & battery
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopStream();
            } else if (isOpen && !capturedPhoto) {
                startCamera(facingMode);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isOpen, capturedPhoto, facingMode, startCamera, stopStream]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between animate-in fade-in duration-200">
            {/* Header bar */}
            <div className="w-full max-w-2xl px-4 py-3 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-orange-600/90 text-white flex items-center justify-center">
                        <Camera className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
                        <p className="text-[11px] text-gray-300 line-clamp-1">{description}</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Close Camera"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Viewfinder / Preview Body */}
            <div className="relative w-full max-w-xl flex-1 flex items-center justify-center p-3">
                {capturedPhoto ? (
                    /* Captured Photo Review State */
                    <div className="relative w-full h-full max-h-[70vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/20 shadow-2xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={capturedPhoto.previewUrl}
                            alt="Captured snapshot preview"
                            className="w-full h-full object-contain"
                        />

                        {/* Top Review Badge */}
                        <div className="absolute top-3 inset-x-0 mx-auto w-fit px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-medium text-emerald-400 flex items-center gap-1.5 shadow-md">
                            <Check className="w-3.5 h-3.5" />
                            <span>Photo captured • Review before confirming</span>
                        </div>

                        {/* Geotag chip */}
                        {gpsCoords?.latitude && gpsCoords?.longitude && (
                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] text-emerald-300 font-mono">
                                <Navigation className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>
                                    📍 {gpsCoords.latitude.toFixed(5)}, {gpsCoords.longitude.toFixed(5)}
                                </span>
                            </div>
                        )}
                    </div>
                ) : cameraError ? (
                    /* Error State with Permission Guidance */
                    <div className="w-full max-w-md p-6 rounded-2xl bg-gray-900/90 border border-red-500/30 text-center space-y-4 shadow-2xl text-white">
                        <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                            <AlertCircle className="w-7 h-7" />
                        </div>

                        <div className="space-y-1.5">
                            <h4 className="text-base font-bold text-white">
                                {cameraError.type === "permission"
                                    ? "Camera Access Required"
                                    : "Camera Unavailable"}
                            </h4>
                            <p className="text-xs text-gray-300 leading-relaxed">
                                {cameraError.message}
                            </p>
                        </div>

                        {cameraError.type === "permission" && (
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-left text-[11px] text-gray-300 space-y-1">
                                <span className="font-semibold text-orange-400 block">How to enable on Android Chrome:</span>
                                <ol className="list-decimal list-inside space-y-0.5 text-gray-400">
                                    <li>Tap the lock / tune icon beside the URL in the address bar.</li>
                                    <li>Tap <strong>Permissions</strong> → <strong>Camera</strong>.</li>
                                    <li>Toggle to <strong>Allow</strong>, then tap Retry below.</li>
                                </ol>
                            </div>
                        )}

                        <div className="pt-2 flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => startCamera(facingMode)}
                                className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry Camera
                            </button>

                            {onFallbackToGallery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleClose();
                                        onFallbackToGallery();
                                    }}
                                    className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                >
                                    <UploadCloud className="w-4 h-4 text-gray-300" />
                                    Choose from Gallery Instead
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Live Viewfinder Stream */
                    <div className="relative w-full h-full max-h-[70vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-2xl">
                        <video
                            ref={(el) => {
                                (videoRef as any).current = el;
                                if (el && streamRef.current && el.srcObject !== streamRef.current) {
                                    el.srcObject = streamRef.current;
                                    el.play().catch(() => {});
                                }
                            }}
                            playsInline
                            autoPlay
                            muted
                            className="w-full h-full object-cover"
                        />

                        {isStarting && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                                <span className="text-xs text-gray-300 font-medium">Starting Live Camera...</span>
                            </div>
                        )}

                        {/* Viewfinder Framing Overlay */}
                        <div className="absolute inset-6 pointer-events-none border border-white/20 rounded-xl">
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-orange-500 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-orange-500 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-orange-500 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-orange-500 rounded-br-lg" />
                        </div>

                        {/* Switch Camera Button (Front / Rear) */}
                        {hasMultipleCameras && (
                            <button
                                type="button"
                                onClick={toggleFacingMode}
                                className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-all hover:scale-105 cursor-pointer shadow-lg z-10"
                                title="Switch Front/Rear Camera"
                            >
                                <SwitchCamera className="w-5 h-5" />
                            </button>
                        )}

                        {/* Top indicator: In-browser live mode */}
                        <div className="absolute top-3 inset-x-0 mx-auto w-fit px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-medium text-white/90">
                            Live In-Browser Camera • WebRTC
                        </div>

                        {/* Live Geotag Chip on Viewfinder */}
                        {gpsCoords?.latitude && gpsCoords?.longitude && (
                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-emerald-400 font-mono">
                                <Navigation className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>
                                    📍 {gpsCoords.latitude.toFixed(5)}, {gpsCoords.longitude.toFixed(5)}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="w-full max-w-xl px-4 py-4 flex flex-col items-center justify-center gap-3 z-10 bg-gradient-to-t from-black/80 to-transparent">
                {capturedPhoto ? (
                    /* Confirmation Controls: Retake vs Confirm */
                    <div className="w-full flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={handleRetake}
                            className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Retake
                        </button>

                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-900/30"
                        >
                            <Check className="w-4 h-4" />
                            Use This Photo
                        </button>
                    </div>
                ) : (
                    /* Shutter & Gallery Controls */
                    <div className="w-full flex flex-col items-center gap-3">
                        <div className="flex items-center justify-center w-full">
                            <button
                                type="button"
                                onClick={handleSnapPhoto}
                                disabled={isStarting || !!cameraError || isCapturing}
                                className="group relative w-18 h-18 rounded-full border-4 border-white/80 p-1 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-40 cursor-pointer shadow-2xl"
                                title="Capture Photo"
                            >
                                <div className="w-full h-full rounded-full bg-orange-600 group-hover:bg-orange-500 transition-colors shadow-inner flex items-center justify-center">
                                    <Camera className="w-7 h-7 text-white" />
                                </div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between w-full text-[11px] text-gray-400 px-2">
                            <span>Tap shutter to capture photo</span>

                            {onFallbackToGallery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleClose();
                                        onFallbackToGallery();
                                    }}
                                    className="text-orange-400 hover:text-orange-300 underline cursor-pointer flex items-center gap-1"
                                >
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    Choose from Gallery
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
