"use client";

import { useState, useRef, useEffect, MouseEvent, TouchEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, Save, Info, Send, CheckSquare, Rocket, Zap,
    Trash2, Eye, Plus, IndianRupee,
    Type, AlignLeft, RefreshCcw,
    CheckCircle2, AlertCircle, FileEdit, X,
    Image as ImageIcon
} from "lucide-react";
import { createWorker } from 'tesseract.js';
import { Heading, Subheading, Text } from "@/components/shared/Typography";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { AppModal } from "@/components/shared/AppModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { storage } from "@/lib/storage";

// --- Types ---

interface MarkedItem {
    id: string;
    x: number;      // Relative coordinates (0-1)
    y: number;
    width: number;
    height: number;
    name: string;
    description: string;
    productImage: string;
    oldPrice: number;
    offerPrice: number;
    currency: string;
}

interface PosterData {
    posterSrc: string;
    markedItems: MarkedItem[];
    currency: string;
}

interface Position { x: number; y: number; }
interface Rect { x: number; y: number; width: number; height: number; }

// --- Component ---

export default function HotspotEditorPage() {
    const router = useRouter();

    // State
    const [posterData, setPosterData] = useState<PosterData>({ posterSrc: '', markedItems: [], currency: 'BD' });
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<Position | null>(null);
    const [currentRect, setCurrentRect] = useState<Rect | null>(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [showModal, setShowModal] = useState(false);
    const [currentMarkedItem, setCurrentMarkedItem] = useState<MarkedItem | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        productImage: '',
        oldPrice: '',
        offerPrice: ''
    });

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

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const productFileInputRef = useRef<HTMLInputElement>(null);
    const cropperImgRef = useRef<HTMLImageElement>(null);
    const cropperContainerRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const data = localStorage.getItem('currentEditingPoster');
        if (data) {
            const parsedData = JSON.parse(data);
            setPosterData(parsedData);
            if (parsedData.title) {
                setOfferTitle(parsedData.title);
            }
        } else {
            router.push('/shop-manager/create-offer');
        }
    }, [router]);

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
        }

        setIsDrawing(false);
        const { x, y, width, height } = currentRect;

        // Calculate relative coordinates
        const relX = x / imageSize.width;
        const relY = y / imageSize.height;
        const relW = width / imageSize.width;
        const relH = height / imageSize.height;

        const id = crypto.randomUUID();
        const tempItem: MarkedItem = {
            id, x: relX, y: relY, width: relW, height: relH,
            name: 'Processing...', description: '', productImage: '',
            oldPrice: 0, offerPrice: 0, currency: posterData.currency
        };

        setPosterData(prev => ({ ...prev, markedItems: [...prev.markedItems, tempItem] }));
        setCurrentRect(null);

        // --- AI Extraction ---
        setIsProcessing(true);
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const img = imgRef.current!;

            const scaleX = img.naturalWidth / imageSize.width;
            const scaleY = img.naturalHeight / imageSize.height;

            const sw = width * scaleX;
            const sh = height * scaleY;
            canvas.width = sw;
            canvas.height = sh;

            ctx.drawImage(img, x * scaleX, y * scaleY, sw, sh, 0, 0, sw, sh);
            const croppedDataUrl = canvas.toDataURL();

            const worker = await createWorker('ara+eng');
            const { data: { text } } = await worker.recognize(croppedDataUrl);

            // Basic Price Extraction (same logic as MVP)
            const priceMatches = text.match(/\d+\.\d+/g);
            let extractedOldPrice = 0;
            let extractedOfferPrice = 0;

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

            const updatedItem: MarkedItem = {
                ...tempItem,
                name: text.split('\n')[0].trim() || 'Marked Product',
                description: text.trim(),
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
            await worker.terminate();
        } catch (err) {
            console.error("OCR Error:", err);
            toast.error("AI extraction failed. Please enter details manually.");
            handleEditItem(tempItem);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Item Management ---

    const handleEditItem = (item: MarkedItem) => {
        setCurrentMarkedItem(item);
        setFormData({
            name: item.name === 'Processing...' ? '' : item.name,
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

        const updatedItem: MarkedItem = {
            ...currentMarkedItem,
            name: formData.name,
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
        if (!offerTitle.trim()) {
            toast.error("Please enter an offer title");
            return;
        }

        const existingData = localStorage.getItem('markedPosters');
        let allPosters = existingData ? JSON.parse(existingData) : [];

        const finalPosterData = {
            ...posterData,
            id: (posterData as any).id || crypto.randomUUID(),
            title: offerTitle,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        allPosters.push(finalPosterData);
        localStorage.setItem('markedPosters', JSON.stringify(allPosters));

        // Remove from current editing and also from drafts if it was one
        localStorage.removeItem('currentEditingPoster');

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
            const existingDrafts = await storage.getItem<any[]>('offerDrafts') || [];
            let allDrafts = [...existingDrafts];

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
            localStorage.removeItem('currentEditingPoster');
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
            localStorage.removeItem('currentEditingPoster');
            toast.success("Changes discarded");
            router.push('/shop-manager/create-offer');
        } catch (error) {
            console.error("Failed to discard session:", error);
            toast.error("Failed to discard session cleanly");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="h-24 lg:h-32" />

            <main className="container mx-auto px-4 py-8 relative">
                <Breadcrumbs
                    items={[
                        { label: "Dashboard", href: "/shop-manager" },
                        { label: "New Offer", href: "/shop-manager/create-offer" },
                        { label: "Mark Items" }
                    ]}
                />

                <div className="mt-8 flex flex-col xl:flex-row gap-8">
                    {/* Editor Area */}
                    <div className="flex-1 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <Heading className="text-3xl font-bold text-gradient">Mark Items</Heading>
                                <Text className="opacity-60 text-sm">Draw boxes over items on your poster.</Text>
                            </div>

                            <div className="flex gap-3 shrink-0">
                                <PremiumButton variant="outline" onClick={() => setShowBackWarning(true)} leftIcon={ChevronLeft}>
                                    Back
                                </PremiumButton>
                                <PremiumButton
                                    variant="outline"
                                    onClick={handleSaveDraft}
                                    leftIcon={Save}
                                >
                                    Save Draft
                                </PremiumButton>
                                <PremiumButton
                                    variant="default"
                                    onClick={handleFinish}
                                    leftIcon={Send}
                                    disabled={posterData.markedItems.length === 0}
                                >
                                    Publish Offer
                                </PremiumButton>
                            </div>
                        </div>

                        <div className="max-w-2xl">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Type className="w-4 h-4 text-primary group-focus-within:scale-110 transition-transform" />
                                </div>
                                <input
                                    type="text"
                                    value={offerTitle}
                                    onChange={(e) => setOfferTitle(e.target.value)}
                                    className="w-full bg-card/50 border border-border/50 rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-lg placeholder:opacity-90"
                                    placeholder="Enter Offer Campaign Title..."
                                />
                                {offerTitle && (
                                    <button
                                        onClick={() => setOfferTitle('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                                    >
                                        <X className="w-3 h-3 opacity-40" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <PremiumCard className="relative overflow-hidden bg-black/5 border-primary/20 p-2 sm:p-4">
                            <div
                                ref={containerRef}
                                className="relative w-full cursor-crosshair select-none overflow-hidden rounded-2xl"
                                onMouseDown={handlePointerDown}
                                onMouseMove={handlePointerMove}
                                onMouseUp={handlePointerUp}
                                onTouchStart={handlePointerDown}
                                onTouchMove={handlePointerMove}
                                onTouchEnd={handlePointerUp}
                            >
                                {posterData.posterSrc && (
                                    <img
                                        ref={imgRef}
                                        src={posterData.posterSrc}
                                        alt="Poster"
                                        className="w-full h-auto block rounded-2xl"
                                        onLoad={() => setImageSize({ width: imgRef.current!.offsetWidth, height: imgRef.current!.offsetHeight })}
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
                    </div>

                    {/* Sidebar: Marked Items List */}
                    <div className="w-full xl:w-96 space-y-6">
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
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {posterData.markedItems.map((item, idx) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleEditItem(item)}
                                            className={cn(
                                                "group flex gap-3 p-3 rounded-2xl border transition-all cursor-pointer",
                                                highlightedId === item.id
                                                    ? "bg-primary/5 border-primary"
                                                    : "bg-muted/30 border-border/50 hover:bg-muted/50"
                                            )}
                                        >
                                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/10 shrink-0">
                                                {item.productImage ? (
                                                    <img src={item.productImage} className="w-full h-full object-cover" alt="" />
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

                {/* --- Edit Modal --- */}
                {showModal && currentMarkedItem && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-4">
                        <PremiumCard className="w-full max-w-lg p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            <form onSubmit={handleSaveForm}>
                                <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <FileEdit className="w-5 h-5 text-primary" />
                                        </div>
                                        <Subheading className="m-0">Refine Item Details</Subheading>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); setHighlightedId(null); }}
                                        className="p-2 hover:bg-black/10 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    {/* Product Image Section */}
                                    <div className="flex gap-6 items-center p-4 bg-primary/5 rounded-3xl border border-primary/10">
                                        <div className="relative group shrink-0">
                                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white shadow-sm border border-border group-hover:border-primary/50 transition-colors">
                                                {formData.productImage ? (
                                                    <img src={formData.productImage} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-muted">
                                                        <ImageIcon className="w-8 h-8 opacity-20" />
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={startProductImageUpload}
                                                className="absolute inset-0 bg-primary/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 rounded-2xl backdrop-blur-[2px]"
                                            >
                                                <RefreshCcw className="w-6 h-6 animate-spin-slow" />
                                            </button>
                                            <input
                                                ref={productFileInputRef}
                                                type="file" accept="image/*" className="hidden"
                                                onChange={handleProductFileChange}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Text className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Product Display</Text>
                                            <Text className="text-[11px] opacity-60 leading-tight mb-2">Main image for the popup. Click to replace or re-crop.</Text>
                                            <button
                                                type="button"
                                                onClick={startProductImageUpload}
                                                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                                            >
                                                <RefreshCcw className="w-3 h-3" /> Change Image
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <PremiumInput
                                            label="Product Name"
                                            icon={Type}
                                            value={formData.name}
                                            required
                                            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                            placeholder="e.g. Delicious Weekend Brunch"
                                            className="h-12"
                                        />

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-[11px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                                                    <AlignLeft className="w-3 h-3 text-primary" /> Full Description
                                                </label>
                                                {/* <button
                                                    type="button" onClick={handleAIFill}
                                                    className="text-[11px] font-bold text-primary hover:text-primary/70 flex items-center gap-1 transition-colors"
                                                >
                                                    <Zap className="w-3 h-3" /> AI PRICE REFILL
                                                </button> */}
                                            </div>
                                            <textarea
                                                value={formData.description} rows={3}
                                                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                                className="w-full bg-background/40 border border-primary/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-sm min-h-[100px] resize-none"
                                                placeholder="Paste any additional details or let the AI fill it..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-2 px-1 text-destructive">
                                                    <IndianRupee className="w-3 h-3" /> Old Price
                                                </label>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold opacity-30 group-focus-within:opacity-60 transition-opacity">₹</span>
                                                    <input
                                                        type="number" step="0.01" value={formData.oldPrice}
                                                        onChange={(e) => setFormData(p => ({ ...p, oldPrice: e.target.value }))}
                                                        className="w-full bg-background/40 border border-primary/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-bold text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-2 px-1 text-green-500">
                                                    <IndianRupee className="w-3 h-3" /> Offer Price
                                                </label>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold opacity-30 group-focus-within:opacity-100 transition-opacity">₹</span>
                                                    <input
                                                        type="number" step="0.01" value={formData.offerPrice}
                                                        onChange={(e) => setFormData(p => ({ ...p, offerPrice: e.target.value }))}
                                                        className="w-full bg-background/40 border border-primary/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-bold text-sm text-green-600 shadow-sm shadow-green-500/5"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-muted/30 border-t border-border/50 flex flex-col gap-3">
                                    <div className="flex gap-3">
                                        <PremiumButton type="submit" variant="default" className="flex-1 h-12 rounded-2xl shadow-lg shadow-primary/20" leftIcon={CheckCircle2}>
                                            Save Changes
                                        </PremiumButton>
                                        <PremiumButton
                                            type="button"
                                            variant="outline"
                                            className="flex-1 h-12 rounded-2xl"
                                            onClick={() => { setShowModal(false); setHighlightedId(null); }}
                                        >
                                            Cancel
                                        </PremiumButton>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteItem(currentMarkedItem.id)}
                                        className="w-full py-2.5 text-[10px] font-bold uppercase tracking-widest text-destructive hover:text-white hover:bg-destructive transition-all rounded-xl flex items-center justify-center gap-2 mt-1 border border-destructive/20 hover:border-destructive"
                                    >
                                        <Trash2 className="w-3 h-3" /> Remove Item from Poster
                                    </button>
                                </div>
                            </form>
                        </PremiumCard>
                    </div>
                )}

                {/* --- Cropper Modal --- */}
                {showCropper && cropperImage && (
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
                )}
                {/* --- Publication Modal --- */}
                {showPublishModal && (
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
                                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <Text className="font-bold text-base leading-tight">Ready to Publish</Text>
                                        <Text className="text-xs opacity-60 mt-0.5">
                                            Campaign: <span className="text-primary font-bold">"{offerTitle}"</span>
                                        </Text>
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
            </main>

            {/* Back Warning Modal */}
            <AppModal
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
            </AppModal>
        </div>
    );
}
