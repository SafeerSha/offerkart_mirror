import { getUserProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { CACHE_TAGS } from "@/lib/api/cache-tags";
import ProductsClient from "@/components/products/ProductsClient";

export default async function ProductsLoader({ searchParams }: {
    searchParams?: Promise<{ category?: string; subcategory?: string | string[]; shopId?: string; search?: string; sort?: string }> | { category?: string; subcategory?: string | string[]; shopId?: string; search?: string; sort?: string };
}) {
    const resolvedParams = searchParams
        ? ("then" in searchParams ? await searchParams : searchParams)
        : {};
    const category = resolvedParams?.category ? String(resolvedParams.category) : undefined;
    const subcategoryRaw = resolvedParams?.subcategory;
    const subcategories = Array.isArray(subcategoryRaw)
        ? subcategoryRaw.map(String)
        : (subcategoryRaw ? [String(subcategoryRaw)] : []);
    const shopId = resolvedParams?.shopId ? String(resolvedParams.shopId) : undefined;
    const search = resolvedParams?.search ? String(resolvedParams.search) : undefined;
    const sort = resolvedParams?.sort ? String(resolvedParams.sort) : "newest";

    let categoryId: string | undefined;
    let subcategoryId: string | undefined;

    const [productsResult] = await Promise.all([
        getUserProducts(
            { search, categoryId, subcategoryId, shopId, sort, limit: 12 },
            { next: { tags: [CACHE_TAGS.PRODUCTS] } }
        ),
    ]);

    const hasMoreInitial = productsResult.success && productsResult.data.pagination
        ? productsResult.data.pagination.page < productsResult.data.pagination.totalPages
        : false;

    return (
        <ProductsClient
            initialProducts={productsResult.success ? productsResult.data.data : []}
            initialFeaturedShops={[]}
            initialCategories={[]}
            hasMoreInitial={hasMoreInitial}
        />
    );
}
