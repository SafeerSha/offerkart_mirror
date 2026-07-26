"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, Eye, Clock, Pencil, Trash2, GitBranch, Calendar, Plus, ArrowRight } from "@/lib/icons";
import { PremiumButton, StatusToggleButton } from "@/components/shared";
import { getRelativeTime } from "@/lib/utils";
import { SwipeableCard } from "./SwipeableCard";

interface OffersTabProps {
    isLoadingOffers: boolean;
    publishedOffers: any[];
    totalOffersCount?: number;
    openEditModal: (offer: any) => void;
    setOfferToDelete: (offer: any) => void;
    handleToggleOfferStatus: (offer: any) => void;
    setPreviewLogo: (preview: { src: string; name: string } | null) => void;
    onAddOffer?: () => void;
}

export function OffersTab({
    isLoadingOffers,
    publishedOffers,
    totalOffersCount,
    openEditModal,
    setOfferToDelete,
    handleToggleOfferStatus,
    setPreviewLogo,
    onAddOffer,
}: OffersTabProps) {
    const router = useRouter();

    if (isLoadingOffers) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="relative rounded-2xl bg-white border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 animate-pulse">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                            <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl shrink-0" />
                            <div className="min-w-0 flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-1/2 rounded-md" />
                                    <Skeleton className="h-4 w-16 rounded-full" />
                                </div>
                                <div className="flex gap-3">
                                    <Skeleton className="h-3 w-24 rounded" />
                                    <Skeleton className="h-3 w-20 rounded" />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 shrink-0 w-full sm:w-auto">
                            <div className="flex flex-col items-center sm:items-end w-full sm:w-auto space-y-2">
                                <Skeleton className="h-2 w-20" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="flex flex-row sm:flex-col items-center gap-3 w-full sm:w-auto justify-between sm:justify-center px-4 sm:px-0 sm:pl-8 border-l-0 sm:border-l border-gray-100">
                                <Skeleton className="h-4 w-12" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-10 w-10 rounded-xl" />
                                    <Skeleton className="h-10 w-10 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
                {publishedOffers.length > 0 ? (
                    publishedOffers.slice(0, 8).map((offer, idx) => {
                        const id = offer.offerId || offer.batchId || idx;
                        const offerImage = offer.posters?.[0]?.posterSrc || offer.posterSrc;
                        return (
                            <SwipeableCard
                                key={id}
                                onEdit={() => (offer.isDraft && offer.type === "BUILDER") ? router.push(`/shop-manager/poster-designer?draftId=${offer.batchId || offer.id}`) : openEditModal(offer)}
                                onDelete={() => setOfferToDelete(offer)}
                                editTitle="Edit offer"
                                deleteTitle="Delete offer"
                            >
                                <div className="group relative flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-white hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
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
                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-primary/5 group-hover/img:from-orange-500/15 group-hover/img:via-amber-500/10 transition-all duration-300">
                                                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/80 shadow-[0_4px_12px_rgba(249,115,22,0.08)] border border-orange-100/50 group-hover/img:scale-110 group-hover/img:shadow-[0_6px_16px_rgba(249,115,22,0.12)] transition-all duration-300">
                                                    <Tag className="w-4.5 h-4.5 text-orange-500/85 group-hover:text-primary transition-colors rotate-12 group-hover/img:rotate-0 transition-transform duration-300" />
                                                </div>
                                            </div>
                                        )}
                                        {offer.isDraft && (
                                            <div className="absolute top-1 left-1">
                                                <div className="px-1 py-0.5 rounded backdrop-blur-sm shadow-sm border bg-amber-100/90 border-amber-200">
                                                    <p className="text-[8px] font-black uppercase tracking-tighter text-amber-600">
                                                        Draft
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1 z-10 flex flex-col justify-center self-stretch py-0.5">
                                        <h4 className="font-bold text-xs text-gray-900 truncate group-hover:text-primary transition-colors leading-tight">
                                            {offer.title || "Untitled Offer"}
                                        </h4>

                                        <div className="flex items-center gap-1.5 mt-0.5 min-w-0 pr-2">
                                            <div className="text-[9px] font-bold text-orange-500 uppercase tracking-widest leading-none truncate">
                                                {offer.type ? `${offer.type}` : ''}
                                            </div>
                                            {(() => {
                                                if (!offer.validTo) return null;
                                                const expiryDate = new Date(offer.validTo);
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                if (expiryDate < today) {
                                                    return (
                                                        <span className="bg-rose-50 text-rose-600 border border-rose-200 px-0.5 py-0.5 rounded font-bold text-[7px] tracking-wider shrink-0">
                                                            Expired
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>

                                        {(offer.validFrom || offer.validTo || (offer.branches && offer.branches.length > 0) || offer.branchNames || offer.branchName) && (
                                            <div className="flex flex-wrap items-center gap-1 text-[8px] text-gray-500 mt-1">
                                                {(offer.validFrom || offer.validTo) && (
                                                    <span className="bg-gray-50 border border-gray-100/80 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                                                        <Calendar className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                                        <span>
                                                            {offer.validFrom ? new Date(offer.validFrom).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : "n/a"}{offer.validTo ? ` - ${new Date(offer.validTo).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}` : ""}
                                                        </span>
                                                    </span>
                                                )}
                                                {((offer.branches && offer.branches.length > 0) || offer.branchNames || offer.branchName) && (
                                                    <span className="bg-primary/5 text-primary border border-primary/10 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                                        <GitBranch className="w-2.5 h-2.5 shrink-0" />
                                                        <span className="truncate max-w-[90px]">
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
                                        <div className="flex items-center gap-1">
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
                                        </div>

                                        <div className="flex items-baseline gap-1 my-1 text-[8px] font-semibold text-slate-400">
                                            <Clock className="w-2.5 h-2.5 shrink-0" />
                                            <span>{getRelativeTime(offer.createdAt || offer.validFrom) ? getRelativeTime(offer.createdAt || offer.validFrom) : "Active"}</span>
                                        </div>

                                        <div className="hidden sm:flex flex-row gap-1 items-center">
                                            <button onClick={() => openEditModal(offer)} className="flex items-center justify-center p-1.5 rounded-lg bg-white border border-gray-100 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm" title="Edit offer"><Pencil className="w-3 h-3" /></button>
                                            <button onClick={() => setOfferToDelete(offer)} className="flex items-center justify-center p-1.5 rounded-lg bg-white border border-gray-100 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm" title="Delete offer"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                </div>
                            </SwipeableCard>
                        );
                    })
                ) : (
                    <div className="col-span-full p-6 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                            <Tag className="w-8 h-8 text-primary/20" />
                        </div>
                        <p className="text-base font-bold text-gray-900">Your Campaign Catalog is Empty</p>
                        <p className="text-sm text-gray-500 max-w-xs mt-1 mb-4">Start publishing offers to showcase them to your customers.</p>
                        <PremiumButton onClick={onAddOffer} className="rounded-xl shadow-lg shadow-primary/20">
                            Add Offer
                            <Plus className="w-4 h-4" />
                        </PremiumButton>
                    </div>
                )}
            </div>

            {publishedOffers.length > 0 && (
                <div className="flex justify-center pt-2 pb-2 border-t border-gray-50">
                    <Link href="/shop-manager/offers" className="w-full sm:w-auto">
                        <PremiumButton
                            variant="outline"
                            glow={false}
                            className="w-full sm:w-auto rounded-xl py-1 px-6 border-primary/10 hover:border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary gap-1.5 shadow-none cursor-pointer text-xs font-bold uppercase tracking-wider"
                        >
                            <span>View All ({typeof totalOffersCount === "number" ? totalOffersCount : publishedOffers.length})</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                        </PremiumButton>
                    </Link>
                </div>
            )}
        </>
    );
}
