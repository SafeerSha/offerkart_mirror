"use client";

import { useState, useEffect, useMemo } from "react";
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
                        { label: "Shop Dashboard", href: "/shop-manager" },
                        { label: shopName || "Shop", href: `/shop-manager/add-shop?id=${shopId}` },
                        { label: "Branches" },
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                            <GitBranch className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <Heading className="text-3xl md:text-4xl">
                                Branches
                            </Heading>
                            <Text className="mt-1 opacity-70">
                                Manage locations for <span className="font-semibold">{shopName}</span>
                            </Text>
                        </div>
                    </div>

                    <PremiumButton asChild className="rounded-xl shadow-lg shadow-primary/20">
                        <Link href={`/shop-manager/${shopId}/add-branch`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Branch
                        </Link>
                    </PremiumButton>
                </div>
            </div>

            {/* Layout content */}
            {isLoading ? (
                <div className="space-y-6">
                    <div>
                        <SectionTitle className="mb-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Locations</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 animate-pulse flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-200" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-3.5 w-3/4 bg-gray-200 rounded" />
                                        <div className="h-2.5 w-1/2 bg-gray-200 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="h-[300px] rounded-2xl bg-gray-50/50 border border-gray-100 animate-pulse" />
                </div>
            ) : branches.length > 0 ? (
                <div className="space-y-6">
                    {/* List of Branches - 2 in a row on desktop/tablet */}
                    <div>
                        <SectionTitle className="mb-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Locations</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {branches.map((branch) => (
                                <div
                                    key={branch.id}
                                    onClick={() => setSelectedBranchId(branch.id)}
                                    className={cn(
                                        "group p-4 rounded-xl cursor-pointer border transition-all duration-300 relative overflow-hidden",
                                        selectedBranchId === branch.id
                                            ? "bg-white border-primary/20 shadow-md shadow-primary/5 ring-1 ring-primary/5"
                                            : "bg-gray-50/40 border-gray-100 hover:border-primary/10 hover:bg-white"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 transition-colors duration-300",
                                            selectedBranchId === branch.id
                                                ? "bg-primary/10 border-primary/20 text-primary"
                                                : "bg-white border-gray-200 text-gray-500"
                                        )}>
                                            <GitBranch className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-sm text-gray-900 truncate leading-tight mb-1">
                                                {branch.branch_name}
                                            </h4>
                                            <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 font-medium">
                                                <MapPin className="w-3 h-3 text-gray-400" />
                                                {branch.city}, {branch.district}
                                            </p>
                                        </div>
                                        <span className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            branch.is_active ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.4)]" : "bg-gray-300"
                                        )} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected Branch Detail View - Below, full width */}
                    {selectedBranch && (
                        <PremiumCard variant="glass" padding="none" className="overflow-hidden border border-primary/10 shadow-lg w-full">
                            {/* Banner gradient header */}
                            <div className="h-20 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent relative border-b border-primary/5 flex items-center px-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white border border-primary/10 flex items-center justify-center shadow-sm">
                                        <GitBranch className="w-5 h-5 text-primary animate-none" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-gray-900 leading-tight">
                                            {selectedBranch.branch_name}
                                        </h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                            Branch details & actions
                                        </p>
                                    </div>
                                </div>

                                {/* Toggle Active state top right */}
                                <div className="absolute right-6 top-6 flex items-center gap-2.5">
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wide",
                                        selectedBranch.is_active ? "text-emerald-600" : "text-gray-400"
                                    )}>
                                        {selectedBranch.is_active ? "Active" : "Inactive"}
                                    </span>
                                    <button
                                        onClick={() => handleToggleActive(selectedBranch.id, selectedBranch.is_active)}
                                        className={cn(
                                            "relative w-11 h-6 rounded-full transition-all duration-300 p-0.5 flex items-center shadow-inner cursor-pointer border-0",
                                            selectedBranch.is_active
                                                ? "bg-emerald-500"
                                                : "bg-gray-200"
                                        )}
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

                            <div className="p-6 space-y-6">
                                {/* Location Info grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <SectionTitle className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Information</SectionTitle>
                                        <div className="space-y-3.5">
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-1">Full Location</p>
                                                    <p className="text-sm font-semibold text-gray-700 leading-snug">
                                                        {selectedBranch.address || "No address provided"}, {selectedBranch.city || ""}, {selectedBranch.district || ""}
                                                    </p>
                                                </div>
                                            </div>

                                            {selectedBranch.phone && (
                                                <div className="flex items-start gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                                                        <Phone className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-1">Contact Phone</p>
                                                        <p className="text-sm font-bold text-gray-700">
                                                            {selectedBranch.phone}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="pt-4 flex items-center gap-3 border-t border-gray-50">
                                            <Link href={`/shop-manager/${shopId}/add-branch?branchId=${selectedBranch.id}`} className="flex-1">
                                                <PremiumButton variant="outline" className="w-full rounded-xl py-3 border-gray-200 hover:border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary gap-1.5 shadow-none text-xs font-bold uppercase tracking-wider">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                    Edit Location
                                                </PremiumButton>
                                            </Link>
                                            <PremiumButton
                                                variant="outline"
                                                className="flex-1 rounded-xl py-3 border-rose-100 hover:border-rose-200 bg-rose-50/20 hover:bg-rose-50 text-rose-600 gap-1.5 shadow-none text-xs font-bold uppercase tracking-wider"
                                                onClick={() => setBranchToDelete(selectedBranch)}
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
                                    </div>

                                    {/* Mockup Map Canvas */}
                                    <div className="space-y-4">
                                        <SectionTitle className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Map View</SectionTitle>
                                        <div className="relative h-44 rounded-2xl bg-gradient-to-br from-blue-50 to-orange-50 overflow-hidden border border-gray-100 flex items-center justify-center shadow-inner">
                                            {/* Grid lines layout mockup */}
                                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:20px_20px] opacity-40" />
                                            {/* Route overlay mockup */}
                                            <div className="absolute top-1/3 left-0 right-0 h-4 bg-orange-200/40 rounded-full rotate-6" />
                                            <div className="absolute top-0 bottom-0 left-1/2 w-4 bg-emerald-200/40 rounded-full -rotate-12" />

                                            {/* Animated Location marker pin */}
                                            <div className="relative flex flex-col items-center animate-bounce">
                                                <MapPin className="w-8 h-8 text-primary fill-primary/10" />
                                                <div className="w-2.5 h-1 bg-black/15 rounded-full blur-[1px] mt-1 scale-x-150" />
                                            </div>

                                            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-100/50 shadow-sm">
                                                <p className="text-[9px] font-bold text-gray-800 flex items-center gap-1 uppercase tracking-wide">
                                                    <MapPin className="w-2.5 h-2.5 text-primary" /> {selectedBranch.city || "Registered"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>
                    )}
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
