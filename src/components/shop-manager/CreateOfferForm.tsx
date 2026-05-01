"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { Heading, Text } from "@/components/shared/Typography";
import {
    Tag,
    Image as ImageIcon,
    Calendar,
    Percent,
    IndianRupee,
    AlertCircle,
    CheckCircle2,
    Loader2,
    LayoutDashboard,
    ChevronLeft,
    Plus,
    CheckSquare,
    Type,
    AlignLeft
} from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "@/components/shared/FileUpload";
import Image from "next/image";

import { CATEGORY_HIERARCHY, MAIN_CATEGORIES, MainCategory } from "@/lib/categories";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

export default function CreateOfferForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        mainCategory: "" as string,
        subcategories: [] as string[],
        discount: "",
        originalPrice: "",
        offerPrice: "",
        imageFile: null as File | null,
    });
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [mainCategoryOpen, setMainCategoryOpen] = useState(false);
    const [mainCategorySearch, setMainCategorySearch] = useState('');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const handleImageUpload = (file: File | null) => {
        if (!file) return;
        setFormData({ ...formData, imageFile: file });
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        setBoxes([]); // Reset boxes for new image
    };

    const getMousePos = useCallback((canvas: HTMLCanvasElement, evt: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }, []);

    const drawBoxes = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        boxes.forEach(box => {
            ctx.strokeRect(box.x, box.y, box.width, box.height);
        });
    }, [boxes, imageSrc]);

    useEffect(() => {
        drawBoxes();
    }, [drawBoxes]);

    const handleMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) return;

        const pos = getMousePos(canvas, e.nativeEvent as MouseEvent);
        setIsDrawing(true);
        setStartX(pos.x);
        setStartY(pos.y);
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) return;

        const pos = getMousePos(canvas, e.nativeEvent as MouseEvent);
        const width = pos.x - startX;
        const height = pos.y - startY;

        if (Math.abs(width) > 10 && Math.abs(height) > 10) {
            setBoxes(prev => [...prev, { x: startX, y: startY, width, height }]);
        }

        setIsDrawing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setIsSuccess(true);

        // Redirect after success
        setTimeout(() => {
            router.push("/shop-manager");
        }, 2000);
    };

    if (isSuccess) {
        return (
            <PremiumCard className="p-12 text-center animate-fade-in">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-primary animate-bounce" />
                </div>
                <Heading className="text-3xl mb-4">Offer Created Successfully!</Heading>
                <Text className="mb-8">Your new offer is now live and visible to shoppers. Redirecting to your dashboard...</Text>
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </PremiumCard>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
            {/* Basic Info, Details, Pricing sections */}
            <PremiumCard className="p-6 md:p-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-black">
                            <AlignLeft className="w-4 h-4 text-black" /> Description
                        </label>
                        <textarea
                            placeholder="Enter offer description"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-gray-700 min-h-[100px] resize-none text-black font-medium"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <PremiumInput
                            label="Discount"
                            icon={Percent}
                            type="text"
                            placeholder="e.g. 50% OFF"
                            value={formData.discount}
                            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        />


                        <div className="grid grid-cols-2 gap-4">
                            <PremiumInput
                                label="Original"
                                icon={IndianRupee}
                                type="number"
                                placeholder="0"
                                value={formData.originalPrice}
                                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                            />
                            <PremiumInput
                                label="Offer"
                                icon={IndianRupee}
                                type="number"
                                placeholder="0"
                                value={formData.offerPrice}
                                onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </PremiumCard>

            {/* Mark Items Section */}
            <PremiumCard className="overflow-hidden">
                <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <ImageIcon className="w-5 h-5 text-black" />
                            <Heading className="text-xl text-black">Mark Items</Heading>
                        </div>
                        <div className="flex gap-3">
                            <PremiumButton
                                type="button"
                                variant="outline"
                                className="h-10 rounded-xl bg-white border-gray-200"
                                onClick={() => router.back()}
                                leftIcon={ChevronLeft}
                            >
                                Back
                            </PremiumButton>
                            <PremiumButton
                                type="button"
                                variant="outline"
                                className="h-10 rounded-xl bg-white border-gray-200"
                                onClick={() => toast.success("Saved as draft")}
                            >
                                Save Draft
                            </PremiumButton>
                            <PremiumButton
                                type="submit"
                                className="h-10 rounded-xl shadow-md px-6"
                                disabled={isSubmitting}
                                leftIcon={CheckCircle2}
                            >
                                {isSubmitting ? "Publishing..." : "Publish"}
                            </PremiumButton>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <PremiumInput
                                label="Title"
                                icon={Type}
                                type="text"
                                placeholder="Enter offer title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="h-12"
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 text-black">
                                    <Tag className="w-4 h-4 text-black" /> Main Category
                                </label>
                                <button
                                    type="button"
                                    onClick={() => { setMainCategoryOpen(!mainCategoryOpen); setMainCategorySearch(''); }}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-sm text-left flex items-center justify-between cursor-pointer hover:border-gray-300 h-12"
                                >
                                    <div className={cn("flex-1 truncate", formData.mainCategory && "text-black")}>
                                        {formData.mainCategory || <span className="text-gray-400 font-medium">Select...</span>}
                                    </div>
                                    <ChevronDown className={cn("w-4 h-4 text-gray-400 shrink-0 transition-transform ml-2", mainCategoryOpen && "rotate-180")} />
                                </button>

                                {mainCategoryOpen && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                                            {MAIN_CATEGORIES.filter(cat => cat.toLowerCase().includes(mainCategorySearch.toLowerCase())).map(cat => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(p => ({ ...p, mainCategory: cat, subcategories: [] }));
                                                        setMainCategoryOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-primary/5 transition-colors cursor-pointer text-gray-700",
                                                        formData.mainCategory === cat && "bg-primary/5 font-bold text-black"
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
                        </div>

                        {formData.mainCategory && (
                            <div className="space-y-2 relative">
                                <label className="text-sm font-medium flex items-center gap-2 text-black">
                                    <CheckSquare className="w-4 h-4 text-black" /> Subcategories
                                </label>

                                <button
                                    type="button"
                                    onClick={() => { setCategoryOpen(!categoryOpen); setCategorySearch(''); }}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm text-left flex items-center justify-between cursor-pointer hover:border-gray-300"
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
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
                                            <Search className="w-3.5 h-3.5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={categorySearch}
                                                onChange={(e) => setCategorySearch(e.target.value)}
                                                placeholder="Search or add custom..."
                                                className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400 text-gray-800"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && categorySearch.trim()) {
                                                            e.preventDefault();
                                                            const newSub = categorySearch.trim();
                                                            setFormData(p => ({
                                                                ...p,
                                                                subcategories: [newSub]
                                                            }));
                                                            setCategorySearch('');
                                                            setCategoryOpen(false);
                                                        }
                                                }}
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {CATEGORY_HIERARCHY[formData.mainCategory as MainCategory].filter(s => s.toLowerCase().includes(categorySearch.toLowerCase())).map(sub => {
                                                const isSelected = formData.subcategories.includes(sub);
                                                return (
                                                    <button
                                                        key={sub}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(p => ({
                                                                ...p,
                                                                subcategories: isSelected ? [] : [sub]
                                                            }));
                                                            setCategoryOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-primary/5 transition-colors cursor-pointer text-gray-700",
                                                            isSelected && "bg-primary/5 font-bold text-black"
                                                        )}
                                                    >
                                                        {sub}
                                                        {isSelected && <Check className="w-4 h-4 text-black" />}
                                                    </button>
                                                );
                                            })}
                                            {categorySearch.trim() && !CATEGORY_HIERARCHY[formData.mainCategory as MainCategory].some(s => s.toLowerCase() === categorySearch.toLowerCase()) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newSub = categorySearch.trim();
                                                        setFormData(p => ({
                                                            ...p,
                                                            subcategories: [newSub]
                                                        }));
                                                        setCategorySearch('');
                                                        setCategoryOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-primary/5 transition-colors cursor-pointer text-primary font-bold"
                                                >
                                                    <Plus className="w-3 h-3" /> Add "{categorySearch}"
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="relative bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-8 min-h-[400px] flex items-center justify-center">
                            {imageSrc ? (
                                <div className="relative w-full h-[400px]">
                                    <Image
                                        ref={imageRef}
                                        src={imageSrc}
                                        alt="Poster"
                                        fill
                                        className="object-contain rounded-lg cursor-crosshair"
                                        unoptimized
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                    />
                                </div>
                            ) : (
                                <div className="text-center">
                                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                    <p className="text-lg font-medium text-gray-700 mb-2">Upload Poster Image</p>
                                    <p className="text-sm text-gray-500 mb-4">Draw boxes over items to highlight them</p>
                                    <FileUpload
                                        onFileSelect={handleImageUpload}
                                    />
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-gray-600 text-center italic">
                            Draw boxes over items on your poster to mark them for the offer
                        </p>
                    </div>
                </div>
            </PremiumCard>
        </form>
    );
}
