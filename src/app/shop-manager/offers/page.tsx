"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

import {
    Heading, Text, PremiumCard, PremiumButton, AppModal, StatusToggleButton
} from "@/components/shared";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

import {
    Clock, Eye, Package, Plus, Search, Tag, Trash2, Calendar,
    Pencil, ArrowLeft, GitBranch, ShoppingBag, Loader2, ArrowRight, AlertTriangle, Check, Power, ListChecks, Play, Pause
} from "@/lib/icons";

import { queryKeys } from "@/hooks/useApi";
import {
    useMyShops, useBranches, useAllOffers, useDeleteOffer, useToggleOfferStatus, useIsMobile
} from "@/hooks";
import { cn, getRelativeTime } from "@/lib/utils";

interface SwipeableCardProps {
    children: React.ReactNode;
    onEdit: () => void;
    onDelete: () => void;
    editTitle?: string;
    deleteTitle?: string;
}

function SwipeableCard({ children, onEdit, onDelete, editTitle = "Edit", deleteTitle = "Delete" }: SwipeableCardProps) {
    const [startX, setStartX] = useState<number | null>(null);
    const [currentX, setCurrentX] = useState<number | null>(null);
    const [isSwiped, setIsSwiped] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX);
        setCurrentX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX === null) return;
        setCurrentX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (startX === null || currentX === null) return;
        const diff = startX - currentX;

        if (diff > 50) {
            setIsSwiped(true);
        }
        else if (diff < -30) {
            setIsSwiped(false);
        }

        setStartX(null);
        setCurrentX(null);
    };

    const handleContentClick = (e: React.MouseEvent) => {
        if (isSwiped) {
            e.preventDefault();
            e.stopPropagation();
            setIsSwiped(false);
        }
    };

    return (
        <div
            ref={cardRef}
            className="relative overflow-hidden rounded-xl w-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div
                onClick={handleContentClick}
                className={cn(
                    "transition-transform duration-300 ease-out select-none w-full relative z-10",
                    isSwiped ? "-translate-x-[110px]" : "translate-x-0"
                )}
            >
                {children}
            </div>

            <div
                className={cn(
                    "absolute right-0 top-0 bottom-0 flex items-center gap-2 px-3 bg-gradient-to-l from-orange-500/10 to-transparent border-l border-primary/10 rounded-r-xl transition-all duration-300 z-0",
                    isSwiped ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                )}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsSwiped(false);
                        onEdit();
                    }}
                    className="flex items-center justify-center p-2.5 rounded-xl bg-white border border-primary/10 text-primary hover:bg-primary hover:text-white shadow-lg active:scale-95 transition-all pointer-events-auto cursor-pointer"
                    title={editTitle}
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsSwiped(false);
                        onDelete();
                    }}
                    className="flex items-center justify-center p-2.5 rounded-xl bg-white border border-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white shadow-lg active:scale-95 transition-all pointer-events-auto cursor-pointer"
                    title={deleteTitle}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function ShopOffersContent() {
    const { data: session } = useSession();
    const router = useRouter();
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "drafted">("all");
    const [offerToDelete, setOfferToDelete] = useState<any | null>(null);
    const [previewLogo, setPreviewLogo] = useState<{ src: string; name: string } | null>(null);
    const [selectedOffers, setSelectedOffers] = useState<Set<string>>(new Set());
    const [bulkActionModal, setBulkActionModal] = useState<{ type: "delete" | "status" | null; targetStatus?: "active" | "inactive" } | null>(null);
    const [isBulkMode, setIsBulkMode] = useState(false);

    const isSelectMode = selectedOffers.size > 0;

    const { data: shopsResponse, isLoading: isLoadingShops } = useMyShops();
    const shops = useMemo(() => {
        if (!shopsResponse?.success || !shopsResponse?.data) return [];
        const result = shopsResponse.data as any;
        return Array.isArray(result) ? result : (result.data || []);
    }, [shopsResponse]);

    const activeShopId = useMemo(() => {
        const sid = session?.shopId ?? (session?.user as any)?.shopId;
        if (sid) return String(sid);
        if (shops.length > 0) return String(shops[0].id);
        return null;
    }, [session, shops]);

    const { data: offersResponse, isLoading: isLoadingOffers } = useAllOffers(activeShopId || undefined);
    const allOffersList = useMemo(() => {
        if (!offersResponse?.success || !offersResponse?.data) return [] as any[];
        const result = offersResponse.data as any;
        return Array.isArray(result) ? result : (result.data || []);
    }, [offersResponse]);

    const publishedOffers = useMemo(() => {
        return allOffersList.filter((offer: any) => !offer.isDraft) as any[];
    }, [allOffersList]);

    const { data: branchesResponse } = useBranches(activeShopId || "");
    const branches = useMemo(() => {
        if (!branchesResponse?.success || !branchesResponse?.data) return [];
        const result = branchesResponse.data as any;
        return Array.isArray(result) ? result : (result.data || []);
    }, [branchesResponse]);

    useEffect(() => {
        if (!activeShopId) return;
        queryClient.invalidateQueries({ queryKey: queryKeys.allOffers(activeShopId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.branches(activeShopId) });
    }, [activeShopId, queryClient]);

    const { mutateAsync: deleteOfferMutation } = useDeleteOffer();
    const { mutateAsync: toggleStatusMutation } = useToggleOfferStatus();

    const openEditModal = (offer: any) => {
        const id = String(offer.offerId || offer.id || offer.batchId);
        router.push(`/shop-manager/edit-offer/${id}`);
    };

    const handleDeleteOffer = async (offer: any) => {
        try {
            if (activeShopId) {
                const idToUse = offer.offerId || offer.id || offer.batchId;
                const res = await deleteOfferMutation({ id: String(idToUse), shopId: activeShopId, offer });
                if (res.success) {
                    toast.success("Offer deleted successfully");
                } else {
                    throw new Error("Failed to delete");
                }
            }
        } catch (err: any) {
            console.error("Delete error:", err);
            toast.error(`Failed to delete offer: ${err.message}`);
        } finally {
            setOfferToDelete(null);
        }
    };

    const handleToggleOfferStatus = async (offer: any) => {
        try {
            if (activeShopId) {
                const idToUse = offer.offerId || offer.id || offer.batchId;
                const res = await toggleStatusMutation({ id: String(idToUse), shopId: activeShopId });
                if (res.success) {
                    toast.success(`Offer ${offer.status === 'active' ? 'paused' : 'resumed'} successfully`);
                } else {
                    throw new Error("Failed to toggle status");
                }
            }
        } catch (err: any) {
            console.error("Toggle error:", err);
            toast.error(`Failed to update status: ${err.message}`);
        }
    };

    const handleSelectOffer = (offerId: string) => {
        const newSelected = new Set(selectedOffers);
        if (newSelected.has(offerId)) {
            newSelected.delete(offerId);
        } else {
            newSelected.add(offerId);
        }
        // toast.info(`Select offer: ${offerId} | Set now contains: [${Array.from(newSelected).join(", ")}]`);
        setSelectedOffers(newSelected);
    };

    const handleSelectAll = () => {
        const offersToSelect = filteredOffers.filter((offer: any) => !offer.isDraft);
        const allSelected = offersToSelect.length > 0 && offersToSelect.every((offer: any) => {
            const id = String(offer.offerId || offer.id || offer.batchId);
            return selectedOffers.has(id);
        });
        if (allSelected) {
            setSelectedOffers(new Set());
        } else {
            const allIds = new Set<string>();
            offersToSelect.forEach((offer: any) => {
                allIds.add(String(offer.offerId || offer.id || offer.batchId));
            });
            setSelectedOffers(allIds);
        }
    };

    const handleBulkDelete = async () => {
        try {
            const deletePromises = Array.from(selectedOffers).map((id) => {
                const offer = filteredOffers.find((o: any) => String(o.offerId || o.id || o.batchId) === id);
                if (offer && activeShopId) {
                    return deleteOfferMutation({ id, shopId: activeShopId });
                }
                return Promise.resolve({ success: false });
            });

            const results = await Promise.all(deletePromises);
            const successCount = results.filter((r: any) => r.success).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
                toast.success(`${successCount} offer${successCount > 1 ? 's' : ''} deleted successfully`);
            }
            if (failCount > 0) {
                toast.error(`Failed to delete ${failCount} offer${failCount > 1 ? 's' : ''}`);
            }
            setSelectedOffers(new Set());
            setIsBulkMode(false);
            setBulkActionModal(null);
        } catch (err: any) {
            console.error("Bulk delete error:", err);
            toast.error(`Failed to delete offers: ${err.message}`);
        }
    };

    const handleBulkToggleStatus = async (status: "active" | "inactive") => {
        try {
            const togglePromises = Array.from(selectedOffers).map((id) => {
                const offer = filteredOffers.find((o: any) => String(o.offerId || o.id || o.batchId) === id);
                if (offer && activeShopId) {
                    return toggleStatusMutation({ id, shopId: activeShopId });
                }
                return Promise.resolve({ success: false });
            });

            const results = await Promise.all(togglePromises);
            const successCount = results.filter((r: any) => r.success).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
                toast.success(`${successCount} offer${successCount > 1 ? 's' : ''} ${status === 'active' ? 'activated' : 'paused'} successfully`);
            }
            if (failCount > 0) {
                toast.error(`Failed to update ${failCount} offer${failCount > 1 ? 's' : ''}`);
            }
            setSelectedOffers(new Set());
            setIsBulkMode(false);
            setBulkActionModal(null);
        } catch (err: any) {
            console.error("Bulk toggle error:", err);
            toast.error(`Failed to update offers: ${err.message}`);
        }
    };

    const filteredOffers = useMemo(() => {
        return allOffersList.filter((offer: any) => {
            const query = searchQuery.toLowerCase().trim();
            let matchesSearch = true;

            if (query) {
                const matchesTitle = (offer.title || "").toLowerCase().includes(query);
                const matchesType = (offer.type || "").toLowerCase().includes(query);
                const matchesCategory = (offer.category || "").toLowerCase().includes(query);

                let matchesBranch = false;
                if (offer.branches && Array.isArray(offer.branches)) {
                    matchesBranch = offer.branches.some((b: any) => (b.branchName || "").toLowerCase().includes(query));
                }
                if (offer.branchNames && Array.isArray(offer.branchNames)) {
                    matchesBranch = matchesBranch || offer.branchNames.some((name: string) => name.toLowerCase().includes(query));
                }
                if (offer.branchName) {
                    matchesBranch = matchesBranch || offer.branchName.toLowerCase().includes(query);
                }

                let matchesDate = false;
                if (offer.validFrom) {
                    const dateStr = new Date(offer.validFrom).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const dateLong = new Date(offer.validFrom).toLocaleDateString('en-US', { month: 'long', day: '2-digit' }).toLowerCase();
                    matchesDate = matchesDate || dateStr.includes(query) || dateLong.includes(query);
                }
                if (offer.validTo) {
                    const dateStr = new Date(offer.validTo).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const dateLong = new Date(offer.validTo).toLocaleDateString('en-US', { month: 'long', day: '2-digit' }).toLowerCase();
                    matchesDate = matchesDate || dateStr.includes(query) || dateLong.includes(query);
                }

                let matchesPrice = false;
                if (offer.price !== undefined && offer.price !== null) {
                    matchesPrice = matchesPrice || String(offer.price).includes(query) || `₹${offer.price}`.toLowerCase().includes(query) || `rs ${offer.price}`.toLowerCase().includes(query);
                }
                if (offer.originalPrice !== undefined && offer.originalPrice !== null) {
                    matchesPrice = matchesPrice || String(offer.originalPrice).includes(query) || `₹${offer.originalPrice}`.toLowerCase().includes(query);
                }
                if (offer.discountValue !== undefined && offer.discountValue !== null) {
                    matchesPrice = matchesPrice || String(offer.discountValue).includes(query);
                }

                matchesSearch = matchesTitle || matchesType || matchesCategory || matchesBranch || matchesDate || matchesPrice;
            }

            const matchesStatus = statusFilter === "all"
                ? !offer.isDraft
                : statusFilter === "active"
                    ? (!offer.isDraft && offer.status === "active")
                    : statusFilter === "paused"
                        ? (!offer.isDraft && offer.status === "inactive")
                        : statusFilter === "drafted"
                            ? offer.isDraft
                            : true;

            return matchesSearch && matchesStatus;
        });
    }, [allOffersList, searchQuery, statusFilter]);

    return (
        <main className="min-h-screen pt-20 lg:pt-24 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4 max-w-6xl">
                <Breadcrumbs
                    items={[
                        { label: "Dashboard", href: "/shop-manager" },
                        { label: "Manage Offers" }
                    ]}
                />

                <div className="mb-5 mt-4 p-1.5 rounded-xl border border-gray-100 bg-white/50 backdrop-blur-sm flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center flex-1 max-w-2xl">
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                            <div className="relative flex-1 sm:w-56 sm:flex-none flex items-center bg-gray-55 rounded-lg px-2 py-1 focus-within:bg-gray-100/80 transition-all border border-transparent focus-within:border-gray-200">
                                <Search className="w-3 h-3 text-gray-400 shrink-0 mr-1.5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search campaigns..."
                                    className="bg-transparent w-full text-xs font-semibold text-gray-700 outline-none placeholder-gray-400/80 h-6"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer border-0 bg-transparent px-1">×</button>
                                )}
                            </div>
                            {/* Mobile Bulk Button */}
                            <button
                                onClick={() => {
                                    if (isBulkMode) {
                                        setSelectedOffers(new Set());
                                    }
                                    setIsBulkMode(!isBulkMode);
                                }}
                                className={cn(
                                    "flex sm:hidden shrink-0 items-center justify-center gap-1 h-8 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer",
                                    isBulkMode
                                        ? "bg-red-400 text-white border-red-500 shadow-sm shadow-red-400/10"
                                        : "bg-white text-gray-650 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <ListChecks className="w-3.5 h-3.5 shrink-0" />
                                <span>{isBulkMode ? "Cancel" : "Select"}</span>
                            </button>

                            <Link href="/shop-manager/create-offer" className="flex sm:hidden shrink-0">
                                <PremiumButton
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    title="Add Offer"
                                >
                                    <Plus className="w-4 h-4 text-white" />
                                </PremiumButton>
                            </Link>
                        </div>

                        <div className="flex bg-gray-55 p-0.5 rounded-lg gap-0.5 self-start sm:self-auto shrink-0 border border-gray-100 bg-gray-50/50">
                            {(["all", "active", "paused", "drafted"] as const).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setStatusFilter(filter)}
                                    className={cn(
                                        "px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer border-0 bg-transparent whitespace-nowrap h-6 flex items-center justify-center",
                                        statusFilter === filter
                                            ? "bg-white text-orange-600 shadow-sm font-black border border-gray-100"
                                            : "text-gray-400 hover:text-gray-700"
                                    )}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => {
                                if (isBulkMode) {
                                    setSelectedOffers(new Set());
                                }
                                setIsBulkMode(!isBulkMode);
                            }}
                            className={cn(
                                "rounded-lg h-7 px-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border",
                                isBulkMode
                                    ? "bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/10"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            )}
                        >
                            <ListChecks className="w-3.5 h-3.5 shrink-0" />
                            {isBulkMode ? "Cancel" : "Select"}
                        </button>
                        <Link href="/shop-manager/create-offer">
                            <PremiumButton
                                className="rounded-lg h-7 px-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 shrink-0 self-start sm:self-auto"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Offer
                            </PremiumButton>
                        </Link>
                    </div>
                </div>

                {isLoadingOffers ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-50 animate-pulse shadow-sm">
                                <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="h-3.5 w-1/3 bg-gray-100 rounded" />
                                    <div className="h-2.5 w-3/4 bg-gray-100 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {isSelectMode && (
                            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 shadow-lg z-50 animate-in slide-in-from-bottom-full pb-safe-bottom">
                                <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center justify-between w-full sm:w-auto gap-3 border-b border-gray-100 sm:border-0">
                                        <div className="flex items-center justify-between gap-2.5 w-full">
                                            <span className="text-xs sm:text-sm font-bold text-gray-700">{selectedOffers.size} selected</span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedOffers(new Set())}
                                            className="text-[11px] sm:text-xs text-red-500 hover:text-red-700 underline whitespace-nowrap"
                                        >
                                            Clear selection
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-center sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
                                        <PremiumButton
                                            variant="outline"
                                            onClick={() => setBulkActionModal({ type: "status", targetStatus: "active" })}
                                            className="rounded-lg text-[10px] sm:text-xs h-8 px-2.5 sm:px-3 flex-1 sm:flex-none justify-center"
                                        >
                                            <Play className="w-3.5 h-3.5 mr-1" />
                                            Activate
                                        </PremiumButton>
                                        <PremiumButton
                                            variant="outline"
                                            onClick={() => setBulkActionModal({ type: "status", targetStatus: "inactive" })}
                                            className="rounded-lg text-[10px] sm:text-xs h-8 px-2.5 sm:px-3 flex-1 sm:flex-none justify-center"
                                        >
                                            <Pause className="w-3.5 h-3.5 mr-1" />
                                            Pause
                                        </PremiumButton>
                                        <PremiumButton
                                            variant="outline"
                                            onClick={() => setBulkActionModal({ type: "delete" })}
                                            className="rounded-lg text-[10px] sm:text-xs h-8 px-2.5 sm:px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 flex-1 sm:flex-none justify-center"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                                            Delete
                                        </PremiumButton>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Select All / Bulk Info bar */}
                        <div className={cn(
                            "overflow-hidden transition-all duration-300 ease-in-out flex items-center justify-between px-1",
                            isBulkMode && !isLoadingOffers && filteredOffers.filter((o: any) => !o.isDraft).length > 0
                                ? "max-h-12 opacity-100 mb-4 scale-y-100 origin-top"
                                : "max-h-0 opacity-0 mb-0 scale-y-95 origin-top pointer-events-none"
                        )}>
                            <span className="text-xs text-black font-medium ml-3">
                                {selectedOffers.size} of {filteredOffers.filter((o: any) => !o.isDraft).length} selected
                            </span>
                            <button
                                onClick={handleSelectAll}
                                className="text-xs font-semibold text-gray-600 hover:text-primary transition-colors flex items-center gap-2 border-0 bg-transparent cursor-pointer"
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                    filteredOffers.filter((o: any) => !o.isDraft).every((o: any) => selectedOffers.has(String(o.offerId || o.id || o.batchId)))
                                        ? "bg-orange-400 border-orange-400 text-white"
                                        : "border-gray-300 bg-white"
                                )}>
                                    {filteredOffers.filter((o: any) => !o.isDraft).every((o: any) => selectedOffers.has(String(o.offerId || o.id || o.batchId))) && (
                                        <Check className="w-2.5 h-2.5" />
                                    )}
                                </div>
                                Select All
                            </button>
                        </div>

                        {filteredOffers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-3">
                                {filteredOffers.map((offer: any, idx: number) => {
                                    const id = String(offer.offerId || offer.id || offer.batchId || idx);
                                    const offerImage = offer.posters?.[0]?.posterSrc || offer.posterSrc;
                                    const isSelected = selectedOffers.has(id);
                                    console.log("Card ID:", id, "isSelected:", isSelected, "selectedSet:", Array.from(selectedOffers));
                                    return (
                                        <div
                                            key={id}
                                            className="relative"
                                            onClick={(e) => {
                                                if (isBulkMode && !offer.isDraft) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleSelectOffer(id);
                                                }
                                            }}
                                        >
                                            <SwipeableCard
                                                onEdit={() => (offer.isDraft && offer.type === "BUILDER") ? router.push(`/shop-manager/poster-designer?draftId=${offer.batchId || offer.id}`) : openEditModal(offer)}
                                                onDelete={() => setOfferToDelete(offer)}
                                                editTitle="Edit"
                                                deleteTitle="Delete"
                                            >
                                                <div className="group relative flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden shadow-sm">
                                                    <div
                                                        className="group/img relative w-16 h-16 rounded-lg bg-white overflow-hidden shrink-0 border border-gray-100 shadow-sm z-10 transition-all duration-300"
                                                    >
                                                        {offerImage ? (
                                                            <>
                                                                <Image src={offerImage} alt={offer.title || "Offer"} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                <div
                                                                    className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[1px] cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setPreviewLogo({ src: offerImage, name: offer.title || "Offer Preview" });
                                                                    }}
                                                                >
                                                                    <div className="bg-white/90 p-1.5 rounded-full shadow-lg scale-75 group-hover/img:scale-100 transition-transform duration-300">
                                                                        <Eye className="w-4 h-4 text-primary" />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-primary/5 group-hover/img:from-orange-500/15 group-hover/img:via-amber-500/10 transition-all duration-300">
                                                                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/80 shadow-[0_4px_12px_rgba(249,115,22,0.08)] border border-orange-100/50 group-hover/img:scale-110 group-hover/img:shadow-[0_6px_16px_rgba(249,115,22,0.12)] transition-all duration-300">
                                                                    <Tag className="w-5 h-5 text-orange-500/85 group-hover:text-primary transition-colors rotate-12 group-hover/img:rotate-0 transition-transform duration-300" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1 z-10 flex flex-col justify-center gap-1 self-stretch py-0.5">
                                                        <div>
                                                            <h4 className="font-black text-sm text-gray-900 truncate group-hover:text-primary transition-colors leading-tight">
                                                                {offer.title || "Untitled Offer"}
                                                            </h4>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none">
                                                                    {offer.type ? `${offer.type}` : 'Builder'}
                                                                </span>
                                                                {offer.isDraft && (
                                                                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.2 rounded font-bold text-[8px] uppercase tracking-wider scale-90 origin-left shrink-0">
                                                                        Draft
                                                                    </span>
                                                                )}
                                                                {(() => {
                                                                    if (!offer.validTo) return null;
                                                                    const expiryDate = new Date(offer.validTo);
                                                                    const today = new Date();
                                                                    today.setHours(0, 0, 0, 0);
                                                                    if (expiryDate < today) {
                                                                        return (
                                                                            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1 py-0.2 rounded font-bold text-[8px] tracking-wider scale-90 origin-left shrink-0">
                                                                                Expired
                                                                            </span>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        </div>

                                                        {(offer.validFrom || offer.validTo || (offer.branches && offer.branches.length > 0) || offer.branchNames || offer.branchName) && (
                                                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                                {(offer.validFrom || offer.validTo) && (
                                                                    <span className="bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold text-[9px] uppercase tracking-wide">
                                                                        <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                                                                        <span>
                                                                            {offer.validFrom ? new Date(offer.validFrom).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : "n/a"}{offer.validTo ? ` - ${new Date(offer.validTo).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}` : ""}
                                                                        </span>
                                                                    </span>
                                                                )}
                                                                {((offer.branches && offer.branches.length > 0) || offer.branchNames || offer.branchName) && (
                                                                    <span className="bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wide flex items-center gap-1">
                                                                        <GitBranch className="w-3 h-3 shrink-0" />
                                                                        <span className="truncate max-w-[120px]">
                                                                            {offer.branches ? (
                                                                                offer.branches.length > 1 ? `${offer.branches[0].branchName} +${offer.branches.length - 1}` : offer.branches[0].branchName
                                                                            ) : (
                                                                                offer.branchNames ? offer.branchNames[0] : offer.branchName
                                                                            )}
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="relative z-20 flex flex-col items-end justify-between self-stretch shrink-0 py-0.5">
                                                        {!offer.isDraft ? (
                                                            <div className="scale-75 origin-right">
                                                                <StatusToggleButton
                                                                    status={offer.status || 'active'}
                                                                    onChange={() => handleToggleOfferStatus(offer)}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="h-6" />
                                                        )}

                                                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                                            <Clock className="w-3 h-3 shrink-0" />
                                                            <span>{getRelativeTime(offer.createdAt || offer.validFrom) ? getRelativeTime(offer.createdAt || offer.validFrom) : "Active"}</span>
                                                        </div>

                                                        <div className="hidden sm:flex flex-row gap-1 items-center">
                                                            <button onClick={() => openEditModal(offer)} className="flex items-center justify-center p-2 rounded-xl bg-white border border-gray-100 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm cursor-pointer" title="Edit offer"><Pencil className="w-3.5 h-3.5" /></button>
                                                            <button onClick={() => setOfferToDelete(offer)} className="flex items-center justify-center p-2 rounded-xl bg-white border border-gray-100 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm cursor-pointer" title="Delete offer"><Trash2 className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </SwipeableCard>
                                            {isBulkMode && offer.isDraft && (
                                                <div
                                                    className="absolute top-2 left-2 z-20 w-5 h-5 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center cursor-not-allowed opacity-50"
                                                    title="Drafts cannot be selected for bulk actions"
                                                >
                                                    <Check className="w-3 h-3 text-gray-400" />
                                                </div>
                                            )}
                                            {isBulkMode && !offer.isDraft && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectOffer(id);
                                                    }}
                                                    className={cn(
                                                        "absolute top-2 left-2 z-20 w-5 h-5 rounded-md border transition-all cursor-pointer flex items-center justify-center",
                                                        isSelected
                                                            ? "bg-orange-400 border-orange-400"
                                                            : "bg-white/90 backdrop-blur border-gray-255 hover:border-primary hover:bg-white shadow-sm"
                                                    )}
                                                    title={isSelected ? "Deselect" : "Select"}
                                                >
                                                    {isSelected && <Check className="w-4 h-4 text-white mx-auto" />}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl text-center shadow-sm max-w-xl mx-auto">
                                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                                    <Tag className="w-8 h-8 text-primary/20" />
                                </div>
                                <p className="text-lg font-black text-gray-900">
                                    {searchQuery ? (
                                        "No matching campaigns"
                                    ) : statusFilter === "active" ? (
                                        "No active campaigns"
                                    ) : statusFilter === "paused" ? (
                                        "No paused campaigns"
                                    ) : statusFilter === "drafted" ? (
                                        "No drafted campaigns"
                                    ) : (
                                        "No campaigns found"
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 max-w-xs mt-1 mb-6">
                                    {searchQuery ? (
                                        "Try adjusting your search terms to find what you're looking for."
                                    ) : statusFilter === "active" ? (
                                        publishedOffers.length > 0
                                            ? "All of your campaigns are currently paused or drafted."
                                            : "You haven't published any campaigns yet."
                                    ) : statusFilter === "paused" ? (
                                        publishedOffers.length > 0
                                            ? "All of your campaigns are active and running."
                                            : "You haven't published any campaigns yet."
                                    ) : statusFilter === "drafted" ? (
                                        "You don't have any drafted campaigns at the moment."
                                    ) : (
                                        "You haven't published any campaigns yet. Let's create one now!"
                                    )}
                                </p>
                                {allOffersList.length === 0 && (
                                    <Link href="/shop-manager/create-offer">
                                        <PremiumButton className="rounded-xl shadow-lg shadow-primary/20 border-0 cursor-pointer">
                                            Create New Offer
                                        </PremiumButton>
                                    </Link>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <AppModal
                open={!!offerToDelete}
                onOpenChange={(open) => { if (!open) setOfferToDelete(null); }}
                title="Delete Offer"
                description="Are you sure you want to delete this offer? This action cannot be undone."
            >
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-sm text-orange-700 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">"{offerToDelete?.title || 'Untitled'}"</p>
                            <p className="mt-1 text-xs opacity-80">This will permanently remove this offer from your catalog.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end flex-wrap">
                        <PremiumButton variant="outline" onClick={() => setOfferToDelete(null)} className="rounded-xl">Cancel</PremiumButton>
                        <PremiumButton onClick={() => offerToDelete && handleDeleteOffer(offerToDelete)} className="rounded-xl px-6 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 border-0">
                            <Trash2 className="w-4 h-4 mr-2" />Confirm Delete
                        </PremiumButton>
                    </div>
                </div>
            </AppModal>

            {previewLogo && (
                <AppModal
                    open={!!previewLogo}
                    onOpenChange={(open) => { if (!open) setPreviewLogo(null); }}
                    title={previewLogo.name}
                >
                    <div className="relative aspect-[3/4] w-full max-w-md mx-auto rounded-2xl overflow-hidden border border-gray-100 shadow-xl bg-gray-50">
                        <Image src={previewLogo.src} alt={previewLogo.name} fill unoptimized className="object-contain" />
                    </div>
                </AppModal>
            )}

            <AppModal
                open={!!bulkActionModal}
                onOpenChange={(open) => { if (!open) setBulkActionModal(null); }}
                title={bulkActionModal?.type === "delete" ? "Delete Selected Offers" : "Update Status"}
                description={bulkActionModal?.type === "delete"
                    ? `Are you sure you want to delete ${selectedOffers.size} offer${selectedOffers.size > 1 ? 's' : ''}? This action cannot be undone.`
                    : `Set ${selectedOffers.size} offer${selectedOffers.size > 1 ? 's' : ''} to ${bulkActionModal?.targetStatus === 'active' ? 'active' : 'inactive'} status?`
                }
            >
                <div className="space-y-4">
                    {bulkActionModal?.type === "delete" && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">{selectedOffers.size} offer{selectedOffers.size > 1 ? 's' : ''} will be deleted</p>
                                <p className="mt-1 text-xs opacity-80">This will permanently remove them from your catalog.</p>
                            </div>
                        </div>
                    )}
                    {bulkActionModal?.type === "status" && (
                        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-sm text-orange-700 flex items-start gap-3">
                            <div>
                                <p className="font-semibold">Status change for {selectedOffers.size} offer{selectedOffers.size > 1 ? 's' : ''}</p>
                                <p className="mt-1 text-xs opacity-80">Offers will be {bulkActionModal.targetStatus === 'active' ? 'activated' : 'paused'} immediately.</p>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 justify-end flex-wrap">
                        <PremiumButton variant="outline" onClick={() => setBulkActionModal(null)} className="rounded-xl">Cancel</PremiumButton>
                        {bulkActionModal?.type === "delete" && (
                            <PremiumButton onClick={handleBulkDelete} className="rounded-xl px-6 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 border-0">
                                <Trash2 className="w-4 h-4 mr-2" />Delete Selected
                            </PremiumButton>
                        )}
                        {bulkActionModal?.type === "status" && (
                            <PremiumButton onClick={() => bulkActionModal.targetStatus && handleBulkToggleStatus(bulkActionModal.targetStatus)} className="rounded-xl px-6 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 border-0">
                                Update Status
                            </PremiumButton>
                        )}
                    </div>
                </div>
            </AppModal>
        </main>
    );
}

export default function ShopOffersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50/50 pt-24 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <ShopOffersContent />
        </Suspense>
    );
}
