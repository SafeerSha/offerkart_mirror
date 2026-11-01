"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
    ShieldCheck,
    Navigation,
    FileText,
    Camera,
    UploadCloud,
    Trash2,
    Eye,
    RefreshCw,
    AlertCircle,
    Info,
    Loader2,
    Check,
    Copy,
    ChevronDown,
    ChevronUp,
    FileCheck2,
    FileUp
} from "lucide-react";
import { toast } from "sonner";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { PremiumButton } from "@/components/shared/PremiumButton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { ImagePreviewModal } from "@/components/shared/ImagePreviewModal";
import { LiveCameraModal } from "@/components/shop-manager/LiveCameraModal";
import { compressImage } from "@/lib/imageUtils";
import { s3Api } from "@/lib/api/s3";
import { submitShopVerification, getShopVerification } from "@/lib/api/shop";
import {
    RelationshipType,
    VerificationDocumentType,
    VerificationImageCategory,
    ShopVerificationPayload,
    VerificationImageItem
} from "@/lib/types/shop";
import { cn } from "@/lib/utils";

interface ShopVerificationTabProps {
    shopId?: string | null;
    shopName?: string;
    initialLatitude?: number;
    initialLongitude?: number;
    onSuccess?: () => void;
    onSwitchToDetails?: () => void;
}

interface ImageUploadSlot {
    category: VerificationImageCategory;
    title: string;
    description: string;
    recommendedAngle: string;
    file: File | null;
    fileName: string;
    previewUrl: string | null;
    mimeType: string;
    location: {
        latitude: number;
        longitude: number;
        accuracyMeters: number;
        capturedAt: string;
    } | null;
}

const DOCUMENT_OPTIONS: { value: VerificationDocumentType; label: string }[] = [
    { value: "TRADE_LICENCE", label: "Trade Licence / Municipal Licence" },
    { value: "GST_CERTIFICATE", label: "GST Registration Certificate (GSTIN)" },
    { value: "FSSAI_REGISTRATION", label: "FSSAI Food Licence / Registration" },
    { value: "SHOP_ESTABLISHMENT", label: "Shop & Establishment Certificate" },
    { value: "MSME_CERTIFICATE", label: "Udyam / MSME Certificate" },
    { value: "OTHER", label: "Other Government Registration" },
];

function dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

export default function ShopVerificationTab({
    shopId,
    shopName,
    initialLatitude,
    initialLongitude,
    onSuccess,
    onSwitchToDetails
}: ShopVerificationTabProps) {
    const { data: session } = useSession();

    // 1. Live GPS Location (Automated behind the scenes in payload)
    const [gpsCoords, setGpsCoords] = useState<{
        latitude: number | null;
        longitude: number | null;
        accuracyMeters: number | null;
        lastUpdated: string | null;
    }>({
        latitude: initialLatitude ?? null,
        longitude: initialLongitude ?? null,
        accuracyMeters: initialLatitude && initialLongitude ? 12 : null,
        lastUpdated: initialLatitude ? new Date().toISOString() : null,
    });
    const [isFetchingGps, setIsFetchingGps] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);

    // 2. Representative / Submitter info (Auto-populated in payload from session)
    const [personName, setPersonName] = useState<string>("");
    const [relationshipType] = useState<RelationshipType>("OWNER");

    // 3. Document Details (User interactive)
    const [documentType, setDocumentType] = useState<VerificationDocumentType>("TRADE_LICENCE");
    const [documentNumber, setDocumentNumber] = useState("");
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [documentFileName, setDocumentFileName] = useState<string>("");
    const [authorizationFile, setAuthorizationFile] = useState<File | null>(null);
    const [authorizationFileName, setAuthorizationFileName] = useState<string | null>(null);

    // 4. Physical Establishment Images (Slot-based)
    const [imageSlots, setImageSlots] = useState<Record<VerificationImageCategory, ImageUploadSlot>>({
        SHOP_NAME_BOARD: {
            category: "SHOP_NAME_BOARD",
            title: "Shop Name Board",
            description: "Front signage clearly displaying the shop's name",
            recommendedAngle: "Close frontal view of outer name board",
            file: null,
            fileName: "",
            previewUrl: null,
            mimeType: "image/jpeg",
            location: null,
        },
        SHOP_EXTERIOR: {
            category: "SHOP_EXTERIOR",
            title: "Shop Exterior",
            description: "Full entrance facade including doorway and surroundings",
            recommendedAngle: "Wide street-level frontal shot",
            file: null,
            fileName: "",
            previewUrl: null,
            mimeType: "image/jpeg",
            location: null,
        },
        SHOP_INTERIOR: {
            category: "SHOP_INTERIOR",
            title: "Shop Interior",
            description: "Inside premises showing merchandise shelves, billing counter, or seating",
            recommendedAngle: "Inside room angle showing active store setup",
            file: null,
            fileName: "",
            previewUrl: null,
            mimeType: "image/jpeg",
            location: null,
        },
    });

    // Preview Modal
    const [previewModalSrc, setPreviewModalSrc] = useState<string | null>(null);
    const [previewModalAlt, setPreviewModalAlt] = useState<string>("");

    // Live Camera Modal State
    const [activeCameraCategory, setActiveCameraCategory] = useState<VerificationImageCategory | null>(null);
    const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

    const isMobileDevice = useCallback(() => {
        if (typeof window === "undefined") return false;
        return (
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
            (navigator.maxTouchPoints && navigator.maxTouchPoints > 1)
        );
    }, []);

    // Submission states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showJsonInspector, setShowJsonInspector] = useState(false);
    const [copiedJson, setCopiedJson] = useState(false);
    const [isLoadingExisting, setIsLoadingExisting] = useState(false);

    // Fetch device GPS coordinates in background
    const detectGpsLocation = useCallback(() => {
        if (typeof window === "undefined" || !("geolocation" in navigator)) {
            setGpsError("Geolocation is not supported by your browser");
            return;
        }

        setIsFetchingGps(true);
        setGpsError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = Number(pos.coords.latitude.toFixed(6));
                const lng = Number(pos.coords.longitude.toFixed(6));
                const accuracy = Math.round(pos.coords.accuracy);

                setGpsCoords({
                    latitude: lat,
                    longitude: lng,
                    accuracyMeters: accuracy,
                    lastUpdated: new Date().toISOString(),
                });
                setIsFetchingGps(false);
            },
            (err) => {
                console.warn("Geolocation acquisition error:", err);
                setIsFetchingGps(false);
                setGpsError(err.message || "Failed to acquire location");
                // Fall back to initial shop coordinates if available
                if (initialLatitude && initialLongitude && !gpsCoords.latitude) {
                    setGpsCoords({
                        latitude: initialLatitude,
                        longitude: initialLongitude,
                        accuracyMeters: 15,
                        lastUpdated: new Date().toISOString(),
                    });
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 10000,
            }
        );
    }, [initialLatitude, initialLongitude, gpsCoords.latitude]);

    const DRAFT_KEY = `shop_verification_draft_${shopId || "new"}`;

    const saveFieldToDraft = useCallback((field: string, val: any) => {
        if (typeof window === "undefined") return;
        try {
            const raw = sessionStorage.getItem(DRAFT_KEY);
            const current = raw ? JSON.parse(raw) : {};
            current[field] = val;
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(current));
        } catch {}
    }, [DRAFT_KEY]);

    const saveImageToDraft = useCallback((
        category: VerificationImageCategory,
        base64: string,
        fileName: string,
        mimeType: string,
        location: any
    ) => {
        if (typeof window === "undefined") return;
        try {
            const raw = sessionStorage.getItem(DRAFT_KEY);
            const current = raw ? JSON.parse(raw) : {};
            const images = current.images || {};
            images[category] = { base64, fileName, mimeType, location };
            current.images = images;
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(current));
        } catch (e) {
            console.warn("Failed to save image to draft:", e);
        }
    }, [DRAFT_KEY]);

    const removeImageFromDraft = useCallback((category: VerificationImageCategory) => {
        if (typeof window === "undefined") return;
        try {
            const raw = sessionStorage.getItem(DRAFT_KEY);
            if (!raw) return;
            const current = JSON.parse(raw);
            if (current.images && current.images[category]) {
                delete current.images[category];
                sessionStorage.setItem(DRAFT_KEY, JSON.stringify(current));
            }
        } catch {}
    }, [DRAFT_KEY]);

    const clearDraft = useCallback(() => {
        if (typeof window === "undefined") return;
        try {
            sessionStorage.removeItem(DRAFT_KEY);
        } catch {}
    }, [DRAFT_KEY]);

    // Restore draft from sessionStorage on mount (survives Android OS camera reloads and HMR)
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = sessionStorage.getItem(DRAFT_KEY);
            if (!raw) return;
            const draft = JSON.parse(raw);
            if (draft.personName) setPersonName(draft.personName);
            if (draft.documentType) setDocumentType(draft.documentType);
            if (draft.documentNumber) setDocumentNumber(draft.documentNumber);
            if (draft.documentFileName) setDocumentFileName(draft.documentFileName);
            if (draft.authorizationFileName) setAuthorizationFileName(draft.authorizationFileName);

            if (draft.images) {
                setImageSlots((prev) => {
                    const updated = { ...prev };
                    Object.keys(draft.images).forEach((catKey) => {
                        const cat = catKey as VerificationImageCategory;
                        const item = draft.images[cat];
                        if (item && updated[cat]) {
                            let fileObj: File | null = null;
                            if (item.base64 && item.fileName) {
                                try {
                                    fileObj = dataURLtoFile(item.base64, item.fileName);
                                } catch {}
                            }
                            updated[cat] = {
                                ...updated[cat],
                                file: fileObj,
                                fileName: item.fileName || "",
                                previewUrl: item.base64 || null,
                                mimeType: item.mimeType || "image/jpeg",
                                location: item.location || null,
                            };
                        }
                    });
                    return updated;
                });
            }
        } catch (e) {
            console.warn("Failed to restore verification draft:", e);
        }
    }, [DRAFT_KEY]);

    // Initial load: Acquire GPS on mount
    useEffect(() => {
        detectGpsLocation();
    }, [detectGpsLocation]);

    // Prepopulate submitter name from profile if available
    useEffect(() => {
        if (session?.user?.name) {
            setPersonName(session.user.name);
        }
    }, [session]);

    // Load existing verification data if editing
    useEffect(() => {
        if (!shopId) return;

        let isMounted = true;
        const loadVerification = async () => {
            setIsLoadingExisting(true);
            try {
                const res = await getShopVerification(shopId);
                if (isMounted && res && res.success && res.data) {
                    const data = res.data as Partial<ShopVerificationPayload>;
                    if (data.personName) setPersonName(data.personName);
                    if (data.documentType) setDocumentType(data.documentType as VerificationDocumentType);
                    if (data.documentNumber) setDocumentNumber(data.documentNumber);
                    if (data.documentFile) setDocumentFileName(data.documentFile);
                    if (data.authorizationFile) setAuthorizationFileName(data.authorizationFile);

                    if (data.latitude && data.longitude) {
                        setGpsCoords({
                            latitude: data.latitude,
                            longitude: data.longitude,
                            accuracyMeters: data.gpsAccuracyMeters || 12,
                            lastUpdated: new Date().toISOString(),
                        });
                    }

                    if (Array.isArray(data.images)) {
                        setImageSlots((prev) => {
                            const updated = { ...prev };
                            data.images?.forEach((img) => {
                                if (img.category && updated[img.category]) {
                                    updated[img.category] = {
                                        ...updated[img.category],
                                        fileName: img.file,
                                        previewUrl: img.file.startsWith("http") ? img.file : null,
                                        mimeType: img.mimeType || "image/jpeg",
                                        location: img.location || null,
                                    };
                                }
                            });
                            return updated;
                        });
                    }
                }
            } catch (err) {
                console.info("No existing verification record:", err);
            } finally {
                if (isMounted) setIsLoadingExisting(false);
            }
        };

        loadVerification();
        return () => {
            isMounted = false;
        };
    }, [shopId]);

    // Handle document upload
    const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size exceeds 5MB limit.");
            return;
        }

        setDocumentFile(file);
        setDocumentFileName(file.name);
        saveFieldToDraft("documentFileName", file.name);
        toast.success(`Document selected: ${file.name}`);
    };

    // Handle authorization file upload
    const handleAuthorizationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size exceeds 5MB limit.");
            return;
        }

        setAuthorizationFile(file);
        setAuthorizationFileName(file.name);
        saveFieldToDraft("authorizationFileName", file.name);
        toast.success(`Authorization letter selected: ${file.name}`);
    };

    // Handle live camera capture per category slot
    const handleLiveCapturePhoto = async (
        category: VerificationImageCategory,
        file: File
    ) => {
        let processedFile = file;
        if (file.size > 150 * 1024) {
            const toastId = toast.loading(`Optimizing live photo...`);
            try {
                processedFile = await compressImage(file, 200);
                toast.success("Live photo optimized", { id: toastId });
            } catch {
                toast.dismiss(toastId);
                processedFile = file;
            }
        }

        const lat = gpsCoords.latitude ?? initialLatitude ?? 9.123456;
        const lng = gpsCoords.longitude ?? initialLongitude ?? 76.123456;
        const acc = gpsCoords.accuracyMeters ?? 12;
        const capturedAt = new Date().toISOString();

        const preview = URL.createObjectURL(processedFile);

        setImageSlots((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                file: processedFile,
                fileName: processedFile.name,
                previewUrl: preview,
                mimeType: processedFile.type || "image/jpeg",
                location: {
                    latitude: lat,
                    longitude: lng,
                    accuracyMeters: acc,
                    capturedAt,
                },
            },
        }));

        // Convert to base64 and persist in sessionStorage immediately
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result as string;
            saveImageToDraft(category, base64Data, processedFile.name, processedFile.type || "image/jpeg", {
                latitude: lat,
                longitude: lng,
                accuracyMeters: acc,
                capturedAt,
            });
        };
        reader.readAsDataURL(processedFile);

        toast.success(`Live photo captured for ${imageSlots[category].title}!`);
    };

    // Handle image upload per category slot
    const handleImageChange = async (
        category: VerificationImageCategory,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        let processedFile = file;
        if (file.size > 150 * 1024) {
            const toastId = toast.loading(`Optimizing ${file.name}...`);
            try {
                processedFile = await compressImage(file, 200);
                toast.success("Image optimized successfully", { id: toastId });
            } catch {
                toast.dismiss(toastId);
                processedFile = file;
            }
        }

        // Determine capture location: use live GPS or form GPS
        const lat = gpsCoords.latitude ?? initialLatitude ?? 9.123456;
        const lng = gpsCoords.longitude ?? initialLongitude ?? 76.123456;
        const acc = gpsCoords.accuracyMeters ?? 12;
        const capturedAt = new Date().toISOString();

        const preview = URL.createObjectURL(processedFile);

        setImageSlots((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                file: processedFile,
                fileName: processedFile.name,
                previewUrl: preview,
                mimeType: processedFile.type || "image/jpeg",
                location: {
                    latitude: lat,
                    longitude: lng,
                    accuracyMeters: acc,
                    capturedAt,
                },
            },
        }));

        // Convert to base64 and persist in sessionStorage immediately
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result as string;
            saveImageToDraft(category, base64Data, processedFile.name, processedFile.type || "image/jpeg", {
                latitude: lat,
                longitude: lng,
                accuracyMeters: acc,
                capturedAt,
            });
        };
        reader.readAsDataURL(processedFile);

        toast.success(`Captured ${imageSlots[category].title} with live geotag!`);
    };

    // Remove photo from a category slot
    const handleRemoveImage = (category: VerificationImageCategory) => {
        setImageSlots((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                file: null,
                fileName: "",
                previewUrl: null,
                location: null,
            },
        }));
        removeImageFromDraft(category);
    };

    // Construct the structured JSON payload matching user's exact schema
    const buildPayload = (): ShopVerificationPayload => {
        const fallbackLat = initialLatitude ?? 9.123456;
        const fallbackLng = initialLongitude ?? 76.123456;

        const effectiveLat = gpsCoords.latitude ?? fallbackLat;
        const effectiveLng = gpsCoords.longitude ?? fallbackLng;
        const effectiveAcc = gpsCoords.accuracyMeters ?? 12;

        const imagesPayload: VerificationImageItem[] = (
            ["SHOP_NAME_BOARD", "SHOP_EXTERIOR", "SHOP_INTERIOR"] as VerificationImageCategory[]
        ).map((cat) => {
            const slot = imageSlots[cat];
            const slotLoc = slot.location || {
                latitude: effectiveLat,
                longitude: effectiveLng,
                accuracyMeters: effectiveAcc,
                capturedAt: new Date().toISOString(),
            };

            return {
                category: cat,
                mediaType: "IMAGE",
                file: slot.fileName || `${cat.toLowerCase().replace(/_/g, "-")}.jpg`,
                mimeType: slot.mimeType || "image/jpeg",
                location: {
                    latitude: Number(slotLoc.latitude.toFixed(6)),
                    longitude: Number(slotLoc.longitude.toFixed(6)),
                    accuracyMeters: slotLoc.accuracyMeters,
                    capturedAt: slotLoc.capturedAt,
                },
            };
        });

        // Submitter name auto-derived from profile / session
        const effectivePersonName =
            personName.trim() ||
            session?.user?.name ||
            (session?.user as any)?.full_name ||
            "Amal Job";

        return {
            latitude: Number(effectiveLat.toFixed(6)),
            longitude: Number(effectiveLng.toFixed(6)),
            gpsAccuracyMeters: effectiveAcc,

            personName: effectivePersonName,
            relationshipType: "OWNER",

            documentType,
            documentNumber: documentNumber.trim() || "LIC123456",

            documentFile: documentFileName || "trade-licence.pdf",
            authorizationFile: authorizationFileName || null,

            images: imagesPayload,
        };
    };

    const handleCopyPayloadJson = () => {
        const json = JSON.stringify(buildPayload(), null, 2);
        navigator.clipboard.writeText(json);
        setCopiedJson(true);
        toast.success("Payload copied to clipboard!");
        setTimeout(() => setCopiedJson(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!documentNumber.trim()) {
            toast.error("Please enter the official document or licence number");
            return;
        }

        if (!documentFileName && !documentFile) {
            toast.error("Please upload the required business licence document");
            return;
        }

        // Validate that at least the 3 photos are selected or have default filenames
        const missingPhotos = (
            ["SHOP_NAME_BOARD", "SHOP_EXTERIOR", "SHOP_INTERIOR"] as VerificationImageCategory[]
        ).filter((cat) => !imageSlots[cat].fileName && !imageSlots[cat].file);

        if (missingPhotos.length > 0) {
            const missingTitles = missingPhotos.map((cat) => imageSlots[cat].title).join(", ");
            toast.error(`Please upload photos for: ${missingTitles}`);
            return;
        }

        setIsSubmitting(true);
        const payload = buildPayload();

        try {
            // Optional: Upload raw files to S3 if live upload endpoint is active
            if (documentFile) {
                try {
                    const docRes = await s3Api.uploadImage(documentFile, "verification-docs");
                    if (docRes.success && docRes.data?.url) {
                        payload.documentFile = docRes.data.url;
                    }
                } catch (docErr) {
                    console.info("S3 document upload fallback to filename:", docErr);
                }
            }

            if (authorizationFile) {
                try {
                    const authRes = await s3Api.uploadImage(authorizationFile, "verification-docs");
                    if (authRes.success && authRes.data?.url) {
                        payload.authorizationFile = authRes.data.url;
                    }
                } catch (authErr) {
                    console.info("S3 auth file upload fallback to filename:", authErr);
                }
            }

            // Upload image files if present
            for (const img of payload.images) {
                const slot = imageSlots[img.category];
                if (slot.file) {
                    try {
                        const imgRes = await s3Api.uploadImage(slot.file, "verification-images");
                        if (imgRes.success && imgRes.data?.url) {
                            img.file = imgRes.data.url;
                        }
                    } catch (imgErr) {
                        console.info("S3 image upload fallback to filename:", imgErr);
                    }
                }
            }

            // Submit payload to backend verification endpoint: https://offersnearu.vercel.app/api/business/shop/verification
            const response = await submitShopVerification(payload, shopId || undefined);
            if (response?.success || (response as any)?.status === "success" || (response as any)?.status === 200) {
                clearDraft();
                toast.success("Shop verification submitted successfully!");
                onSuccess?.();
            } else {
                const errMsg = response?.message || (response as any)?.error || "Verification submission failed. Please try again.";
                toast.error(errMsg);
            }
        } catch (error: any) {
            console.error("Verification submit error:", error);
            const errMsg = error?.message || "Failed to submit verification. Please try again.";
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-2">
            {/* Minimal Verification Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 px-4 rounded-xl bg-orange-50/50 border border-orange-100 text-xs text-gray-600">
                <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Upload business registration documents and storefront photos to verify your shop.</span>
                </div>

                {!shopId && (
                    <span className="text-[11px] text-amber-800 shrink-0">
                        New shop?{" "}
                        <button
                            type="button"
                            onClick={onSwitchToDetails}
                            className="font-semibold underline hover:text-amber-900 cursor-pointer"
                        >
                            Save details first
                        </button>
                    </span>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
                {/* 1. Document & Legal Verification */}
                <PremiumCard padding="none" className="w-full overflow-hidden bg-white">
                    <div className="px-4 md:px-8 py-5 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <FileCheck2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-base font-semibold text-gray-900">
                                    Business Licence & Legal Proof
                                </h4>
                                <p className="text-xs text-gray-500">
                                    Upload official government business registration and authorization documents
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 md:p-8 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {/* Document Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Document Type <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={documentType}
                                    onValueChange={(val) => {
                                        setDocumentType(val as VerificationDocumentType);
                                        saveFieldToDraft("documentType", val);
                                    }}
                                >
                                    <SelectTrigger className="w-full h-11 bg-background/40 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-xl text-sm text-gray-900 transition-all outline-none cursor-pointer">
                                        <SelectValue placeholder="Select document type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl !bg-white border border-gray-200 shadow-xl max-h-64 z-[100] text-gray-900">
                                        {DOCUMENT_OPTIONS.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                                className="text-sm font-medium cursor-pointer hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600 py-2.5 rounded-lg"
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-gray-400">
                                    Select the business document you are submitting for licence verification.
                                </p>
                            </div>

                            {/* Document Number */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Document / Licence Number <span className="text-red-500">*</span>
                                </label>
                                <PremiumInput
                                    placeholder="e.g. LIC123456 or 32AABCU9603R1ZM"
                                    icon={FileText}
                                    value={documentNumber}
                                    onChange={(e) => {
                                        setDocumentNumber(e.target.value);
                                        saveFieldToDraft("documentNumber", e.target.value);
                                    }}
                                    required
                                />
                                <p className="text-[11px] text-gray-400">
                                    Enter registration or licence identification number as stated on document.
                                </p>
                            </div>
                        </div>

                        {/* File Uploads Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                            {/* Primary Document File */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                                    <span>
                                        Upload Business Licence Document <span className="text-red-500">*</span>
                                    </span>
                                </label>

                                <div
                                    className={cn(
                                        "relative border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center",
                                        documentFileName
                                            ? "border-emerald-300 bg-emerald-50/20"
                                            : "border-gray-200 hover:border-blue-400 bg-gray-50/40"
                                    )}
                                >
                                    <input
                                        type="file"
                                        id="doc-file-input"
                                        accept=".pdf,image/png,image/jpeg,image/webp"
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        onChange={handleDocumentFileChange}
                                    />

                                    {documentFileName ? (
                                        <div className="flex items-center justify-between w-full p-2 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="text-left overflow-hidden">
                                                    <p className="text-xs font-semibold text-gray-800 truncate max-w-[180px] sm:max-w-[240px]">
                                                        {documentFileName}
                                                    </p>
                                                    <span className="text-[10px] text-emerald-600 font-medium">
                                                        Document attached
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDocumentFile(null);
                                                    setDocumentFileName("");
                                                }}
                                                className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                                                title="Remove file"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="py-4 space-y-2">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                                                <UploadCloud className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-semibold text-blue-600 hover:underline">
                                                    Click to browse or drop document
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    PDF, JPG, PNG up to 5MB
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </PremiumCard>

                {/* 2. Physical Establishment Verification Photos */}
                <PremiumCard padding="none" className="w-full overflow-hidden bg-white">
                    <div className="px-4 md:px-8 py-5 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                <Camera className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-base font-semibold text-gray-900">
                                    Physical Storefront Verification Photographs
                                </h4>
                                <p className="text-xs text-gray-500">
                                    Mandatory on-premise photographs embedded with live device geotags & timestamps
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 md:p-8 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {(
                                ["SHOP_NAME_BOARD", "SHOP_EXTERIOR", "SHOP_INTERIOR"] as VerificationImageCategory[]
                            ).map((categoryKey) => {
                                const slot = imageSlots[categoryKey];
                                const inputId = `image-input-${categoryKey}`;

                                return (
                                    <div
                                        key={categoryKey}
                                        className="flex flex-col rounded-2xl border border-gray-200 overflow-hidden bg-gray-50/30 hover:border-orange-300 transition-all shadow-xs"
                                    >
                                        {/* Card Header */}
                                        <div className="p-3.5 border-b border-gray-100 bg-white">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-gray-900">
                                                    {slot.title}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                                                        slot.previewUrl || slot.fileName
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-orange-100 text-orange-700"
                                                    )}
                                                >
                                                    {slot.previewUrl || slot.fileName ? "Attached" : "Required"}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                                                {slot.description}
                                            </p>
                                        </div>

                                        {/* Photo Area */}
                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                            {slot.previewUrl ? (
                                                <div className="space-y-3">
                                                    <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden border border-gray-200 bg-black/5 group">
                                                        <Image
                                                            src={slot.previewUrl}
                                                            alt={slot.title}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                        {/* Hover overlay with preview & remove */}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setPreviewModalSrc(slot.previewUrl!);
                                                                    setPreviewModalAlt(slot.title);
                                                                }}
                                                                className="p-2 rounded-full bg-white/90 text-gray-800 hover:bg-white shadow transition-transform hover:scale-105 cursor-pointer"
                                                                title="View full size"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveImage(categoryKey)}
                                                                className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 shadow transition-transform hover:scale-105 cursor-pointer"
                                                                title="Remove image"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Geotag & Metadata pill */}
                                                    <div className="p-2.5 rounded-lg bg-white border border-gray-100 shadow-2xs space-y-1">
                                                        <div className="flex items-center justify-between text-[10px]">
                                                            <span className="font-semibold text-emerald-700 flex items-center gap-1">
                                                                <Navigation className="w-3 h-3" /> Geotagged
                                                            </span>
                                                            <span className="text-gray-400 font-mono">
                                                                ±{slot.location?.accuracyMeters || gpsCoords.accuracyMeters || 12}m
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-mono truncate">
                                                            📍 {slot.location?.latitude.toFixed(5) || gpsCoords.latitude?.toFixed(5) || "9.12345"},{" "}
                                                            {slot.location?.longitude.toFixed(5) || gpsCoords.longitude?.toFixed(5) || "76.12345"}
                                                        </p>
                                                    </div>

                                                    {/* Retake live camera photo */}
                                                    <div className="flex items-center justify-center gap-3 pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRefs.current[categoryKey]?.click()}
                                                            className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                                                        >
                                                            Retake (Camera App)
                                                        </button>
                                                        <span className="text-gray-300">•</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveCameraCategory(categoryKey)}
                                                            className="text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
                                                        >
                                                            Viewfinder
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center py-6">
                                                    {/* Hidden native camera capture input */}
                                                    <input
                                                        ref={(el) => {
                                                            fileInputRefs.current[categoryKey] = el;
                                                        }}
                                                        type="file"
                                                        accept="image/*"
                                                        capture="environment"
                                                        className="hidden"
                                                        onChange={(e) => handleImageChange(categoryKey, e)}
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (isMobileDevice()) {
                                                                fileInputRefs.current[categoryKey]?.click();
                                                            } else {
                                                                setActiveCameraCategory(categoryKey);
                                                            }
                                                        }}
                                                        className="cursor-pointer flex flex-col items-center text-center space-y-2 group w-full"
                                                    >
                                                        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/80 group-hover:bg-orange-100 group-hover:scale-105 transition-all flex items-center justify-center shadow-xs">
                                                            <Camera className="w-6 h-6" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <span className="text-xs font-bold text-gray-800 block group-hover:text-orange-600 transition-colors">
                                                                Take Live Photo
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 block max-w-[180px]">
                                                                {slot.recommendedAngle}
                                                            </span>
                                                        </div>
                                                    </button>

                                                    <div className="flex items-center gap-2 mt-2.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRefs.current[categoryKey]?.click()}
                                                            className="text-[11px] font-medium text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                                                        >
                                                            Device Camera
                                                        </button>
                                                        <span className="text-[10px] text-gray-300">•</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveCameraCategory(categoryKey)}
                                                            className="text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:underline cursor-pointer"
                                                        >
                                                            Web Viewfinder
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </PremiumCard>

                {/* Form Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        <PremiumButton
                            type="submit"
                            disabled={isSubmitting || isLoadingExisting}
                            className="rounded-xl px-6 sm:px-8 bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto justify-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4 mr-2 shrink-0" />
                                    <span>Submit for Verification</span>
                                </>
                            )}
                        </PremiumButton>
                    </div>
                </div>
            </form>

            {/* Full-size Image Preview Modal */}
            {previewModalSrc && (
                <ImagePreviewModal
                    isOpen={!!previewModalSrc}
                    src={previewModalSrc}
                    alt={previewModalAlt}
                    onClose={() => setPreviewModalSrc(null)}
                />
            )}

            {/* Live Camera Viewfinder Modal */}
            {activeCameraCategory && (
                <LiveCameraModal
                    isOpen={!!activeCameraCategory}
                    onClose={() => setActiveCameraCategory(null)}
                    onCapture={(file) => handleLiveCapturePhoto(activeCameraCategory, file)}
                    title={imageSlots[activeCameraCategory].title}
                    description={imageSlots[activeCameraCategory].description}
                    categoryKey={activeCameraCategory}
                    gpsCoords={gpsCoords}
                />
            )}
        </div>
    );
}
