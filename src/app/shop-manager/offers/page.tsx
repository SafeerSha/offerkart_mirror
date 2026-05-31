"use client";

import { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

// UI Components
import {
    Heading, Text, PremiumCard, PremiumButton, AppModal, StatusToggleButton
} from "@/components/shared";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

// Icons
import {
    Clock, Eye, Package, Plus, Search, Tag, Trash2, Calendar,
    Pencil, ArrowLeft, GitBranch, ShoppingBag, Loader2, ArrowRight, AlertTriangle
} from "@/lib/icons";

// Hooks
import {
    useMyShops, useBranches, useAllOffers, useDeleteOffer, useToggleOfferStatus, useIsMobile
} from "@/hooks";
import { cn, getRelativeTime } from "@/lib/utils";

// SwipeableCard helper identical to main dashboard for UI consistency
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

        // If swiped left more than 50px, reveal actions
        if (diff > 50) {
            setIsSwiped(true);
        }
        // If swiped right more than 30px, hide actions
        else if (diff < -30) {
            setIsSwiped(false);
        }

        setStartX(null);
        setCurrentX(null);
    };

    // Auto-close actions if user taps on the card content when swiped
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
            {/* Slideable Card Content */}
            <div
                onClick={handleContentClick}
                className={cn(
                    "transition-transform duration-300 ease-out select-none w-full relative z-10",
                    isSwiped ? "-translate-x-[110px]" : "translate-x-0"
                )}
            >
                {children}
            </div>

            {/* Hidden Action Panel behind the card (revealed on swipe left) */}
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

    // Filters state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "drafted">("all");
    const [offerToDelete, setOfferToDelete] = useState<any | null>(null);
    const [previewLogo, setPreviewLogo] = useState<{ src: string; name: string } | null>(null);

    // ================= API DATA HOOKS =================
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

    // Force React Query to fetch fresh data on mount
    useEffect(() => {
        queryClient.invalidateQueries({ queryKey: ["allOffers"] });
    }, [queryClient]);

    // Mutations
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
                const res = await deleteOfferMutation({ id: String(idToUse), shopId: activeShopId });
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

    // Filtered offers
    const filteredOffers = useMemo(() => {
        return allOffersList.filter((offer: any) => {
            const query = searchQuery.toLowerCase().trim();
            let matchesSearch = true;
            
            if (query) {
                const matchesTitle = (offer.title || "").toLowerCase().includes(query);
                const matchesType = (offer.type || "").toLowerCase().includes(query);
                const matchesCategory = (offer.category || "").toLowerCase().includes(query);

                // Match Branch
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

                // Match Dates (e.g., "30/05", "May", "June")
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

                // Match Price or discount value
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
        <main className="min-h-screen pt-28 lg:pt-32 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4 max-w-6xl">
                <Breadcrumbs
                    items={[
                        { label: "Dashboard", href: "/shop-manager" },
                        { label: "Manage Campaigns" }
                    ]}
                />


                {/* Ultra-Minimal, Space-Efficient & Highly Responsive Filters Panel with Thin Border */}
                <div className="mb-5 mt-4 p-1.5 rounded-xl border border-gray-100 bg-white/50 backdrop-blur-sm flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between shadow-sm">
                    {/* Left: Search and Segmented Control */}
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center flex-1 max-w-2xl">
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                            {/* Minimalist Search capsule */}
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

                            {/* Mobile-only Add Button (Circle) next to search bar to save vertical space */}
                            <Link href="/shop-manager/create-offer" className="flex sm:hidden shrink-0">
                                <button
                                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg w-8 h-8 flex items-center justify-center shadow-sm shadow-orange-500/10 active:scale-95 transition-all cursor-pointer border-0 shrink-0"
                                    title="Add Offer"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>

                        {/* Flat segmented filter tabs */}
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

                    {/* Desktop/Tablet-only Add Button (Pill) */}
                    <Link href="/shop-manager/create-offer" className="hidden sm:flex shrink-0">
                        <button
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-7 px-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm shadow-orange-500/10 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border-0 shrink-0 self-start sm:self-auto"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Offer
                        </button>
                    </Link>
                </div>

                {/* Offers Listing */}
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
                ) : filteredOffers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredOffers.map((offer: any, idx: number) => {
                            const id = offer.offerId || offer.batchId || idx;
                            const offerImage = offer.posters?.[0]?.posterSrc || offer.posterSrc;
                            return (
                                <SwipeableCard
                                    key={id}
                                    onEdit={() => (offer.isDraft && offer.type === "BUILDER") ? router.push(`/shop-manager/poster-designer?draftId=${offer.batchId || offer.id}`) : openEditModal(offer)}
                                    onDelete={() => setOfferToDelete(offer)}
                                    editTitle="Edit"
                                    deleteTitle="Delete"
                                >
                                    <div className="group relative flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden shadow-sm">
                                        <div
                                            className={`group/img relative w-16 h-16 rounded-lg bg-white overflow-hidden shrink-0 border border-gray-100 shadow-sm z-10 transition-all duration-300 ${offerImage ? 'cursor-pointer active:scale-95' : ''}`}
                                            onClick={(e) => {
                                                if (offerImage) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setPreviewLogo({ src: offerImage, name: offer.title || "Offer Preview" });
                                                }
                                            }}
                                            title={offerImage ? "View large poster" : undefined}
                                        >
                                            {offerImage ? (
                                                <>
                                                    <Image src={offerImage} alt={offer.title || "Offer"} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[1px]">
                                                        <div className="bg-white/90 p-1.5 rounded-full shadow-lg scale-75 group-hover/img:scale-100 transition-transform duration-300">
                                                            <Eye className="w-4 h-4 text-primary" />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                                    <Tag className="w-8 h-8 text-gray-300 group-hover:text-primary transition-colors rotate-12" />
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
                                            <div className="scale-75 origin-right">
                                                <StatusToggleButton
                                                    status={offer.status || 'active'}
                                                    onChange={() => handleToggleOfferStatus(offer)}
                                                />
                                            </div>

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
            </div>

            {/* DELETE MODAL */}
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

            {/* IMAGE PREVIEW MODAL */}
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
        </main>
    );
}

export default function ShopOffersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50/50 pt-28 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <ShopOffersContent />
        </Suspense>
    );
}
