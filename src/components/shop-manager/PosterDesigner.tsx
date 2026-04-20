"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { AppModal } from "@/components/shared/AppModal";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumInput } from "@/components/shared/PremiumInput";
import {
    Plus,
    Type,
    Heading1,
    Square,
    Circle,
    Triangle,
    Star,
    Download,
    Trash2,
    Paintbrush,
    Palette,
    ImageIcon,
    FileText,
    Layers,
    Grid3X3,
    Move,
    Undo2,
    Redo2,
    RotateCcw,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignStartVertical,
    AlignCenterVertical,
    AlignEndVertical,
    Smartphone,
    Monitor,
    Sparkles,
    Lock,
    Unlock,
    Eye,
    EyeOff,
    ArrowUpRight,
    Search,
    ChevronRight,
    Loader2,
    Settings,
    Minus,
    Award,
    Zap,
    Waves,
    Octagon,
    Cloud,
    Bookmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PREMIUM_GRADIENTS, ASPECT_RATIOS, GOOGLE_FONTS, ABSTRACT_MODELS } from "@/lib/designPresets";
import { generateTaglines, suggestPalette } from "@/lib/ai/posterAI";
import { useAllProducts } from "@/hooks/useApi";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ElType = "text" | "shape" | "product-card";
type ShapeKind = "rect" | "circle" | "triangle" | "star" | "blob" | "badge" | "burst" | "ribbon" | "pill" | "wave";

/* ================================================================
   TYPES
   ================================================================ */

interface CanvasElement {
    id: string;
    type: ElType;
    x: number;
    y: number;
    w: number;
    h: number;
    zIndex: number;
    isLocked?: boolean;
    isVisible?: boolean;
    name?: string;
    // Text
    text?: string;
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    fontFamily?: string;
    letterSpacing?: number;
    lineHeight?: number;
    textAlign?: "left" | "center" | "right";
    shadow?: string;
    isGlass?: boolean;
    // Shape
    shapeKind?: ShapeKind;
    fill?: string;
    opacity?: number;
    // Product Card
    cardImage?: string;
    cardTitle?: string;
    cardDesc?: string;
    cardOfferPrice?: string;
    cardOldPrice?: string;
    cardBg?: string;
    cardStyle?: "classic" | "badge" | "modern" | "glass" | "split" | "gradient";
    badgeText?: string;
    isLayoutUnlocked?: boolean;
    subLayout?: Record<string, { x: number; y: number; w?: number; h?: number }>;
    internalElements?: CanvasElement[];
}

interface SavedPoster {
    id: string;
    elements: CanvasElement[];
    canvasBg: string;
    gridCols: number;
    gridRows: number;
    timestamp: number;
}

/* ================================================================
   CONSTANTS
   ================================================================ */

const CANVAS_W = 794;
const CANVAS_H = 1123;

/* ================================================================
   SHAPE SVG HELPER
   ================================================================ */

function getShapeClipPath(kind: ShapeKind): string | undefined {
    switch (kind) {
        case "circle": return "circle(50% at 50% 50%)";
        case "triangle": return "polygon(50% 5%, 95% 95%, 5% 95%)";
        case "star": return "polygon(50% 5%, 61% 35%, 95% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 5% 35%, 39% 35%)";
        case "badge": return "polygon(50% 0%, 58% 15%, 75% 15%, 70% 32%, 85% 45%, 70% 58%, 75% 75%, 58% 75%, 50% 90%, 42% 75%, 25% 75%, 30% 58%, 15% 45%, 30% 32%, 25% 15%, 42% 15%)";
        case "burst": return "polygon(50% 2%, 55% 25%, 78% 18%, 68% 40%, 95% 50%, 68% 60%, 78% 82%, 55% 75%, 50% 98%, 45% 75%, 22% 82%, 32% 60%, 5% 50%, 32% 40%, 22% 18%, 45% 25%)";
        case "ribbon": return "polygon(0% 20%, 100% 20%, 100% 80%, 0% 80%, 20% 50%)";
        case "pill": return "inset(25% 0% 25% 0% round 50px)";
        case "wave": return "polygon(0% 50%, 10% 40%, 20% 35%, 40% 40%, 60% 60%, 80% 65%, 90% 60%, 100% 50%, 100% 100%, 0% 100%)";
        default: return undefined;
    }
}

function ShapeSVG({ kind, fill, opacity = 1, isGlass }: { kind: ShapeKind; fill: string; opacity?: number; isGlass?: boolean }) {
    const finalFill = isGlass ? "transparent" : fill;
    const svgs: Record<ShapeKind, React.ReactNode> = {
        rect: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ opacity }}>
                <rect x="0" y="0" width="100" height="100" fill={finalFill} rx="8" />
            </svg>
        ),
        circle: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ opacity }}>
                <ellipse cx="50" cy="50" rx="50" ry="50" fill={finalFill} />
            </svg>
        ),
        triangle: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ opacity }}>
                <polygon points="50,5 95,95 5,95" fill={finalFill} />
            </svg>
        ),
        star: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ opacity }}>
                <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={finalFill} />
            </svg>
        ),
        blob: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ opacity }}>
                <path d="M45,20 Q60,10 75,30 T90,60 Q80,90 50,95 T10,70 Q5,40 45,20" fill={finalFill} />
            </svg>
        ),
        badge: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ opacity }}>
                <path d="M50 0 L58 15 L75 15 L70 32 L85 45 L70 58 L75 75 L58 75 L50 90 L42 75 L25 75 L30 58 L15 45 L30 32 L25 15 L42 15 Z" fill={finalFill} stroke={finalFill} strokeWidth="2" strokeLinejoin="round" />
            </svg>
        ),
        burst: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ opacity }}>
                <path d="M50 2 L55 25 L78 18 L68 40 L95 50 L68 60 L78 82 L55 75 L50 98 L45 75 L22 82 L32 60 L5 50 L32 40 L22 18 L45 25 Z" fill={finalFill} />
            </svg>
        ),
        ribbon: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ opacity }}>
                <path d="M0 20 L100 20 L100 80 L0 80 L20 50 Z" fill={finalFill} />
            </svg>
        ),
        pill: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ opacity }}>
                <rect x="0" y="25" width="100" height="50" rx="25" fill={finalFill} />
            </svg>
        ),
        wave: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" style={{ opacity }}>
                <path d="M0 50 C 20 20, 80 80, 100 50 L 100 100 L 0 100 Z" fill={finalFill} />
            </svg>
        ),
    };
    return <>{svgs[kind]}</>;
}

/* ================================================================
   PRODUCT CARD RENDERER
   ================================================================ */

function ProductCardContent({ el, onUpdate }: { el: CanvasElement; onUpdate: (id: string, updates: Partial<CanvasElement>) => void }) {
    const isBadge = el.cardStyle === "badge";
    const isModern = el.cardStyle === "modern";
    const isGlass = el.cardStyle === "glass";
    const isSplit = el.cardStyle === "split";
    const isGradient = el.cardStyle === "gradient";
    const isUnlocked = el.isLayoutUnlocked;

    const handleSubDrag = (id: string, e: React.MouseEvent) => {
        if (!isUnlocked) return;
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const initialSubLayout = el.subLayout?.[id] || { x: 0, y: 0, w: 100, h: 100 };

        const onMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            const newSubLayout = {
                ...el.subLayout,
                [id]: {
                    x: initialSubLayout.x + dx,
                    y: initialSubLayout.y + dy,
                    w: initialSubLayout.w || 100,
                    h: initialSubLayout.h || 100,
                }
            };
            onUpdate(el.id, { subLayout: newSubLayout });
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    const handleSubResize = (id: string, e: React.MouseEvent) => {
        if (!isUnlocked) return;
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const initialSubLayout = el.subLayout?.[id] || { x: 0, y: 0, w: 100, h: 100 };

        const onMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            const newSubLayout = {
                ...el.subLayout,
                [id]: {
                    x: initialSubLayout.x,
                    y: initialSubLayout.y,
                    w: Math.max(20, (initialSubLayout.w || 100) + dx),
                    h: Math.max(20, (initialSubLayout.h || 100) + dy),
                }
            };
            onUpdate(el.id, { subLayout: newSubLayout });
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    const getSubStyle = (id: string): React.CSSProperties => {
        if (isUnlocked && el.subLayout?.[id]) {
            const l = el.subLayout[id];
            return {
                position: "absolute",
                left: l.x,
                top: l.y,
                width: l.w || undefined,
                height: l.h || undefined,
                cursor: "move",
                zIndex: 10,
            };
        }
        return {};
    };

    return (
        <div
            className={cn(
                "flex w-full h-full rounded-xl overflow-hidden shadow-md group border relative",
                isSplit && !isUnlocked ? "flex-row" : "flex-col",
                isGlass ? "bg-white/30 backdrop-blur-md border-white/20 shadow-xl" : "border-border/10",
                isUnlocked ? "bg-white" : ""
            )}
            style={{
                backgroundColor: isGlass ? undefined : (isGradient && !isUnlocked ? undefined : (el.cardBg || "#ffffff")),
                backgroundImage: isGradient && !isUnlocked ? "linear-gradient(135deg, #f97316 0%, #dc2626 100%)" : undefined
            }}
        >
            {/* Image Section */}
            <div
                className={cn(
                    "bg-gray-100 flex items-center justify-center overflow-hidden relative shrink-0",
                    isSplit && !isUnlocked ? "w-[40%] h-full" : "w-full h-[55%]",
                    isUnlocked ? "absolute w-[60px] h-[60px] rounded-lg shadow-sm" : ""
                )}
                style={getSubStyle("image")}
                onMouseDown={(e) => handleSubDrag("image", e)}
            >
                {el.cardImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={el.cardImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                )}

                {/* Internal Resize handle for image */}
                {isUnlocked && (
                    <div
                        className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-tl-sm cursor-nwse-resize z-20"
                        onMouseDown={(e) => handleSubResize("image", e)}
                    />
                )}

                {/* Badge Overlay */}
                {isBadge && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white rotate-12 scale-110">
                        {el.badgeText || "NEW"}
                    </div>
                )}
            </div>

            {/* Internal Shapes (Elements nested inside card) */}
            {el.internalElements?.map(subEl => (
                <div
                    key={subEl.id}
                    className="absolute cursor-move"
                    style={{
                        left: subEl.x,
                        top: subEl.y,
                        width: subEl.w,
                        height: subEl.h,
                        backgroundColor: subEl.fill,
                        clipPath: subEl.type === "shape" ?
                            (subEl.shapeKind === "circle" ? "circle(50% at 50% 50%)" :
                                (subEl.shapeKind === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" :
                                    (subEl.shapeKind === "star" ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" : "none"))) : "none",
                        borderRadius: subEl.shapeKind === "rect" ? "4px" : "0",
                        zIndex: 15
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        // Internal drag logic for nested shapes
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const initialX = subEl.x;
                        const initialY = subEl.y;

                        const onMouseMove = (mv: MouseEvent) => {
                            const dx = mv.clientX - startX;
                            const dy = mv.clientY - startY;
                            const updatedShapes = el.internalElements?.map(s =>
                                s.id === subEl.id ? { ...s, x: initialX + dx, y: initialY + dy } : s
                            );
                            onUpdate(el.id, { internalElements: updatedShapes });
                        };
                        const onMouseUp = () => {
                            document.removeEventListener("mousemove", onMouseMove);
                            document.removeEventListener("mouseup", onMouseUp);
                        };
                        document.addEventListener("mousemove", onMouseMove);
                        document.addEventListener("mouseup", onMouseUp);
                    }}
                />
            ))}

            {/* Content Section */}
            <div className={cn(
                "flex flex-col gap-1 p-2.5 flex-1 min-w-0 justify-center",
                isGradient && !isUnlocked ? "text-white" : "",
                isUnlocked ? "contents" : ""
            )}>
                <div
                    className={cn(
                        "font-bold text-sm leading-tight truncate px-1",
                        isGradient && !isUnlocked ? "text-white" : "text-gray-900",
                        isUnlocked ? "border border-dashed border-gray-300 p-1 bg-white/80 font-bold" : ""
                    )}
                    style={getSubStyle("title")}
                    onMouseDown={(e) => handleSubDrag("title", e)}
                    data-editable="title"
                    suppressContentEditableWarning
                >
                    {el.cardTitle || "Product"}
                </div>
                <div
                    className={cn(
                        "text-[11px] leading-snug line-clamp-2 px-1",
                        isGradient && !isUnlocked ? "text-white/80" : "text-gray-500",
                        isUnlocked ? "border border-dashed border-gray-300 p-1 bg-white/80" : ""
                    )}
                    style={getSubStyle("desc")}
                    onMouseDown={(e) => handleSubDrag("desc", e)}
                    data-editable="desc"
                    suppressContentEditableWarning
                >
                    {el.cardDesc || ""}
                </div>

                {/* Price Section */}
                <div
                    className={cn(
                        "flex items-center gap-2 mt-auto pt-1",
                        isModern && !isUnlocked ? "bg-orange-50 -mx-2.5 -mb-2.5 px-2.5 py-1.5 border-t border-orange-100" : "",
                        isUnlocked ? "border border-dashed border-blue-400 p-1 bg-blue-50/20" : ""
                    )}
                    style={getSubStyle("prices")}
                    onMouseDown={(e) => handleSubDrag("prices", e)}
                >
                    {el.cardOldPrice && (
                        <span className={cn(
                            "text-xs line-through",
                            isGradient && !isUnlocked ? "text-white/60" : "text-gray-400"
                        )} data-editable="oldPrice" suppressContentEditableWarning>
                            {el.cardOldPrice}
                        </span>
                    )}
                    <span
                        className={cn(
                            "text-lg font-extrabold",
                            isModern && !isUnlocked ? "text-orange-600" : (isGradient && !isUnlocked ? "text-yellow-300" : "text-red-500")
                        )}
                        data-editable="offerPrice"
                        suppressContentEditableWarning
                    >
                        {el.cardOfferPrice || "₹0"}
                    </span>
                    {(isModern || isGradient) && !isUnlocked && (
                        <div className={cn(
                            "ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                            isModern ? "bg-orange-500 text-white" : "bg-white text-orange-600"
                        )}>
                            Offer
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   RESIZE HANDLES
   ================================================================ */

const HANDLE_POSITIONS = ["tl", "tr", "bl", "br", "tc", "bc", "ml", "mr"] as const;
type HandlePos = (typeof HANDLE_POSITIONS)[number];

const handleCursorMap: Record<HandlePos, string> = {
    tl: "cursor-nwse-resize",
    tr: "cursor-nesw-resize",
    bl: "cursor-nesw-resize",
    br: "cursor-nwse-resize",
    tc: "cursor-ns-resize",
    bc: "cursor-ns-resize",
    ml: "cursor-ew-resize",
    mr: "cursor-ew-resize",
};

const handlePositionClasses: Record<HandlePos, string> = {
    tl: "-top-[5px] -left-[5px]",
    tr: "-top-[5px] -right-[5px]",
    bl: "-bottom-[5px] -left-[5px]",
    br: "-bottom-[5px] -right-[5px]",
    tc: "-top-[5px] left-1/2 -translate-x-1/2",
    bc: "-bottom-[5px] left-1/2 -translate-x-1/2",
    ml: "top-1/2 -left-[5px] -translate-y-1/2",
    mr: "top-1/2 -right-[5px] -translate-y-1/2",
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function PosterDesigner() {
    /* ---------- STATE ---------- */
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [canvasBg, setCanvasBg] = useState("#ffffff");
    const [nextZ, setNextZ] = useState(1);
    const [showGrid, setShowGrid] = useState(false);
    const [gridCols, setGridCols] = useState(3);
    const [gridRows, setGridRows] = useState(4);
    const [savedPosters, setSavedPosters] = useState<SavedPoster[]>([]);

    // Canvas Sizing
    const [canvasSize, setCanvasSize] = useState({ w: 794, h: 1123 });
    const [zoom, setZoom] = useState(0.85);

    // History (Undo/Redo)
    const [history, setHistory] = useState<{ elements: CanvasElement[]; bg: string }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // AI Studio State
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiTaglines, setAiTaglines] = useState<string[]>([]);

    // Product Binding
    const { data: productsData } = useAllProducts();
    const products = (productsData || []) as any[];
    const [showProductModal, setShowProductModal] = useState(false);
    const [guides, setGuides] = useState<{ x?: number; y?: number; type: "x" | "y" }[]>([]);

    const SHADOW_PRESETS = [
        { name: "None", value: "none" },
        { name: "Soft", value: "0 4px 12px rgba(0,0,0,0.1)" },
        { name: "Deep", value: "0 12px 32px rgba(0,0,0,0.2)" },
        { name: "Float", value: "0 20px 50px rgba(0,0,0,0.15)" },
        { name: "Glow", value: "0 0 20px rgba(249,115,22,0.4)" },
        { name: "Inner", value: "inset 0 2px 4px rgba(0,0,0,0.1)" },
    ];

    // Load from localStorage on mount
    useEffect(() => {
        // Load fonts
        const fontLinks = GOOGLE_FONTS.map(f => f.name.replace(/\s+/g, '+') + ":wght@300;400;600;700;900").join('&family=');
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${fontLinks}&display=swap`;
        document.head.appendChild(link);

        const stored = localStorage.getItem("offerKart_posters");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSavedPosters(parsed);
            } catch (e) {
                console.error("Failed to load posters", e);
            }
        }

        // Initial history snapshot
        saveHistory([], "#ffffff");
    }, []);

    // Save history snapshot
    const saveHistory = useCallback((els: CanvasElement[], bg: string) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            return [...newHistory, { elements: JSON.parse(JSON.stringify(els)), bg }].slice(-30);
        });
        setHistoryIndex(prev => Math.min(prev + 1, 29));
    }, [historyIndex]);

    const undo = () => {
        if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setElements(prev.elements);
            setCanvasBg(prev.bg);
            setHistoryIndex(historyIndex - 1);
            setSelectedId(null);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setElements(next.elements);
            setCanvasBg(next.bg);
            setHistoryIndex(historyIndex + 1);
            setSelectedId(null);
        }
    };

    // Auto-save history after major changes (throttled)
    const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const recordChange = useCallback(() => {
        if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
        historyTimeoutRef.current = setTimeout(() => {
            saveHistory(elements, canvasBg);
        }, 800);
    }, [elements, canvasBg, saveHistory]);

    // Save to localStorage when updated
    useEffect(() => {
        localStorage.setItem("offerKart_posters", JSON.stringify(savedPosters));
    }, [savedPosters]);

    // Modal state
    const [showCardModal, setShowCardModal] = useState(false);
    const [cardForm, setCardForm] = useState({ image: "", title: "", desc: "", offerPrice: "", oldPrice: "" });
    const [cardFilePreview, setCardFilePreview] = useState<string | null>(null);

    // Drag state
    const dragRef = useRef<{
        elId: string;
        startMouseX: number;
        startMouseY: number;
        startElX: number;
        startElY: number;
    } | null>(null);

    // Resize state
    const resizeRef = useRef<{
        elId: string;
        handle: HandlePos;
        startMouseX: number;
        startMouseY: number;
        startX: number;
        startY: number;
        startW: number;
        startH: number;
    } | null>(null);

    const canvasRef = useRef<HTMLDivElement>(null);
    const resetCanvas = () => {
        if (confirm("Are you sure you want to clear the entire canvas? This cannot be undone (except via Undo).")) {
            setElements([]);
            setCanvasBg("#ffffff");
            recordChange();
            toast.success("Canvas cleared");
        }
    };

    /* ---------- HELPERS ---------- */
    const genId = () => crypto.randomUUID();
    const randOffset = (base: number, range: number) => base + Math.floor(Math.random() * range * 2 - range);

    const bumpZ = useCallback(() => {
        setNextZ((z) => z + 1);
        return nextZ + 1;
    }, [nextZ]);

    const selectedEl = elements.find((e) => e.id === selectedId) || null;

    const updateEl = useCallback((id: string, patch: Partial<CanvasElement>) => {
        setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    }, []);

    /* ---------- ADD ELEMENTS ---------- */
    const addTextElement = (text: string, fontSize: number, fontWeight: number) => {
        const z = bumpZ();
        const el: CanvasElement = {
            id: genId(),
            type: "text",
            x: randOffset(250, 60),
            y: randOffset(200, 60),
            w: 0, // auto-sized
            h: 0,
            zIndex: z,
            text,
            fontSize,
            fontWeight,
            color: "#1e1e2e",
        };
        setElements((prev) => [...prev, el]);
        setSelectedId(el.id);
    };

    const addShape = (kind: ShapeKind) => {
        // If a product-card is selected and unlocked, add as internal element
        if (selectedEl?.type === "product-card" && selectedEl.isLayoutUnlocked) {
            const newInternalShape: CanvasElement = {
                id: genId(),
                type: "shape",
                shapeKind: kind,
                x: 20,
                y: 20,
                w: 40,
                h: 40,
                fill: "#f97316",
                zIndex: 100,
            };
            updateEl(selectedEl.id!, {
                internalElements: [...(selectedEl.internalElements || []), newInternalShape]
            });
            return;
        }

        const z = bumpZ();
        const el: CanvasElement = {
            id: genId(),
            type: "shape",
            x: randOffset(340, 80),
            y: randOffset(480, 80),
            w: 120,
            h: 120,
            zIndex: z,
            shapeKind: kind,
            fill: "#7c3aed",
        };
        setElements((prev) => [...prev, el]);
        setSelectedId(el.id);
    };

    const addProductCard = () => {
        const z = bumpZ();
        const el: CanvasElement = {
            id: genId(),
            type: "product-card",
            x: 280,
            y: 400,
            w: 220,
            h: 280,
            zIndex: z,
            cardImage: cardFilePreview || "",
            cardTitle: cardForm.title || "Product",
            cardDesc: cardForm.desc,
            cardOfferPrice: cardForm.offerPrice || "₹0",
            cardOldPrice: cardForm.oldPrice,
            cardBg: "#ffffff",
            cardStyle: "classic",
            badgeText: "-50%",
        };
        setElements((prev) => [...prev, el]);
        setSelectedId(el.id);
        setShowCardModal(false);
        setCardForm({ image: "", title: "", desc: "", offerPrice: "", oldPrice: "" });
        setCardFilePreview(null);
    };

    const savePoster = () => {
        const newPoster: SavedPoster = {
            id: crypto.randomUUID(),
            elements: [...elements],
            canvasBg,
            gridCols,
            gridRows,
            timestamp: Date.now(),
        };
        setSavedPosters((prev) => [newPoster, ...prev]);
        setSelectedId(null);
    };

    const loadPoster = (poster: SavedPoster) => {
        setElements(poster.elements);
        setCanvasBg(poster.canvasBg);
        setGridCols(poster.gridCols);
        setGridRows(poster.gridRows);
        setSelectedId(null);
    };

    const deleteSavedPoster = (id: string) => {
        setSavedPosters((prev) => prev.filter((p) => p.id !== id));
    };

    const deleteSelected = () => {
        if (!selectedId) return;
        setElements((prev) => prev.filter((e) => e.id !== selectedId));
        setSelectedId(null);
    };

    /* ---------- ALIGNMENT TOOLS ---------- */
    const alignSelected = (dir: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
        if (!selectedId) return;
        const el = elements.find(e => e.id === selectedId);
        if (!el) return;

        const elNode = document.getElementById(`canvas-el-${selectedId}`);
        const w = elNode?.offsetWidth || el.w || 100;
        const h = elNode?.offsetHeight || el.h || 40;

        let patch: Partial<CanvasElement> = {};
        if (dir === "left") patch.x = 0;
        if (dir === "center") patch.x = (canvasSize.w - w) / 2;
        if (dir === "right") patch.x = canvasSize.w - w;
        if (dir === "top") patch.y = 0;
        if (dir === "middle") patch.y = (canvasSize.h - h) / 2;
        if (dir === "bottom") patch.y = canvasSize.h - h;

        updateEl(selectedId, patch);
        recordChange();
    };

    /* ---------- AI STUDIO HANDLERS ---------- */
    const handleGenerateTaglines = async (productName: string, category: string) => {
        setIsGenerating(true);
        try {
            const results = await generateTaglines(productName, category);
            setAiTaglines(results);
            toast.success("AI Taglines generated!");
        } catch (error: any) {
            if (error.message?.includes("Setup Required")) {
                toast.error("AI Setup Needed: Add OPENROUTER_API_KEY to your .env file.");
            } else {
                toast.error("Failed to generate taglines. Using fallbacks.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSuggestPalette = async (imgUrl?: string) => {
        setIsGenerating(true);
        try {
            const colors = await suggestPalette(imgUrl);
            // Just notify or set a palette choice
            toast.info(`AI suggests: ${colors.join(", ")}`);
        } finally {
            setIsGenerating(false);
        }
    };

    /* ---------- IMAGE FILE HANDLER ---------- */
    const handleCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.size > 2 * 1024 * 1024) {
            toast.error("Image too large (max 2MB)");
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setCardFilePreview(result);
            setCardForm((f) => ({ ...f, image: result }));
            recordChange();
        };
        reader.readAsDataURL(file);
    };

    /* ---------- DRAG LOGIC ---------- */
    const startDrag = (e: React.MouseEvent, elId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const el = elements.find((e) => e.id === elId);
        if (!el) return;

        // Bring to top
        const z = bumpZ();
        updateEl(elId, { zIndex: z });
        setSelectedId(elId);

        dragRef.current = {
            elId,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startElX: el.x,
            startElY: el.y,
        };
    };

    const onGlobalMouseMove = useCallback(
        (e: MouseEvent) => {
            // Handle drag
            if (dragRef.current) {
                const { elId, startMouseX, startMouseY, startElX, startElY } = dragRef.current;
                const el = elements.find((e) => e.id === elId);
                if (!el) return;

                let newX = startElX + (e.clientX - startMouseX);
                let newY = startElY + (e.clientY - startMouseY);

                // Smart Alignment Guides
                const elNode = document.getElementById(`canvas-el-${elId}`);
                const elW = elNode?.offsetWidth || el.w || 100;
                const elH = elNode?.offsetHeight || el.h || 40;
                
                const snapThreshold = 5;
                const activeGuides: { x?: number; y?: number; type: "x" | "y" }[] = [];
                
                // Potential snap points (Centers)
                const canvasCenterX = canvasSize.w / 2;
                const canvasCenterY = canvasSize.h / 2;
                
                // X-Axis Snapping (Vertical Lines)
                if (Math.abs(newX + elW / 2 - canvasCenterX) < snapThreshold) {
                    newX = canvasCenterX - elW / 2;
                    activeGuides.push({ x: canvasCenterX, type: "x" });
                }
                
                // Y-Axis Snapping (Horizontal Lines)
                if (Math.abs(newY + elH / 2 - canvasCenterY) < snapThreshold) {
                    newY = canvasCenterY - elH / 2;
                    activeGuides.push({ y: canvasCenterY, type: "y" });
                }

                // Snap to other elements
                elements.forEach(other => {
                    if (other.id === elId || !other.isVisible) return;
                    const otherNode = document.getElementById(`canvas-el-${other.id}`);
                    const otherW = otherNode?.offsetWidth || other.w || 100;
                    const otherH = otherNode?.offsetHeight || other.h || 40;
                    
                    // Vertical Alignment (X)
                    if (Math.abs(newX - other.x) < snapThreshold) {
                        newX = other.x;
                        activeGuides.push({ x: other.x, type: "x" });
                    } else if (Math.abs(newX + elW - (other.x + otherW)) < snapThreshold) {
                        newX = other.x + otherW - elW;
                        activeGuides.push({ x: other.x + otherW, type: "x" });
                    }
                    
                    // Horizontal Alignment (Y)
                    if (Math.abs(newY - other.y) < snapThreshold) {
                        newY = other.y;
                        activeGuides.push({ y: other.y, type: "y" });
                    } else if (Math.abs(newY + elH - (other.y + otherH)) < snapThreshold) {
                        newY = other.y + otherH - elH;
                        activeGuides.push({ y: other.y + otherH, type: "y" });
                    }
                });

                setGuides(activeGuides);
                newX = Math.max(0, Math.min(canvasSize.w - elW, newX));
                newY = Math.max(0, Math.min(canvasSize.h - elH, newY));
                updateEl(elId, { x: newX, y: newY });
            }

            // Handle resize
            if (resizeRef.current) {
                const { elId, handle, startMouseX, startMouseY, startX, startY, startW, startH } = resizeRef.current;
                const el = elements.find((e) => e.id === elId);
                if (!el) return;

                const dx = e.clientX - startMouseX;
                const dy = e.clientY - startMouseY;

                const isCard = el.type === "product-card";
                const minW = isCard ? 180 : el.type === "text" ? 40 : 20;
                const minH = isCard ? 220 : el.type === "text" ? 24 : 20;

                let w = startW, h = startH, x = startX, y = startY;

                if (handle.includes("r")) w = Math.max(minW, startW + dx);
                if (handle === "ml" || handle === "tl" || handle === "bl") {
                    w = Math.max(minW, startW - dx);
                    x = startX + startW - w;
                }
                if (handle.includes("b")) h = Math.max(minH, startH + dy);
                if (handle === "tc") { h = Math.max(minH, startH - dy); y = startY + startH - h; }
                if (handle === "tl") { h = Math.max(minH, startH - dy); y = startY + startH - h; }
                if (handle === "tr") { h = Math.max(minH, startH - dy); y = startY + startH - h; }

                // Clamp to canvas
                x = Math.max(0, x);
                y = Math.max(0, y);
                if (x + w > CANVAS_W) w = CANVAS_W - x;
                if (y + h > CANVAS_H) h = CANVAS_H - y;

                updateEl(elId, { x, y, w, h });
            }
        },
        [elements, updateEl]
    );

    const onGlobalMouseUp = useCallback(() => {
        dragRef.current = null;
        resizeRef.current = null;
        setGuides([]);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Delete" || e.key === "Backspace") {
                // Don't delete if focused on input/textarea
                const active = document.activeElement;
                if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA" || (active as HTMLElement)?.contentEditable === "true") return;

                if (selectedId) {
                    deleteSelected();
                    recordChange();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedId, deleteSelected, recordChange]);

    useEffect(() => {
        window.addEventListener("mousemove", onGlobalMouseMove);
        window.addEventListener("mouseup", onGlobalMouseUp);
        return () => {
            window.removeEventListener("mousemove", onGlobalMouseMove);
            window.removeEventListener("mouseup", onGlobalMouseUp);
        };
    }, [onGlobalMouseMove, onGlobalMouseUp]);

    /* ---------- RESIZE LOGIC ---------- */
    const startResize = (e: React.MouseEvent, elId: string, handle: HandlePos) => {
        e.preventDefault();
        e.stopPropagation();
        const el = elements.find((e) => e.id === elId);
        if (!el) return;

        const elNode = document.getElementById(`canvas-el-${elId}`);
        resizeRef.current = {
            elId,
            handle,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startX: el.x,
            startY: el.y,
            startW: elNode?.offsetWidth || el.w || 100,
            startH: elNode?.offsetHeight || el.h || 40,
        };
    };

    /* ---------- TEXT EDIT (double-click) ---------- */
    const makeEditable = (e: React.MouseEvent, elId: string, field?: string) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.target as HTMLElement;

        // For product cards, look for the closest [data-editable]
        if (field) {
            const editable = target.closest("[data-editable]") as HTMLElement | null;
            if (editable) {
                editable.contentEditable = "true";
                editable.focus();
                editable.style.outline = "2px solid #f97316";
                editable.style.borderRadius = "4px";
                const onBlur = () => {
                    editable.contentEditable = "false";
                    editable.style.outline = "";
                    editable.style.borderRadius = "";
                    const fieldName = editable.getAttribute("data-editable");
                    if (fieldName === "title") updateEl(elId, { cardTitle: editable.textContent || "" });
                    else if (fieldName === "desc") updateEl(elId, { cardDesc: editable.textContent || "" });
                    else if (fieldName === "offerPrice") updateEl(elId, { cardOfferPrice: editable.textContent || "" });
                    else if (fieldName === "oldPrice") updateEl(elId, { cardOldPrice: editable.textContent || "" });
                    editable.removeEventListener("blur", onBlur);
                };
                editable.addEventListener("blur", onBlur);
                return;
            }
        }

        // For text elements, make the whole thing editable
        const node = document.getElementById(`canvas-el-${elId}`);
        if (!node) return;
        node.contentEditable = "true";
        node.focus();
        node.style.cursor = "text";
        const onBlur = () => {
            node.contentEditable = "false";
            node.style.cursor = "grab";
            updateEl(elId, { text: node.textContent || "" });
            node.removeEventListener("blur", onBlur);
        };
        node.addEventListener("blur", onBlur);
    };

    /* ---------- EXPORT ---------- */
    const exportPNG = async () => {
        // Deselect and hide grid before capture
        setSelectedId(null);
        const wasGridVisible = showGrid;
        setShowGrid(false);

        // Give React a frame to re-render without selection/grid
        await new Promise((r) => setTimeout(r, 60));

        const { default: html2canvas } = await import("html2canvas");
        if (!canvasRef.current) {
            if (wasGridVisible) setShowGrid(true);
            return;
        }

        const canvas = await html2canvas(canvasRef.current, {
            useCORS: true,
            scale: 2,
            backgroundColor: null,
            onclone: (clonedDoc) => {
                const allElements = clonedDoc.getElementsByTagName("*");
                for (let i = 0; i < allElements.length; i++) {
                    const el = allElements[i] as HTMLElement;

                    // We check computed styles because Tailwind classes won't show in el.style
                    // But we must use the window of the CLONED document or the global window carefully.
                    // clonedDoc.defaultView is the window for the clone.
                    const win = clonedDoc.defaultView || window;
                    const style = win.getComputedStyle(el);

                    const props: (keyof CSSStyleDeclaration)[] = ["backgroundColor", "color", "borderColor", "fill", "stroke" as any];
                    props.forEach(prop => {
                        const val = style[prop] as string;
                        if (val && (val.includes("lab(") || val.includes("oklch("))) {
                            // Fallback: If it's a background, make it transparent or a default.
                            // If it's text, make it black/inherit.
                            if (prop === "backgroundColor") el.style.backgroundColor = "transparent";
                            else if (prop === "color") el.style.color = "inherit";
                            else if (prop === "fill") el.style.fill = "currentColor";
                            else (el.style as any)[prop] = "";
                        }
                    });
                }
            }
        });

        const a = document.createElement("a");
        a.download = "poster.png";
        a.href = canvas.toDataURL("image/png");
        a.click();

        // Restore grid if it was visible
        if (wasGridVisible) setShowGrid(true);
    };

    /* ---------- DESELECT ---------- */
    const handleCanvasClick = (e: React.MouseEvent) => {
        if (e.target === canvasRef.current) {
            setSelectedId(null);
        }
    };

    /* ================================================================
       RENDER
       ================================================================ */
    return (
        <div className="flex h-[calc(100vh-100px)] w-full overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-2xl font-inter">
            {/* TOOLBAR (Top) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-100 shadow-2xl z-50 transition-all hover:bg-white">
                 <button onClick={undo} disabled={historyIndex <= 0} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all"><Undo2 className="w-4 h-4" /></button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-all"><Redo2 className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <button onClick={resetCanvas} className="p-2 rounded-xl text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-all" title="Reset Canvas">
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <button onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100" title="Zoom Out"><Minus className="w-4 h-4" /></button>
                <span className="text-[10px] font-black text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100"><Plus className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <div className="flex items-center gap-1">
                    <button onClick={() => alignSelected("left")} className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"><AlignLeft className="w-3.5 h-3.5" /></button>
                    <button onClick={() => alignSelected("center")} className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"><AlignCenter className="w-3.5 h-3.5" /></button>
                    <button onClick={() => alignSelected("right")} className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"><AlignRight className="w-3.5 h-3.5" /></button>
                </div>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <button onClick={exportPNG} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-700 active:scale-95 transition-all">
                    <Download className="w-3.5 h-3.5" /> Export PNG
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden bg-[#f0f2f5] relative">
                {/* LEFT INSPECTOR */}
                <div
                    className={cn(
                        "w-[320px] bg-white border-r border-gray-100 flex flex-col h-full relative z-[60] shadow-[20px_0_40px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar",
                        selectedId ? "translate-x-0" : "-translate-x-full absolute pointer-events-none"
                    )}
                >
                    {selectedEl && (
                        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Inspector</h3>
                                </div>
                                <button onClick={deleteSelected} className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>

                            <div className="space-y-6">
                                {selectedEl.type === "text" && (
                                    <>
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-2 ml-1">Typography</p>
                                            <select
                                                className="w-full text-xs font-black p-4 rounded-2xl border bg-gray-50/30 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                                                value={selectedEl.fontFamily}
                                                onChange={(e) => { updateEl(selectedId!, { fontFamily: e.target.value }); recordChange(); }}
                                            >
                                                {GOOGLE_FONTS.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase ml-1">Size</p>
                                                <input
                                                    type="number"
                                                    className="w-full h-12 px-3 rounded-2xl border font-bold text-xs bg-gray-50/30 text-center"
                                                    value={selectedEl.fontSize}
                                                    onChange={(e) => { updateEl(selectedId!, { fontSize: parseInt(e.target.value) }); recordChange(); }}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase ml-1">Weight</p>
                                                <select
                                                    className="w-full h-12 px-2 rounded-2xl border font-bold text-center text-[10px] uppercase bg-gray-50/30 appearance-none"
                                                    value={selectedEl.fontWeight}
                                                    onChange={(e) => { updateEl(selectedId!, { fontWeight: parseInt(e.target.value) }); recordChange(); }}
                                                >
                                                    <option value="300">Light</option>
                                                    <option value="400">Regular</option>
                                                    <option value="600">Semi</option>
                                                    <option value="700">Bold</option>
                                                    <option value="900">Heavy</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {selectedEl.type !== "product-card" && (
                                    <div className="pt-2">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-4 ml-1">Opacity & Colors</p>
                                        <div className="flex flex-col gap-6">
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                                <input
                                                    type="color"
                                                    className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-none p-0 shadow-sm"
                                                    value={selectedEl.color || selectedEl.fill || "#000000"}
                                                    onChange={(e) => {
                                                        if (selectedEl.type === "text") updateEl(selectedId!, { color: e.target.value });
                                                        else updateEl(selectedId!, { fill: e.target.value });
                                                        recordChange();
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-gray-900 uppercase">HEX Color</p>
                                                    <p className="text-[10px] font-bold text-gray-400 font-mono tracking-wider">{selectedEl.color || selectedEl.fill || "#000000"}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3 px-1">
                                                <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase">
                                                    <span>Transparency</span>
                                                    <span>{Math.round((selectedEl.opacity ?? 1) * 100)}%</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="1" step="0.1" value={selectedEl.opacity ?? 1}
                                                    onChange={(e) => { updateEl(selectedId!, { opacity: parseFloat(e.target.value) }); recordChange(); }}
                                                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase ml-1">Wow Effects</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-black text-gray-400 uppercase">Glass</span>
                                            <button 
                                                onClick={() => { updateEl(selectedId!, { isGlass: !selectedEl.isGlass }); recordChange(); }}
                                                className={cn(
                                                    "w-10 h-5 rounded-full transition-all relative flex items-center px-1",
                                                    selectedEl.isGlass ? "bg-orange-500" : "bg-gray-200"
                                                )}
                                            >
                                                <div className={cn("w-3.5 h-3.5 rounded-full bg-white transition-all", selectedEl.isGlass ? "translate-x-4" : "translate-x-0")} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase ml-1">Shadow Preset</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {SHADOW_PRESETS.map(s => (
                                                <button
                                                    key={s.name}
                                                    onClick={() => { updateEl(selectedId!, { shadow: s.value }); recordChange(); }}
                                                    className={cn(
                                                        "px-2 py-2 rounded-lg border text-[8px] font-black uppercase transition-all",
                                                        selectedEl.shadow === s.value ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                                    )}
                                                >
                                                    {s.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-50">
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-[.2em] mb-4 text-center">Layer Information</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-3 rounded-xl bg-gray-50/50 border border-gray-100 flex flex-col items-center">
                                            <span className="text-[8px] font-bold text-gray-400 uppercase">Z-Index</span>
                                            <span className="text-xs font-black text-gray-600">{selectedEl.zIndex}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gray-50/50 border border-gray-100 flex flex-col items-center">
                                            <span className="text-[8px] font-bold text-gray-400 uppercase">Status</span>
                                            <span className={cn("text-[9px] font-black uppercase italic", selectedEl.isLocked ? "text-orange-500" : "text-emerald-500")}>
                                                {selectedEl.isLocked ? "Locked" : "Unlocked"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* CANVAS WORKSPACE */}
                <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center p-20" onMouseDown={handleCanvasClick}>
                    <div
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: "center center",
                            transition: "transform 0.1s ease-out",
                            padding: "40px",
                        }}
                    >
                        <div
                            id="poster-canvas"
                            ref={canvasRef}
                            className="relative shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] group/canvas"
                            style={{
                                width: canvasSize.w,
                                height: canvasSize.h,
                                backgroundColor: (canvasBg.includes("-gradient") || canvasBg.startsWith("url")) ? "transparent" : canvasBg,
                                backgroundImage: (canvasBg.includes("-gradient") || canvasBg.startsWith("url")) ? canvasBg : (showGrid
                                    ? `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                                       linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`
                                    : "none"),
                                backgroundSize: canvasBg.startsWith("url") ? "auto" : "cover",
                            }}
                        >
                            {/* ALIGNMENT GUIDES */}
                            {guides.map((g, i) => (
                                <div 
                                    key={i}
                                    className="absolute bg-orange-400/60 z-[1000] pointer-events-none"
                                    style={{
                                        left: g.type === "x" ? g.x : 0,
                                        top: g.type === "y" ? g.y : 0,
                                        width: g.type === "x" ? "1px" : "100%",
                                        height: g.type === "y" ? "1px" : "100%",
                                        borderStyle: "dashed",
                                        borderWidth: g.type === "x" ? "0 0 0 1px" : "1px 0 0 0",
                                        borderColor: "rgba(249, 115, 22, 0.6)"
                                    }}
                                />
                            ))}
                            {elements.map((el) => {
                                if (el.isVisible === false) return null;
                                return (
                                    <div
                                        key={el.id}
                                        id={`canvas-el-${el.id}`}
                                        className={cn(
                                            "absolute transition-shadow duration-300",
                                            selectedId === el.id ? "z-[9999]" : ""
                                        )}
                                        style={{
                                            left: el.x,
                                            top: el.y,
                                            width: el.type === "text" ? "auto" : el.w,
                                            height: el.type === "text" ? "auto" : el.h,
                                            zIndex: el.zIndex,
                                            cursor: selectedId === el.id ? "grab" : "pointer",
                                            borderWidth: el.isGlass ? "1px" : "2px",
                                            borderStyle: "solid",
                                            borderColor: selectedId === el.id ? "#f97316" : (el.isGlass ? "rgba(255, 255, 255, 0.4)" : "transparent"),
                                            boxShadow: el.shadow || (selectedId === el.id ? "0 0 0 4px rgba(249, 115, 22, 0.1)" : (el.isGlass ? "0 8px 32px 0 rgba(31, 38, 135, 0.15)" : "none")),
                                            borderRadius: el.type === "shape" && el.shapeKind === "circle" ? "50%" : (el.isGlass ? "24px" : "4px"),
                                            clipPath: el.isGlass && el.type === "shape" ? getShapeClipPath(el.shapeKind!) : undefined,
                                            backdropFilter: el.isGlass ? "blur(20px) saturate(180%)" : "none",
                                            background: el.isGlass 
                                                ? `linear-gradient(135deg, ${el.fill}66 0%, ${el.fill}1A 100%)`
                                                : undefined,
                                            boxSizing: "border-box",
                                            filter: el.isGlass && el.type === "shape" && el.shapeKind !== "rect" && el.shapeKind !== "circle" 
                                                ? "drop-shadow(0 0 1px rgba(255,255,255,0.4))" 
                                                : "none",
                                        }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                                        onMouseDown={(e) => !el.isLocked && startDrag(e, el.id)}
                                    >
                                        {el.type === "text" && (
                                            <div
                                                className="whitespace-pre-wrap select-none p-2 min-w-[20px]"
                                                style={{
                                                    fontSize: el.fontSize,
                                                    fontWeight: el.fontWeight,
                                                    color: el.color,
                                                    fontFamily: el.fontFamily || "inherit",
                                                    letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : "normal",
                                                    lineHeight: el.lineHeight || 1.2,
                                                    textAlign: el.textAlign || "left",
                                                    textShadow: el.shadow || "none",
                                                    opacity: el.opacity ?? 1,
                                                }}
                                            >
                                                {el.text}
                                            </div>
                                        )}
                                        {el.type === "shape" && <ShapeSVG kind={el.shapeKind!} fill={el.fill!} opacity={el.opacity} isGlass={el.isGlass} />}
                                        {el.type === "product-card" && <ProductCardContent el={el} onUpdate={updateEl} />}

                                        {/* Selection UI */}
                                        {selectedId === el.id && !el.isLocked && (
                                            <>
                                                {HANDLE_POSITIONS.map((h) => (
                                                    <div
                                                        key={h}
                                                        className={cn(
                                                            "absolute w-2.5 h-2.5 bg-white border-2 border-orange-500 rounded-full z-50 shadow-sm hover:scale-150 transition-transform",
                                                            handlePositionClasses[h],
                                                            handleCursorMap[h]
                                                        )}
                                                        onMouseDown={(e) => startResize(e, el.id, h)}
                                                    />
                                                ))}
                                            </>
                                        )}
                                        {el.isLocked && (
                                            <div className="absolute -top-3 -right-3 bg-white p-1 rounded-full shadow-lg border border-gray-100">
                                                <Lock className="w-3 h-3 text-orange-500" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* SIDEBAR */}
            <div className="w-[360px] bg-white border-l border-gray-100 flex flex-col h-full relative z-[60] shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
                <Tabs defaultValue="add" className="w-full flex flex-col h-full">
                    <div className="p-4 border-b bg-gray-50/50">
                        <TabsList className="grid grid-cols-4 w-full h-10 p-1 bg-gray-100/50 rounded-xl">
                            <TabsTrigger value="add" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><Plus className="w-4 h-4" /></TabsTrigger>
                            <TabsTrigger value="design" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><Paintbrush className="w-4 h-4" /></TabsTrigger>
                            <TabsTrigger value="layers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><Layers className="w-4 h-4" /></TabsTrigger>
                            <TabsTrigger value="ai" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-orange-500"><Sparkles className="w-4 h-4" /></TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <TabsContent value="add" className="m-0 p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <section>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Typography</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => { addTextElement("Heading", 48, 900); recordChange(); }} className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gray-50 bg-gray-50/30 hover:border-orange-500/30 hover:bg-orange-50/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group">
                                        <Heading1 className="w-6 h-6 mb-2 text-gray-400 group-hover:text-orange-500" />
                                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">Big Header</span>
                                    </button>
                                    <button onClick={() => { addTextElement("Add text body...", 16, 400); recordChange(); }} className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gray-50 bg-gray-50/30 hover:border-orange-500/30 hover:bg-orange-50/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group">
                                        <Type className="w-6 h-6 mb-2 text-gray-400 group-hover:text-orange-500" />
                                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">Body Text</span>
                                    </button>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Decoratives</h3>
                                <div className="grid grid-cols-5 gap-3">
                                    {[
                                        { icon: Square, kind: "rect" as ShapeKind, label: "Square" },
                                        { icon: Circle, kind: "circle" as ShapeKind, label: "Circle" },
                                        { icon: Triangle, kind: "triangle" as ShapeKind, label: "Triangle" },
                                        { icon: Star, kind: "star" as ShapeKind, label: "Star" },
                                        { icon: Triangle, kind: "blob" as ShapeKind, label: "Organic Blob" },
                                        { icon: Award, kind: "badge" as ShapeKind, label: "Seal Badge" },
                                        { icon: Zap, kind: "burst" as ShapeKind, label: "Offer Burst" },
                                        { icon: Bookmark, kind: "ribbon" as ShapeKind, label: "Price Tag" },
                                        { icon: Octagon, kind: "pill" as ShapeKind, label: "Pill Shape" },
                                        { icon: Waves, kind: "wave" as ShapeKind, label: "Wave Section" }
                                    ].map(s => (
                                        <button key={s.kind} onClick={() => { addShape(s.kind); recordChange(); }} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-50 bg-gray-50/30 hover:border-orange-500/30 hover:bg-orange-50/50 transition-all group gap-2">
                                            <s.icon className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
                                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter group-hover:text-orange-600">{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Smart Catalog</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setShowProductModal(true)}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                            <ImageIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-xs text-white uppercase tracking-wider">Import Product</p>
                                            <p className="text-[9px] text-white/70 font-medium tracking-tight">Sync from your shop products</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-white/50 ml-auto" />
                                    </button>

                                    <button
                                        onClick={() => {
                                            setCardForm({ image: "", title: "", desc: "", offerPrice: "", oldPrice: "" });
                                            setCardFilePreview(null);
                                            setShowCardModal(true);
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-orange-500/30 hover:bg-orange-50/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-white transition-colors">
                                            <Plus className="w-6 h-6 text-gray-400 group-hover:text-orange-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-xs text-gray-900 uppercase tracking-wider">Custom Product</p>
                                            <p className="text-[9px] text-gray-500 font-medium tracking-tight">Manually enter details</p>
                                        </div>
                                    </button>
                                </div>
                            </section>
                        </TabsContent>

                        <TabsContent value="design" className="m-0 p-6 space-y-8">
                            <section>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Canvas Presets</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {ASPECT_RATIOS.map(ratio => (
                                        <button
                                            key={ratio.name}
                                            onClick={() => { setCanvasSize({ w: ratio.w, h: ratio.h }); recordChange(); }}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2",
                                                canvasSize.w === ratio.w && canvasSize.h === ratio.h ? "border-orange-500 bg-orange-50/50 text-orange-600 shadow-lg shadow-orange-500/10" : "border-gray-50 bg-gray-50/10 hover:border-orange-200 text-gray-400"
                                            )}
                                        >
                                            <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-50">
                                                {ratio.icon === "Smartphone" ? <Smartphone className="w-4 h-4" /> : ratio.icon === "Square" ? <Square className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-tight">{ratio.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Studio Gradients</h3>
                                <div className="grid grid-cols-5 gap-3">
                                    {PREMIUM_GRADIENTS.map((grad, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setCanvasBg(grad.value); recordChange(); }}
                                            className={cn(
                                                "aspect-square rounded-2xl border-4 transition-all hover:scale-110 hover:shadow-xl",
                                                canvasBg === grad.value ? "border-white ring-4 ring-orange-500/20 scale-105" : "border-transparent"
                                            )}
                                            style={{ background: grad.value }}
                                            title={grad.name}
                                        />
                                    ))}
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-4 px-1">
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Abstract Models</h3>
                                </div>
                                <div className="grid grid-cols-5 gap-3">
                                    {ABSTRACT_MODELS.map((model, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setCanvasBg(model.value); recordChange(); }}
                                            className={cn(
                                                "aspect-square rounded-2xl border-4 transition-all hover:scale-110 hover:shadow-xl relative overflow-hidden",
                                                canvasBg === model.value ? "border-white ring-4 ring-indigo-500/20 scale-105" : "border-transparent"
                                            )}
                                            style={{ background: model.value, backgroundSize: "cover" }}
                                            title={model.name}
                                        >
                                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </TabsContent>

                        <TabsContent value="layers" className="m-0 p-6 space-y-4">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Visual Hierarchy</h3>
                            {elements.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 text-xs italic bg-gray-50 rounded-2xl border border-dashed">No elements yet</div>
                            ) : (
                                <div className="space-y-2">
                                    {[...elements].sort((a, b) => b.zIndex - a.zIndex).map(el => (
                                        <div
                                            key={el.id}
                                            className={cn(
                                                "group flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer",
                                                selectedId === el.id ? "border-orange-500 bg-orange-50/30 shadow-lg shadow-orange-500/5" : "border-gray-50 bg-white hover:border-gray-200"
                                            )}
                                            onClick={() => setSelectedId(el.id)}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 text-gray-400 group-hover:bg-white group-hover:text-orange-500 transition-colors shadow-sm">
                                                {el.type === "text" ? <Type className="w-5 h-5" /> : el.type === "shape" ? <Square className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-black text-gray-900 truncate uppercase tracking-tighter">
                                                    {el.name || (el.type === "text" ? (el.text?.substring(0, 15) || "Text Layer") : el.type === "shape" ? `${el.shapeKind} Layer` : "Smart Card")}
                                                </p>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase">Depth: {el.zIndex}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); deleteSelected(); recordChange(); }}
                                                    className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    title="Delete Layer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); updateEl(el.id, { isLocked: !el.isLocked }); recordChange(); }} className={cn("p-2 rounded-lg", el.isLocked ? "bg-orange-100 text-orange-600" : "text-gray-300 hover:bg-gray-100")}>
                                                    {el.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); updateEl(el.id, { isVisible: el.isVisible === false }); recordChange(); }} className={cn("p-2 rounded-lg", el.isVisible === false ? "bg-red-100 text-red-600" : "text-gray-300 hover:bg-gray-100")}>
                                                    {el.isVisible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="ai" className="m-0 p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md"><Sparkles className="w-6 h-6" /></div>
                                        <h3 className="font-black text-xs uppercase tracking-widest">AI Studio</h3>
                                    </div>
                                    <p className="text-[10px] text-white/80 font-medium leading-relaxed mb-6">Let AI generate catchy headlines or suggest the perfect color combination for your shop.</p>

                                    <div className="space-y-3">
                                        <button
                                            onClick={() => handleGenerateTaglines("Big Sale", "Festive")}
                                            disabled={isGenerating}
                                            className="w-full py-4 bg-white text-indigo-600 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Type className="w-4 h-4" />}
                                            Generate Headlines
                                        </button>
                                        <button
                                            onClick={() => handleSuggestPalette()}
                                            disabled={isGenerating}
                                            className="w-full py-4 bg-white/20 text-white border border-white/30 font-black text-[10px] uppercase tracking-widest rounded-2xl backdrop-blur-md active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            Suggest Palette
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {aiTaglines.length > 0 && (
                                <div className="space-y-3 pt-4">
                                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2">AI Results</h4>
                                    {aiTaglines.map((line, i) => (
                                        <div key={i} onClick={() => { addTextElement(line, 48, 900); recordChange(); }} className="group p-4 rounded-2xl border border-gray-100 bg-white hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer">
                                            <p className="text-xs font-bold text-gray-800 leading-snug group-hover:text-indigo-600">{line}</p>
                                            <div className="mt-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter italic">Click to insert</span>
                                                <ChevronRight className="w-3 h-3 text-indigo-300" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* CATALOG SYNC MODAL */}
            <AppModal open={showProductModal} onOpenChange={setShowProductModal} title="Catalog Sync" description="Select a product to generate a designer card instantly.">
                <div className="space-y-4 py-4">
                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {products.map((p) => (
                            <div
                                key={p.id}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 bg-gray-50/20 hover:border-orange-500/30 hover:bg-orange-50/50 cursor-pointer transition-all active:scale-95 group"
                                onClick={() => {
                                    setCardForm({ image: p.image || "", title: p.name, desc: p.description || "", offerPrice: `₹${p.price}`, oldPrice: p.originalPrice ? `₹${p.originalPrice}` : "" });
                                    setCardFilePreview(p.image || "");
                                    addProductCard();
                                    setShowProductModal(false);
                                    recordChange();
                                    toast.success("Product imported!");
                                }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 overflow-hidden shadow-sm shrink-0">
                                    {p.image && <img src={p.image} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tighter group-hover:text-orange-500 transition-colors">{p.name}</p>
                                    <p className="text-[10px] font-bold text-emerald-600">₹{p.price}</p>
                                </div>
                                <div className="p-2 rounded-xl bg-white/50 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><ArrowUpRight className="w-4 h-4" /></div>
                            </div>
                        ))}
                    </div>
                </div>
            </AppModal>

            {/* CUSTOM PRODUCT MODAL */}
            <AppModal open={showCardModal} onOpenChange={setShowCardModal} title="Custom Product" description="Manually create a premium product card for your poster.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                    {/* Left: Image Upload & Preview */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Photo</label>
                        <div className="relative aspect-square rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group hover:border-orange-500/50 transition-all">
                            {cardFilePreview ? (
                                <img src={cardFilePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <ImageIcon className="w-10 h-10 text-gray-300 mb-3 group-hover:scale-110 transition-transform" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase italic">Drop or click to upload</p>
                                </>
                            )}
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*"
                                onChange={handleCardFileChange}
                            />
                            {cardFilePreview && (
                                <button
                                    onClick={() => { setCardFilePreview(null); setCardForm(f => ({ ...f, image: "" })); }}
                                    className="absolute top-4 right-4 p-2 rounded-xl bg-white/80 backdrop-blur-md text-red-500 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Form Details */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
                                <PremiumInput
                                    value={cardForm.title}
                                    onChange={(e) => setCardForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g. Premium Leather Watch"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-2xl border bg-gray-50/50 text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all outline-none resize-none min-h-[80px]"
                                    value={cardForm.desc}
                                    onChange={(e) => setCardForm(f => ({ ...f, desc: e.target.value }))}
                                    placeholder="Briefly describe the offer..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sale Price</label>
                                    <PremiumInput
                                        value={cardForm.offerPrice}
                                        onChange={(e) => setCardForm(f => ({ ...f, offerPrice: e.target.value }))}
                                        placeholder="₹999"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">MRP Price</label>
                                    <PremiumInput
                                        value={cardForm.oldPrice}
                                        onChange={(e) => setCardForm(f => ({ ...f, oldPrice: e.target.value }))}
                                        placeholder="₹1499"
                                    />
                                </div>
                            </div>
                        </div>

                        <PremiumButton
                            onClick={addProductCard}
                            className="w-full py-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-xl shadow-orange-500/20 active:scale-95 transition-all text-sm font-black uppercase tracking-widest"
                        >
                            Create Product Card
                        </PremiumButton>
                    </div>
                </div>
            </AppModal>

        </div>
    );
}
