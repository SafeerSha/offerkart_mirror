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
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ================================================================
   TYPES
   ================================================================ */

type ElType = "text" | "shape" | "product-card";
type ShapeKind = "rect" | "circle" | "triangle" | "star";

interface CanvasElement {
    id: string;
    type: ElType;
    x: number;
    y: number;
    w: number;
    h: number;
    zIndex: number;
    // Text
    text?: string;
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    // Shape
    shapeKind?: ShapeKind;
    fill?: string;
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

function ShapeSVG({ kind, fill }: { kind: ShapeKind; fill: string }) {
    const svgs: Record<ShapeKind, React.ReactNode> = {
        rect: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <rect x="0" y="0" width="100" height="100" fill={fill} rx="8" />
            </svg>
        ),
        circle: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <ellipse cx="50" cy="50" rx="50" ry="50" fill={fill} />
            </svg>
        ),
        triangle: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <polygon points="50,5 95,95 5,95" fill={fill} />
            </svg>
        ),
        star: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={fill} />
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
    const [gridRows, setGridRows] = useState(4); // Based on A4 ratio (~794/1123)
    const [savedPosters, setSavedPosters] = useState<SavedPoster[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("offerKart_posters");
        if (stored) {
            try {
                setSavedPosters(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to load posters", e);
            }
        }
    }, []);

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

    /* ---------- IMAGE FILE HANDLER ---------- */
    const handleCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            setCardFilePreview(result);
            setCardForm((f) => ({ ...f, image: result }));
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

                // Get the actual rendered width/height
                const elNode = document.getElementById(`canvas-el-${elId}`);
                const elW = elNode?.offsetWidth || el.w || 100;
                const elH = elNode?.offsetHeight || el.h || 40;

                newX = Math.max(0, Math.min(CANVAS_W - elW, newX));
                newY = Math.max(0, Math.min(CANVAS_H - elH, newY));

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
    }, []);

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
        <div className="flex h-[calc(100vh-5rem)] w-full overflow-hidden rounded-2xl border border-border/50 shadow-lg">
            {/* ===== LEFT PANEL ===== */}
            <div className="w-[220px] min-w-[220px] bg-card border-r border-border/50 flex flex-col p-4 gap-3">
                <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add Product</span>
                </div>
                <PremiumButton
                    onClick={() => {
                        setCardForm({ image: "", title: "", desc: "", offerPrice: "", oldPrice: "" });
                        setCardFilePreview(null);
                        setShowCardModal(true);
                    }}
                    leftIcon={Plus}
                    className="rounded-xl w-full"
                >
                    Add Product Card
                </PremiumButton>

                <div className="flex-1" />
                <span className="text-[10px] text-muted-foreground text-center">Poster Designer v1.0</span>
            </div>

            {/* ===== CENTER ===== */}
            <div className="flex-1 flex flex-col bg-muted/40 overflow-hidden">
                {/* Top bar */}
                <div className="h-12 bg-card border-b border-border/50 flex items-center justify-between px-4 shrink-0">
                    <div className="text-xs text-muted-foreground font-medium">
                        {elements.length} elements on canvas
                    </div>
                    <div className="flex items-center gap-2">
                        <PremiumButton onClick={exportPNG} variant="outline" leftIcon={Download} className="rounded-xl h-8 text-xs px-4">
                            PNG
                        </PremiumButton>
                        <PremiumButton onClick={savePoster} leftIcon={Plus} className="rounded-xl h-8 text-xs px-5">
                            Done
                        </PremiumButton>
                    </div>
                </div>

                {/* Workspace */}
                <div className="flex-1 overflow-auto flex items-start justify-center p-10">
                    <div
                        id="poster-canvas"
                        ref={canvasRef}
                        className="relative shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
                        style={{
                            width: CANVAS_W,
                            height: CANVAS_H,
                            minWidth: CANVAS_W,
                            minHeight: CANVAS_H,
                            backgroundColor: canvasBg,
                            backgroundImage: showGrid
                                ? `linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px),
                                   linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)`
                                : "none",
                            backgroundSize: `${CANVAS_W / gridCols}px ${CANVAS_H / gridRows}px`,
                        }}
                        onMouseDown={handleCanvasClick}
                    >
                        {elements.map((el) => {
                            const isSelected = el.id === selectedId;
                            const isText = el.type === "text";
                            const isAutoSized = isText && el.w === 0;

                            return (
                                <div
                                    key={el.id}
                                    id={`canvas-el-${el.id}`}
                                    className={cn(
                                        "absolute select-none",
                                        isSelected
                                            ? "outline-2 outline-dashed outline-blue-500 outline-offset-2"
                                            : "",
                                        "cursor-grab active:cursor-grabbing"
                                    )}
                                    style={{
                                        left: el.x,
                                        top: el.y,
                                        width: isAutoSized ? "auto" : el.w,
                                        height: isAutoSized ? "auto" : el.h,
                                        zIndex: el.zIndex,
                                        ...(isText
                                            ? {
                                                fontSize: el.fontSize,
                                                fontWeight: el.fontWeight,
                                                color: el.color,
                                                padding: "6px 10px",
                                                whiteSpace: "pre-wrap" as const,
                                                wordBreak: "break-word" as const,
                                            }
                                            : {}),
                                    }}
                                    onMouseDown={(e) => {
                                        // Don't drag if click is on a resize handle
                                        if ((e.target as HTMLElement).dataset.handle) return;
                                        // Don't drag if contentEditable
                                        if ((e.target as HTMLElement).contentEditable === "true") return;
                                        startDrag(e, el.id);
                                    }}
                                    onDoubleClick={(e) => {
                                        if (isText) makeEditable(e, el.id);
                                        else if (el.type === "product-card") makeEditable(e, el.id, "card");
                                    }}
                                >
                                    {/* CONTENT */}
                                    {isText && (el.text || "")}
                                    {el.type === "shape" && <ShapeSVG kind={el.shapeKind!} fill={el.fill!} />}
                                    {el.type === "product-card" && <ProductCardContent el={el} onUpdate={updateEl} />}

                                    {/* RESIZE HANDLES */}
                                    {isSelected &&
                                        HANDLE_POSITIONS.map((pos) => (
                                            <div
                                                key={pos}
                                                data-handle={pos}
                                                className={cn(
                                                    "absolute w-2.5 h-2.5 bg-blue-500 border border-white rounded-sm z-10",
                                                    handleCursorMap[pos],
                                                    handlePositionClasses[pos]
                                                )}
                                                onMouseDown={(e) => startResize(e, el.id, pos)}
                                            />
                                        ))}
                                </div>
                            );
                        })}
                    </div>

                    {/* SAVED POSTERS GALLERY */}
                    {savedPosters.length > 0 && (
                        <div className="w-full max-w-[840px] mt-12 pb-20">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px flex-1 bg-border/50" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-primary" />
                                    Your Saved Posters
                                </h3>
                                <div className="h-px flex-1 bg-border/50" />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-6">
                                {savedPosters.map((p) => (
                                    <div 
                                        key={p.id} 
                                        className="group relative bg-card border border-border/50 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
                                    >
                                        <div 
                                            className="w-full aspect-[1/1.4] rounded-lg border border-border/30 overflow-hidden mb-3 relative bg-white"
                                            style={{ backgroundColor: p.canvasBg }}
                                        >
                                            {/* Mini preview logic could go here, but for now we'll just show info */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                                                <ImageIcon className="w-12 h-12" />
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex w-full gap-2">
                                                    <button 
                                                        onClick={() => loadPoster(p)}
                                                        className="flex-1 bg-white text-black text-[10px] font-bold py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteSavedPoster(p.id)}
                                                        className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-muted-foreground">
                                                {new Date(p.timestamp).toLocaleDateString()}
                                            </span>
                                            <span className="font-bold text-primary">
                                                {p.elements.length} components
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== RIGHT PANEL ===== */}
            <div className="w-[240px] min-w-[240px] bg-card border-l border-border/50 flex flex-col p-4 gap-4 overflow-y-auto">
                {/* Canvas Background */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Canvas Background</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Color</label>
                        <input
                            type="color"
                            value={canvasBg}
                            onChange={(e) => setCanvasBg(e.target.value)}
                            className="w-9 h-8 rounded-lg border border-border/50 cursor-pointer"
                        />
                    </div>

                    {/* Grid Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Grid3X3 className="w-3.5 h-3.5 text-primary" />
                            <label className="text-xs text-muted-foreground">Show Grid</label>
                        </div>
                        <button
                            onClick={() => setShowGrid(!showGrid)}
                            className={cn(
                                "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                showGrid ? "bg-orange-100" : "bg-slate-300"
                            )}
                        >
                            <span
                                className={cn(
                                    "pointer-events-none block h-4.5 w-4.5 rounded-full bg-orange-500 shadow-[0_1px_3px_rgba(0,0,0,0.3)] ring-0 transition-transform",
                                    showGrid ? "translate-x-4.5" : "translate-x-0.5"
                                )}
                            />
                        </button>
                    </div>

                    {showGrid && (
                        <div className="space-y-3 pt-1 border-t border-border/20 mt-2">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Presets</label>
                                <div className="grid grid-cols-3 gap-1">
                                    {[4, 5, 6].map((n) => (
                                        <button
                                            key={n}
                                            onClick={() => {
                                                setGridCols(n);
                                                setGridRows(n);
                                            }}
                                            className={cn(
                                                "text-[10px] py-1 rounded-md border transition-all",
                                                gridCols === n && gridRows === n
                                                    ? "bg-primary/20 border-primary text-primary font-bold"
                                                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            {n}x{n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-muted-foreground">Cols</label>
                                    <input
                                        type="number"
                                        min={2}
                                        max={50}
                                        value={gridCols}
                                        onChange={(e) => setGridCols(Math.max(2, parseInt(e.target.value) || 2))}
                                        className="w-full bg-background/40 border border-border/50 rounded-md px-1.5 py-1 text-[11px] focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-muted-foreground">Rows</label>
                                    <input
                                        type="number"
                                        min={2}
                                        max={50}
                                        value={gridRows}
                                        onChange={(e) => setGridRows(Math.max(2, parseInt(e.target.value) || 2))}
                                        className="w-full bg-background/40 border border-border/50 rounded-md px-1.5 py-1 text-[11px] focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-px bg-border/50" />

                {/* Add Text */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Type className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add Text</span>
                    </div>
                    <PremiumButton
                        onClick={() => addTextElement("🔥 Special Offer!", 36, 700)}
                        leftIcon={Heading1}
                        className="rounded-xl w-full text-xs h-9"
                    >
                        Offer Title
                    </PremiumButton>
                    <PremiumButton
                        variant="outline"
                        onClick={() => addTextElement("Your text here", 16, 400)}
                        leftIcon={FileText}
                        className="rounded-xl w-full text-xs h-9"
                    >
                        Normal Text
                    </PremiumButton>
                </div>

                <div className="h-px bg-border/50" />

                {/* Add Shapes */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Paintbrush className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add Shapes</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <PremiumButton variant="outline" onClick={() => addShape("rect")} className="rounded-xl text-xs h-9 px-2">
                            <Square className="w-3.5 h-3.5 mr-1" /> Rect
                        </PremiumButton>
                        <PremiumButton variant="outline" onClick={() => addShape("circle")} className="rounded-xl text-xs h-9 px-2">
                            <Circle className="w-3.5 h-3.5 mr-1" /> Circle
                        </PremiumButton>
                        <PremiumButton variant="outline" onClick={() => addShape("triangle")} className="rounded-xl text-xs h-9 px-2">
                            <Triangle className="w-3.5 h-3.5 mr-1" /> Triangle
                        </PremiumButton>
                        <PremiumButton variant="outline" onClick={() => addShape("star")} className="rounded-xl text-xs h-9 px-2">
                            <Star className="w-3.5 h-3.5 mr-1" /> Star
                        </PremiumButton>
                    </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Element Style (contextual) */}
                {selectedEl ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Paintbrush className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Element Style</span>
                        </div>

                        {/* Fill color — for shapes and product cards */}
                        {(selectedEl.type === "shape" || selectedEl.type === "product-card") && (
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-muted-foreground">Fill Color</label>
                                <input
                                    type="color"
                                    value={selectedEl.type === "shape" ? (selectedEl.fill || "#7c3aed") : (selectedEl.cardBg || "#ffffff")}
                                    onChange={(e) => {
                                        if (selectedEl.type === "shape") updateEl(selectedEl.id, { fill: e.target.value });
                                        else updateEl(selectedEl.id, { cardBg: e.target.value });
                                    }}
                                    className="w-9 h-8 rounded-lg border border-border/50 cursor-pointer"
                                />
                            </div>
                        )}

                        {/* Font size — for text */}
                        {selectedEl.type === "text" && (
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-muted-foreground">Font Size</label>
                                <input
                                    type="number"
                                    min={8}
                                    max={200}
                                    value={selectedEl.fontSize || 16}
                                    onChange={(e) => updateEl(selectedEl.id, { fontSize: Number(e.target.value) })}
                                    className="w-20 bg-background/40 border border-border/50 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        )}

                        {/* Card Styling — for product cards */}
                        {selectedEl.type === "product-card" && (
                            <div className="space-y-4 pt-1 border-t border-border/20">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                                        <Move className="w-3 h-3" />
                                        Custom Layout
                                    </label>
                                    <button
                                        onClick={() => updateEl(selectedEl.id!, { 
                                            isLayoutUnlocked: !selectedEl.isLayoutUnlocked,
                                            subLayout: selectedEl.isLayoutUnlocked ? {} : {
                                                image: { x: 10, y: 10, w: 60, h: 60 },
                                                title: { x: 80, y: 15 },
                                                desc: { x: 80, y: 35 },
                                                prices: { x: 80, y: 65 }
                                            }
                                        })}
                                        className={cn(
                                            "px-2 py-1 rounded text-[10px] font-bold transition-all",
                                            selectedEl.isLayoutUnlocked 
                                                ? "bg-orange-500 text-white shadow-sm" 
                                                : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
                                        )}
                                    >
                                        {selectedEl.isLayoutUnlocked ? "Unlocked" : "Unlock"}
                                    </button>
                                </div>

                                {selectedEl.isLayoutUnlocked && (
                                    <div className="flex flex-col gap-2 p-2 bg-orange-50/30 rounded-lg border border-orange-100">
                                        <p className="text-[9px] text-orange-600 font-medium">Tips: Drag internal elements to move. Resize Image via the blue handle.</p>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => addShape("rect")}
                                                className="flex-1 py-1 text-[9px] bg-white border border-orange-200 rounded text-orange-600 hover:bg-orange-50"
                                            >
                                                Add Shape to Card
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!selectedEl.isLayoutUnlocked && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Card Style</label>
                                        <div className="grid grid-cols-3 gap-1">
                                            {(["classic", "badge", "modern", "glass", "split", "gradient"] as const).map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => updateEl(selectedEl.id!, { cardStyle: s })}
                                                    className={cn(
                                                        "text-[8px] py-2 rounded-md border transition-all capitalize",
                                                        selectedEl.cardStyle === s
                                                            ? "bg-primary/20 border-primary text-primary font-bold shadow-sm"
                                                            : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                                                    )}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {selectedEl.cardStyle === "badge" && !selectedEl.isLayoutUnlocked && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Badge Text</label>
                                        <input
                                            type="text"
                                            value={selectedEl.badgeText || ""}
                                            onChange={(e) => updateEl(selectedEl.id!, { badgeText: e.target.value })}
                                            placeholder="-50%"
                                            className="w-full bg-background/40 border border-border/50 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                )}

                                {selectedEl.isLayoutUnlocked && (
                                    <button
                                        onClick={() => updateEl(selectedEl.id!, { subLayout: {}, internalElements: [] })}
                                        className="w-full py-1.5 text-[10px] bg-muted/50 hover:bg-muted text-muted-foreground rounded-md border border-border/50 transition-colors"
                                    >
                                        Reset Layout & Shapes
                                    </button>
                                )}
                            </div>
                        )}

                        <PremiumButton
                            variant="destructive"
                            onClick={deleteSelected}
                            leftIcon={Trash2}
                            className="rounded-xl w-full text-xs h-9"
                            glow={false}
                        >
                            Delete Element
                        </PremiumButton>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground text-center py-3">
                        Click an element on the canvas to edit its style.
                    </p>
                )}
            </div>

            {/* ===== PRODUCT CARD MODAL ===== */}
            <AppModal
                open={showCardModal}
                onOpenChange={setShowCardModal}
                title="Add Product Card"
                description="Fill in the product details to add a card to the canvas."
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Product Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleCardFileChange}
                            className="text-xs w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium file:text-xs file:cursor-pointer"
                        />
                        <div className="w-full h-36 rounded-xl bg-muted/50 border border-dashed border-border/50 flex items-center justify-center overflow-hidden">
                            {cardFilePreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cardFilePreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <span className="text-xs text-muted-foreground">No image selected</span>
                            )}
                        </div>
                    </div>

                    <PremiumInput
                        label="Title"
                        icon={Type}
                        placeholder="Product name"
                        value={cardForm.title}
                        onChange={(e) => setCardForm((f) => ({ ...f, title: e.target.value }))}
                    />

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Description</label>
                        <textarea
                            className="w-full bg-background/40 border border-primary/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground resize-none min-h-[60px]"
                            placeholder="Short description"
                            value={cardForm.desc}
                            onChange={(e) => setCardForm((f) => ({ ...f, desc: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <PremiumInput
                            label="Offer Price"
                            placeholder="₹199"
                            value={cardForm.offerPrice}
                            onChange={(e) => setCardForm((f) => ({ ...f, offerPrice: e.target.value }))}
                        />
                        <PremiumInput
                            label="Old Price"
                            placeholder="₹499"
                            value={cardForm.oldPrice}
                            onChange={(e) => setCardForm((f) => ({ ...f, oldPrice: e.target.value }))}
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <PremiumButton
                            variant="outline"
                            onClick={() => setShowCardModal(false)}
                            className="rounded-xl"
                        >
                            Cancel
                        </PremiumButton>
                        <PremiumButton onClick={addProductCard} className="rounded-xl">
                            Save
                        </PremiumButton>
                    </div>
                </div>
            </AppModal>
        </div>
    );
}
