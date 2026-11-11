"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
    FileUp,
    Clock,
    CheckCircle2,
    ExternalLink
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
import { LiveCameraModal } from "./LiveCameraModal";
import { compressImage } from "@/lib/imageUtils";
import { s3Api } from "@/lib/api/s3";
import { submitShopVerification, getShopVerification } from "@/lib/api/shop";
import {
    RelationshipType,
    VerificationDocumentType,
    VerificationImageCategory,
    ShopVerificationPayload,
    VerificationImageItem,
    ShopVerificationDetails
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

function formatDateTime(isoString?: string | null): string {
    if (!isoString) return "";
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return isoString;
    }
}

const ALLOWED_DOC_MIME_TYPES = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
]);

/** Validates that a selected supporting document is a PDF or safe raster image. */
export function isAllowedDocumentFile(file: File): boolean {
    if (file.type) {
        return ALLOWED_DOC_MIME_TYPES.has(file.type.toLowerCase());
    }
    return /\.(pdf|png|jpe?g|webp)$/i.test(file.name);
}

/** Returns a validated http(s) URL or null to block unsafe URI schemes like javascript: or data:text/html. */
export function getSafeExternalDocumentUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        return null;
    }
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return parsed.toString();
        }
    } catch {
        return null;
    }
    return null;
}

/** Returns a safe raster image preview URL (http/https or non-SVG base64 image data URI). */
export function getSafeImagePreviewUrl(
    previewUrl: string | null | undefined,
    fileNameOrUrl: string | null | undefined
): string | null {
    if (previewUrl) {
        const trimmed = previewUrl.trim();
        if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(trimmed)) {
            return trimmed;
        }
        const safeRemote = getSafeExternalDocumentUrl(trimmed);
        if (safeRemote) return safeRemote;
    }
    return getSafeExternalDocumentUrl(fileNameOrUrl);
}

/** Determines whether a document or URL represents an image that can open in ImagePreviewModal. */
export function isImageDocument(
    file: File | null,
    previewUrl: string | null,
    fileNameOrUrl: string | null
): boolean {
    if (file?.type) {
        return /^image\/(png|jpe?g|webp|gif)$/i.test(file.type);
    }
    if (previewUrl && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(previewUrl.trim())) {
        return true;
    }
    const candidate = (previewUrl || fileNameOrUrl || "").split("?")[0].split("#")[0].toLowerCase();
    return /\.(jpe?g|png|webp|gif)$/.test(candidate);
}

export interface DocumentUploadFieldProps {
    inputId: string;
    label: React.ReactNode;
    file: File | null;
    fileName: string | null;
    previewUrl: string | null;
    isReadOnly: boolean;
    attachedLabel: string;
    submittedLabel: string;
    emptyTitle: string;
    emptySubtitle: string;
    emptyAccent?: "blue" | "gray";
    previewAlt: string;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    onPreviewImage: (src: string, alt: string) => void;
    onPreviewPdfError?: (message: string) => void;
}

/** Reusable supporting-document dropzone & viewer card without overlapping file input interception. */
export function DocumentUploadField({
    inputId,
    label,
    file,
    fileName,
    previewUrl,
    isReadOnly,
    attachedLabel,
    submittedLabel,
    emptyTitle,
    emptySubtitle,
    emptyAccent = "blue",
    previewAlt,
    onFileChange,
    onRemove,
    onPreviewImage,
    onPreviewPdfError,
}: DocumentUploadFieldProps) {
    const safeExternalUrl = getSafeExternalDocumentUrl(previewUrl) || getSafeExternalDocumentUrl(fileName);
    const isImg = Boolean(fileName && isImageDocument(file, previewUrl, fileName));
    const safeImgSrc = isImg ? getSafeImagePreviewUrl(previewUrl, fileName) : null;
    const displayName = fileName ? fileName.split("/").pop()?.split("?")[0] || fileName : "";
    const canViewLocalPdf = Boolean(
        !isImg &&
            fileName &&
            !safeExternalUrl &&
            (file || (previewUrl && /^data:application\/pdf;base64,/i.test(previewUrl.trim())))
    );

    const handleOpenLocalPdf = (e: React.MouseEvent) => {
        e.stopPropagation();
        const blobSource =
            file ??
            (previewUrl && /^data:application\/pdf;base64,/i.test(previewUrl.trim())
                ? dataURLtoFile(previewUrl, displayName || "document.pdf")
                : null);

        if (!blobSource) return;

        const blobUrl = URL.createObjectURL(blobSource);
        const opened = window.open(blobUrl, "_blank", "noopener,noreferrer");
        if (!opened) {
            URL.revokeObjectURL(blobUrl);
            onPreviewPdfError?.("Popup blocked. Please allow popups to preview this PDF.");
            return;
        }
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    };

    const handleOpenImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (safeImgSrc) {
            onPreviewImage(safeImgSrc, previewAlt);
        }
    };

    return (
        <div className="space-y-2">
            <label
                htmlFor={!fileName && !isReadOnly ? inputId : undefined}
                className="text-sm font-medium text-gray-700 flex items-center justify-between"
            >
                <span>{label}</span>
            </label>

            <div
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center",
                    fileName
                        ? "border-emerald-300 bg-emerald-50/20"
                        : isReadOnly
                            ? "border-gray-200 bg-gray-50/40"
                            : "border-gray-200 hover:border-blue-400 bg-gray-50/40",
                    isReadOnly && "opacity-90"
                )}
            >
                {fileName ? (
                    <div className="relative z-10 flex items-center justify-between gap-2 w-full p-2 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                            {isImg && safeImgSrc ? (
                                <button
                                    type="button"
                                    onClick={handleOpenImage}
                                    className="relative w-10 h-10 rounded-lg overflow-hidden border border-emerald-200 bg-gray-50 shrink-0 cursor-pointer group"
                                    title={`Preview ${previewAlt}`}
                                >
                                    <Image
                                        src={safeImgSrc}
                                        alt={previewAlt}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Eye className="w-3.5 h-3.5" />
                                    </span>
                                </button>
                            ) : (
                                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4" />
                                </div>
                            )}
                            <div className="text-left overflow-hidden min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate max-w-[140px] sm:max-w-[200px]">
                                    {displayName}
                                </p>
                                <span className="text-[10px] text-emerald-600 font-medium">
                                    {isReadOnly ? submittedLabel : attachedLabel}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            {isImg && safeImgSrc ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleOpenImage}
                                        className="py-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                        title={`View ${previewAlt}`}
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span className="text-[11px]">View</span>
                                    </button>
                                    {safeExternalUrl && (
                                        <a
                                            href={safeExternalUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors"
                                            title="Open document in new tab"
                                            aria-label="Open document in new tab"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </>
                            ) : safeExternalUrl ? (
                                <a
                                    href={safeExternalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="py-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                                    title={`View ${previewAlt}`}
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span className="text-[11px]">View</span>
                                </a>
                            ) : canViewLocalPdf ? (
                                <button
                                    type="button"
                                    onClick={handleOpenLocalPdf}
                                    className="py-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                    title={`View ${previewAlt}`}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span className="text-[11px]">View</span>
                                </button>
                            ) : null}

                            {!isReadOnly && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove();
                                    }}
                                    className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Remove file"
                                    aria-label="Remove file"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Mount file input only in empty editable state so it never blocks card action buttons */}
                        {!isReadOnly && (
                            <input
                                type="file"
                                id={inputId}
                                accept=".pdf,image/png,image/jpeg,image/webp"
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                onChange={onFileChange}
                            />
                        )}
                        <div className="py-4 space-y-2">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center mx-auto",
                                    emptyAccent === "blue"
                                        ? "bg-blue-50 text-blue-600"
                                        : "bg-gray-50 text-gray-500"
                                )}
                            >
                                <UploadCloud className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                                <p
                                    className={cn(
                                        "text-xs font-semibold",
                                        isReadOnly
                                            ? "text-gray-500"
                                            : emptyAccent === "blue"
                                                ? "text-blue-600 hover:underline"
                                                : "text-gray-600"
                                    )}
                                >
                                    {isReadOnly ? "No document uploaded" : emptyTitle}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                    {isReadOnly ? "Not submitted for this verification" : emptySubtitle}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function ShopVerificationTab({
    shopId,
    shopName,
    initialLatitude,
    initialLongitude,
    onSuccess,
    onSwitchToDetails
}: ShopVerificationTabProps) {
    const router = useRouter();
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
    const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
    const [authorizationFile, setAuthorizationFile] = useState<File | null>(null);
    const [authorizationFileName, setAuthorizationFileName] = useState<string | null>(null);
    const [authorizationPreviewUrl, setAuthorizationPreviewUrl] = useState<string | null>(null);

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

    // In-browser WebRTC Live Camera slot state
    const [activeCameraSlot, setActiveCameraSlot] = useState<VerificationImageCategory | null>(null);

    // Submission states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showJsonInspector, setShowJsonInspector] = useState(false);
    const [copiedJson, setCopiedJson] = useState(false);
    const [isLoadingExisting, setIsLoadingExisting] = useState(false);
    const [existingVerification, setExistingVerification] = useState<ShopVerificationDetails | null>(null);
    const [backendShopName, setBackendShopName] = useState<string | null>(null);

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
            if (draft.documentFileName) {
                setDocumentFileName(draft.documentFileName);
                const safeDocUrl = getSafeExternalDocumentUrl(draft.documentFileName);
                if (safeDocUrl) setDocumentPreviewUrl(safeDocUrl);
            }
            if (draft.authorizationFileName) {
                setAuthorizationFileName(draft.authorizationFileName);
                const safeAuthUrl = getSafeExternalDocumentUrl(draft.authorizationFileName);
                if (safeAuthUrl) setAuthorizationPreviewUrl(safeAuthUrl);
            }

            if (draft.documentFileBase64 && draft.documentFileName) {
                setDocumentPreviewUrl(draft.documentFileBase64);
                try {
                    setDocumentFile(dataURLtoFile(draft.documentFileBase64, draft.documentFileName));
                } catch {}
            }
            if (draft.authorizationFileBase64 && draft.authorizationFileName) {
                setAuthorizationPreviewUrl(draft.authorizationFileBase64);
                try {
                    setAuthorizationFile(dataURLtoFile(draft.authorizationFileBase64, draft.authorizationFileName));
                } catch {}
            }

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
    const loadVerification = useCallback(async () => {
        if (!shopId) return;

        setIsLoadingExisting(true);
        try {
            const res = await getShopVerification(shopId);
            if (res && res.success && res.data) {
                const raw = res.data as any;
                if (raw.shopName) {
                    setBackendShopName(raw.shopName);
                }

                const v: ShopVerificationDetails | null = raw.verification !== undefined ? raw.verification : raw;

                if (v && v.status) {
                    setExistingVerification(v);

                    if (v.ownerDetails) {
                        if (v.ownerDetails.personName) setPersonName(v.ownerDetails.personName);
                        if (v.ownerDetails.documentType) setDocumentType(v.ownerDetails.documentType as VerificationDocumentType);
                        if (v.ownerDetails.documentNumber) setDocumentNumber(v.ownerDetails.documentNumber);
                        if (v.ownerDetails.documentFileUrl) {
                            setDocumentFileName(v.ownerDetails.documentFileUrl);
                            setDocumentPreviewUrl(v.ownerDetails.documentFileUrl);
                        }
                        if (v.ownerDetails.authorizationFileUrl) {
                            setAuthorizationFileName(v.ownerDetails.authorizationFileUrl);
                            setAuthorizationPreviewUrl(v.ownerDetails.authorizationFileUrl);
                        }
                    } else {
                        const flat = v as any;
                        if (flat.personName) setPersonName(flat.personName);
                        if (flat.documentType) setDocumentType(flat.documentType);
                        if (flat.documentNumber) setDocumentNumber(flat.documentNumber);
                        if (flat.documentFile) {
                            const docVal = typeof flat.documentFile === "string" ? flat.documentFile : flat.documentFile.name;
                            setDocumentFileName(docVal);
                            if (typeof flat.documentFile === "string") setDocumentPreviewUrl(flat.documentFile);
                        }
                        if (flat.authorizationFile) {
                            const authVal = typeof flat.authorizationFile === "string" ? flat.authorizationFile : flat.authorizationFile.name;
                            setAuthorizationFileName(authVal);
                            if (typeof flat.authorizationFile === "string") setAuthorizationPreviewUrl(flat.authorizationFile);
                        }
                    }

                    const loc = v.verificationLocation || (v as any).location;
                    if (loc?.latitude && loc?.longitude) {
                        setGpsCoords({
                            latitude: loc.latitude,
                            longitude: loc.longitude,
                            accuracyMeters: loc.gpsAccuracyMeters || (loc as any).accuracyMeters || 12,
                            lastUpdated: v.submittedAt || new Date().toISOString(),
                        });
                    }

                    if (Array.isArray(v.images)) {
                        setImageSlots((prev) => {
                            const updated = { ...prev };
                            v.images.forEach((img: any) => {
                                const cat = img.category as VerificationImageCategory;
                                if (cat && updated[cat]) {
                                    const url = img.fileUrl || img.file || "";
                                    updated[cat] = {
                                        ...updated[cat],
                                        fileName: url,
                                        previewUrl: url.startsWith("http") ? url : null,
                                        mimeType: img.mimeType || "image/jpeg",
                                        location: img.location || null,
                                    };
                                }
                            });
                            return updated;
                        });
                    }
                }
            }
        } catch (err) {
            console.info("No existing verification record:", err);
        } finally {
            setIsLoadingExisting(false);
        }
    }, [shopId]);

    useEffect(() => {
        loadVerification();
    }, [loadVerification]);

    // Unified handler for primary document and authorization letter selection
    const handleSupportingDocSelection = (
        kind: "document" | "authorization",
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isAllowedDocumentFile(file)) {
            toast.error("Unsupported file format. Please upload PDF, PNG, JPG, or WEBP.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size exceeds 5MB limit.");
            e.target.value = "";
            return;
        }

        const isPrimary = kind === "document";
        if (isPrimary) {
            setDocumentFile(file);
            setDocumentFileName(file.name);
        } else {
            setAuthorizationFile(file);
            setAuthorizationFileName(file.name);
        }
        saveFieldToDraft(isPrimary ? "documentFileName" : "authorizationFileName", file.name);

        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = typeof reader.result === "string" ? reader.result : null;
            if (!dataUrl) return;
            if (isPrimary) {
                setDocumentPreviewUrl(dataUrl);
            } else {
                setAuthorizationPreviewUrl(dataUrl);
            }
            saveFieldToDraft(isPrimary ? "documentFileBase64" : "authorizationFileBase64", dataUrl);
        };
        reader.readAsDataURL(file);

        toast.success(
            isPrimary
                ? `Document selected: ${file.name}`
                : `Authorization letter selected: ${file.name}`
        );
    };

    const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        handleSupportingDocSelection("document", e);

    const handleAuthorizationFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        handleSupportingDocSelection("authorization", e);

    // Process and attach an image file (from in-browser WebRTC camera or gallery picker)
    const attachImageFile = async (
        category: VerificationImageCategory,
        file: File
    ) => {
        let processedFile = file;
        // Only optimize if image is exceptionally large (> 3MB), compressing to a generous 1.5MB to preserve crisp signage & licence readability
        if (file.size > 3 * 1024 * 1024) {
            const toastId = toast.loading(`Optimizing ${file.name}...`);
            try {
                processedFile = await compressImage(file, 1500);
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

        // Persist compressed image in sessionStorage draft
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

        toast.success(`Attached ${imageSlots[category].title} with live geotag!`);
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

        if (!shopId) {
            toast.error("Please save your shop details in the 'Basic Details' tab before submitting verification.");
            return;
        }

        if (!documentNumber.trim()) {
            toast.error("Please enter the official document or licence number");
            return;
        }

        if (!documentFile) {
            toast.error("Please upload the required business licence document");
            return;
        }

        // Validate that all 3 photos have been captured or selected
        const categories: VerificationImageCategory[] = ["SHOP_NAME_BOARD", "SHOP_EXTERIOR", "SHOP_INTERIOR"];
        const missingPhotos = categories.filter((cat) => !imageSlots[cat].file);

        if (missingPhotos.length > 0) {
            const missingTitles = missingPhotos.map((cat) => imageSlots[cat].title).join(", ");
            toast.error(`Please capture or upload photos for: ${missingTitles}`);
            return;
        }

        setIsSubmitting(true);
        const payload = buildPayload();

        try {
            const formData = new FormData();
            formData.append("shopId", String(shopId));
            formData.append("shop_id", String(shopId));
            formData.append("latitude", String(payload.latitude));
            formData.append("longitude", String(payload.longitude));
            formData.append("gpsAccuracyMeters", String(payload.gpsAccuracyMeters));
            formData.append("personName", payload.personName);
            formData.append("relationshipType", payload.relationshipType);
            formData.append("documentType", payload.documentType);
            formData.append("documentNumber", payload.documentNumber);

            // Document file
            formData.append("documentFile", documentFile, documentFile.name);

            // Optional authorization letter
            if (authorizationFile) {
                formData.append("authorizationFile", authorizationFile, authorizationFile.name);
            }

            // Append 3 shop images and construct required imageMetadata array
            const imageMetadataList: Array<{
                category: VerificationImageCategory;
                latitude: number;
                longitude: number;
                accuracyMeters: number;
                capturedAt: string;
            }> = [];

            for (const cat of categories) {
                const slot = imageSlots[cat];
                if (slot.file) {
                    formData.append("images", slot.file, slot.fileName || `${cat.toLowerCase().replace(/_/g, "-")}.jpg`);
                }
                const loc = slot.location || {
                    latitude: payload.latitude,
                    longitude: payload.longitude,
                    accuracyMeters: payload.gpsAccuracyMeters || 12,
                    capturedAt: new Date().toISOString()
                };
                imageMetadataList.push({
                    category: cat,
                    latitude: Number(loc.latitude.toFixed(6)),
                    longitude: Number(loc.longitude.toFixed(6)),
                    accuracyMeters: Math.round(loc.accuracyMeters || 12),
                    capturedAt: loc.capturedAt
                });
            }

            formData.append("imageMetadata", JSON.stringify(imageMetadataList));

            // Submit multipart FormData to backend verification endpoint
            const response = await submitShopVerification(formData, shopId || undefined);
            if (response?.success || (response as any)?.status === "success" || (response as any)?.status === 200) {
                clearDraft();
                toast.success("Shop verification submitted successfully!");
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.push("/shop-manager");
                }
            } else {
                const errMsg = response?.message || (response as any)?.error || "Verification submission failed. Please try again.";
                const isAlreadySubmitted =
                    typeof errMsg === "string" && (
                        errMsg.toLowerCase().includes("already been submitted") ||
                        errMsg.toLowerCase().includes("already submitted")
                    );

                if (isAlreadySubmitted) {
                    clearDraft();
                    toast.info("Verification has already been submitted for review. Redirecting to dashboard...");
                    setTimeout(() => {
                        router.push("/shop-manager");
                    }, 1200);
                } else {
                    toast.error(errMsg);
                }
            }
        } catch (error: any) {
            console.error("Verification submit error:", error);
            const errMsg = error?.message || "Failed to submit verification. Please try again.";
            const isAlreadySubmitted =
                typeof errMsg === "string" && (
                    errMsg.toLowerCase().includes("already been submitted") ||
                    errMsg.toLowerCase().includes("already submitted")
                );

            if (isAlreadySubmitted) {
                clearDraft();
                toast.info("Verification has already been submitted for review. Redirecting to dashboard...");
                setTimeout(() => {
                    router.push("/shop-manager");
                }, 1200);
            } else {
                toast.error(errMsg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isUnderReview =
        existingVerification?.status === "UNDER_REVIEW" ||
        existingVerification?.status === "SUBMITTED" ||
        existingVerification?.status === "MANUAL_REVIEW" ||
        existingVerification?.status === "PENDING";
    const isApproved = existingVerification?.status === "APPROVED";
    const isRejected = existingVerification?.status === "REJECTED";
    const isReadOnly = isUnderReview || isApproved;

    return (
        <div className="space-y-3">
            {/* Verification Status Card if verification record exists */}
            {existingVerification && (
                <div
                    className={cn(
                        "rounded-2xl border p-4 sm:p-5 transition-all shadow-xs",
                        isUnderReview && "bg-amber-50/70 border-amber-200 text-amber-950",
                        isApproved && "bg-emerald-50/70 border-emerald-200 text-emerald-950",
                        isRejected && "bg-rose-50/70 border-rose-200 text-rose-950",
                        !isUnderReview && !isApproved && !isRejected && "bg-blue-50/70 border-blue-200 text-blue-950"
                    )}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-3 border-black/5">
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                                    isUnderReview && "bg-amber-100 text-amber-700",
                                    isApproved && "bg-emerald-100 text-emerald-700",
                                    isRejected && "bg-rose-100 text-rose-700",
                                    !isUnderReview && !isApproved && !isRejected && "bg-blue-100 text-blue-700"
                                )}
                            >
                                {isUnderReview && <Clock className="w-5 h-5 animate-pulse" />}
                                {isApproved && <CheckCircle2 className="w-5 h-5" />}
                                {isRejected && <AlertCircle className="w-5 h-5" />}
                                {!isUnderReview && !isApproved && !isRejected && <ShieldCheck className="w-5 h-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-bold leading-tight">
                                        {isUnderReview && "Shop Verification Under Review"}
                                        {isApproved && "Shop Successfully Verified"}
                                        {isRejected && "Verification Application Rejected"}
                                        {!isUnderReview && !isApproved && !isRejected && `Verification Status: ${existingVerification.status}`}
                                    </h4>
                                    <span
                                        className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                            isUnderReview && "bg-amber-100 text-amber-800 border-amber-300",
                                            isApproved && "bg-emerald-100 text-emerald-800 border-emerald-300",
                                            isRejected && "bg-rose-100 text-rose-800 border-rose-300",
                                            !isUnderReview && !isApproved && !isRejected && "bg-blue-100 text-blue-800 border-blue-300"
                                        )}
                                    >
                                        {existingVerification.status?.replace(/_/g, " ")}
                                    </span>
                                </div>
                                <p className="text-[11px] opacity-75 mt-0.5">
                                    Attempt #{existingVerification.attemptNumber || 1}
                                    {existingVerification.submittedAt && ` • Submitted ${formatDateTime(existingVerification.submittedAt)}`}
                                    {existingVerification.reviewedAt && ` • Reviewed ${formatDateTime(existingVerification.reviewedAt)}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => loadVerification()}
                                disabled={isLoadingExisting}
                                className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-black/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50"
                                title="Refresh verification status"
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5", isLoadingExisting && "animate-spin")} />
                                <span>Refresh</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push("/shop-manager")}
                                className="py-1.5 px-3 rounded-xl bg-white hover:bg-gray-50 text-gray-800 border border-black/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                            >
                                <span>Dashboard</span>
                            </button>
                        </div>
                    </div>

                    {/* Rejection feedback */}
                    {isRejected && (
                        <div className="p-3 rounded-xl bg-white/90 border border-rose-200 text-xs space-y-1 mb-3">
                            <div className="font-bold text-rose-900 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                <span>Feedback / Rejection Reason:</span>
                            </div>
                            <p className="text-gray-700 pl-5">
                                {existingVerification.rejectionReason || "Verification criteria were not met."}
                            </p>
                            {existingVerification.adminRemarks && (
                                <div className="mt-2 pt-2 border-t border-rose-100 pl-5 text-[11px] text-gray-600">
                                    <span className="font-semibold text-gray-800">Admin Remarks: </span>
                                    {existingVerification.adminRemarks}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Metadata Badges: Physical Audit, Owner Details, Proximity, GPS */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                        <div className="p-2 rounded-lg bg-white/60 border border-black/5">
                            <span className="text-[10px] text-gray-500 block">Physical Audit</span>
                            <span className="font-semibold text-gray-800">
                                {existingVerification.physicalStatus?.replace(/_/g, " ") || "Pending"}
                            </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white/60 border border-black/5">
                            <span className="text-[10px] text-gray-500 block">Licence Status</span>
                            <span className="font-semibold text-gray-800">
                                {existingVerification.ownerStatus?.replace(/_/g, " ") || "Submitted"}
                            </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white/60 border border-black/5">
                            <span className="text-[10px] text-gray-500 block">Distance to Shop</span>
                            <span className="font-semibold text-gray-800">
                                {existingVerification.verificationLocation?.distanceMeters !== undefined
                                    ? existingVerification.verificationLocation.distanceMeters < 100
                                        ? "On-site (< 100m)"
                                        : `${(existingVerification.verificationLocation.distanceMeters / 1000).toFixed(1)} km away`
                                    : "GPS recorded"}
                            </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white/60 border border-black/5">
                            <span className="text-[10px] text-gray-500 block">GPS Accuracy</span>
                            <span className="font-semibold text-gray-800">
                                ±{existingVerification.verificationLocation?.gpsAccuracyMeters || 12}m
                            </span>
                        </div>
                    </div>

                    {isUnderReview && (
                        <p className="text-[11px] text-amber-800 mt-3 pt-2 border-t border-amber-200/50">
                            🔒 <strong>Notice:</strong> Your verification request is currently locked under administrative review. Once our team approves your establishment photos and documents, your shop will receive the verified badge.
                        </p>
                    )}
                </div>
            )}

            {/* Verification Guidance Notice */}
            {!existingVerification && (
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
            )}

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
                                    disabled={isReadOnly}
                                    onValueChange={(val) => {
                                        setDocumentType(val as VerificationDocumentType);
                                        saveFieldToDraft("documentType", val);
                                    }}
                                >
                                    <SelectTrigger className="w-full h-11 bg-background/40 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-xl text-sm text-gray-900 transition-all outline-none cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed">
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
                                    disabled={isReadOnly}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            {/* Primary Document File */}
                            <DocumentUploadField
                                inputId="doc-file-input"
                                label={
                                    <>
                                        Business Licence Document <span className="text-red-500">*</span>
                                    </>
                                }
                                file={documentFile}
                                fileName={documentFileName}
                                previewUrl={documentPreviewUrl}
                                isReadOnly={isReadOnly}
                                attachedLabel="Document attached"
                                submittedLabel="Submitted Document"
                                emptyTitle="Click to browse or drop document"
                                emptySubtitle="PDF, JPG, PNG up to 5MB"
                                emptyAccent="blue"
                                previewAlt="Business Licence Document"
                                onFileChange={handleDocumentFileChange}
                                onRemove={() => {
                                    setDocumentFile(null);
                                    setDocumentFileName("");
                                    setDocumentPreviewUrl(null);
                                    saveFieldToDraft("documentFileName", "");
                                    saveFieldToDraft("documentFileBase64", null);
                                }}
                                onPreviewImage={(src, alt) => {
                                    setPreviewModalSrc(src);
                                    setPreviewModalAlt(alt);
                                }}
                                onPreviewPdfError={(msg) => toast.error(msg)}
                            />

                            {/* Authorization Letter (Optional) */}
                            <DocumentUploadField
                                inputId="auth-file-input"
                                label={
                                    <>
                                        Authorization Letter <span className="text-gray-400 font-normal text-xs">(If Representative)</span>
                                    </>
                                }
                                file={authorizationFile}
                                fileName={authorizationFileName}
                                previewUrl={authorizationPreviewUrl}
                                isReadOnly={isReadOnly}
                                attachedLabel="Letter attached"
                                submittedLabel="Submitted Authorization"
                                emptyTitle="Upload Authorization Letter"
                                emptySubtitle="Optional: PDF, JPG, PNG up to 5MB"
                                emptyAccent="gray"
                                previewAlt="Authorization Letter"
                                onFileChange={handleAuthorizationFileChange}
                                onRemove={() => {
                                    setAuthorizationFile(null);
                                    setAuthorizationFileName(null);
                                    setAuthorizationPreviewUrl(null);
                                    saveFieldToDraft("authorizationFileName", null);
                                    saveFieldToDraft("authorizationFileBase64", null);
                                }}
                                onPreviewImage={(src, alt) => {
                                    setPreviewModalSrc(src);
                                    setPreviewModalAlt(alt);
                                }}
                                onPreviewPdfError={(msg) => toast.error(msg)}
                            />
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

                    <div className="p-4 md:p-8 space-y-4">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {(
                                ["SHOP_NAME_BOARD", "SHOP_EXTERIOR", "SHOP_INTERIOR"] as VerificationImageCategory[]
                            ).map((categoryKey) => {
                                const slot = imageSlots[categoryKey];

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
                                                    {slot.previewUrl || slot.fileName ? "Captured" : "Required"}
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
                                                            {!isReadOnly && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveImage(categoryKey)}
                                                                    className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 shadow transition-transform hover:scale-105 cursor-pointer"
                                                                    title="Remove image"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Retake action when editable, or View when read-only */}
                                                    {!isReadOnly ? (
                                                        <div className="flex items-center justify-center pt-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveCameraSlot(categoryKey)}
                                                                className="w-full py-1.5 px-3 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                                                            >
                                                                <Camera className="w-3.5 h-3.5" />
                                                                <span>Retake Photo</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center pt-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setPreviewModalSrc(slot.previewUrl!);
                                                                    setPreviewModalAlt(slot.title);
                                                                }}
                                                                className="w-full py-1.5 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                <span>View Full Size</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center py-6 space-y-3">
                                                    <button
                                                        type="button"
                                                        disabled={isReadOnly}
                                                        onClick={() => setActiveCameraSlot(categoryKey)}
                                                        className={cn(
                                                            "cursor-pointer flex flex-col items-center text-center space-y-2.5 group w-full",
                                                            isReadOnly && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/80 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-105 transition-all flex items-center justify-center shadow-xs">
                                                            <Camera className="w-7 h-7" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-xs font-bold text-gray-800 block group-hover:text-orange-600 transition-colors">
                                                                Open Live Camera
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 block max-w-[180px] leading-tight">
                                                                {slot.recommendedAngle}
                                                            </span>
                                                        </div>
                                                    </button>
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
                        {isReadOnly ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                                <button
                                    type="button"
                                    disabled
                                    className={cn(
                                        "rounded-xl px-5 py-2.5 text-xs font-bold border flex items-center justify-center gap-2 cursor-not-allowed",
                                        isApproved
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                            : "bg-amber-50 text-amber-800 border-amber-300"
                                    )}
                                >
                                    {isApproved ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            <span>Shop Verified & Active</span>
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                            <span>Verification Under Review</span>
                                        </>
                                    )}
                                </button>
                                <PremiumButton
                                    type="button"
                                    onClick={() => router.push("/shop-manager")}
                                    className="rounded-xl px-6 bg-orange-600 hover:bg-orange-700 text-white justify-center text-xs"
                                >
                                    <span>Back to Dashboard</span>
                                </PremiumButton>
                            </div>
                        ) : (
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
                                ) : isRejected ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 shrink-0" />
                                        <span>Update & Resubmit Verification</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4 mr-2 shrink-0" />
                                        <span>Submit for Verification</span>
                                    </>
                                )}
                            </PremiumButton>
                        )}
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

            {/* Native In-Browser Live Camera Viewfinder Modal */}
            <LiveCameraModal
                isOpen={activeCameraSlot !== null}
                onClose={() => setActiveCameraSlot(null)}
                onCapture={(file) => {
                    if (activeCameraSlot) {
                        attachImageFile(activeCameraSlot, file);
                    }
                }}
                title={activeCameraSlot ? imageSlots[activeCameraSlot].title : ""}
                description={activeCameraSlot ? imageSlots[activeCameraSlot].description : ""}
                categoryKey={activeCameraSlot || ""}
                gpsCoords={gpsCoords}
            />
        </div>
    );
}
