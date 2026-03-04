"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Heading, Text, SectionTitle } from "@/components/shared/Typography";
import { getMyShops } from "@/lib/api/shop";
import { toast } from "sonner";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import {
    AlertTriangle,
    ArrowUpRight,
    BarChart3,
    ChevronRight,
    Clock,
    Eye,
    Filter,
    GitBranch,
    Info,
    LayoutDashboard,
    LogOut,
    MapPin,
    MoreVertical,
    MousePointer2,
    Package,
    Plus,
    Power,
    Search,
    Settings,
    Store,
    Tag,
    Ticket,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ImagePreviewModal } from "@/components/shared/ImagePreviewModal";
import { storage } from "@/lib/storage";

function DashboardContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get("tab") === "shops" ? "shops" : "offers";
        }
        return "offers";
    });

    const [isShopActive, setIsShopActive] = useState(true);
    const [shops, setShops] = useState<any[]>([]);
    const [isLoadingShops, setIsLoadingShops] = useState(true);
    const [publishedOffers, setPublishedOffers] = useState<any[]>([]);
    const [isLoadingOffers, setIsLoadingOffers] = useState(true);
    const [previewLogo, setPreviewLogo] = useState<{ src: string, name: string } | null>(null);
    const tabsRef = useRef<HTMLDivElement>(null);
    const user = session?.user as any;

    useEffect(() => {
        async function fetchShops() {
            try {
                const response = await getMyShops();

                if (response.success && response.data) {
                    const result = response.data as any;
                    // Handle both { data: [...] } and direct [...] response structures
                    const shopList = Array.isArray(result) ? result : (result.data || []);
                    setShops(Array.isArray(shopList) ? shopList : []);
                } else {
                    console.error("Failed to fetch shops:", response.error);
                    toast.error(`Failed to load shops: ${response.error || "Unknown error"}`);
                }
            } catch (error: any) {
                console.error("Error fetching shops:", error);
                toast.error(`Network error: ${error.message || "Could not reach server"}`);
            } finally {
                setIsLoadingShops(false);
            }
        }

        if (session) {
            fetchShops();
        }
    }, [session]);

    useEffect(() => {
        async function fetchOffers() {
            try {
                const stored = await storage.getItem<any[]>("markedPosters");
                if (stored) {
                    setPublishedOffers(stored);
                }
            } catch (error) {
                console.error("Error fetching offers:", error);
            } finally {
                setIsLoadingOffers(false);
            }
        }
        fetchOffers();
    }, []);

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "shops") {
            setActiveTab("shops");

            const scrollTimeout = setTimeout(() => {
                if (tabsRef.current) {
                    const elementPosition = tabsRef.current.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = elementPosition - 120;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            }, 800);
            return () => clearTimeout(scrollTimeout);
        } else if (tab === "offers") {
            setActiveTab("offers");
        }
    }, [searchParams]);

    const handleLogout = () => {
        signOut({ callbackUrl: "/" });
    };

    return (
        <main className="min-h-screen pt-20 lg:pt-32 pb-12 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <div className="container mx-auto px-4">
                <Breadcrumbs
                    items={[{ label: "Shop Dashboard" }]}
                />
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <LayoutDashboard className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Shop Manager</span>
                        </div>
                        <Heading className="text-3xl md:text-4xl lg:text-5xl mb-3">
                            Welcome <span className="text-gradient">{user?.business_name || "Merchant"}</span>
                        </Heading>
                        <Text className="max-w-2xl opacity-80">
                            Manage your shop, list new offers, and track your business performance all in one place.
                        </Text>
                    </div>
                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
                        <PremiumButton variant="outline" asChild className="rounded-full">
                            <Link href="/">Go Home</Link>
                        </PremiumButton>
                        <PremiumButton asChild className="rounded-full shadow-lg shadow-primary/20">
                            <Link href="/shop-manager/create-offer">Add New Offer</Link>
                        </PremiumButton>
                        <PremiumButton asChild className="rounded-full shadow-lg shadow-primary/20">
                            <Link href="/shop-manager/create-offer">Add Product</Link>
                        </PremiumButton>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mb-12">
                    {/* Mobile: Horizontal Scroll */}
                    <div className="md:hidden">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-700">Quick Stats</h3>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span>Swipe to view</span>
                                <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
                            </div>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                            <div className="min-w-[280px] snap-start">
                                <StatCard
                                    icon={Package}
                                    label="Active Offers"
                                    value="12"
                                    trend="+3 this week"
                                />
                            </div>
                            <div className="min-w-[280px] snap-start">
                                <StatCard
                                    icon={BarChart3}
                                    label="Total Views"
                                    value="1.2k"
                                    trend="+15% vs last month"
                                />
                            </div>
                            <div className="min-w-[280px] snap-start">
                                <StatCard
                                    icon={MousePointer2}
                                    label="Audience Engagement"
                                    value="48"
                                    trend="8 new today"
                                />
                            </div>
                            <div className="min-w-[280px] snap-start">
                                <StatCard
                                    icon={Tag}
                                    label="Conversion Rate"
                                    value="4.8%"
                                    trend="+0.5%"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Desktop: Grid */}
                    <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            icon={Package}
                            label="Active Offers"
                            value="12"
                            trend="+3 this week"
                        />
                        <StatCard
                            icon={BarChart3}
                            label="Total Views"
                            value="1.2k"
                            trend="+15% vs last month"
                        />
                        <StatCard
                            icon={MousePointer2}
                            label="Audience Engagement"
                            value="48"
                            trend="8 new today"
                        />
                        <StatCard
                            icon={Tag}
                            label="Conversion Rate"
                            value="4.8%"
                            trend="+0.5%"
                        />
                    </div>
                </div>

                {/* Main Content Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Quick Links & Actions - Shows second on mobile, second on desktop */}
                    <div className="lg:col-span-1 space-y-6 order-2">
                        {/* Compact Shop Status */}
                        <PremiumCard variant="glass" className={cn(
                            "overflow-hidden border-l-4",
                            isShopActive ? "border-l-emerald-500" : "border-l-rose-500"
                        )}>
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            isShopActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                                        )} />
                                        <span className="text-sm font-bold uppercase tracking-wider text-gray-700">
                                            {isShopActive ? "Online" : "Offline"}
                                        </span>
                                    </div>

                                    {/* Modern Premium Master Toggle */}
                                    <button
                                        onClick={() => setIsShopActive(!isShopActive)}
                                        className={cn(
                                            "relative w-14 h-8 rounded-full transition-all duration-500 p-1 flex items-center shadow-inner",
                                            isShopActive
                                                ? "bg-emerald-500 shadow-emerald-900/20"
                                                : "bg-gray-200 shadow-gray-400/20"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute inset-0 rounded-full transition-opacity duration-500",
                                            isShopActive ? "bg-gradient-to-br from-white/20 to-transparent opacity-100" : "opacity-0"
                                        )} />

                                        <div className={cn(
                                            "relative w-6 h-6 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-all duration-500 transform flex items-center justify-center",
                                            isShopActive ? "translate-x-6" : "translate-x-0"
                                        )}>
                                            <Power className={cn(
                                                "w-3 h-3 transition-colors duration-500",
                                                isShopActive ? "text-emerald-500" : "text-gray-400"
                                            )} />
                                        </div>
                                    </button>
                                </div>
                                <Text className="text-xs leading-relaxed opacity-70 mb-3">
                                    &ldquo;Deactivating hides all live offers and products instantly.&rdquo;
                                </Text>

                                {/* Permanent Status Bar to prevent layout jumps */}
                                <div className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg border transition-all duration-300",
                                    isShopActive
                                        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                        : "bg-rose-50 border-rose-100 text-rose-700"
                                )}>
                                    {isShopActive ? (
                                        <>
                                            <Store className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight">Shop is Visible</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight">Shop is Hidden</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </PremiumCard>


                        <PremiumCard variant="glass" padding="none">
                            <div className="p-6">
                                <SectionTitle>Quick Actions</SectionTitle>
                                <div className="grid grid-cols-1 gap-3">
                                    <ActionButton icon={Settings} label="Business Settings" href="/shop-manager/shop-settings" />
                                    <ActionButton icon={Store} label="View Public Profile" />
                                    <div className="pt-3 mt-3 border-t border-primary/10">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/20 hover:border-rose-500/40 hover:from-rose-500/20 hover:to-orange-500/20 transition-all w-full text-left group cursor-pointer"
                                        >
                                            <LogOut className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                                            <span className="font-medium bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">Logout</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>

                        <PremiumCard className="bg-primary/5 border-primary/20">
                            <div className="p-6">
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-primary" />
                                    Pro Tip
                                </h4>
                                <Text className="text-sm leading-relaxed">
                                    Keep your offers fresh! Updating your deals weekly signals to customers that your shop is active, leading to higher trust and repeat visits.
                                </Text>
                            </div>
                        </PremiumCard>
                    </div>

                    {/* Main Content Tabs - Shows first on mobile, first on desktop */}
                    <div className="lg:col-span-2 space-y-6 order-1 scroll-mt-24 md:scroll-mt-32" ref={tabsRef}>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <PremiumCard variant="glass" padding="none" className="overflow-hidden">
                                <div className="p-6 pb-0 border-b border-primary/5">
                                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mb-2">
                                        <TabsList className="bg-primary/5 p-1 gap-1 w-full xs:w-auto">
                                            <TabsTrigger value="offers" className="flex-1 xs:flex-none data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-2 transition-all">
                                                <Tag className="w-4 h-4" />
                                                Offers
                                            </TabsTrigger>
                                            <TabsTrigger value="shops" className="flex-1 xs:flex-none data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-2 transition-all">
                                                <Store className="w-4 h-4" />
                                                Shop
                                            </TabsTrigger>
                                        </TabsList>
                                        <Link href="#" className="text-sm font-medium text-primary hover:underline px-1">View All</Link>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <TabsContent value="offers" className="mt-0 space-y-4 focus-visible:ring-0">
                                        <div className="space-y-4">
                                            {isLoadingOffers ? (
                                                <div className="p-4 flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                                </div>
                                            ) : publishedOffers.length > 0 ? (
                                                publishedOffers.map((offer, idx) => (
                                                    <div key={offer.batchId || idx} className="p-3 sm:p-4 rounded-xl bg-background/40 border border-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/20 transition-all">
                                                        <div className="flex items-center gap-3 sm:gap-4">
                                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                                {offer.posters?.[0]?.posterSrc || offer.posterSrc ? (
                                                                    <img
                                                                        src={offer.posters?.[0]?.posterSrc || offer.posterSrc}
                                                                        className="w-full h-full object-cover"
                                                                        alt=""
                                                                    />
                                                                ) : (
                                                                    <Store className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-semibold text-base sm:text-lg truncate">{offer.title || "Untitled Offer"}</h4>
                                                                <p className="text-[11px] sm:text-sm opacity-60">
                                                                    {offer.createdAt ? `Posted ${new Date(offer.createdAt).toLocaleDateString()}` : "Active"} • {offer.status || "Active"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-primary/5">
                                                            <div className="font-bold text-primary text-base sm:text-lg">
                                                                {offer.posters?.length || 1} {(offer.posters?.length || 1) === 1 ? 'Poster' : 'Posters'}
                                                            </div>
                                                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Classification</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 rounded-xl border border-dashed border-primary/10 opacity-60 flex flex-col items-center justify-center text-center">
                                                    <Tag className="w-12 h-12 mb-4 text-primary/30" />
                                                    <p className="text-sm font-medium mb-1">No offers published yet</p>
                                                    <p className="text-xs opacity-60 italic">Your active offers will appear here</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="shops" className="mt-0 space-y-4 focus-visible:ring-0">
                                        {/* Add Shop Button - Only show if no shops exist */}
                                        {shops.length === 0 && (
                                            <Link href="/shop-manager/add-shop" className="block">
                                                <div className="p-1 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all group cursor-pointer">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                                                            <Plus className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div className="text-left">
                                                            <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Add New Shop</h4>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        )}

                                        <div className="space-y-4">
                                            {isLoadingShops ? (
                                                <div className="space-y-3">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="p-3 sm:p-4 rounded-xl border border-primary/5 bg-background/40 animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3 sm:gap-4">
                                                                {/* Logo placeholder */}
                                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-200 shrink-0" />
                                                                <div className="space-y-2">
                                                                    {/* Shop name */}
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-5 w-28 sm:w-36 bg-gray-200 rounded" />
                                                                        <div className="w-2 h-2 rounded-full bg-gray-200" />
                                                                    </div>
                                                                    {/* Location + badge */}
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-3 w-20 bg-gray-200 rounded" />
                                                                        <div className="h-4 w-14 bg-gray-200 rounded-full" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Action buttons */}
                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <div className="h-9 w-24 bg-gray-200 rounded-lg" />
                                                                <div className="h-9 w-24 bg-gray-200 rounded-lg" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : shops.length > 0 ? (
                                                <div className="space-y-3">
                                                    {shops.map((shop) => (
                                                        <div key={shop.id} className="p-3 sm:p-4 rounded-xl bg-background/40 border border-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/20 hover:bg-background/60 transition-all">
                                                            <div className="flex items-center gap-3 sm:gap-4">
                                                                <div
                                                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/5 flex items-center justify-center overflow-hidden border border-primary/10 relative shadow-sm shrink-0 cursor-pointer group/logo"
                                                                    onClick={() => shop.logo_url && setPreviewLogo({ src: shop.logo_url, name: shop.shop_name })}
                                                                >
                                                                    <div className="absolute inset-0 flex items-center justify-center text-primary/20">
                                                                        <Store className="w-5 h-5 sm:w-6 sm:h-6" />
                                                                    </div>
                                                                    {shop.logo_url && (
                                                                        <>
                                                                            <img
                                                                                src={shop.logo_url}
                                                                                alt={shop.shop_name}
                                                                                className="w-full h-full object-cover group-hover/logo:scale-110 transition-transform duration-300 relative z-10"
                                                                                onError={(e) => {
                                                                                    (e.currentTarget as HTMLImageElement).classList.add('opacity-0');
                                                                                }}
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity z-20">
                                                                                <Eye className="w-5 h-5 text-white" />
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                                                                        <h4 className="font-bold text-base sm:text-lg leading-tight tracking-tight truncate">{shop.shop_name}</h4>
                                                                        {shop.is_active && (
                                                                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0" title="Active" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-sm">
                                                                        <div className="flex items-center gap-1 opacity-60">
                                                                            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                                            <span className="truncate max-w-[80px] sm:max-w-none">{shop.city}</span>
                                                                        </div>
                                                                        <span className="hidden xs:block w-1 h-1 rounded-full bg-primary/20" />
                                                                        <span className={cn(
                                                                            "text-[9px] sm:text-[10px] uppercase font-bold tracking-widest",
                                                                            shop.is_active ? "text-green-500/80" : "text-red-500/80"
                                                                        )}>
                                                                            {shop.is_active ? "Active" : "Inactive"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col xs:flex-row w-full sm:w-auto gap-2">
                                                                <Link href={`/shop-manager/${shop.id}/branches`} className="w-full sm:w-auto">
                                                                    <PremiumButton variant="ghost" size="sm" className="w-full sm:w-auto h-9 px-5 gap-2 transition-all duration-200 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg border border-orange-200/60 hover:border-orange-300 hover:-translate-y-0.5 shadow-sm group/branches">
                                                                        <GitBranch className="w-3.5 h-3.5" />
                                                                        <span className="text-xs font-semibold uppercase tracking-wider">Branches</span>
                                                                        <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover/branches:translate-x-0.5" />
                                                                    </PremiumButton>
                                                                </Link>
                                                                <Link href={`/shop-manager/add-shop?id=${shop.id}`} className="w-full sm:w-auto group/manage">
                                                                    <PremiumButton variant="ghost" size="sm" className="w-full sm:w-auto h-9 px-5 gap-2 transition-all duration-200 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200/60 hover:border-gray-300 hover:-translate-y-0.5 shadow-sm">
                                                                        <Settings className="w-3.5 h-3.5" />
                                                                        <span className="text-xs font-semibold uppercase tracking-wider">Manage</span>
                                                                        <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover/manage:translate-x-0.5" />
                                                                    </PremiumButton>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-8 rounded-xl border border-dashed border-primary/10 opacity-60 flex flex-col items-center justify-center text-center">
                                                    <Store className="w-12 h-12 mb-4 text-primary/30" />
                                                    <p className="text-sm font-medium mb-1">No shops found</p>
                                                    <p className="text-xs opacity-60 italic">Your added shops will appear here</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </div>
                            </PremiumCard>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewLogo && (
                <ImagePreviewModal
                    src={previewLogo.src}
                    alt={previewLogo.name}
                    isOpen={!!previewLogo}
                    onClose={() => setPreviewLogo(null)}
                />
            )}
        </main>
    );
}

export default function ShopManagerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}

function StatCard({ icon: Icon, label, value, trend }: { icon: any, label: string, value: string, trend: string }) {
    return (
        <PremiumCard variant="glass" className="group hover:border-primary/30 transition-all duration-300">
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                        {trend}
                    </span>
                </div>
                <h3 className="text-sm font-medium opacity-60 mb-1">{label}</h3>
                <div className="text-3xl font-bold text-gradient">{value}</div>
            </div>
        </PremiumCard>
    );
}

function ActionButton({ icon: Icon, label, href, className }: { icon: any, label: string, href?: string, className?: string }) {
    const content = (
        <>
            <Icon className={cn("w-5 h-5 text-primary group-hover:scale-110 transition-transform", className && "text-inherit")} />
            <span className="font-medium">{label}</span>
        </>
    );

    const baseStyles = cn(
        "flex items-center gap-3 p-4 rounded-xl bg-background/40 border border-primary/5 hover:border-primary/30 hover:bg-primary/5 transition-all w-full text-left group",
        className
    );

    if (href) {
        return (
            <Link href={href} className={baseStyles}>
                {content}
            </Link>
        );
    }

    return (
        <button className={baseStyles}>
            {content}
        </button>
    );
}
