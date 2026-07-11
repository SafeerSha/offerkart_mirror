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

    // Resolve category / subcategory names -> IDs so the server fetch matches the URL filters
    let categoryId: string | undefined;
    let subcategoryId: string | undefined;
    if (category && category !== "All") {
        try {
            const catsRes = await getCategories();
            if (catsRes.success && catsRes.data) {
                const main = catsRes.data.find(
                    (c) => c.name.toLowerCase() === category.toLowerCase()
                );
                if (main) {
                    categoryId = String(main.id);
                    if (subcategories.length > 0) {
                        const sub = main.subcategories?.find((s) =>
                            subcategories.some((sc) => sc.toLowerCase() === s.name.toLowerCase())
                        );
                        if (sub) subcategoryId = String(sub.id);
                    }
                }
            }
        } catch (e) {
            console.error("ProductsLoader category resolution failed:", e);
        }
    }

    const [productsResult] = await Promise.all([
        getUserProducts(
            { search, categoryId, subcategoryId, shopId, sort, limit: 100 },
            { next: { tags: [CACHE_TAGS.PRODUCTS] } }
        ),
    ]);

    return (
        <ProductsClient
            initialProducts={productsResult.success ? productsResult.data.data : []}
            initialFeaturedShops={[]}
        />
    );
}
