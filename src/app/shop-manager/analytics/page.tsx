"use client";

import { useState, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heading, Text } from "@/components/shared";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BarChart3, Tag, Package, Eye, Search, ChevronLeft,
    ChevronRight, ArrowLeft
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useMyShops, useOfferViewsAnalytics, useProductViewsAnalytics } from "@/hooks";

// Types from the analytics API
interface OfferViewItem {
    offerId: number;
    offerTitle: string;
    views: number;
}

interface ProductViewItem {
    offerProductId: number;
    displayName: string;
    offerId: number | null;
    offerTitle: string | null;
    imageUrl: string | null;
    offerPrice: number | null;
    views: number;
}

// ─── Skeleton for loading state ───
function AnalyticsSkeleton() {
    return (
        <main className="min-h-screen pt-20 lg:pt-22 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4 max-w-4xl">
                <Skeleton className="h-5 w-48 mb-6" />
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-5 w-96 mb-8" />
                <Skeleton className="h-12 w-full max-w-sm mb-6 rounded-xl" />
                <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        </main>
    );
}

// ─── Offer View Row ───
function OfferViewRow({ item, rank }: { item: OfferViewItem; rank: number }) {
    return (
        <Link
            href={`/offer/${item.offerId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 p-2 rounded-xl bg-white border border-gray-100 hover:border-orange-500/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
        >
            {/* Rank */}
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0",
                rank === 1 ? "bg-amber-500 text-white" :
                    rank === 2 ? "bg-slate-300 text-slate-700" :
                        rank === 3 ? "bg-amber-700 text-white" :
                            "bg-gray-100 text-gray-500"
            )}>
                {rank}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[15px] font-bold text-gray-900 truncate">{item.offerTitle}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <span className="text-[15px] font-black text-gray-900 tabular-nums">{item.views}</span>
                </div>
            </div>
        </Link>
    );
}

// ─── Product View Row ───
function ProductViewRow({ item, rank }: { item: ProductViewItem; rank: number }) {
    return (
        <Link
            href={`/product/${item.offerProductId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 sm:gap-4 p-3 rounded-2xl bg-white border border-gray-100 hover:border-orange-500/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
        >
            {/* Rank */}
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0",
                rank === 1 ? "bg-amber-500 text-white" :
                    rank === 2 ? "bg-slate-300 text-slate-700" :
                        rank === 3 ? "bg-amber-700 text-white" :
                            "bg-gray-100 text-gray-500"
            )}>
                {rank}
            </div>

            {/* Product Image */}
            <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                {item.imageUrl ? (
                    <Image
                        src={item.imageUrl}
                        alt={item.displayName}
                        fill
                        unoptimized
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-300" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[15px] font-bold text-gray-900 truncate">{item.displayName}</span>
                        {item.offerPrice != null && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md shrink-0">
                                ₹{item.offerPrice}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <Eye className="w-4 h-4 text-gray-600" />
                        <span className="text-[15px] font-black text-gray-900 tabular-nums">{item.views}</span>
                    </div>
                </div>
                {item.offerTitle && (
                    <div className="flex items-center gap-1 mt-1">
                        <Tag className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="text-[11px] text-gray-400 truncate">{item.offerTitle}</span>
                    </div>
                )}
            </div>
        </Link>
    );
}

// ─── Empty State ───
function EmptyState({ type }: { type: "offers" | "products" }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                {type === "offers" ? (
                    <Tag className="w-7 h-7 text-primary/30" />
                ) : (
                    <Package className="w-7 h-7 text-primary/30" />
                )}
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-1">No {type} engagement yet</h3>
            <p className="text-sm text-gray-400 max-w-xs">
                {type === "offers"
                    ? "Views on your offers will appear here once customers start discovering them."
                    : "Product views will appear here once customers start browsing your catalog."
                }
            </p>
        </div>
    );
}

// ─── Pagination ───
function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-3 pt-6">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className={cn(
                    "p-2 rounded-xl border transition-all duration-200",
                    page <= 1
                        ? "border-gray-100 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 text-gray-600 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                )}
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={cn(
                            "w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200",
                            p === page
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "text-gray-500 hover:bg-gray-100"
                        )}
                    >
                        {p}
                    </button>
                ))}
            </div>
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className={cn(
                    "p-2 rounded-xl border transition-all duration-200",
                    page >= totalPages
                        ? "border-gray-100 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 text-gray-600 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                )}
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}



// ─── Main Content ───
function AnalyticsContent() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("offers");
    const [searchOffer, setSearchOffer] = useState("");
    const [searchProduct, setSearchProduct] = useState("");
    const [offerPage, setOfferPage] = useState(1);
    const [productPage, setProductPage] = useState(1);

    // Redirect unauthenticated users
    if (sessionStatus === "unauthenticated") {
        router.push("/login");
    }

    // Get shop id (session doesn't contain shopId, we need to get it from the user's shops)
    const { data: shopsResponse, isLoading: isLoadingShops } = useMyShops();
    const activeShopId = useMemo(() => {
        const sid = session?.shopId ?? (session?.user as any)?.shopId;
        if (sid) return String(sid);
        if (!shopsResponse?.success || !shopsResponse?.data) return "";
        const result = shopsResponse.data as any;
        const shops = Array.isArray(result) ? result : (result.data || []);
        return shops.length > 0 ? String(shops[0].id) : "";
    }, [session, shopsResponse]);

    // Only trigger search when at least 3 characters are entered
    const offerQuery = useMemo(() => ({
        search: searchOffer.length >= 3 ? searchOffer : undefined,
        page: offerPage,
        limit: 20,
    }), [searchOffer, offerPage]);

    const productQuery = useMemo(() => ({
        search: searchProduct.length >= 3 ? searchProduct : undefined,
        page: productPage,
        limit: 20,
    }), [searchProduct, productPage]);

    // Fetch analytics
    const { data: offerViewsRes, isLoading: isLoadingOffers } = useOfferViewsAnalytics(activeShopId, offerQuery);
    const { data: productViewsRes, isLoading: isLoadingProducts } = useProductViewsAnalytics(activeShopId, productQuery);


    // Parse offer views
    const offerViews = useMemo(() => {
        if (!offerViewsRes?.success || !offerViewsRes?.data) return { items: [] as OfferViewItem[], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } };
        const res = offerViewsRes.data as any;
        const inner = res.data || res;
        return {
            items: (inner.data || []) as OfferViewItem[],
            pagination: inner.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
        };
    }, [offerViewsRes]);

    // Parse product views
    const productViews = useMemo(() => {
        if (!productViewsRes?.success || !productViewsRes?.data) return { items: [] as ProductViewItem[], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } };
        const res = productViewsRes.data as any;
        const inner = res.data || res;
        return {
            items: (inner.data || []) as ProductViewItem[],
            pagination: inner.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
        };
    }, [productViewsRes]);

    const totalOfferViews = useMemo(() => offerViews.items.reduce((sum, i) => sum + i.views, 0), [offerViews.items]);
    const totalProductViews = useMemo(() => productViews.items.reduce((sum, i) => sum + i.views, 0), [productViews.items]);

    if (sessionStatus === "loading") {
        return <AnalyticsSkeleton />;
    }

    return (
        <main className="min-h-screen pt-20 lg:pt-22 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4 max-w-4xl">
                <Breadcrumbs items={[
                    { label: "Dashboard", href: "/shop-manager" },
                    { label: "Analytics" },
                ]} />

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-2">
                    <div>
                        <Heading className="text-2xl sm:text-3xl md:text-4xl mb-1">
                            Audience <span className="text-orange-500">Engagements</span>
                        </Heading>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); }} className="w-full">
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-6">
                        <div className="p-3 border-b border-gray-100">
                            <TabsList className="bg-transparent h-auto p-0 gap-2 w-full sm:w-auto flex">
                                <TabsTrigger
                                    value="offers"
                                    className="flex-1 sm:flex-none rounded-lg px-4 py-2 text-sm font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-700 gap-2 transition-all"
                                >
                                    <Tag className="w-4 h-4" /> Offer Views
                                </TabsTrigger>
                                <TabsTrigger
                                    value="products"
                                    className="flex-1 sm:flex-none rounded-lg px-4 py-2 text-sm font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-700 gap-2 transition-all"
                                >
                                    <Package className="w-4 h-4" /> Product Views
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Offers Tab */}
                        <TabsContent value="offers" className="mt-0 focus-visible:ring-0">
                            <div className="py-2 px-3">
                                {/* Search & Stats Row */}
                                <div className="flex flex-row items-center gap-2 mb-2">
                                    <div className="relative flex-1 w-full">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchOffer}
                                            onChange={(e) => { setSearchOffer(e.target.value); setOfferPage(1); }}
                                            placeholder="Search offers..."
                                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/10 transition-all duration-200 placeholder:text-gray-400"
                                        />
                                    </div>
                                    {!isLoadingOffers && offerViews.items.length > 0 && (
                                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white shrink-0 w-auto justify-center sm:justify-start">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-gray-400 capitalise tracking-widest leading-none mb-1">Total Views</span>
                                                <span className="text-md font-black text-gray-900 leading-none">{totalOfferViews}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                {isLoadingOffers ? (
                                    <div className="space-y-3">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100">
                                                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-4 w-3/4" />
                                                    <Skeleton className="h-2 w-full rounded-full" />
                                                </div>
                                                <Skeleton className="h-5 w-12" />
                                            </div>
                                        ))}
                                    </div>
                                ) : offerViews.items.length === 0 ? (
                                    <EmptyState type="offers" />
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                            {offerViews.items.map((item, index) => (
                                                <OfferViewRow
                                                    key={item.offerId}
                                                    item={item}
                                                    rank={(offerViews.pagination.page - 1) * offerViews.pagination.limit + index + 1}
                                                />
                                            ))}
                                        </div>
                                        <Pagination
                                            page={offerViews.pagination.page}
                                            totalPages={offerViews.pagination.totalPages}
                                            onPageChange={setOfferPage}
                                        />
                                    </>
                                )}
                            </div>
                        </TabsContent>

                        {/* Products Tab */}
                        <TabsContent value="products" className="mt-0 focus-visible:ring-0">
                            <div className="py-2 px-3">
                                {/* Search & Stats Row */}
                                <div className="flex flex-row items-center gap-2 mb-2">
                                    <div className="relative flex-1 w-full">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchProduct}
                                            onChange={(e) => { setSearchProduct(e.target.value); setProductPage(1); }}
                                            placeholder="Search products..."
                                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/10 transition-all duration-200 placeholder:text-gray-400"
                                        />
                                    </div>
                                    {!isLoadingProducts && productViews.items.length > 0 && (
                                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white shrink-0 w-auto justify-center sm:justify-start">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-gray-400 capitalise tracking-widest leading-none mb-1">Total Views</span>
                                                <span className="text-md font-black text-gray-900 leading-none">{totalProductViews}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                {isLoadingProducts ? (
                                    <div className="space-y-3">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100">
                                                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-4 w-3/4" />
                                                    <Skeleton className="h-2 w-full rounded-full" />
                                                </div>
                                                <Skeleton className="h-5 w-12" />
                                            </div>
                                        ))}
                                    </div>
                                ) : productViews.items.length === 0 ? (
                                    <EmptyState type="products" />
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {productViews.items.map((item, index) => (
                                                <ProductViewRow
                                                    key={item.offerProductId}
                                                    item={item}
                                                    rank={(productViews.pagination.page - 1) * productViews.pagination.limit + index + 1}
                                                />
                                            ))}
                                        </div>
                                        <Pagination
                                            page={productViews.pagination.page}
                                            totalPages={productViews.pagination.totalPages}
                                            onPageChange={setProductPage}
                                        />
                                    </>
                                )}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </main>
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<AnalyticsSkeleton />}>
            <AnalyticsContent />
        </Suspense>
    );
}
