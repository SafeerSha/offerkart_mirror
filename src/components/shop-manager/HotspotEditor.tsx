"use client";

import { useState, useRef, MouseEvent, TouchEvent, FormEvent, useEffect } from "react";
import {
    ChevronLeft, Save, Info, Send, CheckSquare, Rocket, Zap,
    Trash2, Eye, Plus, IndianRupee,
    Type, AlignLeft, RefreshCcw, Tag, ChevronDown, Check, Search,
    CheckCircle2, AlertCircle, FileEdit, X,
    Image as ImageIcon
} from "lucide-react";
import Image from "next/image";

import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import { useSubcategories } from "@/hooks/useApi";
import { createWorker, Worker } from 'tesseract.js';
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

async function preprocessImageForOCR(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
): Promise<string> {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let minGray = 255;
    let maxGray = 0;

    for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        if (gray < minGray) minGray = gray;
        if (gray > maxGray) maxGray = gray;
    }

    const range = maxGray - minGray || 1;

    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        let normalized = ((gray - minGray) / range) * 255;
        normalized = Math.pow(normalized / 255, 0.8) * 255;

        const threshold = 128;
        const isText = normalized < threshold;

        if (normalized < 60) {
            normalized = normalized * 0.7;
        } else if (normalized > 200) {
            normalized = normalized * 0.9 + 25;
        }

        data[i] = normalized;
        data[i + 1] = normalized;
        data[i + 2] = normalized;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png', 1.0);
}

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

    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const productFileInputRef = useRef<HTMLInputElement>(null);
    const cropperImgRef = useRef<HTMLImageElement>(null);
    const cropperContainerRef = useRef<HTMLDivElement>(null);

    // Keep state in sync with props
    useEffect(() => {
        console.log('HotspotEditor Received Poster:', {
            id: poster.id,
            totalMarked: poster.markedItems?.length,
            markedItems: poster.markedItems
        });

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
            console.log('Poster source changed, resetting image size');
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
            let useFallbackImage = false;
            try {
                croppedDataUrl = canvas.toDataURL();
            } catch (e) {
                if (e instanceof DOMException && e.name === 'SecurityError') {
                    console.warn('Image source blocks CORS - falling back to source image for OCR');
                    croppedDataUrl = posterData.posterSrc;
                    useFallbackImage = true;
                } else {
                    throw e;
                }
            }

            let processedDataUrl: string;
            let invertedDataUrl = '';
            if (useFallbackImage) {
                processedDataUrl = croppedDataUrl;
            } else {
                processedDataUrl = await preprocessImageForOCR(canvas, ctx);
                // Create color-inverted canvas for pass 2 to catch colored badges and light-on-dark text
                const invertCanvas = document.createElement('canvas');
                invertCanvas.width = canvas.width;
                invertCanvas.height = canvas.height;
                const invertCtx = invertCanvas.getContext('2d', { willReadFrequently: true })!;
                ctx.drawImage(img, x * scaleX, y * scaleY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
                const invertData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < invertData.data.length; i += 4) {
                    invertData.data[i] = 255 - invertData.data[i];
                    invertData.data[i + 1] = 255 - invertData.data[i + 1];
                    invertData.data[i + 2] = 255 - invertData.data[i + 2];
                }
                invertCtx.putImageData(invertData, 0, 0);
                invertedDataUrl = invertCanvas.toDataURL('image/png');
            }

            let ocrText = '';
            let ocrPass1Text = '';
            try {
                const worker = await createWorker('ara+eng', 1, {
                    logger: m => console.log('OCR Progress:', m),
                });

                // DO NOT set tessedit_char_whitelist — invalid Unicode range syntax breaks digit recognition
                if (invertedDataUrl) {
                    const [{ data: { text: ocrPass1, confidence } }, { data: { text: ocrPass2 } }] = await Promise.all([
                        worker.recognize(processedDataUrl),
                        worker.recognize(invertedDataUrl),
                    ]);
                    ocrPass1Text = ocrPass1;
                    ocrText = `${ocrPass1}\n${ocrPass2}`;
                    console.log('OCR Confidence:', confidence, '\nPass1:', ocrPass1, '\nPass2:', ocrPass2);
                } else {
                    const result = await worker.recognize(processedDataUrl);
                    ocrPass1Text = result.data.text;
                    ocrText = result.data.text;
                    console.log('OCR Confidence:', result.data.confidence, 'Extracted text:', ocrText);
                }
                await worker.terminate();
            } catch (ocrError) {
                if (useFallbackImage) {
                    console.warn('CORS blocked image cannot be processed by OCR:', ocrError);
                    toast.error('Cannot process cross-origin images. Please enter details manually.');
                    setIsProcessing(false);
                    handleEditItem(tempItem);
                    return;
                }
                console.warn("Tesseract OCR initialization failed:", ocrError);
                toast.error("OCR failed. Please enter product details manually.");
                setIsProcessing(false);
                handleEditItem(tempItem);
                return;
            }

            let extractedName = '';
            let extractedDescription = '';
            let extractedOldPrice = 0;
            let extractedOfferPrice = 0;

            // Smart Product Name Filter: require at least 2 letters/Arabic characters, ignore pure digits/noise like "3" or "69"
            const nameCandidates = ocrPass1Text.split('\n').map(l => l.trim()).filter(l => {
                if (l.length < 3) return false;
                if (!/[a-zA-Z\u0600-\u06FF]{2,}/.test(l)) return false;
                const stripped = l.replace(/[0-9.,%$#@!*()\-_=+/?\\|:[\]{}'"~`₹]/g, '').trim().toLowerCase();
                if (['qr', 'rs', 'inr', 'aed', 'sar', 'ريال', 'درهم', 'جنيه', 'ر.ق', 'ر.س'].includes(stripped)) return false;
                return true;
            });
            extractedName = nameCandidates[0] || ocrPass1Text.split('\n').map(l => l.trim()).find(l => l.length > 2 && /[a-zA-Z\u0600-\u06FF]/.test(l)) || 'Marked Product';
            extractedDescription = ocrPass1Text.trim() || ocrText.trim();

            // Smart Price Extraction: mask numbers attached to units/specifications (e.g. 7pcs, 7 حبات) so they aren't taken as prices
            const cleanedTextForPrices = ocrText.replace(/\b(\d+(?:\.\d+)?)\s*(?:pcs?|pieces?|sets?|حبات|حبة|قطع|قطعة|ml|g|kg|l|ltr|cm|mm|inch|pack)\b/gi, '');
            const priceRegex = /(?:₹|Rs\.?|INR)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/g;
            const rawPriceNumbers: number[] = [];
            let m: RegExpExecArray | null;
            while ((m = priceRegex.exec(cleanedTextForPrices)) !== null) {
                const val = parseFloat(m[1].replace(/,/g, ''));
                if (!isNaN(val) && val > 0 && val < 1_000_000) rawPriceNumbers.push(val);
            }
            const prices = [...new Set(rawPriceNumbers)].sort((a, b) => b - a);
            const maxPrice = prices.length > 0 ? prices[0] : 0;
            const validPrices = prices.filter(p => {
                if (p === maxPrice) return true;
                if (maxPrice > 20 && p < Math.max(10, maxPrice * 0.15)) return false;
                return true;
            });

            if (validPrices.length >= 2) {
                extractedOldPrice = validPrices[0];
                extractedOfferPrice = validPrices[1];
            } else if (validPrices.length === 1) {
                extractedOfferPrice = validPrices[0];
                extractedOldPrice = validPrices[0];
            }

            const updatedItem: MarkedItemType = {
                ...tempItem,
                name: extractedName || 'Marked Product',
                description: extractedDescription,
                productImage: croppedDataUrl,
                oldPrice: extractedOldPrice,
                offerPrice: extractedOfferPrice
            };

            setPosterData(prev => ({
                ...prev,
                markedItems: prev.markedItems.map(item => item.id === id ? updatedItem : item)
            }));

            handleEditItem(updatedItem);
        } catch (err) {
            console.error("OCR Error:", err);
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

    const handleAIFill = () => {
        const cleanedDescription = formData.description.replace(/\b(\d+(?:\.\d+)?)\s*(?:pcs?|pieces?|sets?|حبات|حبة|قطع|قطعة|ml|g|kg|l|ltr|cm|mm|inch|pack)\b/gi, '');
        const priceRegex = /(?:₹|Rs\.?|INR)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/g;
        const rawPriceNumbers: number[] = [];
        let m: RegExpExecArray | null;
        while ((m = priceRegex.exec(cleanedDescription)) !== null) {
            const val = parseFloat(m[1].replace(/,/g, ''));
            if (!isNaN(val) && val > 0 && val < 1_000_000) rawPriceNumbers.push(val);
        }
        const prices = [...new Set(rawPriceNumbers)].sort((a, b) => b - a);
        const maxPrice = prices.length > 0 ? prices[0] : 0;
        const validPrices = prices.filter(p => {
            if (p === maxPrice) return true;
            if (maxPrice > 20 && p < Math.max(10, maxPrice * 0.15)) return false;
            return true;
        });

        if (validPrices.length >= 2) {
            setFormData(prev => ({ ...prev, oldPrice: String(validPrices[0]), offerPrice: String(validPrices[1]) }));
            toast.success("Prices updated from description");
        } else if (validPrices.length === 1) {
            setFormData(prev => ({ ...prev, oldPrice: String(validPrices[0]), offerPrice: String(validPrices[0]) }));
            toast.success("Prices updated from description");
        } else {
            toast.error("No prices detected in description");
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
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shadow-sm border border-gray-200 group-hover/img:border-orange-400 transition-all duration-300">
                                            {formData.productImage ? (
                                                <Image src={formData.productImage} alt="" fill unoptimized className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="w-6 h-6 text-gray-200" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            // onClick={startProductImageUpload}
                                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all duration-300 rounded-xl"
                                        >
                                            {/* <RefreshCcw className="w-4 h-4" /> */}
                                        </button>
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
                                    className="w-full py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-400 hover:text-white hover:bg-red-500 transition-all rounded-xl flex items-center justify-center gap-2 border border-red-100/50 hover:border-red-500"
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
        </div >
    );
}
