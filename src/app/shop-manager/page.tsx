"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Heading, Text, SectionTitle } from "@/components/shared/Typography";
import { getMyShops } from "@/lib/api/shop";
import { toast } from "sonner";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { PremiumDatePicker } from "@/components/shared/PremiumDatePicker";
import { AppModal } from "@/components/shared/AppModal";
import { MultiSearchableSelect } from "@/components/shared/MultiSearchableSelect";
import { getBranches } from "@/lib/api/branch";
import { s3Api } from "@/lib/api/s3";
import { Branch } from "@/lib/types/branch";
import {
    AlertTriangle,
    ArrowUpRight,
    ArrowUp,
    ArrowDown,
    Image as ImageIcon,
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
    Loader2,
    Pencil,
    Trash2,
    Type,
    Calendar,
} from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ImagePreviewModal } from "@/components/shared/ImagePreviewModal";
import { StatusToggleButton } from "@/components/shared/StatusToggleButton";
import { storage } from "@/lib/storage";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

function DashboardContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const isMobile = useIsMobile();
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

    // Date range state for offers filter
    const getWeekStart = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(now.setDate(diff));
    };
    const getWeekEnd = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? 0 : 7);
        return new Date(now.setDate(diff));
    };
    const [dateFrom, setDateFrom] = useState<Date>(getWeekStart);
    const [dateTo, setDateTo] = useState<Date>(getWeekEnd);
    const [showDatePopup, setShowDatePopup] = useState(false);
    const [previewLogo, setPreviewLogo] = useState<{ src: string, name: string, markedItems?: any[] } | null>(null);
    const tabsRef = useRef<HTMLDivElement>(null);
    const user = session?.user as any;

    // Edit offer state
    const [editingOffer, setEditingOffer] = useState<any | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editValidFrom, setEditValidFrom] = useState<Date>();
    const [editValidTo, setEditValidTo] = useState<Date>();
    const [editBranchIds, setEditBranchIds] = useState<string[]>([]);
    const [editBranches, setEditBranches] = useState<Branch[]>([]);
    const [editStatus, setEditStatus] = useState("active");
    const [editIsActive, setEditIsActive] = useState(true);
    const [editPosters, setEditPosters] = useState<any[]>([]);
    const [isSavingOffer, setIsSavingOffer] = useState(false);
    const [posterActionIndex, setPosterActionIndex] = useState<number | null>(null);

    // Delete offer state
    const [offerToDelete, setOfferToDelete] = useState<any | null>(null);

    // Logout state
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [openTooltipIndex, setOpenTooltipIndex] = useState<number | null>(null);

    // Revert to mark logic
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

            // Save to current session
            await storage.setItem("currentEditingPosters", editingPosters);

            // Remove from published
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

    // Open edit modal and pre-fill values
    const openEditModal = async (offer: any) => {
        setEditingOffer(offer);
        setEditTitle(offer.title || "");
        setEditValidFrom(offer.validFrom ? new Date(offer.validFrom) : undefined);
        setEditValidTo(offer.validTo ? new Date(offer.validTo) : undefined);
        setEditBranchIds(offer.branchIds ? offer.branchIds.map(String) : (offer.branchId ? [String(offer.branchId)] : []));
        setEditStatus(offer.status || "active");
        setEditIsActive(offer.status === 'active');
        setEditPosters(offer.posters ? offer.posters.map((p: any, i: number) => ({ ...p, order: p.order || i + 1 })) : (offer.posterSrc ? [{ id: '1', posterSrc: offer.posterSrc, type: 'legacy', order: 1 }] : []));

        // Fetch branches for the dropdown
        try {
            let shopId = session?.shopId ?? (session?.user as any)?.shopId;
            if (!shopId) {
                const shopRes = await getMyShops();
                if (shopRes.success && shopRes.data) {
                    const shopList = Array.isArray(shopRes.data) ? shopRes.data : (shopRes.data as any).data || [];
                    if (shopList.length > 0) {
                        shopId = shopList[0].id;
                    }
                }
            }
            if (shopId) {
                const res = await getBranches(shopId);
                if (res.success && res.data) {
                    const list = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
                    setEditBranches(Array.isArray(list) ? list : []);
                }
            }
        } catch (error) {
            console.error("Failed to fetch branches for edit modal:", error);
        }
    };

    // Save current modal state and edit single poster
    const handleEditSinglePoster = async (posterIndex: number) => {
        if (!editingOffer) return;

        try {
            // Re-construct the updated offer payload
            const selectedBranches = editBranches.filter((b) => editBranchIds.includes(String(b.id)));
            const updatedOfferSnapshot = {
                ...editingOffer,
                title: editTitle,
                validFrom: editValidFrom ? editValidFrom.toISOString().split('T')[0] : editingOffer.validFrom,
                validTo: editValidTo ? editValidTo.toISOString().split('T')[0] : editingOffer.validTo,
                branchIds: selectedBranches.length > 0 ? selectedBranches.map((b) => b.id) : editingOffer.branchIds,
                branchNames: selectedBranches.length > 0 ? selectedBranches.map((b) => b.branch_name) : editingOffer.branchNames,
                branchCity: selectedBranches.length > 0 ? selectedBranches[0]?.city : editingOffer.branchCity,
                status: editIsActive ? 'active' : 'paused',
                isActive: editIsActive,
                posters: editPosters.length > 0 ? [...editPosters] : editingOffer.posters,
            };

            const stored = await storage.getItem<any[]>("markedPosters") || [];
            const updated = [...stored];
            const idx = updated.findIndex((o) => o.batchId === editingOffer.batchId);

            if (idx > -1) {
                updated[idx] = updatedOfferSnapshot;
            } else {
                updated.push(updatedOfferSnapshot);
            }

            await storage.setItem("markedPosters", updated);

            // Redirect to editor scoped to this offer and index
            router.push(`/shop-manager/create-offer/editor?edit=${editingOffer.batchId}&poster=${posterIndex}`);
        } catch (error) {
            console.error("Failed to save state before editing:", error);
            toast.error("Failed to save progress before editing");
        }
    };

    // Save edited offer
    const handleSaveOffer = async () => {
        if (!editingOffer) return;
        setIsSavingOffer(true);
        try {
            const stored = await storage.getItem<any[]>("markedPosters");
            if (stored) {
                const selectedBranches = editBranches.filter((b) => editBranchIds.includes(String(b.id)));
                const updated = stored.map((o) => {
                    if (o.batchId === editingOffer.batchId) {
                        return {
                            ...o,
                            title: editTitle,
                            validFrom: editValidFrom ? editValidFrom.toISOString().split('T')[0] : o.validFrom,
                            validTo: editValidTo ? editValidTo.toISOString().split('T')[0] : o.validTo,
                            branchIds: selectedBranches.length > 0 ? selectedBranches.map((b) => b.id) : o.branchIds,
                            branchNames: selectedBranches.length > 0 ? selectedBranches.map((b) => b.branch_name) : o.branchNames,
                            branchCity: selectedBranches.length > 0 ? selectedBranches[0]?.city : o.branchCity,
                            status: editIsActive ? 'active' : 'paused',
                            isActive: editIsActive,
                            posters: editPosters.length > 0 ? editPosters : o.posters,
                        };
                    }
                    return o;
                });
                await storage.setItem("markedPosters", updated);
                setPublishedOffers(updated);
                toast.success("Offer updated successfully");
            }
        } catch {
            toast.error("Failed to update offer");
        } finally {
            setIsSavingOffer(false);
            setEditingOffer(null);
        }
    };

    // Delete offer
    const handleDeleteOffer = async (offer: any) => {
        try {
            const stored = await storage.getItem<any[]>("markedPosters");
            if (stored) {
                const updated = stored.filter((o) => o.batchId !== offer.batchId);
                await storage.setItem("markedPosters", updated);
                setPublishedOffers(updated);
                toast.success("Offer deleted");
            }
        } catch {
            toast.error("Failed to delete offer");
        } finally {
            setOfferToDelete(null);
        }
    };

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
        setIsLoggingOut(true);
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
                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-1">
                            <div className="w-[85vw] sm:w-[280px] flex-none shrink-0 snap-center">
                                <PremiumCard variant="glass" className="group hover:border-primary/30 transition-all duration-300 h-full">
                                    <div className="p-5 sm:p-6">
                                        <div className="flex items-start justify-between mb-0">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <button
                                                onClick={() => setShowDatePopup(true)}
                                                className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full hover:bg-emerald-500/20 transition-colors cursor-pointer"
                                            >
                                                <Calendar className="w-3.5 h-3.5" />
                                                This Week
                                            </button>
                                        </div>
                                        <h3 className="text-sm font-medium opacity-60 mb-1">Offers</h3>
                                        <div className="flex items-baseline gap-3">
                                            <div className="text-3xl font-bold text-gradient">
                                                {publishedOffers.filter(o => o.status === 'active').length}
                                            </div>
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                                / {publishedOffers.filter(o => o.status !== 'active').length} inactive
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] sm:text-xs text-muted-foreground w-full">
                                            <span className="text-emerald-500 font-medium truncate">+{publishedOffers.filter(o => o.status === 'active' && new Date(o.lastEdited || o.createdAt || new Date()) >= dateFrom).length} new active</span>
                                            <span className="opacity-50 shrink-0">|</span>
                                            <span className="text-gray-400 truncate">+{publishedOffers.filter(o => o.status !== 'active' && new Date(o.lastEdited || o.createdAt || new Date()) >= dateFrom).length} paused</span>
                                        </div>
                                    </div>
                                </PremiumCard>
                            </div>
                            <div className="w-[85vw] sm:w-[280px] flex-none shrink-0 snap-center">
                                <StatCard
                                    icon={BarChart3}
                                    label="Total Views"
                                    value="1.2k"
                                    trend="+15% vs last month"
                                />
                            </div>
                            <div className="w-[85vw] sm:w-[280px] flex-none shrink-0 snap-center">
                                <StatCard
                                    icon={MousePointer2}
                                    label="Audience Engagement"
                                    value="48"
                                    trend="8 new today"
                                />
                            </div>
                            <div className="w-[85vw] sm:w-[280px] flex-none shrink-0 snap-center">
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
                        <PremiumCard variant="glass" className="group hover:border-primary/30 transition-all duration-300">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <button
                                        onClick={() => setShowDatePopup(true)}
                                        className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full hover:bg-emerald-500/20 transition-colors cursor-pointer"
                                    >
                                        <Calendar className="w-3.5 h-3.5" />
                                        This Week
                                    </button>
                                </div>
                                <h3 className="text-sm font-medium opacity-60 mb-1">Offers</h3>
                                <div className="flex items-baseline gap-3">
                                    <div className="text-3xl font-bold text-gradient">
                                        {publishedOffers.filter(o => o.status === 'active').length}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        / {publishedOffers.filter(o => o.status !== 'active').length} inactive
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] xl:text-xs text-muted-foreground w-full">
                                    <span className="text-emerald-500 font-medium truncate">+{publishedOffers.filter(o => o.status === 'active' && new Date(o.lastEdited || o.createdAt || new Date()) >= dateFrom).length} new active</span>
                                    <span className="opacity-50 shrink-0">|</span>
                                    <span className="text-gray-400 truncate">+{publishedOffers.filter(o => o.status !== 'active' && new Date(o.lastEdited || o.createdAt || new Date()) >= dateFrom).length} paused</span>
                                </div>
                            </div>
                        </PremiumCard>
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
                                            disabled={isLoggingOut}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/20 hover:border-rose-500/40 hover:from-rose-500/20 hover:to-orange-500/20 transition-all w-full text-left group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoggingOut ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
                                                    <span className="font-medium bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">Logging out...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <LogOut className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                                                    <span className="font-medium bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">Logout</span>
                                                </>
                                            )}
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
                                        {/* Add Offer Button - Only show if no offers exist */}
                                        {!isLoadingOffers && publishedOffers.length === 0 && (
                                            <Link href="/shop-manager/create-offer" className="block">
                                                <div className="p-1 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all group cursor-pointer">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                                                            <Plus className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div className="text-left">
                                                            <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Add New Offer</h4>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        )}

                                        <div className="space-y-4">
                                            {isLoadingOffers ? (
                                                <div className="p-4 flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                                </div>
                                            ) : publishedOffers.length > 0 ? (
                                                publishedOffers.map((offer, idx) => (
                                                    <div key={offer.batchId || idx} className="p-3 sm:p-4 rounded-xl bg-background/40 border border-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/20 transition-all">
                                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                                {offer.posters?.[0]?.posterSrc || offer.posterSrc ? (
                                                                    <Image
                                                                        src={offer.posters?.[0]?.posterSrc || offer.posterSrc}
                                                                        alt=""
                                                                        fill
                                                                        unoptimized
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <Store className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-semibold text-base sm:text-lg truncate">{offer.title || "Untitled Offer"}</h4>
                                                                <div className="flex flex-col gap-1.5 mt-1">
                                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-sm text-slate-500">
                                                                        <span>{offer.createdAt ? `Posted ${new Date(offer.createdAt).toLocaleDateString('en-GB')}` : "Active"}</span>
                                                                        <span className="opacity-40">•</span>
                                                                        <span className={cn(
                                                                            "font-medium",
                                                                            offer.status === "active" ? "text-[#1cc080]" : "text-gray-400"
                                                                        )}>{offer.status || "active"}</span>

                                                                        {(offer.branchNames || offer.branchName) && (
                                                                            <>
                                                                                <span className="opacity-40">•</span>
                                                                                <span className="flex items-center gap-1 line-clamp-1" title={offer.branchNames ? offer.branchNames.join(', ') : offer.branchName}>
                                                                                    <GitBranch className="w-3 h-3 shrink-0 opacity-60" />
                                                                                    {offer.branchNames ? offer.branchNames.join(', ') : offer.branchName}
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {offer.validFrom && offer.validTo && (
                                                                        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                                            <span className="text-[#1cc080]">
                                                                                {new Date(offer.validFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase()}
                                                                            </span>
                                                                            <span className="text-slate-300 px-0.5">—</span>
                                                                            <span className="text-red-500">
                                                                                {new Date(offer.validTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase()}
                                                                            </span>
                                                                            <span className="text-slate-400 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                                                                                {(() => {
                                                                                    const start = new Date(offer.validFrom);
                                                                                    const end = new Date(offer.validTo);
                                                                                    const diffTime = end.getTime() - start.getTime();
                                                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                                                    return diffDays === 1 ? '1 day' : `${diffDays} days`;
                                                                                })()}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-primary/5 w-full sm:w-auto mt-3 sm:mt-0">
                                                            <div className="flex flex-col sm:items-center mr-auto sm:mr-2">
                                                                <TooltipProvider>
                                                                    <Tooltip open={isMobile && openTooltipIndex === idx} onOpenChange={(open) => { if (isMobile) setOpenTooltipIndex(open ? idx : null); }}>
                                                                        <TooltipTrigger asChild>
                                                                            <div
                                                                                className="font-bold text-primary text-base sm:text-lg cursor-help"
                                                                            >
                                                                                {offer.posters?.length || 1} {(offer.posters?.length || 1) === 1 ? 'Poster' : 'Posters'}
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <div className="text-xs space-y-1">
                                                                                <div>Just Posts: {offer.posters?.filter((p: any) => p.type === 'just_post').length || 0}</div>
                                                                                <div>Marked Posts: {offer.posters?.filter((p: any) => p.type === 'marked_poster').length || 0}</div>
                                                                            </div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">in this offer</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => openEditModal(offer)}
                                                                    className="p-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-primary/10 hover:border-primary/20 text-gray-500 hover:text-primary transition-all"
                                                                    title="Edit offer"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setOfferToDelete(offer)}
                                                                    className="p-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-500 transition-all"
                                                                    title="Delete offer"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
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
                                                                            <Image
                                                                                src={shop.logo_url}
                                                                                alt={shop.shop_name}
                                                                                fill
                                                                                unoptimized
                                                                                className="object-cover group-hover/logo:scale-110 transition-transform duration-300 relative z-10"
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
                </div >
            </div >

            {/* ──── Offers Date Range Popup ──── */}
            < AppModal
                open={showDatePopup}
                onOpenChange={setShowDatePopup}
                title="Filter Offers by Date"
                description="Select a date range to view offer statistics."
            >
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <PremiumDatePicker
                            label="From"
                            date={dateFrom}
                            setDate={(d) => d && setDateFrom(d)}
                            placeholder="Start date"
                        />
                        <PremiumDatePicker
                            label="To"
                            date={dateTo}
                            setDate={(d) => d && setDateTo(d)}
                            placeholder="End date"
                        />
                    </div>

                    {/* Quick filters */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => {
                                const now = new Date();
                                const dayOfWeek = now.getDay();
                                const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                                setDateFrom(new Date(now.setDate(diff)));
                                const endDiff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? 0 : 7);
                                setDateTo(new Date(now.setDate(endDiff)));
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => {
                                const now = new Date();
                                setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1));
                                setDateTo(new Date(now.getFullYear(), now.getMonth() + 1, 0));
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => {
                                const now = new Date();
                                setDateFrom(new Date(now.getFullYear(), 0, 1));
                                setDateTo(new Date(now.getFullYear(), 11, 31));
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                        >
                            This Year
                        </button>
                    </div>

                    {/* Stats summary based on date range */}
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium mb-3">Offers in selected period</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-emerald-500/10">
                                <p className="text-xs text-muted-foreground mb-1">New Active Offers</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {publishedOffers.filter(o => o.status === 'active' && new Date(o.lastEdited) >= dateFrom && new Date(o.lastEdited) <= dateTo).length}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-500/10">
                                <p className="text-xs text-muted-foreground mb-1">New Paused Offers</p>
                                <p className="text-2xl font-bold text-gray-600">
                                    {publishedOffers.filter(o => o.status !== 'active' && new Date(o.lastEdited) >= dateFrom && new Date(o.lastEdited) <= dateTo).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <PremiumButton variant="outline" onClick={() => setShowDatePopup(false)} className="rounded-xl">
                            Close
                        </PremiumButton>
                    </div>
                </div>
            </AppModal >

            {/* ──── Edit Offer Modal ──── */}
            < AppModal
                open={!!editingOffer
                }
                onOpenChange={(open) => { if (!open) setEditingOffer(null); }}
                title="Edit Offer"
                description="Update the details of your published offer."
            >
                <div className="space-y-5">
                    <PremiumInput
                        label="Campaign Title"
                        icon={Type}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="e.g. Weekend Mega Sale 2024"
                        autoFocus
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <PremiumDatePicker
                            label="Valid From"
                            date={editValidFrom}
                            setDate={setEditValidFrom}
                            placeholder="Start date"
                        />
                        <PremiumDatePicker
                            label="Valid To"
                            date={editValidTo}
                            setDate={setEditValidTo}
                            placeholder="End date"
                        />
                    </div>

                    {/* Branch Selector */}
                    <div className="space-y-2 pb-1 min-w-0 w-full">
                        <label className="text-sm font-medium flex items-center gap-2 text-foreground ml-1">
                            <GitBranch className="w-4 h-4 text-muted-foreground" />
                            Branch
                            {editBranches.length === 0 && (
                                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-1" />
                            )}
                        </label>
                        <MultiSearchableSelect
                            options={editBranches.map((b) => ({ label: `${b.branch_name} — ${b.city}`, value: String(b.id) }))}
                            selectedValues={editBranchIds}
                            onChange={setEditBranchIds}
                            placeholder={editBranches.length > 0 ? "Select branches" : "Loading branches..."}
                        />
                    </div>



                    {/* Poster Sequence Editor */}
                    {editPosters.length > 1 && (
                        <div className="space-y-3 min-w-0 w-full">
                            <div className="flex items-center justify-between text-sm font-medium text-foreground ml-1 pr-1">
                                <label className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                    Poster Sequence
                                </label>
                                <span className="opacity-60 text-xs">
                                    total posters: <span className="font-bold">{editPosters.length}</span>
                                </span>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 custom-scrollbar snap-x w-full">
                                {editPosters.map((poster, index) => (
                                    <div key={poster.id || index} className="flex flex-col items-center p-2 rounded-xl border border-primary/10 bg-background/50 w-[120px] shrink-0 snap-start relative group">
                                        <div
                                            className="relative w-full aspect-square rounded-lg overflow-hidden border border-primary/20 bg-muted mb-2 group/thumb cursor-pointer"
                                            onClick={() => setPreviewLogo({ src: poster.posterSrc || '', name: `Poster ${index + 1}`, markedItems: poster.markedItems })}
                                            title="Click to preview"
                                        >
                                            <Image src={poster.posterSrc} alt={`Poster ${index + 1}`} fill unoptimized className="object-cover transition-transform duration-300 group-hover/thumb:scale-105" />
                                            <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                                                <Eye className="w-6 h-6 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow-md" />
                                            </div>

                                            {/* Preview Overlay Hotspots */}
                                            {poster.markedItems && poster.markedItems.map((item: any) => (
                                                <div
                                                    key={item.id}
                                                    className="absolute border border-primary bg-primary/20 pointer-events-none"
                                                    style={{
                                                        left: `${item.x * 100}%`,
                                                        top: `${item.y * 100}%`,
                                                        width: `${item.width * 100}%`,
                                                        height: `${item.height * 100}%`
                                                    }}
                                                />
                                            ))}

                                            <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-md z-10 pointer-events-none">
                                                {index + 1}
                                            </div>

                                            <div className="absolute top-1 right-1 z-20 md:opacity-0 md:group-hover/thumb:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    className="p-1.5 bg-black/40 text-white backdrop-blur-md rounded-md hover:bg-primary transition-colors"
                                                    title="Edit Poster Type / Markings"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPosterActionIndex(index);
                                                    }}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="w-full text-center mb-2 px-1">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider truncate">
                                                {poster.type?.replace('_', ' ')}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between w-full bg-primary/5 p-1 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (index === 0) return;
                                                    const newPosters = [...editPosters];
                                                    const temp = newPosters[index - 1];
                                                    newPosters[index - 1] = newPosters[index];
                                                    newPosters[index] = temp;
                                                    setEditPosters(newPosters.map((p, i) => ({ ...p, order: i + 1 })));
                                                }}
                                                disabled={index === 0}
                                                className="p-1 rounded-md hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                                title="Move left"
                                            >
                                                <ArrowUp className="w-4 h-4 -rotate-90" />
                                            </button>

                                            <select
                                                value={index + 1}
                                                onChange={(e) => {
                                                    const newIndex = parseInt(e.target.value) - 1;
                                                    const newPosters = [...editPosters];
                                                    const [moved] = newPosters.splice(index, 1);
                                                    newPosters.splice(newIndex, 0, moved);
                                                    setEditPosters(newPosters.map((p, i) => ({ ...p, order: i + 1 })));
                                                }}
                                                className="w-8 text-center text-xs font-bold bg-transparent border-none appearance-none cursor-pointer outline-none hover:bg-black/5 rounded focus:ring-0 px-0"
                                                title="Jump to position"
                                            >
                                                {editPosters.map((_, i) => (
                                                    <option key={i} value={i + 1}>{i + 1}</option>
                                                ))}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (index === editPosters.length - 1) return;
                                                    const newPosters = [...editPosters];
                                                    const temp = newPosters[index + 1];
                                                    newPosters[index + 1] = newPosters[index];
                                                    newPosters[index] = temp;
                                                    setEditPosters(newPosters.map((p, i) => ({ ...p, order: i + 1 })));
                                                }}
                                                disabled={index === editPosters.length - 1}
                                                className="p-1 rounded-md hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                                title="Move right"
                                            >
                                                <ArrowDown className="w-4 h-4 -rotate-90" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add More Posters Button - Prominent */}
                    <div className="pt-2">
                        <PremiumButton
                            type="button"
                            onClick={() => {
                                if (editingOffer?.batchId) {
                                    router.push(`/shop-manager/create-offer?edit=${editingOffer.batchId}`);
                                }
                            }}
                            leftIcon={Plus}
                            className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                        >
                            Add More Posters
                        </PremiumButton>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-primary/10">
                        {/* Status Toggle matching original visual preference */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 hidden sm:flex">
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    editStatus === "active" ? "bg-[#1cc080]" : "bg-gray-400"
                                )} />
                                <span className={cn(
                                    "text-[13px] font-bold uppercase tracking-wider",
                                    editStatus === "active" ? "text-slate-800" : "text-gray-500"
                                )}>
                                    {editStatus === "active" ? "Online" : "Paused"}
                                </span>
                            </div>
                            <StatusToggleButton
                                status={editIsActive ? "active" : "paused"}
                                onChange={(newStatus) => setEditIsActive(newStatus === "active")}
                            />
                        </div>

                        <div className="flex gap-3">
                            <PremiumButton variant="outline" onClick={() => setEditingOffer(null)} className="rounded-xl">
                                Cancel
                            </PremiumButton>
                            <PremiumButton
                                onClick={handleSaveOffer}
                                disabled={isSavingOffer || !editTitle.trim()}
                                className="rounded-xl px-8 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                            >
                                {isSavingOffer ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                ) : (
                                    "Save Changes"
                                )}
                            </PremiumButton>
                        </div>
                    </div>
                </div>
            </AppModal >

            {/* ──── Delete Confirm Dialog ──── */}
            < AppModal
                open={!!offerToDelete}
                onOpenChange={(open) => { if (!open) setOfferToDelete(null); }}
                title="Delete Offer"
                description="Are you sure you want to delete this offer? This action cannot be undone."
            >
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">"{offerToDelete?.title || 'Untitled'}"</p>
                            <p className="mt-1 text-xs opacity-80">This will permanently remove this offer and all its poster data.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <PremiumButton variant="outline" onClick={() => setOfferToDelete(null)} className="rounded-xl">
                            Cancel
                        </PremiumButton>
                        <PremiumButton
                            onClick={() => offerToDelete && handleDeleteOffer(offerToDelete)}
                            className="rounded-xl px-6 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Confirm Delete
                        </PremiumButton>
                    </div>
                </div>
            </AppModal >

            {/* ──── Poster Edit Action Modal ──── */}
            < AppModal
                open={posterActionIndex !== null}
                onOpenChange={(open) => { if (!open) setPosterActionIndex(null); }}
                title={
                    posterActionIndex !== null && editPosters[posterActionIndex]?.type === 'marked_poster'
                        ? "Edit Marked Poster"
                        : "Mark Products on Poster"
                }
                description={
                    posterActionIndex !== null && editPosters[posterActionIndex]?.type === 'marked_poster'
                        ? "This poster contains product hotspots. What would you like to do?"
                        : "This is a standard post. Do you want to add interactive product hotspots?"
                }
            >
                <div className="space-y-4">
                    {posterActionIndex !== null && editPosters[posterActionIndex]?.type === 'marked_poster' ? (
                        <>
                            <div className="flex gap-3 justify-end mt-4">
                                <PremiumButton
                                    variant="outline"
                                    onClick={() => {
                                        const newPosters = [...editPosters];
                                        newPosters[posterActionIndex] = {
                                            ...newPosters[posterActionIndex],
                                            type: 'just_post',
                                            markedItems: []
                                        };
                                        setEditPosters(newPosters);
                                        setPosterActionIndex(null);
                                    }}
                                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    Change to Just Post
                                </PremiumButton>
                                <PremiumButton
                                    onClick={() => {
                                        const idx = posterActionIndex;
                                        setPosterActionIndex(null);
                                        handleEditSinglePoster(idx);
                                    }}
                                    className="rounded-xl px-6"
                                    leftIcon={Pencil}
                                >
                                    Edit Markings
                                </PremiumButton>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex gap-3 justify-end mt-4">
                                <PremiumButton variant="outline" onClick={() => setPosterActionIndex(null)} className="rounded-xl">
                                    Cancel
                                </PremiumButton>
                                <PremiumButton
                                    onClick={() => {
                                        const idx = posterActionIndex;
                                        setPosterActionIndex(null);
                                        if (idx !== null) handleEditSinglePoster(idx);
                                    }}
                                    className="rounded-xl px-6"
                                    leftIcon={MousePointer2}
                                >
                                    Add Markings
                                </PremiumButton>
                            </div>
                        </>
                    )}
                </div>
            </AppModal >

            {/* Image Preview Modal */}
            {
                previewLogo && (
                    <ImagePreviewModal
                        src={previewLogo.src}
                        alt={previewLogo.name}
                        markedItems={previewLogo.markedItems}
                        isOpen={!!previewLogo}
                        onClose={() => setPreviewLogo(null)}
                    />
                )
            }
        </main >
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
