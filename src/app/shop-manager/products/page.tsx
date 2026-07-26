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
    Pencil, ArrowLeft, GitBranch, ShoppingBag, Loader2, ArrowRight, AlertTriangle, Check, ListChecks, Play, Pause
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
    const router = useRouter();
    const { data: session } = useSession();
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "drafted" | "expired">("all");

    const [productToDelete, setProductToDelete] = useState<any | null>(null);
    const [previewLogo, setPreviewLogo] = useState<{ src: string; name: string } | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [bulkActionModal, setBulkActionModal] = useState<{ type: "delete" | "status" | null; targetStatus?: "active" | "inactive" } | null>(null);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [showNoBranchModal, setShowNoBranchModal] = useState(false);

    const isSelectMode = selectedProducts.size > 0;

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

    const [currentPage, setCurrentPage] = useState(1);
    const [accumulatedProducts, setAccumulatedProducts] = useState<any[]>([]);
    const observerTargetRef = useRef<HTMLDivElement | null>(null);
    const limit = 12;

    useEffect(() => {
        setCurrentPage(1);
        setAccumulatedProducts([]);
    }, [searchQuery, statusFilter, activeShopId]);

    const { data: productsData, isLoading: isLoadingProducts, isFetching: isFetchingProducts } = useAllProducts(
        activeShopId || undefined,
        { page: currentPage, limit, search: searchQuery || undefined, status: statusFilter !== "all" ? statusFilter : undefined }
    );

    const { hasMore, totalPages } = useMemo(() => {
        if (!productsData) {
            return { hasMore: false, totalPages: 1 };
        }
        const res = productsData as any;
        if (typeof res?.hasMore === "boolean") {
            return { hasMore: res.hasMore, totalPages: res.totalPages || (res.hasMore ? currentPage + 1 : currentPage) };
        }
        if (typeof res?.pagination?.totalPages === "number" && res.pagination.totalPages > 0) {
            return {
                hasMore: currentPage < res.pagination.totalPages,
                totalPages: res.pagination.totalPages
            };
        }
        if (typeof res?.totalPages === "number" && res.totalPages > 0) {
            return {
                hasMore: currentPage < res.totalPages,
                totalPages: res.totalPages
            };
        }
        const rawList = Array.isArray(res) ? res : (res.data || []);
        const count = res?.pagination?.totalRecords || res?.pagination?.count || res?.count || res?.total;
        if (typeof count === "number" && count > 0) {
            const pages = Math.ceil(count / limit);
            return { hasMore: currentPage < pages, totalPages: pages };
        }
        const calculatedHasMore = rawList.length >= limit;
        return { hasMore: calculatedHasMore, totalPages: calculatedHasMore ? currentPage + 1 : currentPage };
    }, [productsData, currentPage, limit]);

    useEffect(() => {
        if (!productsData) return;
        const res = productsData as any;
        const rawList = Array.isArray(res) ? res : (res.data || []);

        if (currentPage === 1) {
            setAccumulatedProducts(rawList);
        } else if (rawList.length > 0) {
            setAccumulatedProducts((prev) => {
                const existingIds = new Set(prev.map((item) => String(item.id || item.productId)));
                const newItems = rawList.filter((item: any) => !existingIds.has(String(item.id || item.productId)));
                return [...prev, ...newItems];
            });
        }
    }, [productsData, currentPage]);

    const allProductsList = accumulatedProducts;

    useEffect(() => {
        if (!hasMore || isFetchingProducts) return;

        const handleScroll = () => {
            if (isFetchingProducts || !hasMore) return;
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const clientHeight = window.innerHeight;

            if (scrollHeight - scrollTop - clientHeight < 400) {
                setCurrentPage((prev) => prev + 1);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });

        const target = observerTargetRef.current;
        let observer: IntersectionObserver | null = null;
        if (target) {
            observer = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && !isFetchingProducts && hasMore) {
                        setCurrentPage((prev) => prev + 1);
                    }
                },
                { threshold: 0.1, rootMargin: "400px" }
            );
            observer.observe(target);
        }

        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (observer) observer.disconnect();
        };
    }, [isFetchingProducts, hasMore, accumulatedProducts.length]);

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

    const handleEditProduct = (product: any) => {
        router.push(`/shop-manager/products/edit/${product.id}`);
    };

    const handleDeleteProduct = async (product: any) => {
        try {
            const res = await deleteProductMutation({ id: product.id, shopId: activeShopId || undefined, product });
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

    const handleSelectProduct = (productId: string) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(productId)) {
            newSelected.delete(productId);
        } else {
            newSelected.add(productId);
        }
        setSelectedProducts(newSelected);
    };

    const handleSelectAll = () => {
        const productsToSelect = filteredProducts.filter((product: any) => !product.isDraft);
        const allSelected = productsToSelect.length > 0 && productsToSelect.every((product: any) => {
            const id = String(product.id);
            return selectedProducts.has(id);
        });
        if (allSelected) {
            setSelectedProducts(new Set());
        } else {
            const allIds = new Set<string>();
            productsToSelect.forEach((product: any) => {
                allIds.add(String(product.id));
            });
            setSelectedProducts(allIds);
        }
    };

    const handleBulkDelete = async () => {
        try {
            const deletePromises = Array.from(selectedProducts).map((id) => {
                if (activeShopId) {
                    const product = filteredProducts.find((p: any) => String(p.id) === id);
                    return deleteProductMutation({ id, shopId: activeShopId, product });
                }
                return Promise.resolve({ success: false });
            });

            const results = await Promise.all(deletePromises);
            const successCount = results.filter((r: any) => r.success).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
                toast.success(`${successCount} product${successCount > 1 ? 's' : ''} deleted successfully`);
            }
            if (failCount > 0) {
                toast.error(`Failed to delete ${failCount} product${failCount > 1 ? 's' : ''}`);
            }
            setSelectedProducts(new Set());
            setIsBulkMode(false);
            setBulkActionModal(null);
        } catch (err: any) {
            console.error("Bulk delete error:", err);
            toast.error(`Failed to delete products: ${err.message}`);
        }
    };

    const handleBulkToggleStatus = async (status: "active" | "inactive") => {
        try {
            const togglePromises = Array.from(selectedProducts).map((id) => {
                const product = filteredProducts.find((p: any) => String(p.id) === id);
                if (product && activeShopId) {
                    const currentStatus = product.status || 'active';
                    const targetStatus = status === 'active' ? 'active' : 'inactive';
                    if (currentStatus !== targetStatus) {
                        return toggleProductStatusMutation({ id, shopId: activeShopId });
                    }
                }
                return Promise.resolve({ success: true });
            });

            const results = await Promise.all(togglePromises);
            const successCount = results.filter((r: any) => r.success).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
                toast.success(`${successCount} product${successCount > 1 ? 's' : ''} ${status === 'active' ? 'activated' : 'paused'} successfully`);
            }
            if (failCount > 0) {
                toast.error(`Failed to update ${failCount} product${failCount > 1 ? 's' : ''}`);
            }
            setSelectedProducts(new Set());
            setIsBulkMode(false);
            setBulkActionModal(null);
        } catch (err: any) {
            console.error("Bulk toggle error:", err);
            toast.error(`Failed to update products: ${err.message}`);
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

            const isProductExpired = (item: any) => {
                if (!item.validTo) return false;
                const expiryDate = new Date(item.validTo);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return expiryDate < today;
            };

            const matchesStatus = statusFilter === "all"
                ? true
                : statusFilter === "active"
                    ? (!product.isDraft && product.status === "active" && !isProductExpired(product))
                    : statusFilter === "paused"
                        ? (!product.isDraft && product.status === "inactive" && !isProductExpired(product))
                        : statusFilter === "drafted"
                            ? product.isDraft
                            : statusFilter === "expired"
                                ? (!product.isDraft && isProductExpired(product))
                                : true;

            return matchesSearch && matchesStatus;
        });
    }, [allProductsList, searchQuery, statusFilter, branchNameMap]);

    return (
        <main className="min-h-screen pt-20 lg:pt-24 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
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

                            {/* Mobile Bulk Button */}
                            <button
                                onClick={() => {
                                    if (isBulkMode) {
                                        setSelectedProducts(new Set());
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

                            <PremiumButton
                                onClick={() => {
                                    if (branches.length === 0) {
                                        setShowNoBranchModal(true);
                                    } else {
                                        router.push("/shop-manager/products/add");
                                    }
                                }}
                                className="w-8 h-8 rounded-lg flex sm:hidden items-center justify-center shrink-0 animate-none"
                                title="Add Product"
                            >
                                <Plus className="w-4 h-4 text-white" />
                            </PremiumButton>
                        </div>

                        <div className="flex bg-gray-55 p-0.5 rounded-lg gap-0.5 self-start sm:self-auto shrink-0 border border-gray-100 bg-gray-50/50">
                            {(["all", "active", "paused", "drafted", "expired"] as const).map((filter) => (
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
                                    setSelectedProducts(new Set());
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
                        <PremiumButton
                            onClick={() => {
                                if (branches.length === 0) {
                                    setShowNoBranchModal(true);
                                } else {
                                    router.push("/shop-manager/products/add");
                                }
                            }}
                            className="rounded-lg h-7 px-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 shrink-0 self-start sm:self-auto"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Product
                        </PremiumButton>
                    </div>
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
                ) : (
                    <>
                        {isSelectMode && (
                            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 shadow-lg z-50 animate-in slide-in-from-bottom-full pb-safe-bottom">
                                <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center justify-between w-full sm:w-auto gap-3 border-b border-gray-100 sm:border-0 pb-2 sm:pb-0">
                                        <div className="flex items-center justify-between gap-2.5 w-full">
                                            <span className="text-xs sm:text-sm font-bold text-gray-700">{selectedProducts.size} selected</span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedProducts(new Set())}
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
                            isBulkMode && !isLoadingProducts && filteredProducts.filter((p: any) => !p.isDraft).length > 0
                                ? "max-h-12 opacity-100 mb-4 scale-y-100 origin-top"
                                : "max-h-0 opacity-0 mb-0 scale-y-95 origin-top pointer-events-none"
                        )}>
                            <span className="text-xs text-black font-medium ml-3">
                                {selectedProducts.size} of {filteredProducts.filter((p: any) => !p.isDraft).length} selected
                            </span>
                            <button
                                onClick={handleSelectAll}
                                className="text-xs font-semibold text-gray-600 hover:text-primary transition-colors flex items-center gap-2 border-0 bg-transparent cursor-pointer"
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                    filteredProducts.filter((p: any) => !p.isDraft).every((p: any) => selectedProducts.has(String(p.id)))
                                        ? "bg-orange-400 border-orange-400 text-white"
                                        : "border-gray-300 bg-white"
                                )}>
                                    {filteredProducts.filter((p: any) => !p.isDraft).every((p: any) => selectedProducts.has(String(p.id))) && (
                                        <Check className="w-2.5 h-2.5" />
                                    )}
                                </div>
                                Select All
                            </button>
                        </div>

                        {filteredProducts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-3">
                                {filteredProducts.map((product: any) => {
                                    const id = String(product.id);
                                    const productImage = product.image || product.imageUrl;
                                    const isSelected = selectedProducts.has(id);
                                    return (
                                        <div
                                            key={id}
                                            className="relative"
                                            onClick={(e) => {
                                                if (isBulkMode && !product.isDraft) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleSelectProduct(id);
                                                }
                                            }}
                                        >
                                            <SwipeableCard
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
                                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-primary/5 group-hover/img:from-orange-500/15 group-hover/img:via-amber-500/10 transition-all duration-300">
                                                                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/80 shadow-[0_4px_12px_rgba(249,115,22,0.08)] border border-orange-100/50 group-hover/img:scale-110 group-hover/img:shadow-[0_6px_16px_rgba(249,115,22,0.12)] transition-all duration-300">
                                                                    <ShoppingBag className="w-4.5 h-4.5 text-orange-500/85 group-hover:text-primary transition-colors group-hover/img:scale-110 transition-transform duration-300" />
                                                                </div>
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
                                                                {(() => {
                                                                    if (!product.validTo) return null;
                                                                    const expiryDate = new Date(product.validTo);
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
                                            {isBulkMode && product.isDraft && (
                                                <div
                                                    className="absolute top-2 left-2 z-20 w-5 h-5 rounded-md bg-gray-55 border border-gray-200 flex items-center justify-center cursor-not-allowed opacity-50"
                                                    title="Drafts cannot be selected for bulk actions"
                                                >
                                                    <Check className="w-3 h-3 text-gray-400" />
                                                </div>
                                            )}
                                            {isBulkMode && !product.isDraft && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectProduct(id);
                                                    }}
                                                    className={cn(
                                                        "absolute top-2 left-2 z-20 w-5 h-5 rounded-md border transition-all cursor-pointer flex items-center justify-center",
                                                        isSelected
                                                            ? "bg-orange-400 border-orange-400 animate-none"
                                                            : "bg-white/90 backdrop-blur border-gray-255 hover:border-primary hover:bg-white shadow-sm animate-none"
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

                            {/* Scroll trigger for infinite scroll loading */}
                            <div id="scroll-trigger" ref={observerTargetRef} className="w-full py-8 flex flex-col items-center justify-center mt-4">
                                {isFetchingProducts && currentPage > 1 && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-orange-500 animate-pulse">
                                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                                        <span>Loading more products...</span>
                                    </div>
                                )}
                                {!hasMore && !isFetchingProducts && filteredProducts.length > 0 && (
                                    <div className="text-center py-2">
                                        <span className="text-xs text-gray-400 font-medium">
                                            You've reached the end of your products ({filteredProducts.length} total)
                                        </span>
                                    </div>
                                )}
                            </div>
                        </>
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
                                    ) : statusFilter === "expired" ? (
                                        "No expired products"
                                    ) : (
                                        "No products found"
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 max-w-xs mt-1 mb-6">
                                    {searchQuery ? (
                                        "Try adjusting your search terms or filters to find your product."
                                    ) : statusFilter === "active" ? (
                                        filteredProducts.length > 0
                                            ? "All of your products are currently paused."
                                            : "Your product catalog is empty."
                                    ) : statusFilter === "paused" ? (
                                        filteredProducts.length > 0
                                            ? "All of your products are active and live."
                                            : "Your product catalog is empty."
                                    ) : statusFilter === "drafted" ? (
                                        "You don't have any drafted products at the moment."
                                    ) : statusFilter === "expired" ? (
                                        "You don't have any expired products at the moment."
                                    ) : (
                                        "Your product catalog is empty. Let's add your first product now!"
                                    )}
                                </p>
                                {allProductsList.length === 0 && (
                                    <PremiumButton onClick={() => router.push("/shop-manager/products/add")} className="rounded-xl shadow-lg shadow-primary/20 border-0 cursor-pointer">
                                        Add Product
                                    </PremiumButton>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>



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

            <AppModal
                open={!!bulkActionModal}
                onOpenChange={(open) => { if (!open) setBulkActionModal(null); }}
                title={bulkActionModal?.type === "delete" ? "Delete Products" : "Update Status"}
                description={bulkActionModal?.type === "delete" ? `Are you sure you want to delete ${selectedProducts.size} selected product${selectedProducts.size > 1 ? 's' : ''}?` : `Set ${selectedProducts.size} product${selectedProducts.size > 1 ? 's' : ''} to ${bulkActionModal?.targetStatus === 'active' ? 'active' : 'paused'} status?`}
            >
                <div className="space-y-4">
                    {bulkActionModal?.type === "delete" && (
                        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-sm text-orange-700 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Delete {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''}</p>
                                <p className="mt-1 text-xs opacity-80">This action will permanently delete the selected products and cannot be undone.</p>
                            </div>
                        </div>
                    )}
                    {bulkActionModal?.type === "status" && (
                        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-sm text-orange-700 flex items-start gap-3">
                            <div>
                                <p className="font-semibold">Status change for {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''}</p>
                                <p className="mt-1 text-xs opacity-80">Products will be {bulkActionModal.targetStatus === 'active' ? 'activated' : 'paused'} immediately.</p>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 justify-end flex-wrap">
                        <PremiumButton variant="outline" onClick={() => setBulkActionModal(null)} className="rounded-xl">Cancel</PremiumButton>
                        {bulkActionModal?.type === "delete" && (
                            <PremiumButton onClick={handleBulkDelete} className="rounded-xl px-6 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 border-0">
                                <Trash2 className="w-4 h-4 mr-2" />Confirm Delete
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

            {/* Branch Required Modal */}
            <AppModal
                open={showNoBranchModal}
                onOpenChange={setShowNoBranchModal}
                title="Branch Required"
                description="At least one branch is necessary in creating products and offers."
            >
                <div className="space-y-4">
                    <div className="flex gap-3 justify-end">
                        <PremiumButton variant="outline" onClick={() => setShowNoBranchModal(false)} className="rounded-xl">
                            Cancel
                        </PremiumButton>
                        <PremiumButton
                            onClick={() => {
                                setShowNoBranchModal(false);
                                router.push(`/shop-manager/${activeShopId}/add-branch`);
                            }}
                            className="rounded-xl px-6 shadow-lg shadow-primary/20"
                        >
                            OK
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
            <div className="min-h-screen bg-gray-50/50 pt-24 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <ShopProductsContent />
        </Suspense>
    );
}
