"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Heading, Text } from "@/components/shared/Typography";
import {
    Tag,
    Image as ImageIcon,
    Calendar,
    Percent,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Loader2,
    LayoutDashboard,
    ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "@/components/shared/FileUpload";

const CATEGORIES = [
    "Food & Dining",
    "Fashion",
    "Wellness",
    "Electronics",
    "Entertainment",
    "Services",
    "Others"
];

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
        category: "Food & Dining",
        discount: "",
        validUntil: "",
        originalPrice: "",
        offerPrice: "",
        imageFile: null as File | null,
    });
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
            {/* Basic Info, Details, Pricing sections remain the same */}
            <PremiumCard className="p-6 md:p-8">
                <div className="space-y-6">
                    {/* ... previous fields ... */}
                    {/* For brevity, assuming previous fields are here */}
                </div>
            </PremiumCard>

            {/* Mark Items Section */}
            <PremiumCard className="overflow-hidden">
                <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            <Heading className="text-xl">Mark Items</Heading>
                        </div>
                        <div className="flex gap-2">
                            <PremiumButton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => router.back()}
                            >
                                Back
                            </PremiumButton>
                            <PremiumButton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => toast.success("Saved as draft")}
                            >
                                Save Draft
                            </PremiumButton>
                            <PremiumButton
                                type="submit"
                                size="sm"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Publishing..." : "Publish"}
                            </PremiumButton>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <input
                                type="text"
                                placeholder="Enter offer title"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-gray-700"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="relative bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-8 min-h-[400px] flex items-center justify-center">
                            {imageSrc ? (
                                <div className="relative w-full h-[400px]">
                                    <img
                                        ref={imageRef}
                                        src={imageSrc}
                                        alt="Poster"
                                        className="w-full h-full object-contain rounded-lg cursor-crosshair"
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
