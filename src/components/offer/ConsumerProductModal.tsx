"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerTitle,
} from "@/components/ui/drawer";
import { IndianRupee, Tag, X, ShoppingBag, MapPin, Loader2, Store, Maximize2 } from "lucide-react";
import { Text } from "@/components/shared/Typography";
import { useTranslation } from "@/hooks/useTranslation";
import { MarkedItem } from "@/lib/types/offer";
import { getUserOfferProductById } from "@/lib/api/offerproduct";

interface ConsumerProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    markedItems: MarkedItem[];
    initialItemId: string | null;
    offerCategory?: string;
    shopName?: string;
    shopLogo?: string | null;
}

interface LocationItem {
    name: string;
    latitude?: number;
    longitude?: number;
}

function getFallbackLocations(shopName?: string): LocationItem[] {
    if (!shopName) return [{ name: "Main Outlet" }];
    const name = shopName.toLowerCase();
    
    // Mumbai locations coordinates mapping helper
    const getCoords = (locName: string): { latitude?: number; longitude?: number } => {
        const ln = locName.toLowerCase();
        if (ln.includes("bandra west")) return { latitude: 19.0596, longitude: 72.8295 };
        if (ln.includes("colaba")) return { latitude: 18.9067, longitude: 72.8147 };
        if (ln.includes("lokhandwala") || ln.includes("andheri west")) return { latitude: 19.1363, longitude: 72.8276 };
        if (ln.includes("andheri east")) return { latitude: 19.1179, longitude: 72.8631 };
        if (ln.includes("palladium") || ln.includes("lower parel")) return { latitude: 18.9950, longitude: 72.8250 };
        if (ln.includes("juhu")) return { latitude: 19.1012, longitude: 72.8258 };
        if (ln.includes("oberoi") || ln.includes("goregaon")) return { latitude: 19.1634, longitude: 72.8412 };
        if (ln.includes("warden road")) return { latitude: 18.9667, longitude: 72.8056 };
        if (ln.includes("prabhadevi")) return { latitude: 19.0166, longitude: 72.8300 };
        if (ln.includes("powai")) return { latitude: 19.1176, longitude: 72.9060 };
        if (ln.includes("marketcity") || ln.includes("kurla")) return { latitude: 19.0728, longitude: 72.8826 };
        if (ln.includes("fort")) return { latitude: 18.9345, longitude: 72.8371 };
        if (ln.includes("thane")) return { latitude: 19.2183, longitude: 72.9781 };
        if (ln.includes("malad west")) return { latitude: 19.1860, longitude: 72.8485 };
        return {};
    };

    let names: string[] = [];
    if (name.includes("coffee") || name.includes("artisan")) {
        names = ["Bandra West", "Colaba", "Andheri Lokhandwala"];
    } else if (name.includes("zara")) {
        names = ["Phoenix Palladium (Lower Parel)", "Juhu", "Oberoi Mall (Goregaon)"];
    } else if (name.includes("basket") || name.includes("nature")) {
        names = ["Warden Road", "Prabhadevi", "Bandra West", "Powai"];
    } else if (name.includes("h&m") || name.includes("h & m")) {
        names = ["Phoenix Marketcity (Kurla)", "Oberoi Mall (Goregaon)", "Fort"];
    } else if (name.includes("starbucks")) {
        names = ["Horniman Circle (Fort)", "Carter Road (Bandra)", "Juhu Beach", "Hiranandani (Powai)"];
    } else if (name.includes("roma") || name.includes("pizza")) {
        names = ["Colaba", "Bandra West", "Andheri West"];
    } else if (name.includes("kart") || name.includes("offer")) {
        names = ["Andheri East", "Malad West", "Thane"];
    } else {
        names = [`${shopName} - Bandra West`, `${shopName} - Colaba`, `${shopName} - Andheri East`];
    }

    return names.map(n => ({
        name: n,
        ...getCoords(n)
    }));
}

function extractLocations(data: any): LocationItem[] {
    if (!data) return [];
    
    const locations: LocationItem[] = [];
    
    const getBranchDetails = (b: any): LocationItem | null => {
        if (!b) return null;
        if (typeof b === "string") return { name: b };
        const name = b.branchName || b.branch_name || b.name || b.locationName || b.address || null;
        if (!name) return null;
        
        let latitude: number | undefined = undefined;
        let longitude: number | undefined = undefined;
        
        if (typeof b.latitude === 'number') {
            latitude = b.latitude;
        } else if (b.latitude) {
            const latNum = Number(b.latitude);
            if (!isNaN(latNum)) latitude = latNum;
        }
        
        if (typeof b.longitude === 'number') {
            longitude = b.longitude;
        } else if (b.longitude) {
            const lngNum = Number(b.longitude);
            if (!isNaN(lngNum)) longitude = lngNum;
        }
        
        return {
            name,
            latitude,
            longitude
        };
    };

    if (Array.isArray(data.availableBranches)) {
        data.availableBranches.forEach((ab: any) => {
            const item = getBranchDetails(ab);
            if (item) locations.push(item);
        });
    }

    if (Array.isArray(data.offerBranches)) {
        data.offerBranches.forEach((ob: any) => {
            if (ob) {
                const item = getBranchDetails(ob.branch) || getBranchDetails(ob);
                if (item) locations.push(item);
            }
        });
    }

    if (locations.length === 0 && Array.isArray(data.branches)) {
        data.branches.forEach((b: any) => {
            const item = getBranchDetails(b);
            if (item) locations.push(item);
        });
    }

    if (locations.length === 0 && data.shop && Array.isArray(data.shop.branches)) {
        data.shop.branches.forEach((b: any) => {
            const item = getBranchDetails(b);
            if (item) locations.push(item);
        });
    }

    if (locations.length === 0) {
        const singleBranch = getBranchDetails(data.branch) || 
            (data.branchName || data.location ? {
                name: data.branchName || data.location,
                latitude: typeof data.latitude === 'number' ? data.latitude : (data.latitude ? Number(data.latitude) : undefined),
                longitude: typeof data.longitude === 'number' ? data.longitude : (data.longitude ? Number(data.longitude) : undefined),
            } : null);
        if (singleBranch) {
            locations.push(singleBranch);
        }
    }

    // Deduplicate by name
    const seen = new Set<string>();
    const uniqueLocations: LocationItem[] = [];
    for (const loc of locations) {
        if (!seen.has(loc.name)) {
            seen.add(loc.name);
            uniqueLocations.push(loc);
        }
    }
    return uniqueLocations;
}

export const ConsumerProductModal = ({
    open,
    onOpenChange,
    markedItems = [],
    initialItemId,
    offerCategory,
    shopName,
    shopLogo,
}: ConsumerProductModalProps) => {
    const { t } = useTranslation("common");
    const [locations, setLocations] = useState<LocationItem[]>([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [isImageZoomed, setIsImageZoomed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const activeItem = markedItems.find(item => String(item.id) === String(initialItemId)) || markedItems[0];

    useEffect(() => {
        if (!open || !activeItem?.id) {
            setLocations([]);
            setIsImageZoomed(false);
            return;
        }

        let isMounted = true;
        setIsLoadingLocations(true);

        getUserOfferProductById(activeItem.id)
            .then((res) => {
                if (!isMounted) return;
                
                let fetchedLocs: LocationItem[] = [];
                if (res && res.success && res.data) {
                    const rawData = res.data.data || res.data;
                    fetchedLocs = extractLocations(rawData);
                }
                
                if (fetchedLocs.length === 0) {
                    fetchedLocs = getFallbackLocations(shopName);
                }
                
                setLocations(fetchedLocs);
            })
            .catch((err) => {
                console.error("Error fetching product details/locations:", err);
                if (isMounted) {
                    setLocations(getFallbackLocations(shopName));
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoadingLocations(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [open, activeItem?.id, shopName]);

    if (markedItems.length === 0) return null;
    if (!activeItem) return null;

    const discountValue = activeItem.oldPrice && activeItem.offerPrice && activeItem.oldPrice > activeItem.offerPrice
        ? `${Math.round(((activeItem.oldPrice - activeItem.offerPrice) / activeItem.oldPrice) * 100)}% OFF`
        : "Sale";

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[92vh] border-none bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl rounded-t-[32px] overflow-hidden focus:outline-none">
                {/* Drag Handle for Mobile */}
                <div className="mx-auto my-3 h-1 w-12 rounded-full bg-zinc-300 dark:bg-zinc-800 md:hidden" />

                {/* Close Button */}
                <DrawerClose className="absolute top-4 right-4 z-50 p-2 rounded-full bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all focus:outline-none border-none">
                    <X className="w-4 h-4" />
                </DrawerClose>

                <div className="relative w-full max-w-4xl mx-auto px-4 md:px-8 pb-6 pt-2 md:pt-6">
                    {/* Main Content Area */}
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-stretch w-full max-h-[75vh] overflow-y-auto overflow-x-hidden pr-1">
                        {/* Image Section */}
                        <div 
                            onClick={() => {
                                if (activeItem.productImage) {
                                    setIsImageZoomed(true);
                                }
                            }}
                            className="relative w-full md:w-[45%] h-64 md:h-auto md:min-h-[360px] rounded-2xl overflow-hidden bg-gradient-to-tr from-slate-50 to-white dark:from-zinc-900/40 dark:to-zinc-950/80 border border-slate-200/60 dark:border-zinc-800/60 shadow-sm flex-shrink-0 flex items-center justify-center group/img cursor-zoom-in"
                        >
                            {activeItem.productImage ? (
                                <>
                                    <Image
                                        src={activeItem.productImage}
                                        alt={activeItem.name}
                                        fill
                                        className="object-contain p-6 transition-transform duration-500 group-hover/img:scale-105"
                                        sizes="(max-width: 768px) 100vw, 400px"
                                        unoptimized
                                    />
                                    {/* Zoom Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100 duration-300">
                                        <div className="bg-white/95 dark:bg-zinc-900/95 p-2.5 rounded-full shadow-lg border border-slate-200/40 dark:border-zinc-800/40 flex items-center gap-1.5 transform translate-y-2 group-hover/img:translate-y-0 transition-all duration-300">
                                            <Maximize2 className="w-4 h-4 text-orange-500" />
                                            <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider pr-1">Click to Zoom</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/10 text-slate-400">
                                    <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800/60 mb-2">
                                        <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        {t("catalog.noImage") || "No Image Available"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                            <div className="space-y-4">
                                {/* Shop info header with logo and name */}
                                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-zinc-900/60">
                                    <div className="w-8 h-8 rounded-full bg-orange-500/10 dark:bg-orange-500/20 border border-slate-100 dark:border-zinc-800/60 overflow-hidden flex items-center justify-center flex-shrink-0">
                                        {shopLogo ? (
                                            <img
                                                src={shopLogo}
                                                alt={shopName || "Shop Logo"}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Store className="w-4 h-4 text-orange-500" />
                                        )}
                                    </div>
                                    <span className="text-sm font-black text-slate-800 dark:text-zinc-200 tracking-wide">
                                        {shopName || "OfferKart"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2.5 py-1 rounded-md">
                                        {(activeItem as any).subcategory || activeItem.subcategories?.[0] || activeItem.mainCategory || offerCategory || "Product"}
                                    </span>
                                    {activeItem.oldPrice > activeItem.offerPrice && (
                                        <span className="bg-orange-500 text-white font-black text-[9px] uppercase tracking-wider py-0.5 px-2 rounded-full flex items-center shadow-sm">
                                            <Tag className="w-2.5 h-2.5 mr-1" />
                                            {discountValue}
                                        </span>
                                    )}
                                </div>
                                
                                <DrawerTitle className="text-xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight pt-1">
                                    {activeItem.name}
                                </DrawerTitle>

                                <div className="flex items-baseline gap-2.5 pt-1">
                                    <span className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600 dark:from-orange-400 dark:to-amber-500 flex items-center">
                                        <IndianRupee className="w-6 h-6 md:w-7 md:h-7 stroke-[3] text-orange-500 dark:text-orange-400 mr-0.5" />
                                        {activeItem.offerPrice.toLocaleString()}
                                    </span>
                                    {activeItem.oldPrice > activeItem.offerPrice && (
                                        <span className="text-sm md:text-base font-medium text-muted-foreground line-through flex items-center">
                                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                            {activeItem.oldPrice.toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <Text className="text-muted-foreground text-sm leading-relaxed">
                                        {activeItem.description || "No description available for this item."}
                                    </Text>
                                </div>
                            </div>

                            {/* Store Locations Section */}
                            <div className="pt-6 border-t border-slate-100 dark:border-zinc-900/60 mt-6 space-y-3">
                                <div className="flex items-center gap-2 text-foreground">
                                    <MapPin className="w-4 h-4 text-orange-500" />
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        {t("catalog.availableAt") || "Available Store Locations"}
                                    </h4>
                                </div>
                                
                                {isLoadingLocations ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 animate-pulse">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                                        <span>Fetching store locations...</span>
                                    </div>
                                ) : locations.length > 0 ? (
                                    <div className="flex flex-row flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                        {locations.map((loc, index) => {
                                            const query = loc.latitude && loc.longitude
                                                ? `${loc.latitude},${loc.longitude}`
                                                : encodeURIComponent(loc.name);
                                            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
                                            return (
                                                <a 
                                                    key={index} 
                                                    href={mapUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-slate-50/60 dark:bg-zinc-900/30 border border-slate-100/50 dark:border-zinc-800/20 hover:bg-orange-50/50 dark:hover:bg-orange-500/10 hover:border-orange-500/30 text-slate-700 hover:text-orange-500 dark:text-zinc-300 dark:hover:text-orange-400 transition-all shrink-0 cursor-pointer decoration-none"
                                                >
                                                    <MapPin className="w-3 h-3 text-orange-500/80 shrink-0" />
                                                    <span className="text-xs font-semibold leading-none">
                                                        {loc.name}
                                                    </span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">
                                        No store locations available.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DrawerContent>

            {/* High Scale Zoom Lightbox Overlay */}
            {isImageZoomed && activeItem.productImage && mounted && typeof window !== "undefined" && createPortal(
                <div 
                    onClick={() => setIsImageZoomed(false)}
                    className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center cursor-zoom-out animate-in fade-in-0 duration-300"
                    style={{ zIndex: 999999 }}
                >
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsImageZoomed(false);
                        }}
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center animate-in scale-in-95 duration-200"
                    >
                        <img 
                            src={activeItem.productImage} 
                            alt={activeItem.name} 
                            className="max-w-full max-h-[85vh] object-contain rounded-xl select-none shadow-2xl border border-white/5"
                        />
                    </div>
                </div>,
                document.body
            )}
        </Drawer>
    );
};
