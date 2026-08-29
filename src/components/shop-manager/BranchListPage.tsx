"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    GitBranch,
    Plus,
    MapPin,
    Phone,
    Pencil,
    Trash2,
    Loader2,
    Power,
    X,
    Mail,
} from "lucide-react";
import { getBranches, deleteBranch, updateBranch } from "@/lib/api/branch";
import { getShopDetails } from "@/lib/api/shop";
import { Branch } from "@/lib/types/branch";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Heading, Text, SectionTitle } from "@/components/shared/Typography";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

const BranchMapPreview = dynamic(() => import("@/components/shared/BranchMapPreview"), {
    ssr: false,
    loading: () => (
        <div className="h-48 sm:h-52 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xs text-gray-400 animate-pulse">
            Loading map...
        </div>
    ),
});

interface BranchPreviewCardProps {
    selectedBranch: Branch;
    shopId: string;
    onToggleActive: (branchId: number, currentStatus: boolean) => void;
    onDeleteClick: (branch: Branch) => void;
    deletingId: number | null;
    showActionsInCard?: boolean;
}

function BranchPreviewCard({
    selectedBranch,
    shopId,
    onToggleActive,
    onDeleteClick,
    deletingId,
    showActionsInCard = true,
}: BranchPreviewCardProps) {
    return (
        <PremiumCard variant="glass" padding="none" className="overflow-hidden border border-primary/10 shadow-lg w-full">
            {/* Banner gradient header */}
            <div className="p-5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent relative border-b border-primary/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-primary/15 flex items-center justify-center shadow-sm shrink-0">
                        <GitBranch className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-black text-lg text-gray-900 leading-tight truncate">
                            {selectedBranch.branch_name}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                            Branch details & actions
                        </p>
                    </div>
                </div>

                {/* Toggle Active state top right */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wide hidden sm:inline-block",
                        selectedBranch.is_active ? "text-emerald-600" : "text-gray-400"
                    )}>
                        {selectedBranch.is_active ? "Active" : "Inactive"}
                    </span>
                    <button
                        onClick={() => onToggleActive(selectedBranch.id, selectedBranch.is_active)}
                        className={cn(
                            "relative w-11 h-6 rounded-full transition-all duration-300 p-0.5 flex items-center shadow-inner cursor-pointer border-0",
                            selectedBranch.is_active
                                ? "bg-emerald-500"
                                : "bg-gray-200"
                        )}
                        title={selectedBranch.is_active ? "Deactivate Branch" : "Activate Branch"}
                    >
                        <div className={cn(
                            "w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 transform flex items-center justify-center",
                            selectedBranch.is_active ? "translate-x-5" : "translate-x-0"
                        )}>
                            <Power className={cn(
                                "w-2.5 h-2.5 transition-colors",
                                selectedBranch.is_active ? "text-emerald-500" : "text-gray-400"
                            )} />
                        </div>
                    </button>
                </div>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
                {/* Location Info */}
                <div className="space-y-3.5">
                    <SectionTitle className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Information</SectionTitle>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-start gap-2.5 bg-gray-50/60 p-3 rounded-xl border border-gray-100/80">
                            <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-500 shrink-0 shadow-xs">
                                <MapPin className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-1">Full Location</p>
                                <p className="text-xs font-semibold text-gray-700 leading-snug break-words">
                                    {[selectedBranch.address, selectedBranch.city, selectedBranch.district, selectedBranch.state, selectedBranch.pincode].filter(Boolean).join(", ") || "No address provided"}
                                </p>
                            </div>
                        </div>

                        {selectedBranch.phone && (
                            <div className="flex items-start gap-2.5 bg-gray-50/60 p-3 rounded-xl border border-gray-100/80">
                                <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-500 shrink-0 shadow-xs">
                                    <Phone className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-1">Contact Phone</p>
                                    <p className="text-xs font-bold text-gray-700">
                                        {selectedBranch.phone}
                                    </p>
                                </div>
                            </div>
                        )}

                        {selectedBranch.email && (
                            <div className="flex items-start gap-2.5 bg-gray-50/60 p-3 rounded-xl border border-gray-100/80">
                                <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-500 shrink-0 shadow-xs">
                                    <Mail className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-1">Email Address</p>
                                    <p className="text-xs font-bold text-gray-700 truncate">
                                        {selectedBranch.email}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons (Desktop inline) */}
                    {showActionsInCard && (
                        <div className="flex items-center gap-3 pt-2">
                            <Link href={`/shop-manager/${shopId}/add-branch?branchId=${selectedBranch.id}`} className="flex-1">
                                <PremiumButton variant="outline" className="w-full rounded-xl py-2.5 border-gray-200 hover:border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary gap-1.5 shadow-none text-xs font-bold uppercase tracking-wider">
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit Location
                                </PremiumButton>
                            </Link>
                            <PremiumButton
                                variant="outline"
                                className="flex-1 rounded-xl py-2.5 border-rose-100 hover:border-rose-200 bg-rose-50/20 hover:bg-rose-50 text-rose-600 gap-1.5 shadow-none text-xs font-bold uppercase tracking-wider"
                                onClick={() => onDeleteClick(selectedBranch)}
                                disabled={deletingId === selectedBranch.id}
                            >
                                {deletingId === selectedBranch.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                )}
                                Delete
                            </PremiumButton>
                        </div>
                    )}
                </div>

                {/* Actual Map Canvas */}
                <div className="space-y-2.5 pt-1 border-t border-gray-100">
                    <SectionTitle className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Map View</SectionTitle>
                    <BranchMapPreview
                        latitude={selectedBranch.latitude}
                        longitude={selectedBranch.longitude}
                        branchName={selectedBranch.branch_name}
                        city={selectedBranch.city}
                        district={selectedBranch.district}
                        state={selectedBranch.state}
                        address={selectedBranch.address}
                        className="h-56 sm:h-64"
                    />
                </div>
            </div>
        </PremiumCard>
    );
}

interface BranchListPageProps {
    shopId: string;
}

export default function BranchListPage({ shopId }: BranchListPageProps) {
    const router = useRouter();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [shopName, setShopName] = useState("test Shop");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
    const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [shopId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch shop name and branches in parallel
            const [shopRes, branchRes] = await Promise.all([
                getShopDetails(shopId),
                getBranches(shopId),
            ]);

            if (shopRes.success && shopRes.data) {
                const shop = shopRes.data as any;
                setShopName(shop.shop_name || shop.data?.shop_name || `Shop #${shopId}`);
            }

            if (branchRes.success && branchRes.data) {
                const result = branchRes.data as any;
                const list = Array.isArray(result) ? result : (result.data || []);
                setBranches(Array.isArray(list) ? list : []);
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
            toast.error("Failed to load branches");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (branchId: number) => {
        const index = branches.findIndex(b => b.id === branchId);
        const deletedBranch = branches[index];

        // Optimistically update UI
        setBranches((prev) => prev.filter((b) => b.id !== branchId));

        // Reset dialog state
        setBranchToDelete(null);
        setDeletingId(branchId);

        try {
            const response = await deleteBranch(shopId, branchId.toString());
            if (response.success || (response as any).status === "success") {
                toast.success("Branch deleted successfully");
            } else {
                // Revert on failure
                if (deletedBranch) {
                    setBranches((prev) => {
                        const newBranches = [...prev];
                        newBranches.splice(index, 0, deletedBranch);
                        return newBranches;
                    });
                }
                toast.error(response.error || "Failed to delete branch");
            }
        } catch {
            // Revert on error
            if (deletedBranch) {
                setBranches((prev) => {
                    const newBranches = [...prev];
                    newBranches.splice(index, 0, deletedBranch);
                    return newBranches;
                });
            }
            toast.error("An error occurred while deleting");
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleActive = async (branchId: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        // Optimistically update UI
        setBranches((prev) =>
            prev.map((b) =>
                b.id === branchId ? { ...b, is_active: newStatus } : b
            )
        );

        try {
            const response = await updateBranch(shopId, branchId.toString(), { is_active: newStatus });
            if (response.success || (response as any).status === "success") {
                toast.success(`Branch ${newStatus ? 'activated' : 'deactivated'} successfully`);
            } else {
                // Revert on failure
                setBranches((prev) =>
                    prev.map((b) =>
                        b.id === branchId ? { ...b, is_active: currentStatus } : b
                    )
                );
                toast.error(response.error || "Failed to update branch status");
            }
        } catch (error) {
            // Revert on error
            setBranches((prev) =>
                prev.map((b) =>
                    b.id === branchId ? { ...b, is_active: currentStatus } : b
                )
            );
            toast.error("An error occurred while updating status");
        }
    };

    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

    // Automatically close mobile preview sheet if window is resized to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMobilePreviewOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Set initial selected branch on load
    useEffect(() => {
        if (branches.length > 0 && !selectedBranchId) {
            setSelectedBranchId(branches[0].id);
        }
    }, [branches, selectedBranchId]);

    const selectedBranch = useMemo(() => {
        return branches.find(b => b.id === selectedBranchId) || branches[0] || null;
    }, [branches, selectedBranchId]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <Breadcrumbs
                    items={[
                        { label: "Manage Shop", href: "/shop-manager" },
                        { label: "Branches" },
                    ]}
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
                    <div>
                        <Heading className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                            Branches
                        </Heading>
                        <Text className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                            Manage locations for <span className="text-gray-900 font-bold">{shopName}</span>
                        </Text>
                    </div>
                    <PremiumButton asChild className="rounded-2xl shadow-lg shadow-primary/20 shrink-0">
                        <Link href={`/shop-manager/${shopId}/add-branch`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Branch
                        </Link>
                    </PremiumButton>
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 rounded-2xl bg-gray-50/50 border border-gray-100 animate-pulse" />
                        ))}
                    </div>
                    <div className="hidden lg:block lg:col-span-7">
                        <div className="h-[420px] rounded-2xl bg-gray-50/50 border border-gray-100 animate-pulse" />
                    </div>
                </div>
            ) : branches.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Branch List (Master) */}
                    <div className="lg:col-span-5 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <SectionTitle className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">
                                Locations ({branches.length})
                            </SectionTitle>
                            <span className="text-[11px] text-gray-400 font-medium">
                                Select to preview
                            </span>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[calc(100vh-220px)] overflow-y-auto p-1.5 pb-6 no-scrollbar">
                            {branches.map((branch) => {
                                const isSelected = selectedBranchId === branch.id;
                                return (
                                    <div
                                        key={branch.id}
                                        onClick={() => {
                                            setSelectedBranchId(branch.id);
                                            // Only open the slide-out sheet on mobile devices (< 1024px)
                                            if (typeof window !== "undefined" && window.innerWidth < 1024) {
                                                setIsMobilePreviewOpen(true);
                                            }
                                        }}
                                        className={cn(
                                            "group p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 relative overflow-hidden shadow-xs",
                                            isSelected
                                                ? "bg-orange-50/30 border-orange-500 shadow-md shadow-orange-500/10 ring-4 ring-orange-500/15"
                                                : "bg-white border-gray-100/90 hover:border-orange-200 hover:bg-orange-50/10 hover:shadow-sm"
                                        )}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-200 shrink-0",
                                                isSelected
                                                    ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/30"
                                                    : "bg-gray-50 border-gray-200 text-gray-500 group-hover:bg-white group-hover:text-orange-500 group-hover:border-orange-200"
                                            )}>
                                                <GitBranch className={cn("w-5 h-5", isSelected ? "text-white" : "text-gray-500 group-hover:text-orange-500")} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className={cn(
                                                        "font-bold text-sm truncate leading-tight transition-colors",
                                                        isSelected ? "text-orange-950" : "text-gray-900 group-hover:text-orange-600"
                                                    )}>
                                                        {branch.branch_name}
                                                    </h4>
                                                    <span className={cn(
                                                        "w-2.5 h-2.5 rounded-full shrink-0",
                                                        branch.is_active ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-gray-300"
                                                    )} />
                                                </div>
                                                <p className="text-xs text-gray-500 truncate flex items-center gap-1.5 font-medium mt-1">
                                                    <MapPin className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-orange-500" : "text-gray-400")} />
                                                    <span className="truncate">{branch.city || branch.district || "Registered Branch"}, {branch.district || branch.state}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Selected Branch Preview (Desktop only) */}
                    <div className="hidden lg:block lg:col-span-7 lg:sticky lg:top-24">
                        {selectedBranch ? (
                            <BranchPreviewCard
                                selectedBranch={selectedBranch}
                                shopId={shopId}
                                onToggleActive={handleToggleActive}
                                onDeleteClick={(b) => setBranchToDelete(b)}
                                deletingId={deletingId}
                            />
                        ) : (
                            <div className="h-64 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xs text-gray-400 font-medium">
                                Select a branch from the left to view details
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center bg-white border border-gray-100 rounded-3xl shadow-sm max-w-xl mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 border border-primary/10">
                        <GitBranch className="w-8 h-8 text-primary/30" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No branches yet</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm">
                        Create your first branch to start managing multiple locations for this shop.
                    </p>
                    <PremiumButton asChild className="rounded-xl shadow-lg shadow-primary/20">
                        <Link href={`/shop-manager/${shopId}/add-branch`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Branch
                        </Link>
                    </PremiumButton>
                </div>
            )}

            {/* Mobile Slide-Out Preview Modal (Drawer) - strictly hidden on desktop (lg:hidden) */}
            <div className="lg:hidden">
                <Sheet open={isMobilePreviewOpen} onOpenChange={setIsMobilePreviewOpen}>
                    <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-white border-l border-gray-100 z-50 [&>button]:hidden">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Branch Details</SheetTitle>
                            <SheetDescription>Preview and actions for {selectedBranch?.branch_name}</SheetDescription>
                        </SheetHeader>

                        {selectedBranch && (
                            <>
                                {/* Scrollable Modal Content */}
                                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                                    <BranchPreviewCard
                                        selectedBranch={selectedBranch}
                                        shopId={shopId}
                                        onToggleActive={handleToggleActive}
                                        onDeleteClick={(b) => {
                                            setIsMobilePreviewOpen(false);
                                            setBranchToDelete(b);
                                        }}
                                        deletingId={deletingId}
                                        showActionsInCard={false}
                                    />
                                </div>

                                {/* Sticky Modal Footer: [Edit Location] [Delete] [Close] */}
                                <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-gray-100 p-3 sm:p-4 flex items-center gap-2.5 shadow-lg z-20">
                                    <Link href={`/shop-manager/${shopId}/add-branch?branchId=${selectedBranch.id}`} className="flex-1">
                                        <PremiumButton
                                            variant="outline"
                                            className="w-full rounded-xl py-2.5 border-orange-200 hover:border-orange-300 bg-orange-50/50 hover:bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-wider gap-1.5 shadow-none justify-center"
                                            onClick={() => setIsMobilePreviewOpen(false)}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            Edit Location
                                        </PremiumButton>
                                    </Link>

                                    <PremiumButton
                                        variant="outline"
                                        className="rounded-xl py-2.5 px-3.5 border-rose-100 hover:border-rose-200 bg-rose-50/20 hover:bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-wider gap-1.5 shadow-none shrink-0"
                                        onClick={() => {
                                            setIsMobilePreviewOpen(false);
                                            setBranchToDelete(selectedBranch);
                                        }}
                                        disabled={deletingId === selectedBranch.id}
                                    >
                                        {deletingId === selectedBranch.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                        Delete
                                    </PremiumButton>

                                    <PremiumButton
                                        variant="outline"
                                        className="rounded-xl py-2.5 px-4 border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider gap-1.5 shadow-none shrink-0"
                                        onClick={() => setIsMobilePreviewOpen(false)}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Close
                                    </PremiumButton>
                                </div>
                            </>
                        )}
                    </SheetContent>
                </Sheet>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!branchToDelete} onOpenChange={(open) => !open && setBranchToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the branch "{branchToDelete?.branch_name}".
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => branchToDelete && handleDelete(branchToDelete.id)}
                            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                        >
                            Delete Branch
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
