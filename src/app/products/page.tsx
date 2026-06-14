import { getAllProducts } from "@/lib/api/products";
import ProductsClient from "@/components/products/ProductsClient";
import { CACHE_TAGS } from "@/lib/api/cache-tags";

export const dynamic = "force-static";
export const revalidate = false;

export default async function ProductsPage() {
    const products = await getAllProducts(undefined, { next: { tags: [CACHE_TAGS.PRODUCTS] } });

    return (
        <ProductsClient initialProducts={products} />
    );
}
