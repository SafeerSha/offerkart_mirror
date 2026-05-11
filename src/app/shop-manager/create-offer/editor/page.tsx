"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ChevronLeft, ChevronRight, Save, Info, Send, CheckSquare, Rocket, Zap,
    Trash2, Eye, Plus, IndianRupee,
    Type, AlignLeft, RefreshCcw, Tag, ChevronDown, Check, Search,
    CheckCircle2, AlertCircle, FileEdit, X, ArrowLeft,
    Image as ImageIcon
} from "lucide-react";

import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import { useSubcategories } from "@/hooks/useApi";
import Image from "next/image";
import { createWorker, Worker } from 'tesseract.js';
import { Heading, Subheading, Text } from "@/components/shared/Typography";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { AppModal } from "@/components/shared/AppModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { storage } from "@/lib/storage";
import { MarkedItem } from "@/lib/types/offer";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { MarkedItem as MarkedItemType } from "@/lib/types/offer";

// --- Image Preprocessing for OCR ---
/**
 * Preprocesses an image to improve OCR accuracy
 * - Converts to grayscale
 * - Increases contrast
 * - Applies thresholding for cleaner text extraction
 */
async function preprocessImageForOCR(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
): Promise<string> {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Calculate histogram for contrast enhancement
    const grayValues: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        grayValues.push(gray);
    }

    // Find min and max for normalization
    const minGray = Math.min(...grayValues);
    const maxGray = Math.max(...grayValues);
    const range = maxGray - minGray || 1;

    // Apply grayscale and contrast enhancement
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Normalize to full range (contrast stretch)
        let normalized = ((gray - minGray) / range) * 255;

        // Apply slight gamma correction for better dynamic range
        normalized = Math.pow(normalized / 255, 0.8) * 255;

        // Apply thresholding for cleaner text (Otsu's method approximation)
        const threshold = 128;
        const isText = normalized < threshold;

        // Preserve some gray for anti-aliasing, but strengthen contrast
        if (normalized < 60) {
            normalized = normalized * 0.7; // Darken shadows
        } else if (normalized > 200) {
            normalized = normalized * 0.9 + 25; // Brighten highlights
        }

        data[i] = normalized;     // R
        data[i + 1] = normalized; // G
        data[i + 2] = normalized; // B
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png', 1.0);
}

// --- Types ---

// Local specialized types removed in favor of global types from @/lib/types/offer

interface PosterData {
    posterSrc: string;
    markedItems: MarkedItemType[];
    currency: string;
    aspectRatio?: number;
}

interface Position { x: number; y: number; }
interface Rect { x: number; y: number; width: number; height: number; }

// --- Component ---

function HotspotEditorContent() {
    const router = useRouter();
    const { mainCategories, categoryHierarchy, getCategoryId } = useCategoryHierarchy();
    const searchParams = useSearchParams();
    const fromPreview = searchParams.get('from') === 'preview';
    const isEditFlow = searchParams.get('returnTo') === 'edit-offer';
    const posterIndex = parseInt(searchParams.get('index') || '0', 10);

    // Multi-poster state
    const [allPosters, setAllPosters] = useState<any[]>([]);
    const [activePosterIndex, setActivePosterIndex] = useState(0);

    // State
    const [posterData, setPosterData] = useState<PosterData>({
        posterSrc: '',
        markedItems: [],
        currency: '₹',
        aspectRatio: undefined
    });
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<Position | null>(null);
    const [currentRect, setCurrentRect] = useState<Rect | null>(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [showModal, setShowModal] = useState(false);
    const [currentMarkedItem, setCurrentMarkedItem] = useState<MarkedItemType | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [imgCrossOrigin, setImgCrossOrigin] = useState<"anonymous" | undefined>("anonymous");

    const [formData, setFormData] = useState({
        name: '',
        mainCategory: '' as string,
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

    // Navigation Step State
    const [popoverOpen, setPopoverOpen] = useState(false);

    // Publication State
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [offerTitle, setOfferTitle] = useState('');

    // Cropper State
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

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const productFileInputRef = useRef<HTMLInputElement>(null);
    const cropperImgRef = useRef<HTMLImageElement>(null);
    const cropperContainerRef = useRef<HTMLDivElement>(null);

    const isDrawingRef = useRef(isDrawing);
    useEffect(() => {
        isDrawingRef.current = isDrawing;
    }, [isDrawing]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleTouch = (e: globalThis.TouchEvent) => {
            if (isDrawingRef.current) {
                e.preventDefault();
            }
        };

        container.addEventListener('touchstart', handleTouch, { passive: false });
        container.addEventListener('touchmove', handleTouch, { passive: false });

        return () => {
            container.removeEventListener('touchstart', handleTouch);
            container.removeEventListener('touchmove', handleTouch);
        };
    }, []);

    // Initial Load — support both multi-poster and single-poster
    useEffect(() => {
        const loadInitialData = async () => {
            const multiData = await storage.getItem<any[]>('currentEditingPosters');
            const singleData = await storage.getItem<any>('currentEditingPoster');

            if (multiData) {
                setAllPosters(multiData);

                // Load the specifically requested poster if fromPreview, otherwise find first interactive
                const targetIndex = (fromPreview && posterIndex >= 0 && posterIndex < multiData.length)
                    ? posterIndex
                    : (multiData.findIndex((p: any) => p.type === 'mark_products') >= 0
                        ? multiData.findIndex((p: any) => p.type === 'mark_products')
                        : 0);

                const activePoster = multiData[targetIndex];
                setActivePosterIndex(targetIndex);
                console.log('Standalone Editor Initial Load:', {
                    posterIndex: targetIndex,
                    posterId: activePoster.id,
                    markedItemsCount: activePoster.markedItems?.length,
                    markedItems: activePoster.markedItems
                });
                setImgCrossOrigin("anonymous"); // Reset for new poster
                setPosterData({
                    posterSrc: activePoster.posterSrc,
                    markedItems: activePoster.markedItems || [],
                    currency: '₹',
                });
                if (activePoster.title) setOfferTitle(activePoster.title);
            } else if (singleData) {
                setPosterData(singleData);
                if (singleData.title) setOfferTitle(singleData.title);
            } else {
                router.push('/shop-manager/create-offer');
            }
        };
        loadInitialData();
    }, [router]);

    // Switch poster — saves current marked items before switching
    const switchPoster = (index: number) => {
        if (index === activePosterIndex || !allPosters.length) return;

        // Save current poster's marked items
        setAllPosters((prev) =>
            prev.map((p, i) =>
                i === activePosterIndex
                    ? { ...p, markedItems: posterData.markedItems }
                    : p
            )
        );

        // Load new poster
        const target = allPosters[index];
        setActivePosterIndex(index);
        setImgCrossOrigin("anonymous"); // Reset for new poster
        setPosterData({
            posterSrc: target.posterSrc,
            markedItems: target.markedItems || [],
            currency: '₹',
        });
        setHighlightedId(null);
    };

    // Jump functionality is now handled by Popover buttons

    // --- Drawing Logic ---

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
        if (!isDrawing || !currentRect || currentRect.width < 10 || currentRect.height < 10) {
            setIsDrawing(false);
            setCurrentRect(null);
            return;
        } setIsDrawing(false);
        const { x, y, width, height } = currentRect;
        const container = containerRef.current;
        if (!container) return;

        // Calculate relative coordinates using real-time container dimensions
        const relX = x / container.offsetWidth;
        const relY = y / container.offsetHeight;
        const relW = width / container.offsetWidth;
        const relH = height / container.offsetHeight;

        const id = crypto.randomUUID();
        const tempItem: MarkedItemType = {
            id, x: relX, y: relY, width: relW, height: relH,
            name: 'Processing...', mainCategory: '', subcategories: [], description: '', productImage: '',
            oldPrice: 0, offerPrice: 0, currency: posterData.currency
        };

        setPosterData(prev => ({ ...prev, markedItems: [...prev.markedItems, tempItem] }));
        setCurrentRect(null);

        // --- AI Extraction ---
        setIsProcessing(true);
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
            const container = containerRef.current;
            const img = imgRef.current;

            if (!container || !img) return;

            // Robust validation of image and measurements
            if (!img.complete || img.naturalWidth === 0 || container.offsetWidth === 0) {
                console.error("Image or Container state check failed:", { 
                    complete: img.complete, 
                    naturalWidth: img.naturalWidth, 
                    containerWidth: container.offsetWidth 
                });
                throw new Error('Image not fully loaded. Please wait a moment and try again.');
            }

            const scaleX = img.naturalWidth / container.offsetWidth;
            const scaleY = img.naturalHeight / container.offsetHeight;

            const sw = Math.round(width * scaleX);
            const sh = Math.round(height * scaleY);
            
            if (sw <= 0 || sh <= 0) {
                throw new Error('Selection is too small to process.');
            }

            canvas.width = sw;
            canvas.height = sh;

            ctx.drawImage(img, x * scaleX, y * scaleY, sw, sh, 0, 0, sw, sh);
            const croppedDataUrl = canvas.toDataURL();

            // Step 1: Preprocess image for better OCR results
            const processedDataUrl = await preprocessImageForOCR(canvas, ctx);

            // Step 2: OCR — Extract raw text from the cropped image with enhanced settings
            const worker = await createWorker('ara+eng', 1, {
                logger: m => console.log('OCR Progress:', m),
            });

            // Set parameters for better accuracy (Tesseract.js v5+ uses LSTM by default)
            await worker.setParameters({
                tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\s\u0600-\u06FF\u0750-\u077F.,%+-',
            });

            const { data: { text: ocrText, confidence } } = await worker.recognize(processedDataUrl);
            await worker.terminate();

            console.log('OCR Confidence:', confidence, 'Extracted text:', ocrText);

            let extractedName = '';
            let extractedDescription = '';
            let extractedOldPrice = 0;
            let extractedOfferPrice = 0;

            // Step 2: AI — Parse the OCR text into structured fields
            try {
                const { askAI } = await import('@/lib/ai/aiClient');
                const aiResult = await askAI<{
                    brand?: string;
                    productName?: string;
                    description?: string;
                    oldPrice?: number;
                    offerPrice?: number;
                }>(ocrText, 'extract product name, prices, description');

                if (aiResult.success && aiResult.data) {
                    const d = aiResult.data!;
                    // Combine brand + product name intelligently
                    extractedName = d.productName || '';
                    if (d.brand && d.productName && !extractedName.toLowerCase().includes((d.brand || "").toLowerCase())) {
                        extractedName = `${d.brand} ${d.productName}`;
                    }
                    extractedDescription = d.description || '';
                    extractedOldPrice = d.oldPrice || 0;
                    extractedOfferPrice = d.offerPrice || 0;
                } else {
                    throw new Error(aiResult.error || 'AI parsing returned no data');
                }
            } catch (aiError) {
                console.warn('AI parsing failed, using basic OCR fallback:', aiError);

                // Fallback: basic text parsing (first line = name, full text = description)
                extractedName = ocrText.split('\n')[0].trim() || 'Marked Product';
                extractedDescription = ocrText.trim();

                const priceMatches = ocrText.match(/\d+\.\d+/g);
                if (priceMatches && priceMatches.length > 0) {
                    const prices = priceMatches.map(p => parseFloat(p)).filter(p => !isNaN(p));
                    if (prices.length >= 2) {
                        const sorted = [...prices].sort((a, b) => b - a);
                        extractedOldPrice = sorted[0];
                        extractedOfferPrice = sorted[1];
                    } else {
                        extractedOfferPrice = prices[0];
                        extractedOldPrice = prices[0];
                    }
                }
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

            // Open Modal for refinement
            handleEditItem(updatedItem);
        } catch (err) {
            console.error("OCR Error:", err);
            toast.error("AI extraction failed. Please enter details manually.");
            handleEditItem(tempItem);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Item Management ---

    const handleEditItem = (item: MarkedItemType) => {
        setCurrentMarkedItem(item);
        setFormData({
            name: item.name === 'Processing...' ? '' : item.name,
            mainCategory: item.mainCategory || '',
            subcategories: item.subcategories || [],
            subcategoryId: item.subcategoryId || null,
            description: item.description,
            productImage: item.productImage,
            oldPrice: item.oldPrice ? String(item.oldPrice) : '',
            offerPrice: item.offerPrice ? String(item.offerPrice) : ''
        });
        setShowModal(true);
        setHighlightedId(item.id);
    };

    const handleDeleteItem = (id: string) => {
        setPosterData(prev => ({
            ...prev,
            markedItems: prev.markedItems.filter(item => item.id !== id)
        }));
        if (currentMarkedItem?.id === id) setShowModal(false);
        toast.success("Item removed");
    };

    const handleSaveForm = (e: FormEvent) => {
        e.preventDefault();
        if (!currentMarkedItem) return;
        const finalSubcategoryId = formData.subcategoryId || undefined;

        const updatedItem: MarkedItemType = {
            ...currentMarkedItem,
            name: formData.name,
            mainCategory: formData.mainCategory,
            subcategories: formData.subcategories,
            subcategoryId: finalSubcategoryId,
            description: formData.description,
            productImage: formData.productImage,
            oldPrice: parseFloat(formData.oldPrice) || 0,
            offerPrice: parseFloat(formData.offerPrice) || 0
        };

        setPosterData(prev => ({
            ...prev,
            markedItems: prev.markedItems.map(item => item.id === updatedItem.id ? updatedItem : item)
        }));

        setShowModal(false);
        setHighlightedId(null);
        toast.success("Item saved");
    };

    const handleAIFill = () => {
        const priceMatches = formData.description.match(/\d+\.\d+/g);
        if (priceMatches && priceMatches.length > 0) {
            const prices = priceMatches.map(p => parseFloat(p)).filter(p => !isNaN(p));
            if (prices.length >= 2) {
                const sorted = [...prices].sort((a, b) => b - a);
                setFormData(prev => ({ ...prev, oldPrice: String(sorted[0]), offerPrice: String(sorted[1]) }));
            } else {
                setFormData(prev => ({ ...prev, oldPrice: String(prices[0]), offerPrice: String(prices[0]) }));
            }
            toast.success("Prices updated from description");
        } else {
            toast.error("No prices detected in description");
        }
    };

    // --- Cropper Logic ---

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

    // --- Final Save ---
    const handleFinish = () => {
        setShowPublishModal(true);
    };

    const confirmPublish = async () => {
        if (!offerTitle.trim() && !fromPreview) {
            toast.error("Please enter an offer title");
            return;
        }

        if (fromPreview || isEditFlow) {
            try {
                // If we are in the edit flow, we use 'currentEditingPosters' instead of 'poster_stack_resume'
                const storageKey = isEditFlow ? 'currentEditingPosters' : 'poster_stack_resume';
                const stack = await storage.getItem<any[]>(storageKey) || [];
                
                if (stack[posterIndex]) {
                    stack[posterIndex] = {
                        ...stack[posterIndex],
                        markedItems: posterData.markedItems,
                        type: 'marked_poster'
                    };
                    await storage.setItem(storageKey, stack);
                    toast.success(isEditFlow ? "Hotspots updated" : "Poster markings updated");
                    
                    if (isEditFlow) {
                        const returnUrl = await storage.getItem<string>('edit_offer_return');
                        router.push(returnUrl || '/shop-manager');
                    } else {
                        router.push(`/shop-manager/create-offer?resume=true&previewIndex=${posterIndex}`);
                    }
                    return;
                }
            } catch (err) {
                console.error("Failed to update poster stack:", err);
                toast.error("Failed to save changes");
            }
        }

        const existingData = await storage.getItem<any[]>('markedPosters');
        let allPostersArr = existingData || [];

        const finalPosterData = {
            ...posterData,
            id: (posterData as any).id || crypto.randomUUID(),
            title: offerTitle,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        allPostersArr.push(finalPosterData);
        await storage.setItem('markedPosters', allPostersArr);

        // Remove from current editing and also from drafts if it was one
        await storage.removeItem('currentEditingPoster');
        await storage.removeItem('currentEditingPosters');

        try {
            const draftsArr = await storage.getItem<any[]>('offerDrafts') || [];
            const filtered = draftsArr.filter((d: any) => d.id !== finalPosterData.id);
            await storage.setItem('offerDrafts', filtered);
        } catch (error) {
            console.error("Failed to clean up draft:", error);
        }

        toast.success("Offer published successfully!");
        router.push('/shop-manager/create-offer');
    };

    const handleSaveDraft = async () => {
        try {
            if (fromPreview) {
                // For preview flow, saving draft is essentially updating the stack
                const stack = await storage.getItem<any[]>('poster_stack_resume') || [];
                if (stack[posterIndex]) {
                    stack[posterIndex] = {
                        ...stack[posterIndex],
                        markedItems: posterData.markedItems,
                        type: 'marked_poster'
                    };
                    await storage.setItem('poster_stack_resume', stack);
                    toast.success("Draft updated in stack");
                    router.push(`/shop-manager/create-offer?resume=true&previewIndex=${posterIndex}`);
                    return;
                }
            }

            const existingDrafts = await storage.getItem<any[]>('offerDrafts') || [];
            let allDrafts = [...existingDrafts];
            // ... (rest of existing logic)

            const draftId = (posterData as any).id || crypto.randomUUID();
            const draftTitle = offerTitle || `Untitled Draft - ${new Date().toLocaleDateString()}`;

            const draftData = {
                ...posterData,
                id: draftId,
                title: draftTitle,
                lastEdited: new Date().toISOString(),
                status: 'draft'
            };

            // Update existing or add new
            const index = allDrafts.findIndex((d: any) => d.id === draftId);
            if (index > -1) {
                allDrafts[index] = draftData;
            } else {
                allDrafts.push(draftData);
            }

            await storage.setItem('offerDrafts', allDrafts);
            await storage.removeItem('currentEditingPoster');
            await storage.removeItem('currentEditingPosters');
            toast.success("Draft saved successfully!");
            router.push('/shop-manager/create-offer');
        } catch (error) {
            toast.error("Failed to save draft. Storage may be full.");
            console.error(error);
        }
    };

    const handleDiscardSession = async () => {
        try {
            const draftId = (posterData as any).id;
            if (draftId) {
                const draftsArr = await storage.getItem<any[]>('offerDrafts') || [];
                const filtered = draftsArr.filter((d: any) => d.id !== draftId);
                await storage.setItem('offerDrafts', filtered);
            }
            await storage.removeItem('currentEditingPoster');
            await storage.removeItem('currentEditingPosters');
            toast.success("Changes discarded");

            if (fromPreview || isEditFlow) {
                if (isEditFlow) {
                    const returnUrl = await storage.getItem<string>('edit_offer_return');
                    router.push(returnUrl || '/shop-manager');
                } else {
                    router.push(`/shop-manager/create-offer?resume=true&previewIndex=${posterIndex}`);
                }
                return;
            }
            router.push('/shop-manager/create-offer');
        } catch (error) {
            console.error("Failed to discard session:", error);
            toast.error("Failed to discard session cleanly");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="h-4 sm:h-16 lg:h-32" />

            <main className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 relative">
                <Breadcrumbs
                    items={[
                        { label: "Dashboard", href: "/shop-manager" },
                        { label: "New Offer", href: "/shop-manager/create-offer" },
                        { label: "Mark Items" }
                    ]}
                />

                <div className="mt-4 sm:mt-8 flex flex-col xl:flex-row gap-4 sm:gap-8">
                    {/* Editor Area */}
                    <div className="flex-1 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <Heading className="text-3xl font-bold text-gradient">Mark Items</Heading>
                                <Text className="opacity-60 text-sm">Draw boxes over items on your poster.</Text>
                            </div>

                            <div className="flex gap-3 shrink-0">
                                <PremiumButton
                                    variant="outline"
                                    onClick={() => fromPreview ? handleDiscardSession() : setShowBackWarning(true)}
                                    leftIcon={fromPreview ? Trash2 : ChevronLeft}
                                >
                                    {fromPreview ? "Cancel" : "Back"}
                                </PremiumButton>
                                {!fromPreview && (
                                    <PremiumButton
                                        variant="outline"
                                        onClick={handleSaveDraft}
                                        leftIcon={Save}
                                    >
                                        Save Draft
                                    </PremiumButton>
                                )}
                                <PremiumButton
                                    variant="default"
                                    onClick={confirmPublish}
                                    leftIcon={fromPreview ? Check : Send}
                                    disabled={posterData.markedItems.length === 0}
                                >
                                    {fromPreview ? "Finish" : "Publish Offer"}
                                </PremiumButton>
                            </div>
                        </div>

                        {/* Navigation Row */}
                        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <PremiumButton
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-3 text-xs font-bold"
                                    onClick={() => switchPoster(activePosterIndex - 1)}
                                    disabled={activePosterIndex === 0}
                                    leftIcon={ChevronLeft}
                                >
                                    Prev
                                </PremiumButton>

                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-md rounded-xl border border-primary/10 hover:bg-white/80 hover:border-primary/30 transition-all group">
                                            <span className="text-[10px] font-black uppercase opacity-40 group-hover:opacity-60">Poster</span>
                                            <span className="w-8 text-center font-black text-sm text-primary">
                                                {activePosterIndex + 1}
                                            </span>
                                            <span className="text-[10px] font-black uppercase opacity-40 group-hover:opacity-60">of {allPosters.length}</span>
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-3 bg-white shadow-xl" side="top" align="center">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Jump to Poster</span>
                                                <span className="text-[10px] font-medium text-muted-foreground">{allPosters.length} Total</span>
                                            </div>
                                            <div className="grid grid-cols-5 gap-1">
                                                {allPosters.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => {
                                                            switchPoster(i);
                                                            setPopoverOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-8 h-5 rounded-xl text-xs font-black transition-all flex items-center justify-center",
                                                            i === activePosterIndex
                                                                ? "bg-primary text-gradient shadow-lg shadow-primary/30 scale-110 z-10"
                                                                : "text-black/60 hover:bg-primary/10 hover:text-primary"
                                                        )}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <PremiumButton
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-3 text-xs font-bold"
                                    onClick={() => switchPoster(activePosterIndex + 1)}
                                    disabled={activePosterIndex === allPosters.length - 1}
                                    rightIcon={ChevronRight}
                                >
                                    Next
                                </PremiumButton>
                            </div>

                            {fromPreview && (
                                <PremiumButton
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-4 text-xs font-bold border-primary/30 text-primary hover:bg-primary/5"
                                    onClick={() => router.push(`/shop-manager/create-offer?resume=true&previewIndex=${activePosterIndex}`)}
                                    leftIcon={ArrowLeft}
                                >
                                    Back to Publish
                                </PremiumButton>
                            )}
                        </div>



                        <PremiumCard className="relative overflow-hidden bg-black/5 border-primary/20 p-1 sm:p-4">
                            <div
                                ref={containerRef}
                                className="relative w-full cursor-crosshair select-none overflow-hidden rounded-2xl"
                                style={{ aspectRatio: posterData.aspectRatio ? `${posterData.aspectRatio}` : 'auto' }}
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
                                        height={1200}
                                        unoptimized
                                        crossOrigin={imgCrossOrigin}
                                        className="w-full h-auto block rounded-2xl"
                                        onLoad={(e) => {
                                            const target = e.currentTarget;
                                            const ratio = (target.naturalWidth || 1) / (target.naturalHeight || 1);
                                            setPosterData(prev => ({ ...prev, aspectRatio: ratio }));
                                            setImageSize({
                                                width: target.offsetWidth || 0,
                                                height: target.offsetHeight || 0
                                            });
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

                                {/* Existing Hotspots */}
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
                                            <Text className="font-bold">AI Identifying Item...</Text>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </PremiumCard>

                        {/* Multi-poster thumbnail navigator strip */}
                        {allPosters.length > 1 && (
                            <div className="mt-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Text className="text-xs font-black uppercase tracking-widest opacity-40">
                                        All Posters ({activePosterIndex + 1} of {allPosters.length})
                                    </Text>
                                </div>
                                <div className="flex items-center gap-4 overflow-x-auto py-4 px-2 scrollbar-hide">
                                    {allPosters.map((poster, idx) => (
                                        <button
                                            key={poster.id}
                                            onClick={() => switchPoster(idx)}
                                            className={cn(
                                                "relative w-20 h-28 sm:w-24 sm:h-32 rounded-2xl overflow-hidden border-2 transition-all duration-300 shrink-0 group",
                                                idx === activePosterIndex
                                                    ? "border-primary ring-4 ring-primary/20 scale-105 z-10 shadow-xl shadow-primary/20"
                                                    : "border-border/40 hover:border-primary/30 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <Image
                                                src={poster.posterSrc}
                                                alt={`Poster ${idx + 1}`}
                                                fill
                                                unoptimized
                                                className="object-cover"
                                            />
                                            {/* Type badge */}
                                            <div className={cn(
                                                "absolute bottom-2 left-2 right-2 text-[9px] font-black uppercase text-center h-5 flex items-center justify-center rounded-lg backdrop-blur-md shadow-lg",
                                                poster.type === "mark_products"
                                                    ? "bg-primary text-white"
                                                    : "bg-black/60 text-white"
                                            )}>
                                                {poster.type === "mark_products" ? "Mark" : "Post"}
                                            </div>
                                            {/* Done badge */}
                                            {poster.markedItems && poster.markedItems.length > 0 && idx !== activePosterIndex && (
                                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-2 border-white z-20 animate-in zoom-in duration-300">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="w-full xl:w-96 space-y-6">
                        <PremiumCard className="p-4 sm:p-6">
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
                                <div className="grid grid-cols-2 gap-2 sm:gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {posterData.markedItems.map((item, idx) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleEditItem(item)}
                                            className={cn(
                                                "group flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-2xl border transition-all cursor-pointer",
                                                highlightedId === item.id
                                                    ? "bg-primary/5 border-primary"
                                                    : "bg-muted/30 border-border/50 hover:bg-muted/50"
                                            )}
                                        >
                                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/10 shrink-0">
                                                {item.productImage ? (
                                                    <Image src={item.productImage} fill unoptimized className="object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs opacity-30">#{idx + 1}</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-6 relative">
                                                <h4 className="font-bold text-sm truncate pr-4">{item.name || `Item ${idx + 1}`}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs line-through opacity-40">{item.currency} {item.oldPrice}</span>
                                                    <span className="text-sm font-bold text-green-500">{item.currency} {item.offerPrice}</span>
                                                </div>
                                                {item.mainCategory && (
                                                    <div className="flex flex-wrap gap-1 mt-1.5 auto-rows-min">
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-black whitespace-nowrap uppercase">
                                                            {item.mainCategory}
                                                        </span>
                                                        {item.subcategories && item.subcategories.slice(0, 1).map(cat => (
                                                            <span key={cat} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10 font-bold whitespace-nowrap">
                                                                {cat}
                                                            </span>
                                                        ))}
                                                        {item.subcategories && item.subcategories.length > 1 && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-bold">
                                                                +{item.subcategories.length - 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                                                    className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1.5 text-destructive rounded-lg hover:bg-destructive/10 transition-all"
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
                                        <span>The AI will extract name and price from your selection.</span>
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
                <div className="fixed inset-0 z-[100] overflow-hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => { setShowModal(false); setHighlightedId(null); }}
                    />
                    
                    {/* Slide-out Panel */}
                    <div className="fixed inset-y-0 right-0 w-full max-w-md md:max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 h-[100dvh]">
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
                                    onClick={() => { setShowModal(false); setHighlightedId(null); }}
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
                                                <Image src={formData.productImage} fill unoptimized className="object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="w-6 h-6 text-gray-200" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={startProductImageUpload}
                                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all duration-300 rounded-xl"
                                        >
                                            <RefreshCcw className="w-4 h-4" />
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
                                                    {mainCategories.filter(cat => cat.toLowerCase().includes(mainCategorySearch.toLowerCase())).map(cat => (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(p => ({ ...p, mainCategory: cat, subcategories: [] }));
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
                                                                            setFormData(p => ({
                                                                                ...p,
                                                                                subcategories: isSelected ? [] : [sub],
                                                                                subcategoryId: isSelected ? null : subObj.id
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
                                                type="number" step="0.01" value={formData.offerPrice}
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
                                        value={formData.description} rows={2}
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
                                        onClick={() => { setShowModal(false); setHighlightedId(null); }}
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
                                <Image
                                    ref={cropperImgRef}
                                    src={cropperImage}
                                    width={1000}
                                    height={1000}
                                    unoptimized
                                    className="max-w-full max-h-[60vh] mx-auto block object-contain"
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
            {/* --- Publication Modal --- */}
            {
                showPublishModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[300] p-4">
                        <PremiumCard className="w-full max-w-md p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Rocket className="w-5 h-5 text-primary" />
                                    </div>
                                    <Subheading className="m-0">Finalize Publication</Subheading>
                                </div>
                                <button
                                    onClick={() => setShowPublishModal(false)}
                                    className="p-2 hover:bg-black/10 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <Text className="font-bold text-base leading-tight">Ready to Publish</Text>
                                            <Text className="text-xs opacity-60 mt-0.5">
                                                Finalize your offer details below.
                                            </Text>
                                        </div>
                                    </div>

                                    <div className="space-y-2 relative group">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-primary/70 px-1">Campaign Name</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                                <Type className="w-4 h-4 text-primary group-focus-within:scale-110 transition-transform" />
                                            </div>
                                            <input
                                                type="text"
                                                value={offerTitle}
                                                onChange={(e) => setOfferTitle(e.target.value)}
                                                className="w-full bg-white border border-primary/10 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm"
                                                placeholder="e.g. Ramadan Special Electronics Sale"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                                    <Text className="text-xs font-medium m-0">You've marked {posterData.markedItems.length} items on this poster.</Text>
                                </div>

                                <Text className="text-xs opacity-50 italic px-1">
                                    Give your offer a catchy name to help you track it later.
                                </Text>
                            </div>

                            <div className="p-6 bg-muted/30 border-t border-border/50 flex gap-3">
                                <PremiumButton
                                    variant="default"
                                    className="flex-1 h-12"
                                    onClick={confirmPublish}
                                    leftIcon={CheckCircle2}
                                >
                                    Publish Now
                                </PremiumButton>
                                <PremiumButton
                                    variant="outline"
                                    className="flex-1 h-12"
                                    onClick={() => setShowPublishModal(false)}
                                >
                                    Cancel
                                </PremiumButton>
                            </div>
                        </PremiumCard>
                    </div>
                )}

            {/* Back Warning Modal */}
            < AppModal
                open={showBackWarning}
                onOpenChange={setShowBackWarning}
                title="Unsaved Changes"
                description="You have unsaved changes. Would you like to save this as a draft before leaving?"
            >
                <div className="flex flex-col gap-3">
                    <PremiumButton
                        variant="default"
                        onClick={async () => {
                            await handleSaveDraft();
                            setShowBackWarning(false);
                        }}
                        className="rounded-xl w-full"
                        leftIcon={Save}
                    >
                        Save as Draft & Exit
                    </PremiumButton>
                    <div className="grid grid-cols-2 gap-3">
                        <PremiumButton
                            variant="outline"
                            onClick={handleDiscardSession}
                            className="rounded-xl"
                            leftIcon={Trash2}
                        >
                            Discard
                        </PremiumButton>
                        <PremiumButton
                            variant="outline"
                            onClick={() => setShowBackWarning(false)}
                            className="rounded-xl font-bold"
                        >
                            Cancel
                        </PremiumButton>
                    </div>
                </div>
            </AppModal >
        </div >
    );
}

// Wrapper component with Suspense boundary for useSearchParams
export default function HotspotEditorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <HotspotEditorContent />
        </Suspense>
    );
}
