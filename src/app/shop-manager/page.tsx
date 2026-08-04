"use client";

export const dynamic = "force-dynamic";

// Core React imports
import { useState, useEffect, useRef, Suspense, useMemo } from "react";

// UI Components (barrel import)
import {
    Heading, Text, SectionTitle, PremiumCard, PremiumButton,
    AppModal, PremiumDatePicker, ImagePreviewModal, StatusToggleButton
} from "@/components/shared";

// Types
import { Product } from "@/lib/types";

// Icons (selective import - only what's needed)
import {
    AlertTriangle, ArrowUpRight, BarChart3, ChevronRight, Clock,
    Eye, Filter, Info, LayoutDashboard, LogOut, MapPin,
    MoreVertical, Package, Plus, Power, Search, Settings,
    Store, Tag, Ticket, Loader2, Trash2, Calendar,
    MousePointerClick, Pencil, ArrowRight, GitBranch, Paintbrush, ShoppingBag
} from "@/lib/icons";

// UI Libraries
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

// Next.js
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

// React Query
import { useQueryClient } from "@tanstack/react-query";

// Shared utilities
import { cn, getRelativeTime } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { toast } from "sonner";

// Local components
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { SwipeableCard } from "@/components/shop-manager/SwipeableCard";
import { DashboardSkeleton } from "@/components/shop-manager/DashboardSkeleton";
import { OffersTab } from "@/components/shop-manager/OffersTab";
import { ProductsTab } from "@/components/shop-manager/ProductsTab";
import { DraftsTab } from "@/components/shop-manager/DraftsTab";

// Hooks (barrel import)
import { queryKeys } from "@/hooks/useApi";
import {
    useMyShops, useBranches, useAllOffers, useAllProducts,
    useDeleteOffer, useToggleOfferStatus, useCreateProduct,
    useUpdateProduct, useDeleteProduct, useToggleOfferProductStatus,
    useIsMobile, useDashboardAnalytics
} from "@/hooks";

import { getOfferProductById } from "@/lib/api";


function DashboardContent() {
    const { data: session, status: sessionStatus } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState("offers");
    const [isShopActive, setIsShopActive] = useState(true);

    const queryClient = useQueryClient();

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            router.push("/login");
        }
    }, [sessionStatus, router]);

    // 1. Fetch Shops
    const { data: shopsResponse, isLoading: isLoadingShops } = useMyShops();
    const shops = useMemo(() => {
        if (!shopsResponse?.success || !shopsResponse?.data) return [];
        const result = shopsResponse.data as any;
        return Array.isArray(result) ? result : (result.data || []);
    }, [shopsResponse]);

    // Derived Active Shop ID
    const activeShopId = useMemo(() => {
        const sid = session?.shopId ?? (session?.user as any)?.shopId;
        if (sid) return String(sid);
        if (shops.length > 0) return String(shops[0].id);
        return null;
    }, [session, shops]);

    useEffect(() => {
        if (!activeShopId) return;
        queryClient.invalidateQueries({ queryKey: queryKeys.allOffers(activeShopId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.allProducts(activeShopId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.branches(activeShopId) });
    }, [activeShopId, queryClient]);

    // 2. Fetch Offers for current shop
    const { data: offersResponse, isLoading: isLoadingOffers } = useAllOffers(activeShopId || undefined, { limit: 50 });
    const publishedOffers = useMemo(() => {
        if (!offersResponse?.success || !offersResponse?.data) return [] as any[];
        const result = offersResponse.data as any;
        const offersArray = Array.isArray(result) ? result : (result.data || []);
        return offersArray.filter((offer: any) => !offer.isDraft) as any[];
    }, [offersResponse]);

    const totalOffersCount = useMemo(() => {
        if (!offersResponse?.success || !offersResponse?.data) return 0;
        const res = offersResponse.data as any;
        return res?.pagination?.totalRecords || res?.pagination?.count || res?.count || res?.total || (Array.isArray(res) ? res.length : (res.data?.length || 0));
    }, [offersResponse]);

    const draftedOffers = useMemo(() => {
        if (!offersResponse?.success || !offersResponse?.data) return [] as any[];
        const result = offersResponse.data as any;
        const offersArray = Array.isArray(result) ? result : (result.data || []);
        return offersArray.filter((offer: any) => offer.isDraft) as any[];
    }, [offersResponse]);

    // 3. Fetch Products
    const { data: productsData, isLoading: isLoadingProducts } = useAllProducts(activeShopId || undefined, { limit: 50 });
    const products = useMemo(() => {
        const prods = (productsData || []) as Product[];
        return prods.filter((p: any) => !p.isDraft);
    }, [productsData]);

    const totalProductsCount = useMemo(() => {
        if (!productsData) return 0;
        const res = productsData as any;
        return res?.pagination?.totalRecords || res?.pagination?.count || res?.count || res?.total || (Array.isArray(res) ? res.length : (res.data?.length || 0));
    }, [productsData]);

    const draftedProducts = useMemo(() => {
        const prods = (productsData || []) as Product[];
        return prods.filter((p: any) => p.isDraft);
    }, [productsData]);

    const allDrafts = useMemo(() => {
        return [
            ...draftedOffers.map((o: any) => ({ ...o, _draftType: 'offer' })),
            ...draftedProducts.map((p: any) => ({ ...p, _draftType: 'product' }))
        ];
    }, [draftedOffers, draftedProducts]);

    // 4. Fetch Branches for mapping in product cards
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

    const { data: analyticsResponse, isLoading: isLoadingAnalytics } = useDashboardAnalytics(activeShopId || "");
    const dashboardAnalytics = useMemo(() => {
        if (!analyticsResponse?.success || !analyticsResponse?.data) return { offerCount: 0, standaloneOfferProductCount: 0, offerViews: 0, offerProductViews: 0 };
        const res = analyticsResponse.data as any;
        return res.data || res;
    }, [analyticsResponse]);

    const totalViews = (Number(dashboardAnalytics.offerViews) || 0) + (Number(dashboardAnalytics.offerProductViews) || 0);

    // ================= MUTATIONS =================
    const { mutateAsync: deleteOfferMutation } = useDeleteOffer();
    const { mutateAsync: toggleStatusMutation } = useToggleOfferStatus();
    const { mutateAsync: createProductMutation } = useCreateProduct();
    const { mutateAsync: updateProductMutation } = useUpdateProduct();
    const { mutateAsync: deleteProductMutation } = useDeleteProduct();
    const { mutateAsync: toggleProductStatusMutation } = useToggleOfferProductStatus();

    // ================= LOCAL UI STATE =================
    const [productToDelete, setProductToDelete] = useState<any | null>(null);
    const [dateFrom, setDateFrom] = useState<Date>(() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(now.setDate(diff));
    });
    const [dateTo, setDateTo] = useState<Date>(() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? 0 : 7);
        return new Date(now.setDate(diff));
    });
    const [showDatePopup, setShowDatePopup] = useState(false);
    const [showNoBranchModal, setShowNoBranchModal] = useState(false);
    const [previewLogo, setPreviewLogo] = useState<{ src: string, name: string, markedItems?: any[] } | null>(null);
    const tabsRef = useRef<HTMLDivElement>(null);
    const user = session?.user as any;
    const [offerToDelete, setOfferToDelete] = useState<any | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [expandedOffers, setExpandedOffers] = useState<Record<string, boolean>>({});

    const toggleOfferExpand = (id: string) => {
        setExpandedOffers((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // ================= EVENT HANDLERS =================

    const handleRevertToMark = async (offer: any) => {
        try {
            const editingPosters = (offer.posters || [{
                id: crypto.randomUUID(),
                posterSrc: offer.posterSrc,
                type: 'just_post',
                markedItems: []
            }]).map((p: any) => ({
                ...p,
                type: 'marked_poster'
            }));

            if (editingPosters[0]) {
                editingPosters[0].title = offer.title;
            }

            await storage.setItem("currentEditingPosters", editingPosters);
            const stored = await storage.getItem<any[]>("markedPosters");
            if (stored) {
                const updated = stored.filter((o) => o.batchId !== offer.batchId);
                await storage.setItem("markedPosters", updated);
            }

            toast.success("Ready for marking. Redirecting...");
            router.push("/shop-manager/create-offer/editor");
        } catch (error) {
            console.error("Failed to revert offer:", error);
            toast.error("Failed to transition offer to marking mode");
        }
    };

    const openEditModal = (offer: any) => {
        // If it's a draft and has a batchId, use batchId so it loads correctly from local storage
        const isLocalDraft = offer.isDraft && offer.batchId;
        const id = isLocalDraft ? String(offer.batchId) : String(offer.offerId || offer.id || offer.batchId);
        router.push(`/shop-manager/edit-offer/${id}`);
    };

    const handleDeleteOffer = async (offer: any) => {
        try {
            if (activeShopId) {
                const idToUse = offer.offerId || offer.id || offer.batchId;
                const res = await deleteOfferMutation({ id: String(idToUse), shopId: activeShopId, offer });
                if (res.success) {
                    toast.success("Offer deleted");
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
        if (offer.isDraft) {
            toast.error("Draft offers cannot be activated. Please publish it first.");
            return;
        }

        try {
            if (activeShopId) {
                const idToUse = offer.offerId || offer.id || offer.batchId;
                const res = await toggleStatusMutation({ id: String(idToUse), shopId: activeShopId });
                if (res.success) {
                    toast.success(`Offer ${offer.status === 'active' ? 'paused' : 'resumed'}`);
                } else {
                    throw new Error("Failed to toggle status");
                }
            }
        } catch (err: any) {
            console.error("Toggle error:", err);
            toast.error(`Failed to update status: ${err.message}`);
        }
    };

    const handleEditProduct = (product: any) => {
        router.push(`/shop-manager/products/edit/${product.id}`);
    };

    const handleDeleteProduct = async (product: any) => {
        try {
            const res = await deleteProductMutation({ id: product.id, shopId: activeShopId || undefined, product });
            if (res.success) {
                toast.success("Product deleted");
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

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "offers" || tab === "products") {
            setActiveTab(tab);
        } else if (tab === "shops") {
            // "shops" tab moved out, redirect to default "offers"
            setActiveTab("offers");
        }
    }, [searchParams]);

    useEffect(() => {
        if (allDrafts.length === 0 && activeTab === "drafts") {
            setActiveTab("offers");
        }
    }, [allDrafts.length, activeTab]);

    const handleLogout = () => {
        setIsLoggingOut(true);
        signOut({ callbackUrl: "/" });
    };

    if (
        sessionStatus === "loading" ||
        (sessionStatus === "authenticated" && (isLoadingShops || (shopsResponse && !shopsResponse.success)))
    ) {
        return <DashboardSkeleton />;
    }

    if (sessionStatus === "unauthenticated") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Redirecting</h3>
                <p className="text-sm text-gray-500">You are logged out. Redirecting to login page...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen pt-20 lg:pt-22 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4">
                <Breadcrumbs items={[{ label: "Shop Dashboard" }]} />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 sm:mb-12">
                    <div>
                        <Heading className="text-3xl md:text-4xl lg:text-5xl mb-3">
                            Welcome <span className="text-gradient">{user?.business_name || "Merchant"}</span>
                        </Heading>
                        <Text className="max-w-2xl opacity-80">
                            Manage your shop, list new offers, offer products and track your business performance all in one place.
                        </Text>
                    </div>
                    <div className="grid grid-cols-3 md:flex md:flex-wrap lg:flex-nowrap items-center gap-2 md:gap-3 w-full md:w-auto">
                        <PremiumButton variant="outline" asChild className="rounded-full w-full md:w-auto justify-center px-1 sm:px-3 md:px-4 py-1.5 md:py-2.5 h-auto text-[11px] sm:text-xs md:text-sm">
                            <Link href="/">
                                <span className="hidden sm:inline">Go Home</span>
                                <span className="sm:hidden">Home</span>
                            </Link>
                        </PremiumButton>

                        {shops.length > 0 ? (
                            <PremiumButton
                                onClick={() => {
                                    if (branches.length === 0) {
                                        setShowNoBranchModal(true);
                                    } else {
                                        router.push("/shop-manager/create-offer?source=dashboard");
                                    }
                                }}
                                className="rounded-full shadow-lg shadow-primary/20 w-full md:w-auto justify-center px-1 sm:px-3 md:px-4 py-1.5 md:py-2.5 h-auto text-[11px] sm:text-xs md:text-sm"
                            >
                                <span className="hidden sm:inline">Add Offer</span>
                                <span className="sm:hidden">Offer +</span>
                            </PremiumButton>
                        ) : (
                            <PremiumButton
                                onClick={() => toast.error("Please create a shop profile first to add offers or products.")}
                                className="rounded-full w-full md:w-auto justify-center px-1 sm:px-3 md:px-4 py-1.5 md:py-2.5 h-auto text-[11px] sm:text-xs md:text-sm opacity-40 cursor-not-allowed hover:shadow-none active:scale-100"
                                glow={false}
                            >
                                <span className="hidden sm:inline">Add Offer</span>
                                <span className="sm:hidden">Offer +</span>
                            </PremiumButton>
                        )}

                        <PremiumButton
                            onClick={() => {
                                if (shops.length > 0) {
                                    if (branches.length === 0) {
                                        setShowNoBranchModal(true);
                                    } else {
                                        router.push("/shop-manager/products/add");
                                    }
                                } else {
                                    toast.error("Please create a shop profile first to add offers or products.");
                                }
                            }}
                            className={cn(
                                "rounded-full w-full md:w-auto justify-center px-1 sm:px-3 md:px-4 py-1.5 md:py-2.5 h-auto text-[11px] sm:text-xs md:text-sm",
                                shops.length > 0
                                    ? "shadow-lg shadow-primary/20"
                                    : "opacity-40 cursor-not-allowed hover:shadow-none active:scale-100"
                            )}
                            glow={shops.length > 0}
                        >
                            <span className="hidden sm:inline">Add Product</span>
                            <span className="sm:hidden">Product +</span>
                        </PremiumButton>
                    </div>
                </div>

                {/* Quick Stats */}
                {shops.length > 0 && (
                    <div className="mb-2 sm:mb-5">
                        <div className="md:hidden">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-700">Quick Stats</h3>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span>Swipe to view</span>
                                    <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
                                </div>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-1">
                                <div className="w-[46vw] sm:w-[240px] flex-none shrink-0 snap-center">
                                    <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl">
                                        <div className="p-3.5 flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                                                <Tag className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate flex items-center gap-1">
                                                        <Tag className="w-3 h-3 shrink-0" />
                                                        Offers
                                                    </h3>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <div className={cn("text-xl font-black text-gray-900 tracking-tight")}>
                                                        {isLoadingOffers ? 0 : publishedOffers.filter((o: any) => o.status === 'active').length}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-medium truncate">
                                                        / {isLoadingOffers ? 0 : publishedOffers.filter((o: any) => o.status !== 'active').length} paused
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </PremiumCard>
                                </div>
                                <div className="w-[46vw] sm:w-[240px] flex-none shrink-0 snap-center">
                                    <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl">
                                        <div className="p-3.5 flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                                                <ShoppingBag className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">Products</h3>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <div className={cn("text-xl font-black text-gray-900 tracking-tight")}>
                                                        {isLoadingProducts ? 0 : products.filter((p: any) => p.status === 'active').length}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-medium truncate">
                                                        / {isLoadingProducts ? 0 : products.filter((p: any) => p.status !== 'active').length} paused
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </PremiumCard>
                                </div>
                                <div className="w-[55vw] sm:w-[220px] flex-none shrink-0 snap-center">
                                    <ViewsCard analytics={dashboardAnalytics} isLoading={isLoadingAnalytics} />
                                </div>
                            </div>

                        </div>

                        <div className="hidden md:grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                            <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl">
                                <div className="p-4 flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                                        <Tag className="w-5 h-5 transition-transform" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate flex items-center gap-1">
                                                Offers
                                            </h3>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <div className={cn("text-2xl font-black text-gray-900 tracking-tighter")}>
                                                {isLoadingOffers ? 0 : publishedOffers.filter((o: any) => o.status === 'active').length}
                                            </div>
                                            <span className="text-[11px] text-gray-400 font-medium truncate mt-1">
                                                / {isLoadingOffers ? 0 : publishedOffers.filter((o: any) => o.status !== 'active').length} paused
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </PremiumCard>
                            <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl">
                                <div className="p-4 flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                                        <ShoppingBag className="w-5 h-5 transition-transform" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">Products</h3>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <div className={cn("text-2xl font-black text-gray-900 tracking-tighter")}>
                                                {isLoadingProducts ? 0 : products.filter((p: any) => p.status === 'active').length}
                                            </div>
                                            <span className="text-[11px] text-gray-400 font-medium truncate mt-1">
                                                / {isLoadingProducts ? 0 : products.filter((p: any) => p.status !== 'active').length} paused
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </PremiumCard>
                            <ViewsCard analytics={dashboardAnalytics} isLoading={isLoadingAnalytics} />
                        </div>

                    </div>
                )}

                {/* Main Content Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {shops.length > 0 && (
                        <div className="lg:col-span-1 space-y-6 order-2">
                            {/* Shop Profile Spotlight */}
                            {isLoadingShops && (
                                <PremiumCard variant="glass" padding="none" className="overflow-hidden">
                                    <div className="h-16 bg-gray-100/50 animate-pulse" />
                                    <div className="px-5 pb-5 -mt-8 relative z-10 flex flex-col items-center">
                                        <Skeleton className="w-16 h-16 rounded-2xl bg-white shadow-lg shadow-black/5" />
                                        <Skeleton className="h-6 w-40 mt-3 rounded-lg" />
                                        <Skeleton className="h-4 w-24 mt-2 rounded-lg" />
                                        <div className="grid grid-cols-2 gap-4 w-full mt-4 py-2.5 border-y border-primary/5">
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-8 mx-auto" />
                                                <Skeleton className="h-2 w-12 mx-auto" />
                                            </div>
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-8 mx-auto" />
                                                <Skeleton className="h-2 w-12 mx-auto" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 w-full mt-4">
                                            <Skeleton className="h-10 w-full rounded-xl" />
                                            <Skeleton className="h-10 w-full rounded-xl" />
                                        </div>
                                    </div>
                                </PremiumCard>
                            )}

                            {!isLoadingShops && (
                                <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                    <div className="h-16 bg-orange-500/[0.08] relative">
                                        <div className="absolute top-3 right-3 z-20 scale-90 origin-top-right">
                                            <StatusToggleButton
                                                status={isShopActive ? 'active' : 'paused'}
                                                onChange={(s) => setIsShopActive(s === 'active')}
                                            />
                                        </div>
                                    </div>
                                    <div className="px-5 pb-5 -mt-8 relative z-10">
                                        <div className="flex flex-col items-center text-center">
                                            <div
                                                className="w-16 h-16 rounded-2xl bg-white p-1 shadow-xl shadow-black/5 ring-4 ring-white relative group/logo cursor-pointer"
                                                onClick={() => shops[0].logo_url && setPreviewLogo({ src: shops[0].logo_url, name: shops[0].shop_name })}
                                            >
                                                <div className="w-full h-full rounded-xl bg-primary/5 flex items-center justify-center overflow-hidden relative">
                                                    <Store className="w-6 h-6 text-primary/20 absolute" />
                                                    {shops[0].logo_url && (
                                                        <Image
                                                            src={shops[0].logo_url}
                                                            alt={shops[0].shop_name}
                                                            fill
                                                            unoptimized
                                                            className="object-cover group-hover/logo:scale-110 transition-transform duration-500 relative z-10"
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity z-20">
                                                        <Eye className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-3 w-full">
                                                <div className="flex items-center justify-center gap-2 mb-0.5">
                                                    <h3 className="text-lg font-black text-gray-900 tracking-tight">{shops[0].shop_name}</h3>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", isShopActive ? "bg-green-500 animate-pulse" : "bg-gray-300")} />
                                                </div>
                                                <div className="flex items-center justify-center gap-1 text-[12px] text-gray-500 font-medium">
                                                    <MapPin className="w-3 h-3 text-primary/60" />
                                                    {shops[0].city}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 w-full mt-4 py-2.5 border-y border-primary/5">
                                                <div className="text-center">
                                                    <div className="text-xs font-bold text-gray-900">{publishedOffers.length}</div>
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Offers</div>
                                                </div>
                                                <div className="text-center border-x border-primary/5">
                                                    <div className="text-xs font-bold text-gray-900">{branches.length}</div>
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Branches</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs font-bold text-gray-900">{products.length}</div>
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Products</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 w-full mt-4">
                                                <Link href={`/shop-manager/${shops[0].id}/branches`} className="w-full cursor-pointer">
                                                    <PremiumButton variant="outline" glow={false} size="sm" className="w-full rounded-xl py-3.5 border-primary/10 hover:border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary gap-1.5 shadow-none cursor-pointer">
                                                        <GitBranch className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Branches</span>
                                                    </PremiumButton>
                                                </Link>
                                                <Link href={`/shop-manager/add-shop?id=${shops[0].id}`} className="w-full cursor-pointer">
                                                    <PremiumButton variant="outline" glow={false} size="sm" className="w-full rounded-xl py-3.5 border-primary/10 hover:border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary gap-1.5 shadow-none cursor-pointer">
                                                        <Settings className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Manage</span>
                                                    </PremiumButton>
                                                </Link>
                                            </div>
                                            <PremiumButton
                                                onClick={handleLogout}
                                                variant="outline"
                                                glow={false}
                                                size="sm"
                                                className="w-full rounded-xl py-3.5 mt-2 border-rose-100 hover:border-rose-200 bg-rose-50/30 hover:bg-rose-50 text-rose-600 gap-1.5 transition-all duration-300 shadow-none cursor-pointer"
                                            >
                                                <LogOut className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Logout</span>
                                            </PremiumButton>
                                        </div>
                                    </div>
                                </PremiumCard>
                            )}

                            <PremiumCard variant="glass" padding="none" className="overflow-hidden shadow-lg shadow-black/5">
                                <div className="p-5">
                                    <SectionTitle className="mb-4 text-xs text-gray-400 font-bold uppercase tracking-widest">Quick Utilities</SectionTitle>
                                    <div className="grid grid-cols-3 gap-2.5">
                                        <ActionButton icon={Settings} label="Business" href="/shop-manager/shop-settings" variant="grid" />
                                        <ActionButton icon={Paintbrush} label="Designer" href="/shop-manager/poster-designer" variant="grid" />
                                        <ActionButton icon={BarChart3} label="Analysis" href="/shop-manager/analytics" variant="grid" />
                                    </div>
                                </div>
                            </PremiumCard>
                        </div>
                    )}

                    {/* Tabs Content */}
                    <div className={cn("space-y-6 order-1 scroll-mt-24 md:scroll-mt-32", shops.length > 0 ? "lg:col-span-2" : "lg:col-span-3")} ref={tabsRef}>
                        {shops.length === 0 ? (
                            <div className="max-w-4xl mx-auto space-y-8 py-4">
                                {/* Hero Card */}
                                <PremiumCard variant="glass" padding="none" className="overflow-hidden border border-primary/10 rounded-3xl shadow-xl shadow-primary/5 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-orange-500/[0.03] via-transparent to-rose-500/[0.02]">
                                    <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 w-full">
                                        <div className="space-y-3 text-center md:text-left max-w-xl">
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold text-orange-600 bg-orange-100/50 uppercase tracking-widest">
                                                Onboarding Started
                                            </span>
                                            <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                                                Let's Launch Your Digital Storefront
                                            </h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                To start publishing deals, sharing posters, and attracting local shoppers, you first need to set up your virtual shop profile.
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 justify-center">
                                            <Link href="/shop-manager/add-shop" className="w-full sm:w-auto">
                                                <PremiumButton className="w-full rounded-2xl py-4 px-8 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 flex items-center justify-center gap-2.5 border-none hover:scale-[1.02] active:scale-95 transition-all duration-300 text-sm font-bold tracking-wide uppercase">
                                                    <Plus className="w-5 h-5" />
                                                    Create Shop
                                                </PremiumButton>
                                            </Link>
                                            <PremiumButton
                                                onClick={handleLogout}
                                                variant="outline"
                                                glow={false}
                                                className="w-full sm:w-auto rounded-2xl py-4 px-6 border-rose-100 hover:border-rose-200 bg-rose-50/20 hover:bg-rose-50 text-rose-600 gap-1.5 transition-all duration-300 shadow-none"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Logout</span>
                                            </PremiumButton>
                                        </div>
                                    </div>
                                </PremiumCard>

                                {/* Stepper Visual Flow */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                    {/* Step 1: Active */}
                                    <PremiumCard variant="glass" className="relative border border-orange-500/20 bg-white/60 hover:bg-white transition-all duration-300 p-6 rounded-2xl">
                                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center text-xs font-bold ring-4 ring-orange-100/50">
                                            1
                                        </div>
                                        <div className="flex flex-col h-full justify-between">
                                            <div>
                                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 text-orange-600">
                                                    <Store className="w-5 h-5" />
                                                </div>
                                                <h4 className="font-bold text-sm text-gray-900 mb-1">Create Shop</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                                                    Add your branding, address, and live map coordinates.
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1.5 mt-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                In Progress
                                            </span>
                                        </div>
                                    </PremiumCard>

                                    {/* Step 2: Locked */}
                                    <PremiumCard variant="glass" className="opacity-60 border border-primary/5 bg-gray-50/30 p-6 rounded-2xl">
                                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">
                                            2
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                                            <Tag className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-700 mb-1">List Offers</h4>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            Create promotional posters using our AI studio or design canvas.
                                        </p>
                                    </PremiumCard>

                                    {/* Step 3: Locked */}
                                    <PremiumCard variant="glass" className="opacity-60 border border-primary/5 bg-gray-50/30 p-6 rounded-2xl">
                                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">
                                            3
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                                            <BarChart3 className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-700 mb-1">Publish & Attract</h4>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            Go live! Reach nearby shoppers and drive foot traffic directly to your physical store.
                                        </p>
                                    </PremiumCard>
                                </div>
                            </div>
                        ) : (
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <PremiumCard variant="glass" padding="none" className="overflow-hidden">
                                    <div className="p-4 pb-0 border-b border-primary/5">
                                        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-2">
                                            <TabsList className="bg-primary/5 p-1 gap-1 w-full xs:w-auto">
                                                <TabsTrigger value="offers" className="flex-1 xs:flex-none data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-2 transition-all">
                                                    <Tag className="w-4 h-4" /> Offers
                                                </TabsTrigger>
                                                <TabsTrigger value="products" className="flex-1 xs:flex-none data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-2 transition-all">
                                                    <Package className="w-4 h-4" /> Products
                                                </TabsTrigger>
                                                {allDrafts.length > 0 && (
                                                    <TabsTrigger value="drafts" className="flex-1 xs:flex-none data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-2 transition-all">
                                                        <Pencil className="w-4 h-4" /> Drafts
                                                    </TabsTrigger>
                                                )}
                                            </TabsList>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] text-gray-400 font-bold block sm:hidden mt-0.5">← Swipe left on items to manage</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-2">
                                        <TabsContent value="offers" className="mt-0 space-y-3 focus-visible:ring-0">
                                            <OffersTab
                                                isLoadingOffers={isLoadingOffers}
                                                publishedOffers={publishedOffers}
                                                totalOffersCount={totalOffersCount}
                                                openEditModal={openEditModal}
                                                setOfferToDelete={setOfferToDelete}
                                                handleToggleOfferStatus={handleToggleOfferStatus}
                                                setPreviewLogo={setPreviewLogo}
                                                onAddOffer={() => {
                                                    if (branches.length === 0) {
                                                        setShowNoBranchModal(true);
                                                    } else {
                                                        router.push("/shop-manager/create-offer?source=dashboard");
                                                    }
                                                }}
                                            />
                                        </TabsContent>
                                        <TabsContent value="products" className="mt-0 space-y-3 focus-visible:ring-0">
                                            <ProductsTab
                                                isLoadingProducts={isLoadingProducts}
                                                products={products || []}
                                                totalProductsCount={totalProductsCount}
                                                branchNameMap={branchNameMap}
                                                handleEditProduct={handleEditProduct}
                                                setProductToDelete={setProductToDelete}
                                                handleToggleProductStatus={handleToggleProductStatus}
                                                setPreviewLogo={setPreviewLogo}
                                                onAddProduct={() => {
                                                    if (branches.length === 0) {
                                                        setShowNoBranchModal(true);
                                                    } else {
                                                        router.push("/shop-manager/products/add");
                                                    }
                                                }}
                                            />
                                        </TabsContent>

                                        {allDrafts.length > 0 && (
                                            <TabsContent value="drafts" className="mt-0 focus-visible:ring-0">
                                                <DraftsTab
                                                    allDrafts={allDrafts}
                                                    openEditModal={openEditModal}
                                                    handleEditProduct={handleEditProduct}
                                                    setOfferToDelete={setOfferToDelete}
                                                    setProductToDelete={setProductToDelete}
                                                />
                                            </TabsContent>
                                        )}
                                    </div>
                                </PremiumCard>
                            </Tabs>
                        )}
                    </div>
                </div>
            </div>

            {/* Date Range Modal */}
            <AppModal open={showDatePopup} onOpenChange={setShowDatePopup} title="Filter Offers by Date" description="Select a date range to view offer statistics.">
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <PremiumDatePicker label="From" date={dateFrom} setDate={(d) => d && setDateFrom(d)} />
                        <PremiumDatePicker label="To" date={dateTo} setDate={(d) => d && setDateTo(d)} />
                    </div>
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium mb-3">Offers in selected period</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-emerald-500/10"><p className="text-xs text-muted-foreground mb-1">Active</p><p className="text-2xl font-bold text-emerald-600">{publishedOffers.filter((o: any) => o.status === 'active').length}</p></div>
                            <div className="p-3 rounded-lg bg-gray-500/10"><p className="text-xs text-muted-foreground mb-1">Paused</p><p className="text-2xl font-bold text-gray-600">{publishedOffers.filter((o: any) => o.status !== 'active').length}</p></div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4"><PremiumButton variant="outline" onClick={() => setShowDatePopup(false)} className="rounded-xl">Close</PremiumButton></div>
                </div>
            </AppModal>

            {/* Delete Modal */}
            <AppModal open={!!offerToDelete} onOpenChange={(open) => { if (!open) setOfferToDelete(null); }} title="Delete Offer" description="Are you sure you want to delete this offer? This action cannot be undone.">
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div><p className="font-semibold">"{offerToDelete?.title || 'Untitled'}"</p><p className="mt-1 text-xs opacity-80">This will permanently remove this offer.</p></div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <PremiumButton variant="outline" onClick={() => setOfferToDelete(null)} className="rounded-xl">Cancel</PremiumButton>
                        <PremiumButton onClick={() => offerToDelete && handleDeleteOffer(offerToDelete)} className="rounded-xl px-6 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"><Trash2 className="w-4 h-4 mr-2" />Confirm Delete</PremiumButton>
                    </div>
                </div>
            </AppModal>



            {/* Product Delete Modal */}
            <AppModal
                open={!!productToDelete}
                onOpenChange={(open) => { if (!open) setProductToDelete(null); }}
                title="Delete Product"
                description="Are you sure you want to delete this product? This will remove it from your catalog."
            >
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div><p className="font-semibold">"{productToDelete?.name || 'Untitled'}"</p><p className="mt-1 text-xs opacity-80">This will permanently delete this product from the inventory.</p></div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <PremiumButton variant="outline" onClick={() => setProductToDelete(null)} className="rounded-xl">Cancel</PremiumButton>
                        <PremiumButton onClick={() => productToDelete && handleDeleteProduct(productToDelete)} className="rounded-xl px-6 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"><Trash2 className="w-4 h-4 mr-2" />Confirm Delete</PremiumButton>
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

            {/* Logo Preview */}
            {previewLogo && <ImagePreviewModal src={previewLogo.src} alt={previewLogo.name} isOpen={!!previewLogo} onClose={() => setPreviewLogo(null)} />}
        </main>
    );
}



export default function ShopManagerPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}

function StatCard({ icon: Icon, label, value, trend, isLoading }: { icon: any, label: string, value: string, trend: string, isLoading?: boolean }) {
    const displayValue = isLoading ? (label.toLowerCase().includes("rate") ? "0%" : "0") : value;
    const displayTrend = isLoading ? (label.toLowerCase().includes("rate") ? "+0.0%" : (label.toLowerCase().includes("views") ? "+0%" : "+0")) : trend;

    return (
        <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl h-full">
            <div className="p-4 flex items-center gap-3 h-full">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">{label}</h3>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                        <div className={cn("text-2xl font-black text-gray-900 tracking-tighter leading-none shrink-0")}>
                            {displayValue}
                        </div>
                        <div className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-lg whitespace-nowrap mb-0.5">
                            {displayTrend}
                        </div>
                    </div>
                </div>
            </div>
        </PremiumCard>
    );
}

function ViewsCard({ analytics, isLoading }: { analytics: any, isLoading?: boolean }) {
    const offerViews = Number(analytics?.offerViews) || 0;
    const productViews = Number(analytics?.offerProductViews) || 0;

    return (
        <Link href="/shop-manager/analytics" className="block h-full cursor-pointer">
            <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 hover:shadow-md transition-all duration-300 rounded-2xl h-full">
                <div className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4 h-full">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex-shrink-0 self-start sm:self-center mt-1 sm:mt-0">
                        <MousePointerClick className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h3 className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate flex items-center gap-1 mb-1">
                                Audience Engaged On
                            </h3>
                        </div>
                        <div className="flex items-end gap-3.5 sm:gap-5">
                            <div className="flex items-end gap-1.5 sm:gap-2" title="Offers viewed">
                                <Tag className="w-4 h-4 sm:hidden text-primary/70 shrink-0" />
                                <span className="flex items-end text-xl sm:text-[24px] font-black text-gray-900 tracking-tighter leading-none">{isLoading ? 0 : offerViews}</span>
                                <span className="hidden sm:inline text-xs font-semibold text-gray-500">Offers</span>
                            </div>
                            <div className="flex items-end sm:items-end gap-1.5 sm:gap-2" title="Products viewed">
                                <ShoppingBag className="w-4 h-4 sm:hidden text-primary/70 shrink-0" />
                                <span className="flex items-end text-xl sm:text-[24px] font-black text-gray-900 tracking-tighter leading-none">{isLoading ? 0 : productViews}</span>
                                <span className="hidden sm:inline text-xs font-semibold text-gray-500">Products</span>
                            </div>
                        </div>
                    </div>
                </div>
            </PremiumCard>
        </Link>
    );
}

function ActionButton({ icon: Icon, label, href, className, variant = "default", onClick }: { icon: any, label: string, href?: string, className?: string, variant?: "default" | "grid", onClick?: () => void }) {
    const isGrid = variant === "grid";
    const content = (
        <>
            <div className={cn("p-2 rounded-lg transition-all duration-300", isGrid ? "bg-orange-100/50 text-orange-600 group-hover:bg-primary group-hover:text-white" : "bg-primary/10 text-primary group-hover:scale-110")}><Icon className={cn(isGrid ? "w-4 h-4" : "w-5 h-5", className && "text-inherit")} /></div>
            <span className={cn("font-bold transition-colors", isGrid ? "text-[11px] sm:text-xs text-gray-500 group-hover:text-primary mt-1" : "font-medium")}>{label}</span>
        </>
    );
    const baseStyles = cn("flex transition-all duration-300 w-full text-left group", isGrid ? "flex-col items-center justify-center p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-white hover:shadow-lg hover:shadow-primary/5" : "items-center gap-3 p-4 rounded-xl bg-background/40 border border-primary/5 hover:border-primary/30 hover:bg-primary/5", className);
    if (href) return <Link href={href} className={baseStyles}>{content}</Link>;
    return <button onClick={onClick} className={baseStyles}>{content}</button>;
}
