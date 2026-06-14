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
import { ProductModal } from "@/components/shop-manager/ProductModal";

import {
    Clock, Eye, Package, Plus, Search, Tag, Trash2, Calendar,
    Pencil, ArrowLeft, GitBranch, ShoppingBag, Loader2, ArrowRight, AlertTriangle
} from "@/lib/icons";

import { queryKeys } from "@/hooks/useApi";
import {
    useMyShops, useBranches, useAllProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useToggleOfferProductStatus, useIsMobile
} from "@/hooks";
import { cn, getRelativeTime } from "@/lib/utils";
import { Product } from "@/lib/types";

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

function ShopProductsContent() {
    const { data: session } = useSession();
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "drafted">("all");

    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [productToEdit, setProductToEdit] = useState<any | null>(null);
    const [productToDelete, setProductToDelete] = useState<any | null>(null);
    const [previewLogo, setPreviewLogo] = useState<{ src: string; name: string } | null>(null);

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

    const { data: productsData, isLoading: isLoadingProducts } = useAllProducts(activeShopId || undefined);
    const allProductsList = useMemo(() => {
        return (productsData || []) as Product[];
    }, [productsData]);

    const products = useMemo(() => {
        return allProductsList.filter((p: any) => !p.isDraft);
    }, [allProductsList]);

    const { data: branchesResponse } = useBranches(activeShopId || "");
    const branches = useMemo(() => {
        if (!branchesResponse?.success || !branchesResponse?.data) return [];
        const result = branchesResponse.data as any;
        return Array.isArray(result) ? result : (result.data || []);
    }, [branchesResponse]);

    const branchNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        branches.forEach((b: any) => {
            if (b.id) {
                map[String(b.id)] = b.name || b.address || `Branch ${b.id}`;
            }
        });
        return map;
    }, [branches]);

    useEffect(() => {
        if (!activeShopId) return;
        queryClient.invalidateQueries({ queryKey: queryKeys.allProducts(activeShopId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.branches(activeShopId) });
    }, [activeShopId, queryClient]);

    const { mutateAsync: createProductMutation } = useCreateProduct();
    const { mutateAsync: updateProductMutation } = useUpdateProduct();
    const { mutateAsync: deleteProductMutation } = useDeleteProduct();
    const { mutateAsync: toggleProductStatusMutation } = useToggleOfferProductStatus();

    const handleCreateProduct = async (payload: any) => {
        try {
            const res = await createProductMutation({ payload, shopId: activeShopId || undefined });
            if (res.success) {
                toast.success("Product created successfully");
                setShowAddProductModal(false);
            } else {
                throw new Error("Failed to create product");
            }
        } catch (err: any) {
            console.error("Create product error:", err);
            toast.error(`Failed to create product: ${err.message}`);
        }
    };

    const handleEditProduct = (product: any) => {
        setProductToEdit({
            id: product.id,
            name: product.name || product.displayName || "",
            categoryId: product.categoryId || null,
            parentCategoryId: product.parentCategoryId ?? null,
            subcategoryId: product.subcategoryId ?? null,
            categoryObject: product.categoryObject ?? null,
            category: product.category || null,
            price: product.price ?? product.offerPrice ?? "",
            originalPrice: product.originalPrice ?? "",
            image: product.image || product.imageUrl || null,
            description: product.description || product.displayDescription || "",
            validFrom: product.validFrom ?? null,
            validTo: product.validTo ?? null,
            branchIds: product.branchIds || [],
            status: product.status || (product.isActive ? "active" : "inactive"),
            isHighlighted: product.isHighlighted,
        });
    };

    const handleUpdateProduct = async (payload: any) => {
        try {
            if (!productToEdit) return;
            const res = await updateProductMutation({
                id: productToEdit.id,
                payload,
                shopId: activeShopId || undefined
            });
            if (res.success) {
                toast.success("Product updated successfully");
                setProductToEdit(null);
            } else {
                throw new Error("Failed to update product");
            }
        } catch (err: any) {
            console.error("Update product error:", err);
            toast.error(`Failed to update product: ${err.message}`);
        }
    };

    const handleDeleteProduct = async (product: any) => {
        try {
            const res = await deleteProductMutation({ id: product.id, shopId: activeShopId || undefined });
            if (res.success) {
                toast.success("Product deleted successfully");
            } else {
                throw new Error("Failed to delete product");
            }
        } catch (err: any) {
            console.error("Delete product error:", err);
            toast.error(`Failed to delete product: ${err.message}`);
        } finally {
            setProductToDelete(null);
        }
    };

    const handleToggleProductStatus = async (product: any) => {
        try {
            const res = await toggleProductStatusMutation({ id: product.id, shopId: activeShopId || undefined });
            if (res.success) {
                toast.success(`Product ${product.status === 'active' ? 'paused' : 'activated'} successfully`);
            } else {
                throw new Error("Failed to toggle product status");
            }
        } catch (err: any) {
            console.error("Toggle product status error:", err);
            toast.error(`Failed to update product status: ${err.message}`);
        }
    };

    const filteredProducts = useMemo(() => {
        return allProductsList.filter((product: any) => {
            const query = searchQuery.toLowerCase().trim();
            let matchesSearch = true;

            if (query) {
                const matchesName = (product.name || "").toLowerCase().includes(query);
                const matchesCategory = (product.category || "").toLowerCase().includes(query);

                let matchesBranch = false;
                if (product.branchIds && Array.isArray(product.branchIds)) {
                    matchesBranch = product.branchIds.some((id: any) => {
                        const branchName = branchNameMap[String(id)];
                        return branchName && branchName.toLowerCase().includes(query);
                    });
                }

                let matchesDate = false;
                if (product.validFrom) {
                    const dateStr = new Date(product.validFrom).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const dateLong = new Date(product.validFrom).toLocaleDateString('en-US', { month: 'long', day: '2-digit' }).toLowerCase();
                    matchesDate = matchesDate || dateStr.includes(query) || dateLong.includes(query);
                }
                if (product.validTo) {
                    const dateStr = new Date(product.validTo).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const dateLong = new Date(product.validTo).toLocaleDateString('en-US', { month: 'long', day: '2-digit' }).toLowerCase();
                    matchesDate = matchesDate || dateStr.includes(query) || dateLong.includes(query);
                }

                let matchesPrice = false;
                if (product.price !== undefined && product.price !== null) {
                    matchesPrice = matchesPrice || String(product.price).includes(query) || `₹${product.price}`.toLowerCase().includes(query) || `rs ${product.price}`.toLowerCase().includes(query) || `rs. ${product.price}`.toLowerCase().includes(query);
                }
                if (product.originalPrice !== undefined && product.originalPrice !== null) {
                    matchesPrice = matchesPrice || String(product.originalPrice).includes(query) || `₹${product.originalPrice}`.toLowerCase().includes(query);
                }

                matchesSearch = matchesName || matchesCategory || matchesBranch || matchesDate || matchesPrice;
            }

            const matchesStatus = statusFilter === "all"
                ? !product.isDraft
                : statusFilter === "active"
                ? (!product.isDraft && product.status === "active")
                : statusFilter === "paused"
                ? (!product.isDraft && product.status === "inactive")
                : statusFilter === "drafted"
                ? product.isDraft
                : true;

            return matchesSearch && matchesStatus;
        });
    }, [allProductsList, searchQuery, statusFilter, branchNameMap]);

    return (
        <main className="min-h-screen pt-28 lg:pt-32 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4 max-w-6xl">
                <Breadcrumbs
                    items={[
                        { label: "Dashboard", href: "/shop-manager" },
                        { label: "Manage Products" }
                    ]}
                />

                <div className="mb-5 mt-4 p-1.5 rounded-xl border border-gray-100 bg-white/50 backdrop-blur-sm flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center flex-1 max-w-2xl">
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                            <div className="relative flex-1 sm:w-56 sm:flex-none flex items-center bg-gray-50 rounded-lg px-2 py-1 focus-within:bg-gray-100/80 transition-all border border-transparent focus-within:border-gray-200">
                                <Search className="w-3 h-3 text-gray-400 shrink-0 mr-1.5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="bg-transparent w-full text-xs font-semibold text-gray-700 outline-none placeholder-gray-400/80 h-6"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer border-0 bg-transparent px-1">×</button>
                                )}
                            </div>

                            <button
                                onClick={() => setShowAddProductModal(true)}
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg w-8 h-8 flex sm:hidden items-center justify-center shadow-sm shadow-orange-500/10 active:scale-95 transition-all cursor-pointer border-0 shrink-0"
                                title="Add Product"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
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

                    <button
                        onClick={() => setShowAddProductModal(true)}
                        className="hidden sm:flex bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-7 px-3 text-[10px] font-bold uppercase tracking-wider items-center justify-center gap-1 shadow-sm shadow-orange-500/10 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border-0 shrink-0 self-start sm:self-auto"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Product
                    </button>
                </div>

                {isLoadingProducts ? (
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
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProducts.map((product: any) => {
                            const id = product.id;
                            const productImage = product.image || product.imageUrl;
                            return (
                                <SwipeableCard
                                    key={id}
                                    onEdit={() => handleEditProduct(product)}
                                    onDelete={() => setProductToDelete(product)}
                                    editTitle="Edit"
                                    deleteTitle="Delete"
                                >
                                    <div className="group relative flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden shadow-sm">
                                        <div
                                            className={`group/img relative w-16 h-16 rounded-lg bg-white overflow-hidden shrink-0 border border-gray-100 shadow-sm z-10 transition-all duration-300 ${productImage ? 'cursor-pointer active:scale-95' : ''}`}
                                            onClick={(e) => {
                                                if (productImage) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setPreviewLogo({ src: productImage, name: product.name || "Product Preview" });
                                                }
                                            }}
                                            title={productImage ? "View large image" : undefined}
                                        >
                                            {productImage ? (
                                                <>
                                                    <Image src={productImage} alt={product.name} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[1px]">
                                                        <div className="bg-white/90 p-1.5 rounded-full shadow-lg scale-75 group-hover/img:scale-100 transition-transform duration-300">
                                                            <Eye className="w-4 h-4 text-primary" />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                                    <ShoppingBag className="w-8 h-8 text-gray-300 group-hover:text-primary transition-colors" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1 z-10 flex flex-col justify-center gap-1 self-stretch py-0.5">
                                            <div>
                                                <h4 className="font-black text-sm text-gray-900 truncate group-hover:text-primary transition-colors leading-tight">
                                                    {product.name || "Untitled Product"}
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none">
                                                        {product.category || "General"}
                                                    </span>
                                                    {product.isDraft && (
                                                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.2 rounded font-bold text-[8px] uppercase tracking-wider scale-90 origin-left shrink-0">
                                                            Draft
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {(product.validFrom || (product.branchIds && product.branchIds.length > 0)) && (
                                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                    {product.validFrom && (
                                                        <span className="bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold text-[9px] uppercase tracking-wide">
                                                            <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                                                            <span>
                                                                {new Date(product.validFrom).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}{product.validTo ? ` - ${new Date(product.validTo).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}` : " onwards"}
                                                            </span>
                                                        </span>
                                                    )}
                                                    {product.branchIds && product.branchIds.length > 0 && (
                                                        <span className="bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wide flex items-center gap-1">
                                                            <GitBranch className="w-3 h-3 shrink-0" />
                                                            <span className="truncate max-w-[120px]">
                                                                {product.branchIds.length > 1 ? `${product.branchIds.length} branches` : (branchNameMap[String(product.branchIds[0])] || `Branch ${product.branchIds[0]}`)}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative z-20 flex flex-col items-end justify-between self-stretch shrink-0 py-0.5">
                                            <div className="scale-75 origin-right">
                                                <StatusToggleButton
                                                    status={product.status || 'active'}
                                                    onChange={() => handleToggleProductStatus(product)}
                                                />
                                            </div>

                                            <div className="flex items-baseline gap-1 my-1">
                                                <span className="text-sm font-black text-gray-900 tracking-tighter leading-none">
                                                    ₹{product.price}
                                                </span>
                                                {product.originalPrice && (
                                                    <span className="text-[10px] text-red-500 line-through font-medium">
                                                        ₹{product.originalPrice}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="hidden sm:flex flex-row gap-1 items-center">
                                                <button onClick={() => handleEditProduct(product)} className="flex items-center justify-center p-2 rounded-xl bg-white border border-gray-100 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm cursor-pointer" title="Edit product"><Pencil className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => setProductToDelete(product)} className="flex items-center justify-center p-2 rounded-xl bg-white border border-gray-100 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm cursor-pointer" title="Delete product"><Trash2 className="w-3.5 h-3.5" /></button>
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
                            <Package className="w-8 h-8 text-primary/20" />
                        </div>
                        <p className="text-lg font-black text-gray-900">
                            {searchQuery ? (
                                "No matching products"
                            ) : statusFilter === "active" ? (
                                "No active products"
                            ) : statusFilter === "paused" ? (
                                "No paused products"
                            ) : statusFilter === "drafted" ? (
                                "No drafted products"
                            ) : (
                                "No products found"
                            )}
                        </p>
                        <p className="text-xs text-gray-500 max-w-xs mt-1 mb-6">
                            {searchQuery ? (
                                "Try adjusting your search terms or filters to find your product."
                            ) : statusFilter === "active" ? (
                                products.length > 0
                                    ? "All of your products are currently paused."
                                    : "Your product catalog is empty."
                            ) : statusFilter === "paused" ? (
                                products.length > 0
                                    ? "All of your products are active and live."
                                    : "Your product catalog is empty."
                            ) : statusFilter === "drafted" ? (
                                "You don't have any drafted products at the moment."
                            ) : (
                                "Your product catalog is empty. Let's add your first product now!"
                            )}
                        </p>
                        {allProductsList.length === 0 && (
                            <PremiumButton onClick={() => setShowAddProductModal(true)} className="rounded-xl shadow-lg shadow-primary/20 border-0 cursor-pointer">
                                Add Product
                            </PremiumButton>
                        )}
                    </div>
                )}
            </div>

            {showAddProductModal && (
                <ProductModal
                    open={showAddProductModal}
                    onOpenChange={setShowAddProductModal}
                    product={null}
                    onSubmit={handleCreateProduct}
                />
            )}

            {productToEdit && (
                <ProductModal
                    open={!!productToEdit}
                    onOpenChange={(open) => !open && setProductToEdit(null)}
                    product={productToEdit}
                    onSubmit={handleUpdateProduct}
                />
            )}

            <AppModal
                open={!!productToDelete}
                onOpenChange={(open) => { if (!open) setProductToDelete(null); }}
                title="Delete Product"
                description="Are you sure you want to delete this product? This action cannot be undone."
            >
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-sm text-orange-700 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">"{productToDelete?.name || 'Untitled'}"</p>
                            <p className="mt-1 text-xs opacity-80">This will permanently remove this product from your catalog.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end flex-wrap">
                        <PremiumButton variant="outline" onClick={() => setProductToDelete(null)} className="rounded-xl">Cancel</PremiumButton>
                        <PremiumButton onClick={() => productToDelete && handleDeleteProduct(productToDelete)} className="rounded-xl px-6 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 border-0">
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
        </main>
    );
}

export default function ShopProductsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50/50 pt-28 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <ShopProductsContent />
        </Suspense>
    );
}
