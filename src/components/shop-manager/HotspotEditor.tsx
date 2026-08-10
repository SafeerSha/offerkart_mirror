"use client";

import { useState, useRef, MouseEvent, TouchEvent, FormEvent, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    ChevronLeft, Save, Info, Send, CheckSquare, Rocket, Zap,
    Trash2, Eye, Plus, IndianRupee,
    Type, AlignLeft, RefreshCcw, Tag, ChevronDown, Check, Search,
    CheckCircle2, AlertCircle, FileEdit, X, ZoomIn, ZoomOut, RotateCcw, Maximize2,
    Image as ImageIcon
} from "lucide-react";
import Image from "next/image";

import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import { useSubcategories } from "@/hooks/useApi";
import { Heading, Subheading, Text } from "@/components/shared/Typography";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { AppModal } from "@/components/shared/AppModal";
import { cn } from "@/lib/utils";
import { MarkedItem } from "@/lib/types/offer";
import { toast } from "sonner";
import { storage } from "@/lib/storage";
import { MarkedItem as MarkedItemType } from "@/lib/types/offer";
import { extractProductFromImage } from "@/lib/ai/aiClient";

interface PosterData {
    posterSrc: string;
    markedItems: MarkedItemType[];
    currency: string;
}

interface HotspotEditorProps {
    poster: {
        id: string;
        posterSrc: string;
        markedItems: MarkedItemType[];
    };
    onSave: (markedItems: MarkedItemType[]) => void;
    onCancel: () => void;
}

interface Position { x: number; y: number; }
interface Rect { x: number; y: number; width: number; height: number; }

export function HotspotEditor({ poster, onSave, onCancel }: HotspotEditorProps) {
    const { categoryHierarchy, mainCategories, getCategoryId } = useCategoryHierarchy();

    const [formData, setFormData] = useState({
        name: '',
        mainCategory: '',
        subcategories: [] as string[],
        subcategoryId: null as number | null,
        description: '',
        productImage: '',
        oldPrice: '',
        offerPrice: ''
    });

    const activeCategoryId = formData.mainCategory ? getCategoryId(formData.mainCategory) : null;
    const { data: subcategoriesRes, isLoading: isLoadingSubcategories } = useSubcategories(activeCategoryId);
    const dynamicSubcategories = subcategoriesRes?.success && subcategoriesRes.data
        ? subcategoriesRes.data
        : [];

    const [posterData, setPosterData] = useState<PosterData>({
        posterSrc: poster.posterSrc,
        markedItems: poster.markedItems || [],
        currency: '₹'
    });
    const [savedItemIds, setSavedItemIds] = useState<Set<string>>(() => new Set((poster.markedItems || []).map(item => item.id)));
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<Position | null>(null);
    const [currentRect, setCurrentRect] = useState<Rect | null>(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [showModal, setShowModal] = useState(false);
    const [currentMarkedItem, setCurrentMarkedItem] = useState<MarkedItemType | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);

    const [showCropper, setShowCropper] = useState(false);
    const [cropperImage, setCropperImage] = useState('');
    const [cropRect, setCropRect] = useState<Rect | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [cropStartPos, setCropStartPos] = useState<Position | null>(null);
    const [showBackWarning, setShowBackWarning] = useState(false);

    const [categoryOpen, setCategoryOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [mainCategoryOpen, setMainCategoryOpen] = useState(false);
    const [mainCategorySearch, setMainCategorySearch] = useState('');
    const [imgCrossOrigin, setImgCrossOrigin] = useState<"anonymous" | undefined>("anonymous");

    const [zoomedImageSrc, setZoomedImageSrc] = useState<string | null>(null);
    const [zoomScale, setZoomScale] = useState<number>(1);

    useEffect(() => {
        if (!zoomedImageSrc) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setZoomedImageSrc(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [zoomedImageSrc]);

    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const productFileInputRef = useRef<HTMLInputElement>(null);
    const cropperImgRef = useRef<HTMLImageElement>(null);
    const cropperContainerRef = useRef<HTMLDivElement>(null);

    // Keep state in sync with props
    useEffect(() => {
        setPosterData({
            posterSrc: poster.posterSrc,
            markedItems: poster.markedItems || [],
            currency: '₹'
        });

        setSavedItemIds(new Set((poster.markedItems || []).map(item => item.id)));

        // Reset CORS setting for new images
        setImgCrossOrigin("anonymous");

        // ONLY reset image size if the source image actually changes
        // This prevents flickering/disappearing hotspots if the parent re-renders 
        // with the same poster but different metadata.
        if (posterData.posterSrc !== poster.posterSrc) {
            setImageSize({ width: 0, height: 0 });
        }

        setShowModal(false);
        setHighlightedId(null);
    }, [poster.id, poster.posterSrc, poster.markedItems]);

    useEffect(() => {
        if (!imgRef.current) return;
        const img = imgRef.current;

        const updateSize = () => {
            if (img.offsetWidth && img.offsetHeight) {
                setImageSize({ width: img.offsetWidth, height: img.offsetHeight });
            }
        };

        if (img.complete) updateSize();

        const observer = new ResizeObserver(updateSize);
        observer.observe(img);

        return () => observer.disconnect();
    }, [posterData.posterSrc]);

    const getEventCoords = (e: MouseEvent | TouchEvent): Position => {
        const rect = containerRef.current!.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
        if (showModal || showCropper) return;
        const { x, y } = getEventCoords(e);
        setStartPos({ x, y });
        setIsDrawing(true);
        setCurrentRect({ x, y, width: 0, height: 0 });
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing || !startPos) return;
        const { x, y } = getEventCoords(e);
        setCurrentRect({
            x: Math.min(startPos.x, x),
            y: Math.min(startPos.y, y),
            width: Math.abs(x - startPos.x),
            height: Math.abs(y - startPos.y)
        });
    };

    const handlePointerUp = async () => {
        if (!isDrawing || !currentRect || currentRect.width < 10 || currentRect.height < 10 || imageSize.width === 0 || imageSize.height === 0) {
            setIsDrawing(false);
            setCurrentRect(null);
            return;
        }

        setIsDrawing(false);
        const { x, y, width, height } = currentRect;

        const relX = x / imageSize.width;
        const relY = y / imageSize.height;
        const relW = width / imageSize.width;
        const relH = height / imageSize.height;

        const id = crypto.randomUUID();
        const tempItem: MarkedItemType = {
            id, x: relX, y: relY, width: relW, height: relH,
            name: 'Processing...', mainCategory: '', subcategories: [], description: '', productImage: '',
            oldPrice: 0, offerPrice: 0, currency: posterData.currency
        };

        setPosterData(prev => ({ ...prev, markedItems: [...prev.markedItems, tempItem] }));
        setCurrentRect(null);

        setIsProcessing(true);
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
            const img = imgRef.current;

            // Robust validation of image and measurements
            if (!img || !img.complete || img.naturalWidth === 0 || !imageSize.width || !imageSize.height) {
                console.error("Image state check failed:", {
                    imgExists: !!img,
                    complete: img?.complete,
                    naturalWidth: img?.naturalWidth,
                    measureWidth: imageSize.width
                });
                throw new Error('Image not fully loaded or has invalid dimensions. Please wait a moment and try again.');
            }

            const scaleX = img.naturalWidth / imageSize.width;
            const scaleY = img.naturalHeight / imageSize.height;

            const sw = Math.max(1, Math.round(width * scaleX));
            const sh = Math.max(1, Math.round(height * scaleY));
            canvas.width = sw;
            canvas.height = sh;

            // Validate canvas has valid dimensions before drawing
            if (canvas.width === 0 || canvas.height === 0) {
                throw new Error('Failed to create valid cropping area.');
            }

            ctx.drawImage(img, x * scaleX, y * scaleY, sw, sh, 0, 0, sw, sh);

            let croppedDataUrl: string;
            try {
                croppedDataUrl = canvas.toDataURL('image/png');
            } catch (e) {
                if (e instanceof DOMException && e.name === 'SecurityError') {
                    console.warn('Image source blocks CORS — cannot crop for AI extraction.');
                    toast.error('Cannot process cross-origin images. Please enter details manually.');
                    setIsProcessing(false);
                    handleEditItem(tempItem);
                    return;
                }
                throw e;
            }

            // --- Gemini Vision Extraction ---
            const result = await extractProductFromImage(croppedDataUrl, 'image/png');

            if (result.success && result.data) {
                const d = result.data;
                const displayName = d.brand && d.productName
                    ? `${d.brand} ${d.productName}`
                    : d.productName || d.brand || 'Marked Product';

                let validMainCategory = '';
                let validSubcategories: string[] = [];

                if (d.mainCategory && mainCategories.includes(d.mainCategory)) {
                    validMainCategory = d.mainCategory;

                    if (Array.isArray(d.subcategories)) {
                        validSubcategories = d.subcategories.filter((sub: string) =>
                            categoryHierarchy[validMainCategory]?.includes(sub)
                        );
                    }
                }

                const updatedItem: MarkedItemType = {
                    ...tempItem,
                    name: displayName,
                    description: d.description || '',
                    productImage: croppedDataUrl,
                    oldPrice: d.oldPrice || 0,
                    offerPrice: d.offerPrice || 0,
                    mainCategory: validMainCategory,
                    subcategories: validSubcategories,
                };

                setPosterData(prev => ({
                    ...prev,
                    markedItems: prev.markedItems.map(item => item.id === id ? updatedItem : item)
                }));

                toast.success(`Extracted: ${displayName}`);
                handleEditItem(updatedItem);
            } else {
                console.warn('[HotspotEditor] Gemini extraction failed:', result.error);
                toast.error(result.error || 'AI extraction failed. Please enter details manually.');
                handleEditItem(tempItem);
            }
        } catch (err) {
            console.error("Extraction Error:", err);
            toast.error("AI extraction failed. Please enter details manually.");
            handleEditItem(tempItem);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEditItem = (item: MarkedItemType) => {
        setCurrentMarkedItem(item);
        setFormData({
            name: item.name,
            mainCategory: item.mainCategory || '',
            subcategories: item.subcategories || [],
            subcategoryId: item.subcategoryId || null,
            description: item.description,
            productImage: item.productImage,
            oldPrice: item.oldPrice ? item.oldPrice.toString() : '',
            offerPrice: item.offerPrice ? item.offerPrice.toString() : ''
        });
        setShowModal(true);
        setHighlightedId(item.id);
    };

    const handleDeleteItem = (id: string) => {
        setPosterData(prev => ({
            ...prev,
            markedItems: prev.markedItems.filter(item => item.id !== id)
        }));
        setSavedItemIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        if (currentMarkedItem?.id === id) setShowModal(false);
        toast.success("Item removed");
    };

    const handleSaveForm = (e: FormEvent) => {
        e.preventDefault();
        if (!currentMarkedItem) return;

        if (!formData.name?.trim()) {
            toast.error("Product Name is required");
            return;
        }
        if (!formData.mainCategory) {
            toast.error("Main Category is required");
            return;
        }
        if (!formData.subcategories || formData.subcategories.length === 0) {
            toast.error("At least one Subcategory is required");
            return;
        }
        if (!formData.offerPrice || isNaN(parseFloat(formData.offerPrice))) {
            toast.error("Offer Price is required and must be a valid number");
            return;
        }

        const updatedItem: MarkedItemType = {
            ...currentMarkedItem,
            name: formData.name,
            mainCategory: formData.mainCategory,
            subcategories: formData.subcategories,
            subcategoryId: formData.subcategoryId || undefined,
            description: formData.description,
            productImage: formData.productImage,
            oldPrice: Number(formData.oldPrice),
            offerPrice: Number(formData.offerPrice),
            currency: posterData.currency
        };

        setPosterData(prev => ({
            ...prev,
            markedItems: prev.markedItems.map(item => item.id === updatedItem.id ? updatedItem : item)
        }));

        setSavedItemIds(prev => {
            const next = new Set(prev);
            next.add(updatedItem.id);
            return next;
        });

        setShowModal(false);
        setHighlightedId(null);
        toast.success("Item saved");
    };

    const handleCancelForm = () => {
        if (currentMarkedItem && !savedItemIds.has(currentMarkedItem.id)) {
            // Remove the unsaved new marking
            setPosterData(prev => ({
                ...prev,
                markedItems: prev.markedItems.filter(item => item.id !== currentMarkedItem.id)
            }));
        }
        setShowModal(false);
        setHighlightedId(null);
    };

    const handleAIFill = async () => {
        if (!currentMarkedItem?.productImage) {
            toast.error('No product image available for re-extraction.');
            return;
        }
        setIsProcessing(true);
        try {
            const result = await extractProductFromImage(currentMarkedItem.productImage, 'image/png');
            if (result.success && result.data) {
                const d = result.data;
                const displayName = d.brand && d.productName
                    ? `${d.brand} ${d.productName}`
                    : d.productName || d.brand || formData.name;

                setFormData(prev => ({
                    ...prev,
                    name: displayName || prev.name,
                    description: d.description || prev.description,
                    oldPrice: d.oldPrice ? String(d.oldPrice) : prev.oldPrice,
                    offerPrice: d.offerPrice ? String(d.offerPrice) : prev.offerPrice,
                    mainCategory: d.mainCategory || prev.mainCategory,
                    subcategories: d.subcategories?.length ? d.subcategories : prev.subcategories,
                }));
                toast.success('Form updated with AI extraction');
            } else {
                toast.error(result.error || 'AI re-extraction failed.');
            }
        } catch (err) {
            toast.error('AI re-extraction failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const startProductImageUpload = () => productFileInputRef.current?.click();

    const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setCropperImage(reader.result as string);
                setShowCropper(true);
                setCropRect(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropperDown = (e: MouseEvent) => {
        const rect = cropperContainerRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCropStartPos({ x, y });
        setIsCropping(true);
        setCropRect({ x, y, width: 0, height: 0 });
    };

    const handleCropperMove = (e: MouseEvent) => {
        if (!isCropping || !cropStartPos) return;
        const rect = cropperContainerRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCropRect({
            x: Math.min(cropStartPos.x, x),
            y: Math.min(cropStartPos.y, y),
            width: Math.abs(x - cropStartPos.x),
            height: Math.abs(y - cropStartPos.y)
        });
    };

    const applyCrop = () => {
        if (!cropRect || !cropperImgRef.current) return;
        const img = cropperImgRef.current;
        const scaleX = img.naturalWidth / img.offsetWidth;
        const scaleY = img.naturalHeight / img.offsetHeight;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = cropRect.width * scaleX;
        canvas.height = cropRect.height * scaleY;

        ctx.drawImage(img, cropRect.x * scaleX, cropRect.y * scaleY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        setFormData(prev => ({ ...prev, productImage: canvas.toDataURL() }));
        setShowCropper(false);
    };

    const handleFinish = () => {
        onSave(posterData.markedItems);
    };

    return (
        <div className="w-full h-full bg-background flex flex-col">
            <main className="flex-1 max-w-7xl mx-auto w-full px-0 sm:px-4 py-2 sm:py-4 relative">
                <div className="flex flex-col xl:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-0">
                            <div>
                                <Heading className="text-3xl font-bold text-gradient">Mark Items</Heading>
                                <Text className="opacity-60 text-sm">Draw boxes over items on your poster.</Text>
                            </div>

                            <div className="flex gap-3 shrink-0">
                                <PremiumButton variant="outline" onClick={() => setShowBackWarning(true)} leftIcon={ChevronLeft}>
                                    Back
                                </PremiumButton>
                                <PremiumButton
                                    variant="default"
                                    onClick={handleFinish}
                                    leftIcon={Save}
                                >
                                    Save & Continue
                                </PremiumButton>
                            </div>
                        </div>



                        <PremiumCard padding="none" className="relative overflow-hidden bg-black/5 border-primary/20 p-0 sm:p-4">
                            <div
                                ref={containerRef}
                                className="relative w-full cursor-crosshair select-none overflow-hidden rounded-2xl touch-none"
                                onMouseDown={handlePointerDown}
                                onMouseMove={handlePointerMove}
                                onMouseUp={handlePointerUp}
                                onTouchStart={handlePointerDown}
                                onTouchMove={handlePointerMove}
                                onTouchEnd={handlePointerUp}
                            >
                                {posterData.posterSrc && (
                                    <Image
                                        ref={imgRef}
                                        src={posterData.posterSrc}
                                        alt="Poster"
                                        width={1200}
                                        height={1600}
                                        unoptimized
                                        crossOrigin={imgCrossOrigin}
                                        className="w-full h-auto block rounded-2xl"
                                        onLoad={(e) => {
                                            const target = e.currentTarget;
                                            setImageSize({ width: target.offsetWidth, height: target.offsetHeight });
                                        }}
                                        onError={() => {
                                            if (imgCrossOrigin === "anonymous") {
                                                console.warn("CORS load failed, retrying without crossOrigin...");
                                                setImgCrossOrigin(undefined);
                                            } else {
                                                toast.error("Failed to load image. Even without CORS, the image source appears unreachable.");
                                            }
                                        }}
                                        draggable={false}
                                    />
                                )}

                                {imageSize.width > 0 && posterData.markedItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "absolute border-2 transition-all duration-300 group/hotspot",
                                            highlightedId === item.id
                                                ? "border-primary bg-primary/30 ring-4 ring-primary/20 scale-[1.02] z-10"
                                                : "border-red-500 bg-red-500/10 hover:bg-red-500/20"
                                        )}
                                        style={{
                                            left: `${item.x * 100}%`,
                                            top: `${item.y * 100}%`,
                                            width: `${item.width * 100}%`,
                                            height: `${item.height * 100}%`,
                                        }}
                                        onClick={(e) => { e.stopPropagation(); handleEditItem(item); }}
                                    >
                                        <div className="absolute top-0 right-0 -translate-y-full mb-1 opacity-0 group-hover/hotspot:opacity-100 transition-opacity">
                                            <div className="bg-red-500 text-white p-1 rounded-md shadow-lg" onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}>
                                                <Trash2 className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Current Drawing Rect */}
                                {currentRect && (
                                    <div
                                        className="absolute border-2 border-dashed border-red-500 bg-red-500/20"
                                        style={{
                                            left: currentRect.x,
                                            top: currentRect.y,
                                            width: currentRect.width,
                                            height: currentRect.height,
                                        }}
                                    />
                                )}

                                {/* Loading Overlay */}
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                                        <div className="flex flex-col items-center gap-4 text-white">
                                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                            <Text className="font-bold">Identifying Item...</Text>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </PremiumCard>

                    </div>
                    <div className="w-full xl:w-96 space-y-6 px-2 sm:px-0">
                        <PremiumCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <CheckSquare className="w-5 h-5 text-primary" />
                                    </div>
                                    <Subheading className="m-0">Marked Items</Subheading>
                                </div>
                                <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-primary/20">
                                    {posterData.markedItems.length}
                                </span>
                            </div>

                            {posterData.markedItems.length === 0 ? (
                                <div className="text-center py-12 space-y-4">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <Text className="opacity-40 text-sm italic">
                                        No items marked yet.<br />Draw on the poster to start.
                                    </Text>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {posterData.markedItems.map((item, idx) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleEditItem(item)}
                                            className={cn(
                                                "group flex gap-3 p-3 rounded-2xl border transition-all cursor-pointer bg-white shadow-sm hover:shadow-md",
                                                highlightedId === item.id
                                                    ? "bg-primary/5 border-primary shadow-primary/5"
                                                    : "border-border/50 hover:bg-muted/10"
                                            )}
                                        >
                                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/5 shrink-0 border border-border/20 shadow-inner">
                                                {item.productImage ? (
                                                    <Image src={item.productImage} alt="" fill unoptimized className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs opacity-30">#{idx + 1}</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-6 relative flex flex-col justify-center">
                                                <h4 className="font-bold text-sm text-gray-900 truncate pr-4">{item.name || `Item ${idx + 1}`}</h4>
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                                                    <span className="text-xs line-through opacity-40 whitespace-nowrap">{item.currency}{item.oldPrice}</span>
                                                    <span className="text-sm font-bold text-green-600 whitespace-nowrap">{item.currency}{item.offerPrice}</span>
                                                </div>
                                                {item.subcategories && item.subcategories.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1.5 auto-rows-min">
                                                        {item.subcategories.slice(0, 1).map(cat => (
                                                            <span key={cat} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10 font-bold whitespace-nowrap">
                                                                {cat}
                                                            </span>
                                                        ))}
                                                        {item.subcategories.length > 1 && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-bold">
                                                                +{item.subcategories.length - 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                                                    className="absolute top-1/2 -translate-y-1/2 right-0 opacity-0 group-hover:opacity-100 p-1.5 text-destructive rounded-lg hover:bg-destructive/10 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-border/50">
                                <div className="flex items-center gap-3 mb-4 opacity-70">
                                    <Info className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Instructions</span>
                                </div>
                                <ul className="space-y-3 text-xs opacity-60 leading-relaxed font-medium">
                                    <li className="flex gap-2">
                                        <span className="text-primary font-bold">1.</span>
                                        <span>Click and drag over an item on the poster to mark it.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-primary font-bold">2.</span>
                                        <span>Marking will automatically extract name and price from your selection.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-primary font-bold">3.</span>
                                        <span>Click on any marked area to refine details or change the image.</span>
                                    </li>
                                </ul>
                            </div>
                        </PremiumCard>
                    </div>
                </div>
            </main>

            {/* --- Edit Side Panel --- */}
            {showModal && currentMarkedItem && (
                <div className="fixed inset-0 z-[100] overflow-hidden md:flex md:items-center md:justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={handleCancelForm}
                    />

                    {/* Modal Panel */}
                    <div className="absolute inset-y-0 right-0 md:relative md:inset-auto w-full sm:max-w-md md:max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right md:slide-in-from-right-0 md:zoom-in-95 duration-300 h-[100dvh] md:h-[85vh] md:rounded-2xl overflow-hidden">
                        <form onSubmit={handleSaveForm} className="flex flex-col h-full overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 rounded-lg">
                                        <FileEdit className="w-5 h-5 text-primary" />
                                    </div>
                                    <Subheading className="m-0">Refine Item Details</Subheading>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCancelForm}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="px-6 py-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0 bg-white">
                                {/* Row 1: Image & Product Name */}
                                <div className="flex items-start gap-4">
                                    <div className="relative group/img shrink-0 pt-1">
                                        <div
                                            onClick={() => {
                                                if (formData.productImage) {
                                                    setZoomedImageSrc(formData.productImage);
                                                    setZoomScale(1);
                                                }
                                            }}
                                            className={cn(
                                                "w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shadow-sm border border-gray-200 transition-all duration-300 relative",
                                                formData.productImage && "cursor-pointer group-hover/img:border-orange-400 group-hover/img:shadow-md"
                                            )}
                                            title={formData.productImage ? "Click to view zoomed image" : undefined}
                                        >
                                            {formData.productImage ? (
                                                <>
                                                    <Image src={formData.productImage} alt="" fill unoptimized className="object-cover transition-transform duration-300 group-hover/img:scale-105" />
                                                    <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center transition-all duration-200 rounded-xl backdrop-blur-[1px]">
                                                        <ZoomIn className="w-5 h-5 text-white drop-shadow" />
                                                        <span className="text-[9px] font-bold text-white mt-0.5 tracking-wider uppercase">Zoom</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="w-6 h-6 text-gray-200" />
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={productFileInputRef}
                                            type="file" accept="image/*" className="hidden"
                                            onChange={handleProductFileChange}
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <PremiumInput
                                            label="Product Name"
                                            icon={Type}
                                            value={formData.name}
                                            required
                                            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                            placeholder="e.g. Delicious Weekend Brunch"
                                            className="h-12 text-black font-semibold"
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Categories */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 relative">
                                        <label className="text-xs font-semibold text-black flex items-center gap-2 px-1">
                                            <Tag className="w-3.5 h-3.5 text-black" /> Main Category
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => { setMainCategoryOpen(!mainCategoryOpen); setMainCategorySearch(''); }}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 h-12 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all font-bold text-sm text-left flex items-center justify-between cursor-pointer hover:border-gray-300"
                                        >
                                            <div className={cn("flex-1 truncate", formData.mainCategory && "text-black")}>
                                                {formData.mainCategory || <span className="text-gray-400 font-medium">Select...</span>}
                                            </div>
                                            <ChevronDown className={cn("w-4 h-4 text-gray-400 shrink-0 transition-transform ml-2", mainCategoryOpen && "rotate-180")} />
                                        </button>

                                        {mainCategoryOpen && (
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
                                                    <Search className="w-3.5 h-3.5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={mainCategorySearch}
                                                        onChange={(e) => setMainCategorySearch(e.target.value)}
                                                        placeholder="Search..."
                                                        className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400 text-black font-medium"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {(mainCategories || []).filter(cat => cat.toLowerCase().includes(mainCategorySearch.toLowerCase())).map(cat => (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(p => ({ ...p, mainCategory: cat, subcategories: [], subcategoryId: null }));
                                                                setMainCategoryOpen(false);
                                                            }}
                                                            className={cn(
                                                                "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer text-gray-700",
                                                                formData.mainCategory === cat && "bg-gray-50 font-bold text-black"
                                                            )}
                                                        >
                                                            {cat}
                                                            {formData.mainCategory === cat && <Check className="w-4 h-4 text-black" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 relative">
                                        <label className="text-xs font-semibold text-black flex items-center gap-2 px-1">
                                            <CheckSquare className="w-3.5 h-3.5 text-black" /> Subcategories
                                        </label>
                                        {formData.mainCategory ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => { setCategoryOpen(!categoryOpen); setCategorySearch(''); }}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 h-12 focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-200 transition-all font-bold text-sm text-left flex items-center justify-between cursor-pointer hover:border-gray-300"
                                                >
                                                    <div className={cn("flex-1 truncate", formData.subcategories.length > 0 && "text-black font-bold text-xs")}>
                                                        {formData.subcategories.length === 0 ? (
                                                            <span className="text-gray-400 font-medium">Select...</span>
                                                        ) : (
                                                            formData.subcategories.join(", ")
                                                        )}
                                                    </div>
                                                    <ChevronDown className={cn("w-4 h-4 text-gray-400 shrink-0 transition-transform ml-2", categoryOpen && "rotate-180")} />
                                                </button>

                                                {categoryOpen && (
                                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
                                                            <Search className="w-3.5 h-3.5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                value={categorySearch}
                                                                onChange={(e) => setCategorySearch(e.target.value)}
                                                                placeholder="Search..."
                                                                className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400 text-black font-medium"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto">
                                                            {isLoadingSubcategories ? (
                                                                <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading subcategories...</div>
                                                            ) : dynamicSubcategories.filter((s: any) => s.name.toLowerCase().includes(categorySearch.toLowerCase())).map((subObj: any) => {
                                                                const sub = subObj.name;
                                                                const isSelected = formData.subcategories.includes(sub);
                                                                return (
                                                                    <button
                                                                        key={subObj.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const nextSelected = isSelected ? [] : [sub];
                                                                            const nextId = isSelected ? null : subObj.id;
                                                                            setFormData(p => ({
                                                                                ...p,
                                                                                subcategories: nextSelected,
                                                                                subcategoryId: nextId
                                                                            }));
                                                                            setCategoryOpen(false); // Close dropdown after selection
                                                                        }}
                                                                        className={cn(
                                                                            "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer text-gray-700",
                                                                            isSelected && "bg-gray-50 font-bold text-black"
                                                                        )}
                                                                    >
                                                                        {sub}
                                                                        {isSelected && <Check className="w-4 h-4 text-black" />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 h-12 text-sm text-gray-400 italic">
                                                Select main category first
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Row 3: Pricing */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-black flex items-center gap-2 px-1">
                                            <IndianRupee className="w-3.5 h-3.5 text-black" /> Old Price
                                        </label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 group-focus-within:text-black transition-colors">₹</span>
                                            <input
                                                type="number" step="0.01" value={formData.oldPrice}
                                                onChange={(e) => setFormData(p => ({ ...p, oldPrice: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all font-bold text-sm text-black h-12"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-black flex items-center gap-2 px-1">
                                            <IndianRupee className="w-3.5 h-3.5 text-black" /> Offer Price
                                        </label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 group-focus-within:text-black transition-colors">₹</span>
                                            <input
                                                type="number" step="0.01" value={formData.offerPrice} required
                                                onChange={(e) => setFormData(p => ({ ...p, offerPrice: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all font-bold text-sm text-black h-12"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Row 4: Description */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-black flex items-center gap-2 px-1">
                                        <AlignLeft className="w-3.5 h-3.5 text-black" /> Full Description
                                    </label>
                                    <textarea
                                        value={formData.description} rows={5}
                                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all text-sm text-black font-medium min-h-[80px] resize-none placeholder:text-gray-400"
                                        placeholder="Add additional item details..."
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-5 bg-gray-50/80 backdrop-blur-sm border-t border-gray-100 flex flex-col gap-4 shrink-0">
                                <div className="flex gap-4">
                                    <PremiumButton
                                        type="submit"
                                        variant="default"
                                        className="flex-[2] h-12 rounded-2xl shadow-lg shadow-primary/20 text-sm font-bold"
                                        leftIcon={CheckCircle2}
                                    >
                                        Save Changes
                                    </PremiumButton>
                                    <PremiumButton
                                        type="button"
                                        variant="outline"
                                        className="flex-1 h-12 rounded-2xl text-sm font-bold bg-white"
                                        onClick={handleCancelForm}
                                    >
                                        Cancel
                                    </PremiumButton>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteItem(currentMarkedItem.id)}
                                    className="w-full py-2.5 text-[10px] font-bold capitalize tracking-[0.2em] text-red-400 hover:text-white hover:bg-red-500 transition-all rounded-xl flex items-center justify-center gap-2 border border-red-100/50 hover:border-red-500"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Remove Item from Poster
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Cropper Modal --- */}
            {
                showCropper && cropperImage && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex flex-col justify-center items-center z-[200] p-4">
                        <PremiumCard className="w-full max-w-2xl bg-transparent border-none p-0 overflow-visible shadow-none">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <ImageIcon className="w-5 h-5 text-primary" />
                                    </div>
                                    <Heading className="m-0 text-white">Crop Product Image</Heading>
                                </div>
                                <button
                                    onClick={() => setShowCropper(false)}
                                    className="p-2 text-white/60 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div
                                ref={cropperContainerRef}
                                className="relative bg-black/40 rounded-3xl overflow-hidden cursor-crosshair border-2 border-white/10 select-none shadow-2xl"
                                onMouseDown={handleCropperDown}
                                onMouseMove={handleCropperMove}
                                onMouseUp={() => setIsCropping(false)}
                            >
                                <img
                                    ref={cropperImgRef}
                                    src={cropperImage}
                                    className="max-w-full max-h-[60vh] mx-auto block"
                                    alt="Cropping"
                                    draggable={false}
                                />
                                {cropRect && (
                                    <div
                                        className="absolute border-2 border-red-500 bg-red-500/20 ring-[5000px] ring-black/60"
                                        style={{
                                            left: cropRect.x,
                                            top: cropRect.y,
                                            width: cropRect.width,
                                            height: cropRect.height,
                                        }}
                                    />
                                )}
                            </div>

                            <div className="flex gap-4 mt-8 justify-center">
                                <PremiumButton
                                    variant="default"
                                    onClick={applyCrop}
                                    className="px-10 h-14 rounded-2xl"
                                    leftIcon={CheckCircle2}
                                >
                                    Apply Selection
                                </PremiumButton>
                                <PremiumButton
                                    variant="outline"
                                    onClick={() => setShowCropper(false)}
                                    className="px-10 h-14 rounded-2xl text-white border-white/20 hover:bg-white/10"
                                >
                                    Cancel
                                </PremiumButton>
                            </div>
                        </PremiumCard>
                    </div>
                )
            }

            {/* Back Warning Modal */}
            <AppModal
                open={showBackWarning}
                onOpenChange={setShowBackWarning}
                title="Unsaved Changes"
                description="You are about to go back. Any unsaved markings will be lost. Are you sure?"
            >
                <div className="flex flex-col gap-3">
                    <PremiumButton
                        variant="default"
                        onClick={() => {
                            setShowBackWarning(false);
                            onCancel();
                        }}
                        className="rounded-xl w-full"
                    >
                        Yes, go back
                    </PremiumButton>
                    <PremiumButton
                        variant="outline"
                        onClick={() => setShowBackWarning(false)}
                        className="rounded-xl font-bold"
                    >
                        Cancel
                    </PremiumButton>
                </div>
            </AppModal>
            {/* Fullscreen Product Image Zoom Lightbox */}
            {zoomedImageSrc && typeof window !== "undefined" && createPortal(
                <div 
                    className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
                    onClick={() => setZoomedImageSrc(null)}
                >
                    {/* Top Header & Toolbar */}
                    <div 
                        className="w-full flex items-center justify-between z-10 max-w-5xl mx-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2.5 text-white">
                            <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/30">
                                <ZoomIn className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm sm:text-base text-white leading-tight">Product Image Preview</h3>
                                <p className="text-xs text-zinc-400 hidden sm:block">Detailed zoom view of the cropped poster item</p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/80 rounded-full px-3 py-1.5 shadow-2xl backdrop-blur-md">
                                <button
                                    type="button"
                                    onClick={() => setZoomScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))}
                                    className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-mono font-bold text-orange-400 min-w-[45px] text-center select-none">
                                    {Math.round(zoomScale * 100)}%
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setZoomScale(s => Math.min(3.5, +(s + 0.25).toFixed(2)))}
                                    className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <div className="w-px h-4 bg-zinc-700 mx-0.5" />
                                <button
                                    type="button"
                                    onClick={() => setZoomScale(1)}
                                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                                    title="Reset Zoom (100%)"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setZoomScale(s => (s > 1 ? 1 : 2))}
                                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900/90 border border-zinc-700/80 hover:bg-zinc-800 rounded-full transition-all"
                            >
                                <Maximize2 className="w-3.5 h-3.5 text-orange-400" />
                                <span>{zoomScale > 1 ? 'Fit Screen' : '2x Zoom'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setZoomedImageSrc(null)}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/90 rounded-full transition-colors border border-zinc-700/50"
                                title="Close (Esc)"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Center Canvas Viewport */}
                    <div 
                        className="flex-1 w-full flex items-center justify-center overflow-auto py-6 custom-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative max-w-full max-h-full flex items-center justify-center p-2">
                            <img
                                src={zoomedImageSrc}
                                alt="Zoomed Product Image Preview"
                                className="max-w-[85vw] max-h-[75vh] object-contain rounded-2xl shadow-2xl transition-transform duration-200 ease-out select-none border border-zinc-800 bg-zinc-950/60 cursor-zoom-in"
                                style={{ transform: `scale(${zoomScale})` }}
                                onClick={() => setZoomScale(s => (s > 1 ? 1 : 2))}
                                title="Click image to toggle 2x zoom"
                            />
                        </div>
                    </div>

                    {/* Bottom Bar Info */}
                    <div className="w-full text-center z-10 select-none">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 shadow-xl backdrop-blur-md">
                            <span className="text-zinc-300 font-medium">Click image to toggle 2x zoom</span>
                            <span className="text-zinc-600">•</span>
                            <span>Use controls to zoom/reset</span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-orange-400 font-medium">Press Esc to close</span>
                        </span>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
