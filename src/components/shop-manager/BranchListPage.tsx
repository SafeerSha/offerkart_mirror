"use client";

import { useState, useEffect } from "react";
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
import { getBranches, deleteBranch } from "@/lib/api/branch";
import { getShopDetails } from "@/lib/api/shop";
import { Branch } from "@/lib/types/branch";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Heading, Text } from "@/components/shared/Typography";
import { cn } from "@/lib/utils";

interface BranchListPageProps {
    shopId: string;
}

// Mock data for testing
const MOCK_BRANCHES: Branch[] = [
    {
        id: 1,
        branch_name: "Downtown Branch",
        city: "Mumbai",
        district: "Mumbai City",
        state: "Maharashtra",
        pincode: "400001",
        phone: "+91 98765 43210",
        email: "downtown@testshop.com",
        is_active: true,
        address: "123 Main Street",
        shop_id: 1,
        latitude: 18.9388,
        longitude: 72.8354,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 2,
        branch_name: "Suburb Branch",
        city: "Thane",
        district: "Thane",
        state: "Maharashtra",
        pincode: "400601",
        phone: "+91 98765 43211",
        email: "suburb@testshop.com",
        is_active: false,
        address: "456 Park Avenue",
        shop_id: 1,
        latitude: 19.2183,
        longitude: 72.9781,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 3,
        branch_name: "Airport Branch",
        city: "Mumbai",
        district: "Mumbai Suburban",
        state: "Maharashtra",
        pincode: "400099",
        phone: "+91 98765 43212",
        email: "airport@testshop.com",
        is_active: true,
        address: "789 Airport Road",
        shop_id: 1,
        latitude: 19.0896,
        longitude: 72.8656,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

export default function BranchListPage({ shopId }: BranchListPageProps) {
    const router = useRouter();
    const [branches, setBranches] = useState<Branch[]>(MOCK_BRANCHES);
    const [isLoading, setIsLoading] = useState(false);
    const [shopName, setShopName] = useState("test Shop");
    const [deletingId, setDeletingId] = useState<number | null>(null);

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
        if (!confirm("Are you sure you want to delete this branch?")) return;
        setDeletingId(branchId);
        try {
            const response = await deleteBranch(shopId, branchId.toString());
            if (response.success) {
                toast.success("Branch deleted successfully");
                setBranches((prev) => prev.filter((b) => b.id !== branchId));
            } else {
                toast.error(response.error || "Failed to delete branch");
            }
        } catch {
            toast.error("An error occurred while deleting");
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleActive = async (branchId: number, currentStatus: boolean) => {
        // Optimistically update UI
        setBranches((prev) =>
            prev.map((b) =>
                b.id === branchId ? { ...b, is_active: !currentStatus } : b
            )
        );
        toast.success(`Branch ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        // TODO: Add API call to update branch status on backend
    };

    return (
        <div className="space-y-8">
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
                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                            <GitBranch className="w-6 h-6 text-gray-700" />
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

            {/* Branch List */}
            <PremiumCard variant="glass" padding="none" className="overflow-hidden">
                <div className="p-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50 animate-pulse flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gray-200" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-36 bg-gray-200 rounded" />
                                            <div className="h-3 w-24 bg-gray-200 rounded" />
                                        </div>
                                    </div>
                                    <div className="h-8 w-20 bg-gray-200 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : branches.length > 0 ? (
                        <div className="space-y-3">
                            {branches.map((branch) => (
                                <div
                                    key={branch.id}
                                    className="group p-4 sm:p-5 rounded-xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-300"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
                                                <GitBranch className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-base sm:text-lg leading-tight truncate text-gray-900">
                                                        {branch.branch_name}
                                                    </h4>
                                                    {branch.is_active ? (
                                                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0" title="Active" />
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" title="Inactive" />
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>{branch.city}, {branch.district}</span>
                                                    </div>
                                                    {branch.phone && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{branch.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider",
                                                    branch.is_active ? "text-emerald-600" : "text-gray-400"
                                                )}>
                                                    {branch.is_active ? "Active" : "Inactive"}
                                                </span>
                                                <button
                                                    onClick={() => handleToggleActive(branch.id, branch.is_active)}
                                                    className={cn(
                                                        "relative w-12 h-7 rounded-full transition-all duration-500 p-1 flex items-center shadow-inner",
                                                        branch.is_active
                                                            ? "bg-emerald-500 shadow-emerald-900/20"
                                                            : "bg-gray-200 shadow-gray-400/20"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute inset-0 rounded-full transition-opacity duration-500",
                                                        branch.is_active ? "bg-gradient-to-br from-white/20 to-transparent opacity-100" : "opacity-0"
                                                    )} />

                                                    <div className={cn(
                                                        "relative w-5 h-5 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-all duration-500 transform flex items-center justify-center",
                                                        branch.is_active ? "translate-x-5" : "translate-x-0"
                                                    )}>
                                                        <Power className={cn(
                                                            "w-2.5 h-2.5 transition-colors duration-500",
                                                            branch.is_active ? "text-emerald-500" : "text-gray-400"
                                                        )} />
                                                    </div>
                                                </button>
                                            </div>
                                            <Link href={`/shop-manager/${shopId}/add-branch?branchId=${branch.id}`}>
                                                <PremiumButton variant="ghost" size="sm" className="h-9 px-3 gap-1.5 border border-gray-100 hover:border-primary/20 hover:bg-primary/5">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-medium">Edit</span>
                                                </PremiumButton>
                                            </Link>
                                            <PremiumButton
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 px-3 gap-1.5 border border-gray-100 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => handleDelete(branch.id)}
                                                disabled={deletingId === branch.id}
                                            >
                                                {deletingId === branch.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                )}
                                                <span className="text-xs font-medium">Delete</span>
                                            </PremiumButton>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 border border-primary/10">
                                <GitBranch className="w-10 h-10 text-primary/30" />
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
                </div>
            </PremiumCard>
        </div>
    );
}
