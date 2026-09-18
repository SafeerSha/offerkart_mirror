"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Tag, ShoppingBag, Pencil, Trash2 } from "@/lib/icons";
import { formatOfferType } from "@/lib/common";
import { SwipeableCard } from "./SwipeableCard";

interface DraftsTabProps {
    allDrafts: any[];
    openEditModal: (draft: any) => void;
    handleEditProduct: (draft: any) => void;
    setOfferToDelete: (draft: any) => void;
    setProductToDelete: (draft: any) => void;
}

export function DraftsTab({
    allDrafts,
    openEditModal,
    handleEditProduct,
    setOfferToDelete,
    setProductToDelete,
}: DraftsTabProps) {
    const router = useRouter();

    if (allDrafts.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-1">
            {allDrafts.map((draft, idx) => {
                const isOffer = draft._draftType === 'offer';
                const id = isOffer ? (draft.offerId || draft.batchId || idx) : draft.id;
                const image = isOffer ? (draft.posters?.[0]?.posterSrc || draft.posterSrc) : draft.image;
                const title = isOffer ? draft.title : draft.name;
                const badgeText = isOffer ? 'OFFER' : 'PRODUCT';
                const typeIcon = isOffer ? <Tag className="w-6 h-6 text-gray-300" /> : <ShoppingBag className="w-6 h-6 text-gray-300" />;

                return (
                    <SwipeableCard
                        key={`draft-${draft._draftType}-${id}`}
                        onEdit={() => {
                            if (isOffer) {
                                if (draft.type === "BUILDER") {
                                    if (draft.rawDesigner) {
                                        const rawData = typeof draft.rawDesigner === 'string' ? draft.rawDesigner : JSON.stringify(draft.rawDesigner);
                                        const dataToSave = rawData
                                            .replace(/&amp;quot;/g, '"')
                                            .replace(/&quot;/g, '"')
                                            .replace(/&#039;/g, "'")
                                            .replace(/&lt;/g, '<')
                                            .replace(/&gt;/g, '>')
                                            .replace(/&amp;/g, '&');
                                        localStorage.setItem('designer_draft_data', dataToSave);
                                    } else {
                                        localStorage.removeItem('designer_draft_data');
                                    }
                                    router.push(`/shop-manager/poster-designer?draftId=${draft.batchId || draft.offerId || draft.id}&fromLocalStorage=true`);
                                } else {
                                    openEditModal(draft);
                                }
                            } else {
                                handleEditProduct(draft);
                            }
                        }}
                        onDelete={() => isOffer ? setOfferToDelete(draft) : setProductToDelete(draft)}
                        editTitle={`Edit ${draft._draftType}`}
                        deleteTitle={`Delete ${draft._draftType}`}
                    >
                        <div className="group relative flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-white hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
                            <div className="relative w-16 h-16 rounded-lg bg-white overflow-hidden shrink-0 border border-gray-100 shadow-sm z-10 transition-all duration-300">
                                {image ? (
                                    <Image src={image} alt={title || ""} fill unoptimized className="object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                        {typeIcon}
                                    </div>
                                )}
                                <div className="absolute top-1 left-1"><div className="px-1 py-0.5 rounded bg-amber-100/90 backdrop-blur-sm shadow-sm border border-amber-200"><p className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">{badgeText}</p></div></div>
                            </div>
                            <div className="min-w-0 flex-1 z-10 flex flex-col justify-center self-stretch py-0.5">
                                <h4 className="font-bold text-xs text-gray-900 truncate">{title}</h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[10px] font-semibold text-primary tracking-wider">
                                        {isOffer ? `Offer Draft ${draft.type ? `• ${formatOfferType(draft.type)}` : ''}` : 'Product Draft'}
                                    </span>
                                </div>
                            </div>
                            <div className="relative z-20 flex flex-col items-end justify-between self-stretch shrink-0 py-0.5">
                                <div className="hidden sm:flex flex-row gap-1 items-center">
                                    <button onClick={() => {
                                        if (isOffer) {
                                            if (draft.type === "BUILDER") {
                                                if (draft.rawDesigner) {
                                                    const rawData = typeof draft.rawDesigner === 'string' ? draft.rawDesigner : JSON.stringify(draft.rawDesigner);
                                                    const dataToSave = rawData
                                                        .replace(/&amp;quot;/g, '"')
                                                        .replace(/&quot;/g, '"')
                                                        .replace(/&#039;/g, "'")
                                                        .replace(/&lt;/g, '<')
                                                        .replace(/&gt;/g, '>')
                                                        .replace(/&amp;/g, '&');
                                                    localStorage.setItem('designer_draft_data', dataToSave);
                                                } else {
                                                    localStorage.removeItem('designer_draft_data');
                                                }
                                                router.push(`/shop-manager/poster-designer?draftId=${draft.batchId || draft.offerId || draft.id}&fromLocalStorage=true`);
                                            } else {
                                                openEditModal(draft);
                                            }
                                        } else {
                                            handleEditProduct(draft);
                                        }
                                    }} className="flex items-center justify-center p-1.5 rounded-lg bg-white border border-gray-100 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm"><Pencil className="w-3 h-3" /></button>
                                    <button onClick={() => isOffer ? setOfferToDelete(draft) : setProductToDelete(draft)} className="flex items-center justify-center p-1.5 rounded-lg bg-white border border-gray-100 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                        </div>
                    </SwipeableCard>
                );
            })}
        </div>
    );
}
