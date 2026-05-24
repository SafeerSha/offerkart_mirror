"use client";

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
    MousePointer2, Pencil, ArrowRight, GitBranch, Paintbrush, ShoppingBag
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

// Shared utilities
import { cn, getRelativeTime } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { toast } from "sonner";

// Local components
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { ProductModal } from "@/components/shop-manager/ProductModal";

// Hooks (barrel import)
import {
    useMyShops, useBranches, useAllOffers, useAllProducts,
    useDeleteOffer, useToggleOfferStatus, useCreateProduct,
    useUpdateProduct, useDeleteProduct, useToggleOfferProductStatus,
    useIsMobile
} from "@/hooks";

// API functions
import { getOfferProductById } from "@/lib/api";

function DashboardContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState("offers");
    const [isShopActive, setIsShopActive] = useState(true);

    // ================= API DATA HOOKS =================

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

    // 2. Fetch Offers for current shop
    const { data: offersResponse, isLoading: isLoadingOffers } = useAllOffers(activeShopId || undefined);
    const publishedOffers = useMemo(() => {
        if (!offersResponse?.success || !offersResponse?.data) return [] as any[];
        const result = offersResponse.data as any;
        return (Array.isArray(result) ? result : (result.data || [])) as any[];
    }, [offersResponse]);

    // 3. Fetch Products
    const { data: productsData, isLoading: isLoadingProducts } = useAllProducts(activeShopId || undefined);
    const products = (productsData || []) as Product[];

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

    // ================= MUTATIONS =================
    const { mutateAsync: deleteOfferMutation } = useDeleteOffer();
    const { mutateAsync: toggleStatusMutation } = useToggleOfferStatus();
    const { mutateAsync: createProductMutation } = useCreateProduct();
    const { mutateAsync: updateProductMutation } = useUpdateProduct();
    const { mutateAsync: deleteProductMutation } = useDeleteProduct();
    const { mutateAsync: toggleProductStatusMutation } = useToggleOfferProductStatus();

    // ================= LOCAL UI STATE =================
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [productToEdit, setProductToEdit] = useState<any | null>(null);
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
        const id = String(offer.offerId || offer.id || offer.batchId);
        router.push(`/shop-manager/edit-offer/${id}`);
    };

    const handleDeleteOffer = async (offer: any) => {
        try {
            if (activeShopId) {
                const idToUse = offer.offerId || offer.id || offer.batchId;
                const res = await deleteOfferMutation({ id: String(idToUse), shopId: activeShopId });
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
        // Use the already-fetched product data from useAllProducts — no extra API call needed
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

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "offers" || tab === "products") {
            setActiveTab(tab);
        } else if (tab === "shops") {
            // "shops" tab moved out, redirect to default "offers"
            setActiveTab("offers");
        }
    }, [searchParams]);

    const handleLogout = () => {
        setIsLoggingOut(true);
        signOut({ callbackUrl: "/" });
    };

    return (
        <main className="min-h-screen pt-20 lg:pt-32 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4">
                <Breadcrumbs items={[{ label: "Shop Dashboard" }]} />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <Heading className="text-3xl md:text-4xl lg:text-5xl mb-3">
                            Welcome <span className="text-gradient">{user?.business_name || "Merchant"}</span>
                        </Heading>
                        <Text className="max-w-2xl opacity-80">
                            Manage your shop, list new offers, and track your business performance all in one place.
                        </Text>
                    </div>
                    <div className="grid grid-cols-3 md:flex md:flex-wrap lg:flex-nowrap items-center gap-2 md:gap-3 w-full md:w-auto">
                        <PremiumButton variant="outline" asChild className="rounded-full w-full md:w-auto justify-center px-1 sm:px-3 md:px-4 py-1.5 md:py-2.5 h-auto text-[11px] sm:text-xs md:text-sm">
                            <Link href="/">
                                <span className="hidden sm:inline">Go Home</span>
                                <span className="sm:hidden">Home</span>
                            </Link>
                        </PremiumButton>
                        <PremiumButton asChild className="rounded-full shadow-lg shadow-primary/20 w-full md:w-auto justify-center px-1 sm:px-3 md:px-4 py-1.5 md:py-2.5 h-auto text-[11px] sm:text-xs md:text-sm">
                            <Link href="/shop-manager/create-offer">
                                <span className="hidden sm:inline">Add Offer</span>
                                <span className="sm:hidden">Offer</span>
                            </Link>
                        </PremiumButton>
                        <PremiumButton onClick={() => setShowAddProductModal(true)} className="rounded-full shadow-lg shadow-primary/20 w-full md:w-auto justify-center px-1 sm:px-3 md:px-4 py-1.5 md:py-2.5 h-auto text-[11px] sm:text-xs md:text-sm">
                            <span className="hidden sm:inline">Add Product</span>
                            <span className="sm:hidden">Product</span>
                        </PremiumButton>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mb-12">
                    <div className="md:hidden">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-700">Quick Stats</h3>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span>Swipe to view</span>
                                <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
                            </div>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-1">
                            <div className="w-[85vw] sm:w-[240px] flex-none shrink-0 snap-center">
                                {isLoadingOffers ? (
                                    <Skeleton className="h-24 w-full rounded-2xl" />
                                ) : (
                                    <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl">
                                        <div className="p-3.5 flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">Offers</h3>
                                                    <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-lg whitespace-nowrap">
                                                        <Calendar className="w-2.5 h-2.5" />
                                                        Active
                                                    </div>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <div className="text-xl font-black text-gray-900 tracking-tight">
                                                        {publishedOffers.filter((o: any) => o.status === 'active').length}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-medium truncate">
                                                        / {publishedOffers.filter((o: any) => o.status !== 'active').length} paused
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </PremiumCard>
                                )}
                            </div>
                            <div className="w-[85vw] sm:w-[240px] flex-none shrink-0 snap-center">
                                {isLoadingProducts ? (
                                    <Skeleton className="h-24 w-full rounded-2xl" />
                                ) : (
                                    <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl">
                                        <div className="p-3.5 flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                                                <ShoppingBag className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">Products</h3>
                                                    <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-lg whitespace-nowrap">
                                                        <Calendar className="w-2.5 h-2.5" />
                                                        Active
                                                    </div>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <div className="text-xl font-black text-gray-900 tracking-tight">
                                                        {products.filter((p: any) => p.status === 'active').length}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-medium truncate">
                                                        / {products.filter((p: any) => p.status !== 'active').length} paused
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </PremiumCard>
                                )}
                            </div>
                            <div className="w-[85vw] sm:w-[220px] flex-none shrink-0 snap-center">
                                <StatCard icon={BarChart3} label="Total Views" value="1.2k" trend="+15%" isLoading={isLoadingOffers} />
                            </div>
                            <div className="w-[85vw] sm:w-[220px] flex-none shrink-0 snap-center">
                                <StatCard icon={MousePointer2} label="Engagement" value="48" trend="+8 up" isLoading={isLoadingOffers} />
                            </div>
                            <div className="w-[85vw] sm:w-[220px] flex-none shrink-0 snap-center">
                                <StatCard icon={Tag} label="Conv. Rate" value="4.8%" trend="+0.5%" isLoading={isLoadingOffers} />
                            </div>
                        </div>

                    </div>

                    <div className="hidden md:grid grid-cols-2 xl:grid-cols-5 gap-4">
                        {isLoadingOffers ? (
                            <Skeleton className="h-24 w-full rounded-2xl" />
                        ) : (
                            <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl">
                                <div className="p-4 flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                                        <Package className="w-5 h-5 transition-transform" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">Offers</h3>
                                            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                                <Calendar className="w-3 h-3" />
                                                Live
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <div className="text-2xl font-black text-gray-900 tracking-tighter">
                                                {publishedOffers.filter((o: any) => o.status === 'active').length}
                                            </div>
                                            <span className="text-[11px] text-gray-400 font-medium truncate mt-1">
                                                / {publishedOffers.filter((o: any) => o.status !== 'active').length} paused
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </PremiumCard>
                        )}
                        {isLoadingProducts ? (
                            <Skeleton className="h-24 w-full rounded-2xl" />
                        ) : (
                            <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl">
                                <div className="p-4 flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                                        <ShoppingBag className="w-5 h-5 transition-transform" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">Products</h3>
                                            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                                <Calendar className="w-3 h-3" />
                                                Live
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <div className="text-2xl font-black text-gray-900 tracking-tighter">
                                                {products.filter((p: any) => p.status === 'active').length}
                                            </div>
                                            <span className="text-[11px] text-gray-400 font-medium truncate mt-1">
                                                / {products.filter((p: any) => p.status !== 'active').length} paused
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </PremiumCard>
                        )}
                        <StatCard icon={BarChart3} label="Total Views" value="1.2k" trend="+15% vs last month" isLoading={isLoadingOffers} />
                        <StatCard icon={MousePointer2} label="Audience Engagement" value="48" trend="8 new today" isLoading={isLoadingOffers} />
                        <StatCard icon={Tag} label="Conversion Rate" value="4.8%" trend="+0.5%" isLoading={isLoadingOffers} />
                    </div>

                </div>

                {/* Main Content Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                            shops.length > 0 ? (
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
                                            <div className="grid grid-cols-2 gap-4 w-full mt-4 py-2.5 border-y border-primary/5">
                                                <div className="text-center">
                                                    <div className="text-xs font-bold text-gray-900">{publishedOffers.length}</div>
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Offers</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs font-bold text-gray-900">{products.length}</div>
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Products</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 w-full mt-4">
                                                <Link href={`/shop-manager/${shops[0].id}/branches`} className="w-full">
                                                    <PremiumButton variant="outline" size="sm" className="w-full rounded-xl py-3.5 border-primary/10 hover:border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary gap-1.5">
                                                        <GitBranch className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Branches</span>
                                                    </PremiumButton>
                                                </Link>
                                                <Link href={`/shop-manager/add-shop?id=${shops[0].id}`} className="w-full">
                                                    <PremiumButton variant="outline" size="sm" className="w-full rounded-xl py-3.5 border-primary/10 hover:border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary gap-1.5">
                                                        <Settings className="w-3 h-3" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Manage</span>
                                                    </PremiumButton>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </PremiumCard>
                            ) : (
                                <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                    <div className="h-16 bg-orange-500/[0.08] relative flex items-center justify-center border-b border-primary/5">
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="px-5 pb-6 -mt-8 relative z-10">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-xl shadow-black/5 ring-4 ring-white relative flex items-center justify-center">
                                                <div className="w-full h-full rounded-xl bg-primary/5 flex items-center justify-center overflow-hidden relative">
                                                    <Store className="w-6 h-6 text-primary/30" />
                                                </div>
                                            </div>
                                            <div className="mt-4 w-full">
                                                <h3 className="text-lg font-black text-gray-900 tracking-tight">No Shop Yet</h3>
                                                <p className="text-xs text-gray-500 mt-1.5 mb-5 leading-relaxed">
                                                    Ready to start selling? Create your virtual shop profile to showcase your business.
                                                </p>
                                            </div>
                                            <Link href="/shop-manager/add-shop" className="w-full">
                                                <PremiumButton className="w-full rounded-xl py-3.5 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 border-none hover:scale-[1.02] transition-all duration-300">
                                                    <Plus className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Create Your Shop</span>
                                                </PremiumButton>
                                            </Link>
                                        </div>
                                    </div>
                                </PremiumCard>
                            )
                        )}
                        <PremiumCard variant="glass" padding="none" className="overflow-hidden shadow-lg shadow-black/5">
                            <div className="p-5">
                                <SectionTitle className="mb-4 text-xs text-gray-400 font-bold uppercase tracking-widest">Quick Utilities</SectionTitle>
                                <div className="grid grid-cols-2 gap-3">
                                    <ActionButton icon={Settings} label="Business" href="/shop-manager/shop-settings" variant="grid" />
                                    <ActionButton icon={Paintbrush} label="Designer" href="/shop-manager/poster-designer" variant="grid" />
                                    <ActionButton icon={BarChart3} label="Analysis" variant="grid" />
                                    <ActionButton icon={LogOut} label="Logout" className="text-rose-500" variant="grid" onClick={handleLogout} />
                                </div>
                            </div>
                        </PremiumCard>
                    </div>

                    {/* Tabs Content */}
                    <div className="lg:col-span-2 space-y-6 order-1 scroll-mt-24 md:scroll-mt-32" ref={tabsRef}>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <PremiumCard variant="glass" padding="none" className="overflow-hidden">
                                <div className="p-4 pb-0 border-b border-primary/5">
                                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mb-2">
                                        <TabsList className="bg-primary/5 p-1 gap-1 w-full xs:w-auto">
                                            <TabsTrigger value="offers" className="flex-1 xs:flex-none data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-2 transition-all">
                                                <Tag className="w-4 h-4" /> Offers
                                            </TabsTrigger>
                                            <TabsTrigger value="products" className="flex-1 xs:flex-none data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-2 transition-all">
                                                <Package className="w-4 h-4" /> Products
                                            </TabsTrigger>
                                        </TabsList>
                                        <Link href="#" className="text-sm font-medium text-primary hover:underline px-1">View All</Link>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <TabsContent value="offers" className="mt-0 space-y-3 focus-visible:ring-0">
                                        {isLoadingOffers ? (
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
                                        ) : (
                                            <>
                                                {publishedOffers.length === 0 && (
                                                    <Link href="/shop-manager/create-offer" className="block">
                                                        <div className="p-1 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all group cursor-pointer">
                                                            <div className="flex items-center justify-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                                                                    <Plus className="w-5 h-5 text-primary" />
                                                                </div>
                                                                <div className="text-left"><h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Add Offer</h4></div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                )}
                                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {publishedOffers.length > 0 ? (

                                                        publishedOffers.map((offer, idx) => {
                                                            const id = offer.offerId || offer.batchId || idx;
                                                            const isExpanded = expandedOffers[id] || false;
                                                            return (
                                                                <div key={id} className="relative group rounded-2xl bg-white border border-gray-100 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
                                                                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                        <div className="flex items-center justify-between w-full sm:w-auto flex-1 gap-4 min-w-0 pl-1">
                                                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                                                <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden ring-4 ring-gray-50/50 group-hover:ring-primary/10 transition-all">
                                                                                    {offer.posters?.[0]?.posterSrc || offer.posterSrc ? (
                                                                                        <Image src={offer.posters?.[0]?.posterSrc || offer.posterSrc} alt="" fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                                    ) : (
                                                                                        <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-hover:text-primary transition-colors rotate-12" />
                                                                                    )}
                                                                                </div>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <div className="flex items-center gap-2 mb-1">
                                                                                        <h4 className="font-bold text-sm sm:text-lg text-gray-900 truncate leading-tight group-hover:text-primary transition-colors">{offer.title || "Untitled Offer"}</h4>
                                                                                        <div className={cn("px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm border shrink-0", offer.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-gray-400 border-gray-200")}>{offer.status || "active"}</div>
                                                                                    </div>
                                                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] sm:text-xs">
                                                                                        <div className="flex items-center gap-1.5 text-slate-400 font-medium"><Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /><span className="truncate">{getRelativeTime(offer.createdAt || offer.validFrom) ? `Posted ${getRelativeTime(offer.createdAt || offer.validFrom)}` : "Active"}</span></div>
                                                                                        {(offer.branches || offer.branchNames || offer.branchName) && (
                                                                                            <div className="flex items-center gap-1.5 py-0.5 px-2 rounded-lg bg-orange-50 text-orange-600 font-bold text-[9px] uppercase tracking-wide border border-orange-100">
                                                                                                <GitBranch className="w-3 h-3" />
                                                                                                <span className="truncate max-w-[120px]">{offer.branches ? (offer.branches.length > 1 ? `${offer.branches[0].branchName} +${offer.branches.length - 1}` : offer.branches[0].branchName) : (offer.branchNames ? offer.branchNames[0] : offer.branchName)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => toggleOfferExpand(id)}
                                                                                className="sm:hidden p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-gray-400 hover:text-primary shrink-0"
                                                                                aria-label="Toggle details"
                                                                            >
                                                                                <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", isExpanded ? "rotate-90" : "rotate-0")} />
                                                                            </button>
                                                                        </div>
                                                                        <div className={cn(
                                                                            "sm:flex flex-col sm:flex-row items-center gap-4 sm:gap-8 shrink-0 w-full sm:w-auto transition-all duration-300",
                                                                            isExpanded ? "flex mt-2 pt-3 border-t border-gray-50 sm:mt-0 sm:pt-0 sm:border-t-0" : "hidden sm:flex"
                                                                        )}>
                                                                            <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
                                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 sm:mb-2"><Calendar className="w-3 h-3" /> Offer Validity</div>
                                                                                <div className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                                                                                    <div className="flex flex-col sm:flex-row items-center sm:gap-2"><span className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest leading-none mb-1 sm:mb-0">From</span><span className="text-gray-800">{offer.validFrom ? new Date(offer.validFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toLowerCase() : 'n/a'}</span></div>
                                                                                    <ArrowRight className="w-3 h-3 text-gray-300" />
                                                                                    <div className="flex flex-col sm:flex-row items-center sm:gap-2"><span className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest leading-none mb-1 sm:mb-0">To</span><span className="text-gray-800">{offer.validTo ? new Date(offer.validTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toLowerCase() : 'n/a'}</span></div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex flex-row sm:flex-col items-center gap-3 w-full sm:w-auto justify-between sm:justify-center px-2 sm:px-0 sm:pl-8 border-l-0 sm:border-l border-gray-100">
                                                                                <div className="flex items-center gap-2 group/toggle">
                                                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest transition-colors", offer.status === 'active' ? "text-emerald-500" : "text-gray-400")}>{offer.status === 'active' ? 'Live' : 'Paused'}</span>
                                                                                    <StatusToggleButton status={offer.status || 'active'} onChange={() => handleToggleOfferStatus(offer)} className="scale-90" />
                                                                                </div>
                                                                                <div className="flex gap-2.5">
                                                                                    <button onClick={() => openEditModal(offer)} className="flex items-center justify-center p-2 sm:p-3 rounded-xl bg-gray-50 text-gray-400 hover:bg-primary hover:text-secondary hover:shadow-lg transition-all duration-300" title="Edit offer"><Pencil className="w-4 h-4" /></button>
                                                                                    <button onClick={() => setOfferToDelete(offer)} className="flex items-center justify-center p-2 sm:p-3 rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-500 hover:text-white hover:shadow-lg transition-all duration-300" title="Delete offer"><Trash2 className="w-4 h-4" /></button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="p-8 rounded-xl border border-dashed border-primary/10 opacity-60 flex flex-col items-center justify-center text-center">
                                                            <Tag className="w-12 h-12 mb-4 text-primary/30" /><p className="text-sm font-medium mb-1">No offers published yet</p><p className="text-xs opacity-60 italic">Your active offers will appear here</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="products" className="mt-0 space-y-3 focus-visible:ring-0">
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
                                                products.map((product) => (
                                                    <div key={product.id} className="group relative flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-white hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden">

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
                                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                                                    <ShoppingBag className="w-6 h-6 text-gray-300" />
                                                                </div>
                                                            )}
                                                            <div className="absolute top-1 left-1"><div className="px-1 py-0.5 rounded bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100"><p className="text-[8px] font-black text-primary uppercase tracking-tighter">New</p></div></div>
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
                                                                {product.originalPrice && (
                                                                    <span className="text-[9px] text-red-500 line-through font-medium">
                                                                        ₹{product.originalPrice}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-row gap-1 items-center">
                                                                <button onClick={() => handleEditProduct(product)} className="flex items-center justify-center p-1.5 rounded-lg bg-white border border-gray-100 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm" title="Edit product"><Pencil className="w-3 h-3" /></button>
                                                                <button onClick={() => setProductToDelete(product)} className="flex items-center justify-center p-1.5 rounded-lg bg-white border border-gray-100 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm" title="Delete product"><Trash2 className="w-3 h-3" /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full p-6 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 text-center"><div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4"><Package className="w-8 h-8 text-primary/20" /></div><p className="text-base font-bold text-gray-900">Your Catalog is Empty</p><p className="text-sm text-gray-500 max-w-xs mt-1 mb-4">Start adding products to showcase them to your customers.</p><PremiumButton onClick={() => setShowAddProductModal(true)} className="rounded-xl shadow-lg shadow-primary/20"><Plus className="w-4 h-4 mr-2" />Add Product</PremiumButton></div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </div>
                            </PremiumCard>
                        </Tabs>
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

            {/* Product Add Modal */}
            <ProductModal
                open={showAddProductModal}
                onOpenChange={setShowAddProductModal}
                product={null}
                onSubmit={handleCreateProduct}
                availableBranches={branches}
            />

            {/* Product Edit Modal */}
            <ProductModal
                open={!!productToEdit}
                onOpenChange={(open) => { if (!open) setProductToEdit(null); }}
                product={productToEdit}
                onSubmit={handleUpdateProduct}
                availableBranches={branches}
            />

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

            {/* Logo Preview */}
            {previewLogo && <ImagePreviewModal src={previewLogo.src} alt={previewLogo.name} isOpen={!!previewLogo} onClose={() => setPreviewLogo(null)} />}
        </main>
    );
}

export default function ShopManagerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>}>
            <DashboardContent />
        </Suspense>
    );
}

function StatCard({ icon: Icon, label, value, trend, isLoading }: { icon: any, label: string, value: string, trend: string, isLoading?: boolean }) {
    if (isLoading) {
        return <Skeleton className="h-20 w-full rounded-2xl" />;
    }
    return (
        <PremiumCard variant="glass" padding="none" className="overflow-hidden group hover:border-primary/30 transition-all duration-300 rounded-2xl h-full">
            <div className="p-4 flex items-center gap-3 h-full">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex-shrink-0"><Icon className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5"><h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">{label}</h3></div>
                    <div className="flex items-end justify-between gap-2"><div className="text-2xl font-black text-gray-900 tracking-tighter leading-none shrink-0">{value}</div><div className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-lg whitespace-nowrap mb-0.5">{trend}</div></div>
                </div>
            </div>
        </PremiumCard>
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
