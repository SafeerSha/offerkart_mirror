"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { ShoppingBag, Eye, Pencil, Trash2, GitBranch, Calendar, Plus, ArrowRight } from "@/lib/icons";
import { PremiumButton, StatusToggleButton } from "@/components/shared";
import { SwipeableCard } from "./SwipeableCard";

interface ProductsTabProps {
    isLoadingProducts: boolean;
    products: any[];
    branchNameMap: Record<string, string>;
    handleEditProduct: (product: any) => void;
    setProductToDelete: (product: any) => void;
    handleToggleProductStatus: (product: any) => void;
    setPreviewLogo: (preview: { src: string; name: string } | null) => void;
}

export function ProductsTab({
    isLoadingProducts,
    products,
    branchNameMap,
    handleEditProduct,
    setProductToDelete,
    handleToggleProductStatus,
    setPreviewLogo,
}: ProductsTabProps) {
    const router = useRouter();

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
                {isLoadingProducts ? (
                    <>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100 animate-pulse">
                                <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-2 w-16" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-5 w-20" />
                                </div>
                            </div>
                        ))}
                    </>
                ) : products && products.length > 0 ? (
                    products.slice(0, 15).map((product) => (
                        <SwipeableCard
                            key={product.id}
                            onEdit={() => handleEditProduct(product)}
                            onDelete={() => setProductToDelete(product)}
                            editTitle="Edit product"
                            deleteTitle="Delete product"
                        >
                            <div className="group relative flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-white hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden">

                                <div
                                    className={`group/img relative w-16 h-16 rounded-lg bg-white overflow-hidden shrink-0 border border-gray-100 shadow-sm z-10 transition-all duration-300 ${product.image ? 'cursor-pointer active:scale-95' : ''}`}
                                    onClick={(e) => {
                                        if (product.image) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setPreviewLogo({ src: product.image, name: product.name });
                                        }
                                    }}
                                    title={product.image ? "View large image" : undefined}
                                >
                                    {product.image ? (
                                        <>
                                            <Image src={product.image} alt={product.name} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[1px]">
                                                <div className="bg-white/90 p-1.5 rounded-full shadow-lg scale-75 group-hover/img:scale-100 transition-transform duration-300">
                                                    <Eye className="w-4 h-4 text-primary" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-primary/5 group-hover/img:from-orange-500/15 group-hover/img:via-amber-500/10 transition-all duration-300">
                                            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/80 shadow-[0_4px_12px_rgba(249,115,22,0.08)] border border-orange-100/50 group-hover/img:scale-110 group-hover/img:shadow-[0_6px_16px_rgba(249,115,22,0.12)] transition-all duration-300">
                                                <ShoppingBag className="w-4.5 h-4.5 text-orange-500/85 group-hover:text-primary transition-colors group-hover/img:scale-110 transition-transform duration-300" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1 z-10 flex flex-col justify-center self-stretch py-0.5">
                                    <h4 className="font-bold text-xs text-gray-900 truncate group-hover:text-primary transition-colors leading-tight">
                                        {product.name}
                                    </h4>

                                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0 pr-2">
                                        <div className="text-[9px] font-bold text-orange-500 uppercase tracking-widest leading-none truncate">
                                            {product.category}
                                        </div>
                                    </div>

                                    {(product.validFrom || (product.branchIds && product.branchIds.length > 0)) && (
                                        <div className="flex flex-wrap items-center gap-1 text-[8px] text-gray-500 mt-1">
                                            {product.validFrom && (
                                                <span className="bg-gray-50 border border-gray-100/80 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                                                    <Calendar className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                                    <span>
                                                        {new Date(product.validFrom).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}{product.validTo ? ` - ${new Date(product.validTo).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}` : " onwards"}
                                                    </span>
                                                </span>
                                            )}
                                            {product.branchIds && product.branchIds.length > 0 && (
                                                product.branchIds.length === 1 ? (
                                                    <span className="bg-primary/5 text-primary border border-primary/10 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                                        <GitBranch className="w-2.5 h-2.5 shrink-0" />
                                                        <span className="truncate max-w-[90px]">
                                                            {branchNameMap[String(product.branchIds[0])] || `Branch ${product.branchIds[0]}`}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <TooltipProvider delayDuration={100}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="bg-primary/5 text-primary border border-primary/10 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 cursor-pointer">
                                                                    <GitBranch className="w-2.5 h-2.5 shrink-0" />
                                                                    <span>{product.branchIds.length} branches</span>
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="bg-white p-2 rounded-xl shadow-xl border border-gray-100 z-[100] max-w-[200px]">
                                                                <div className="space-y-1">
                                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b pb-1 mb-1 border-gray-50">Active Branches</p>
                                                                    {product.branchIds.map((bid: any, idx: number) => (
                                                                        <p key={idx} className="text-[11px] font-semibold text-gray-700 truncate">
                                                                            • {branchNameMap[String(bid)] || `Branch ${bid}`}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="relative z-20 flex flex-col items-end justify-between self-stretch shrink-0 py-0.5">
                                    <div className="flex items-center gap-1">
                                        <div className="scale-75 origin-right">
                                            <StatusToggleButton
                                                status={product.status || 'active'}
                                                onChange={() => handleToggleProductStatus(product)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-baseline gap-1 my-1">
                                        <span className="text-xs font-black text-gray-900 tracking-tighter leading-none">
                                            ₹{product.price}
                                        </span>
                                        {!!product.originalPrice && (
                                            <span className="text-[9px] text-red-500 line-through font-medium">
                                                ₹{product.originalPrice}
                                            </span>
                                        )}
                                    </div>

                                    <div className="hidden sm:flex flex-row gap-1 items-center">
                                        <button onClick={() => handleEditProduct(product)} className="flex items-center justify-center p-1.5 rounded-lg bg-white border border-gray-100 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm" title="Edit product"><Pencil className="w-3 h-3" /></button>
                                        <button onClick={() => setProductToDelete(product)} className="flex items-center justify-center p-1.5 rounded-lg bg-white border border-gray-100 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm" title="Delete product"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            </div>
                        </SwipeableCard>
                    ))
                ) : (
                    <div className="col-span-full p-6 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 text-center"><div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4"><ShoppingBag className="w-8 h-8 text-primary/20" /></div><p className="text-base font-bold text-gray-900">Your Catalog is Empty</p><p className="text-sm text-gray-500 max-w-xs mt-1 mb-4">Start adding products to showcase them to your customers.</p><PremiumButton onClick={() => router.push("/shop-manager/products/add")} className="rounded-xl shadow-lg shadow-primary/20">Add Product<Plus className="w-4 h-4" /></PremiumButton></div>
                )}
            </div>

            {products && products.length > 0 && (
                <div className="flex justify-center pt-2 pb-2 border-t border-gray-50">
                    <Link href="/shop-manager/products" className="w-full sm:w-auto">
                        <PremiumButton
                            variant="outline"
                            glow={false}
                            className="w-full sm:w-auto rounded-xl py-1 px-6 border-primary/10 hover:border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary gap-1.5 shadow-none cursor-pointer text-xs font-bold uppercase tracking-wider"
                        >
                            <span>View All ({products.length})</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                        </PremiumButton>
                    </Link>
                </div>
            )}
        </>
    );
}
