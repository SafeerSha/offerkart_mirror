"use client";

export const dynamic = "force-dynamic";

import { useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ProductForm } from "@/components/shop-manager/ProductForm";
import { useMyShops, useCreateProduct } from "@/hooks";
import { queryKeys } from "@/hooks/useApi";

function AddProductContent() {
    const router = useRouter();
    const { data: session } = useSession();
    const queryClient = useQueryClient();

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

    const { mutateAsync: createProductMutation } = useCreateProduct();

    const handleCreateProduct = async (payload: any) => {
        try {
            const res = await createProductMutation({ payload, shopId: activeShopId || undefined });
            if (res.success) {
                toast.success("Product created successfully");
                // Invalidate query to refresh products list
                if (activeShopId) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.allProducts(activeShopId) });
                }
                router.push("/shop-manager/products");
            } else {
                throw new Error(res.message || "Failed to create product");
            }
        } catch (err: any) {
            console.error("Create product error:", err);
            toast.error(`Failed to create product: ${err.message}`);
            throw err;
        }
    };

    const handleCancel = () => {
        router.push("/shop-manager/products");
    };

    if (isLoadingShops) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50/50">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading catalog...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen pt-24 lg:pt-28 pb-16 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <ProductForm
                product={null}
                onSubmit={handleCreateProduct}
                onCancel={handleCancel}
            />
        </main>
    );
}

export default function AddProductPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50/50 pt-24 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <AddProductContent />
        </Suspense>
    );
}
