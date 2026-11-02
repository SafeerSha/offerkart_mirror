"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import {
    X,
    RefreshCw,
    AlertCircle,
    Check,
    SwitchCamera,
    RotateCcw,
    Zap,
    ZapOff,
    Focus,
    Maximize,
    Minimize
} from "lucide-react";

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
    categoryKey
}: LiveCameraModalProps) {
    const webcamRef = useRef<Webcam>(null);

    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [isStarting, setIsStarting] = useState(true);
    const [retryKey, setRetryKey] = useState(0);
    const [torchAvailable, setTorchAvailable] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPortrait, setIsPortrait] = useState(true);
    const [cameraError, setCameraError] = useState<{
        type: "permission" | "unsupported" | "busy" | "notfound" | "generic";
        message: string;
    } | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<CapturedState | null>(null);

    // Track screen orientation to request matching sensor aspect ratio
    useEffect(() => {
        const checkOrientation = () => {
            if (typeof window !== "undefined") {
                setIsPortrait(window.innerHeight >= window.innerWidth);
            }
        };
        checkOrientation();
        window.addEventListener("resize", checkOrientation);
        window.addEventListener("orientationchange", checkOrientation);
        return () => {
            window.removeEventListener("resize", checkOrientation);
            window.removeEventListener("orientationchange", checkOrientation);
        };
    }, []);

    // Stop all media tracks and release camera hardware
    const stopStream = useCallback(() => {
        if (webcamRef.current?.video?.srcObject) {
            const stream = webcamRef.current.video.srcObject as MediaStream;
            try {
                stream.getTracks().forEach((track) => {
                    track.stop();
                });
            } catch {}
            webcamRef.current.video.srcObject = null;
        }
        setTorchOn(false);
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

    // Handle camera stream success
    const handleUserMedia = useCallback(() => {
        setIsStarting(false);
        setCameraError(null);

        // Check if torch/flashlight, zoom, and autofocus are supported on active video track
        if (webcamRef.current?.video?.srcObject) {
            const stream = webcamRef.current.video.srcObject as MediaStream;
            const track = stream.getVideoTracks()[0];
            if (track) {
                if (typeof (track as any).getCapabilities === "function") {
                    try {
                        const caps = (track as any).getCapabilities();
                        setTorchAvailable(!!caps?.torch);

                        // Reset zoom to natural 1x (or minimum optical zoom) to prevent default digital magnification
                        const advancedConstraints: any[] = [];
                        if (caps.zoom) {
                            const defaultZoom = Math.max(1, caps.zoom.min || 1);
                            advancedConstraints.push({ zoom: defaultZoom });
                        }
                        if (caps.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes("continuous")) {
                            advancedConstraints.push({ focusMode: "continuous" });
                        }
                        if (caps.exposureMode && Array.isArray(caps.exposureMode) && caps.exposureMode.includes("continuous")) {
                            advancedConstraints.push({ exposureMode: "continuous" });
                        }

                        if (advancedConstraints.length > 0 && typeof (track as any).applyConstraints === "function") {
                            (track as any).applyConstraints({
                                advanced: advancedConstraints
                            }).catch(() => {});
                        }
                    } catch (err) {
                        console.warn("Camera track constraint application error:", err);
                        setTorchAvailable(false);
                    }
                }
            }
        }
    }, []);

    // Toggle hardware torch/flashlight
    const toggleTorch = async () => {
        if (!webcamRef.current?.video?.srcObject) return;
        const stream = webcamRef.current.video.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        if (track && typeof (track as any).applyConstraints === "function") {
            try {
                const nextTorch = !torchOn;
                await (track as any).applyConstraints({
                    advanced: [{ torch: nextTorch }]
                });
                setTorchOn(nextTorch);
            } catch (err) {
                console.warn("Torch constraint failed:", err);
            }
        }
    };

    // Toggle full-screen mode
    const toggleFullscreen = () => {
        if (typeof document === "undefined") return;

        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(() => {
                // If browser blocks fullscreen request, ignore safely
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            }).catch(() => {});
        }
    };

    // Handle camera errors (e.g., permissions denied, camera unavailable)
    const handleUserMediaError = useCallback((err: string | DOMException) => {
        console.warn("Webcam error:", err);
        setIsStarting(false);

        const errorObj = typeof err === "object" ? err : null;
        const errName = errorObj?.name || "";

        if (
            errName === "NotAllowedError" ||
            errName === "PermissionDeniedError" ||
            errName === "SecurityError"
        ) {
            setCameraError({
                type: "permission",
                message:
                    "Camera permission was denied. Please allow camera permissions in your browser to capture live on-premise photos."
            });
        } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
            setCameraError({
                type: "notfound",
                message: "No camera hardware detected on this device."
            });
        } else if (errName === "NotReadableError" || errName === "TrackStartError") {
            setCameraError({
                type: "busy",
                message:
                    "The camera is currently occupied by another application. Please close other camera apps and retry."
            });
        } else {
            setCameraError({
                type: "generic",
                message:
                    (errorObj && errorObj.message) ||
                    "Could not access live camera. Please check your browser permissions."
            });
        }
    }, []);

    // Switch between front and rear cameras (Always enabled)
    const toggleFacingMode = () => {
        stopStream();
        setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
        setIsStarting(true);
        setRetryKey((k) => k + 1);
    };

    // Close modal and release all resources
    const handleClose = useCallback(() => {
        if (typeof document !== "undefined" && document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
        stopStream();
        clearCapturedPhoto();
        onClose();
    }, [stopStream, clearCapturedPhoto, onClose]);

    // Capture photo from webcam directly at full hardware sensor resolution
    const handleSnapPhoto = () => {
        if (!webcamRef.current || isCapturing) return;

        const videoEl = webcamRef.current.video;
        if (!videoEl || videoEl.readyState < 2) {
            fallbackBase64Capture();
            return;
        }

        setIsCapturing(true);

        try {
            // Read native camera hardware resolution from the video stream
            const naturalWidth = videoEl.videoWidth || 1920;
            const naturalHeight = videoEl.videoHeight || 1080;

            const canvas = document.createElement("canvas");
            canvas.width = naturalWidth;
            canvas.height = naturalHeight;

            const ctx = canvas.getContext("2d", { alpha: false });
            if (!ctx) {
                fallbackBase64Capture();
                return;
            }

            // High-fidelity image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Mirror if using front-facing camera
            if (facingMode === "user") {
                ctx.translate(naturalWidth, 0);
                ctx.scale(-1, 1);
            }

            // Direct 1:1 hardware frame capture without clientWidth downscaling
            ctx.drawImage(videoEl, 0, 0, naturalWidth, naturalHeight);

            canvas.toBlob(
                (blob) => {
                    // Release canvas memory immediately
                    canvas.width = 0;
                    canvas.height = 0;

                    setIsCapturing(false);
                    if (!blob) {
                        fallbackBase64Capture();
                        return;
                    }

                    stopStream();
                    const fileName = `${categoryKey.toLowerCase().replace(/_/g, "-")}-${Date.now()}.jpg`;
                    const file = new File([blob], fileName, {
                        type: "image/jpeg",
                        lastModified: Date.now()
                    });
                    const previewUrl = URL.createObjectURL(blob);
                    setCapturedPhoto({ file, previewUrl });
                },
                "image/jpeg",
                0.92
            );
        } catch (err) {
            console.error("Frame capture error:", err);
            fallbackBase64Capture();
        }
    };

    // Fallback capture using getScreenshot dataUrl
    const fallbackBase64Capture = () => {
        try {
            const dataUrl = webcamRef.current?.getScreenshot();
            if (!dataUrl) {
                setIsCapturing(false);
                setCameraError({
                    type: "generic",
                    message: "Failed to take snapshot. Please retry."
                });
                return;
            }

            fetch(dataUrl)
                .then((res) => res.blob())
                .then((blob) => {
                    stopStream();
                    setIsCapturing(false);
                    const fileName = `${categoryKey.toLowerCase().replace(/_/g, "-")}-${Date.now()}.jpg`;
                    const file = new File([blob], fileName, {
                        type: "image/jpeg",
                        lastModified: Date.now()
                    });
                    const previewUrl = URL.createObjectURL(blob);
                    setCapturedPhoto({ file, previewUrl });
                })
                .catch(() => {
                    setIsCapturing(false);
                });
        } catch {
            setIsCapturing(false);
        }
    };

    // Retake photograph (restarts live camera)
    const handleRetake = () => {
        clearCapturedPhoto();
        setIsStarting(true);
        setRetryKey((k) => k + 1);
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

    // Reset when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            clearCapturedPhoto();
            setIsStarting(true);
            setCameraError(null);
            setRetryKey((k) => k + 1);
        } else {
            stopStream();
            clearCapturedPhoto();
        }

        return () => {
            stopStream();
            clearCapturedPhoto();
        };
    }, [isOpen, stopStream, clearCapturedPhoto]);

    // Handle tab visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopStream();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [stopStream]);

    if (!isOpen) return null;

    // Full HD (1080p) adaptive constraints for lag-free 30-60fps preview and uncropped 1x optical view
    const videoConstraints: MediaTrackConstraints = {
        facingMode: { ideal: facingMode },
        width: { ideal: isPortrait ? 1080 : 1920 },
        height: { ideal: isPortrait ? 1920 : 1080 },
        frameRate: { ideal: 30, max: 60 }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none overflow-hidden animate-in fade-in duration-200">
            {/* Top Controls Bar (Native Camera Header) */}
            <header className="relative w-full px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between z-20 bg-black/95 backdrop-blur-md shrink-0 border-b border-white/10">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 active:scale-95 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-md"
                    title="Close Camera"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Title & Live Status */}
                <div className="flex flex-col items-center text-center">
                    <span className="text-xs font-bold tracking-widest text-white uppercase font-mono drop-shadow-md">
                        {title}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-gray-200 font-mono tracking-wider drop-shadow-sm">
                            {facingMode === "environment" ? "REAR CAMERA (1x)" : "FRONT CAMERA (1x)"}
                        </span>
                    </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2">
                    {/* Torch Toggle */}
                    {torchAvailable && !capturedPhoto && (
                        <button
                            type="button"
                            onClick={toggleTorch}
                            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/15 transition-all cursor-pointer shadow-md ${
                                torchOn
                                    ? "bg-amber-400 text-black shadow-amber-400/40"
                                    : "bg-white/10 hover:bg-white/20 text-white"
                            }`}
                            title={torchOn ? "Turn off Flash" : "Turn on Flash"}
                        >
                            {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                        </button>
                    )}

                    {/* Grid Overlay Toggle */}
                    {!capturedPhoto && (
                        <button
                            type="button"
                            onClick={() => setShowGrid((g) => !g)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/15 transition-all cursor-pointer shadow-md ${
                                showGrid ? "bg-white/30 text-yellow-300" : "bg-white/10 hover:bg-white/20 text-gray-300"
                            }`}
                            title="Toggle Grid Lines"
                        >
                            <Focus className="w-4 h-4" />
                        </button>
                    )}

                    {/* Full-screen Toggle */}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 active:scale-95 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-md"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                </div>
            </header>

            {/* Viewfinder Main: Natural 1x Optical View with Zero Digital Zoom & Zero Cropping */}
            <main className="relative flex-1 w-full h-full overflow-hidden bg-black flex items-center justify-center">
                {capturedPhoto ? (
                    /* Review Preview Photo: Uncropped 1x Frame */
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={capturedPhoto.previewUrl}
                        alt="Captured storefront"
                        className="w-full h-full object-contain bg-black"
                    />
                ) : cameraError ? (
                    /* Error State with Browser Permission Guidance */
                    <div className="w-full max-w-sm p-6 mx-4 rounded-2xl bg-zinc-900/95 border border-red-500/30 text-center space-y-4 shadow-2xl text-white z-20">
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
                            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-left text-[11px] text-gray-300 space-y-2">
                                <span className="font-semibold text-orange-400 block">
                                    How to allow camera permission:
                                </span>
                                <ol className="list-decimal list-inside space-y-1 text-gray-400">
                                    <li>Tap the <strong>🔒 / tune icon</strong> in the address bar.</li>
                                    <li>Tap <strong>Permissions</strong> → <strong>Camera</strong>.</li>
                                    <li>Change to <strong>Allow</strong>, then tap Retry below.</li>
                                </ol>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsStarting(true);
                                    setCameraError(null);
                                    setRetryKey((k) => k + 1);
                                }}
                                className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-98 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry Camera Permission
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Edge-to-Edge Live Camera Feed */
                    <>
                        <Webcam
                            key={`${facingMode}-${retryKey}-${isPortrait ? "p" : "l"}`}
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            screenshotQuality={0.92}
                            forceScreenshotSourceSize={true}
                            videoConstraints={videoConstraints}
                            onUserMedia={handleUserMedia}
                            onUserMediaError={handleUserMediaError}
                            className="w-full h-full object-contain"
                            mirrored={facingMode === "user"}
                        />

                        {isStarting && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-30">
                                <RefreshCw className="w-7 h-7 animate-spin text-orange-500" />
                                <span className="text-xs text-gray-300 font-medium tracking-wide">
                                    Starting camera sensor...
                                </span>
                            </div>
                        )}

                        {/* Rule of Thirds Grid Overlay */}
                        {showGrid && (
                            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25 z-10">
                                <div className="border-r border-b border-white" />
                                <div className="border-r border-b border-white" />
                                <div className="border-b border-white" />
                                <div className="border-r border-b border-white" />
                                <div className="border-r border-b border-white" />
                                <div className="border-b border-white" />
                                <div className="border-r border-white" />
                                <div className="border-r border-white" />
                                <div />
                            </div>
                        )}

                        {/* Native Center Autofocus Reticle */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                            <div className="w-20 h-20 border border-yellow-400/50 rounded-sm relative animate-pulse">
                                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-yellow-400" />
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-yellow-400" />
                                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-yellow-400" />
                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-yellow-400" />
                                <div className="absolute inset-0 m-auto w-1 h-1 bg-yellow-400/90 rounded-full" />
                            </div>
                        </div>

                        {/* Native Corner Framing Target */}
                        <div className="absolute inset-4 sm:inset-8 pointer-events-none rounded-2xl z-10">
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/60 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/60 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/60 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/60 rounded-br-lg" />
                        </div>
                    </>
                )}
            </main>

            {/* Bottom Controls Bar (Native Camera Deck) */}
            <footer className="relative w-full px-6 pb-8 pt-4 flex flex-col items-center justify-center gap-3 z-20 bg-black/95 backdrop-blur-md shrink-0 border-t border-white/10">
                {capturedPhoto ? (
                    /* Review Controls: Retake vs Use Photo */
                    <div className="w-full max-w-sm flex items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={handleRetake}
                            className="flex-1 py-3.5 px-6 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-2 backdrop-blur-md transition-all cursor-pointer shadow-lg"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Retake</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="flex-1 py-3.5 px-6 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-emerald-500/25"
                        >
                            <Check className="w-4 h-4" />
                            <span>Use Photo</span>
                        </button>
                    </div>
                ) : (
                    /* Native Camera Shutter & Flip Button */
                    <div className="w-full max-w-sm flex flex-col items-center gap-2">
                        {/* Mode Indicator */}
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-yellow-400 uppercase tracking-widest font-mono drop-shadow">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                            <span>PHOTO</span>
                        </div>

                        {/* Controls Row: Shutter in Center, Camera Switch on Right */}
                        <div className="w-full flex items-center justify-between px-6 mt-1">
                            {/* Left balance spacer */}
                            <div className="w-14 h-14 flex items-center justify-center">
                                <span className="text-[11px] font-mono text-white/70 bg-black/40 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                                    1x
                                </span>
                            </div>

                            {/* Center Native Shutter Button */}
                            <button
                                type="button"
                                onClick={handleSnapPhoto}
                                disabled={isStarting || !!cameraError || isCapturing}
                                className="group relative w-20 h-20 rounded-full border-[4px] border-white flex items-center justify-center transition-transform active:scale-95 disabled:opacity-30 cursor-pointer shadow-2xl"
                                title="Capture Storefront Photo"
                            >
                                <div className="w-15 h-15 rounded-full bg-white transition-all group-active:scale-90 group-active:bg-gray-200 shadow-inner" />
                            </button>

                            {/* Right: Switch Camera Button */}
                            <button
                                type="button"
                                onClick={toggleFacingMode}
                                className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 active:scale-90 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg"
                                title="Switch Front/Rear Camera"
                            >
                                <SwitchCamera className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}
            </footer>
        </div>
    );
}
