"use client";

export const dynamic = "force-dynamic";

import { useMemo, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ProductForm } from "@/components/shop-manager/ProductForm";
import { useMyShops, useProductDetails, useAllProducts, useUpdateProduct } from "@/hooks";
import { queryKeys } from "@/hooks/useApi";

function EditProductContent() {
    const router = useRouter();
    const params = useParams();
    const productId = String(params.id);
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

    // Fetch product details
    const { data: detailsRes, isLoading: isLoadingDetails } = useProductDetails(productId);
    const { data: productsData, isLoading: isLoadingProducts } = useAllProducts(activeShopId || undefined);

    const rawProduct = useMemo(() => {
        // Try to find the product in the all products list first
        if (productsData) {
            const found = productsData.find((p: any) => String(p.id) === String(productId));
            if (found) return found;
        }

        // Fallback to direct product details query
        if (detailsRes?.success && detailsRes.data) {
            const innerData = detailsRes.data;
            return innerData.data ?? innerData;
        }

        return null;
    }, [productsData, detailsRes, productId]);

    // Map raw product data to the structure required by ProductForm
    const mappedProduct = useMemo(() => {
        if (!rawProduct) return null;
        const p = rawProduct;
        return {
            id: p.id,
            name: p.name || p.displayName || "",
            categoryId: p.categoryId || null,
            parentCategoryId: p.parentCategoryId ?? null,
            subcategoryId: p.subcategoryId ?? null,
            categoryObject: p.categoryObject ?? null,
            category: p.category || null,
            price: p.price ?? p.offerPrice ?? "",
            originalPrice: p.originalPrice ?? "",
            image: p.image || p.imageUrl || null,
            description: p.description || p.displayDescription || "",
            validFrom: p.validFrom ?? null,
            validTo: p.validTo ?? null,
            branchIds: p.branchIds || [],
            status: p.status || (p.isActive ? "active" : "inactive"),
            isHighlighted: p.isHighlighted,
        };
    }, [rawProduct]);

    const { mutateAsync: updateProductMutation } = useUpdateProduct();

    const handleUpdateProduct = async (payload: any) => {
        try {
            const res = await updateProductMutation({
                id: productId,
                payload,
                shopId: activeShopId || undefined
            });
            if (res.success) {
                toast.success("Product updated successfully");
                // Invalidate keys to refresh cache
                if (activeShopId) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.allProducts(activeShopId) });
                }
                queryClient.invalidateQueries({ queryKey: queryKeys.productDetails(productId) });
                router.push("/shop-manager/products");
            } else {
                throw new Error(res.message || "Failed to update product");
            }
        } catch (err: any) {
            console.error("Update product error:", err);
            toast.error(`Failed to update product: ${err.message}`);
            throw err;
        }
    };

    const handleCancel = () => {
        router.push("/shop-manager/products");
    };

    const isLoading = isLoadingShops || (isLoadingDetails && !rawProduct) || (isLoadingProducts && !productsData);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50/50">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading product details...</p>
            </div>
        );
    }

    if (!rawProduct) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50/50">
                <p className="text-base font-bold text-gray-800">Product not found.</p>
                <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all text-xs"
                >
                    Back to Products
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-screen pt-40 lg:pt-32 pb-16 bg-[radial-gradient(circle_at_top_right,hsl(var(--color-primary)/0.05)_0%,transparent_50%)]">
            <ProductForm
                product={mappedProduct}
                onSubmit={handleUpdateProduct}
                onCancel={handleCancel}
            />
        </main>
    );
}

export default function EditProductPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50/50 pt-40 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <EditProductContent />
        </Suspense>
    );
}
