import { Suspense } from "react";
import { getAllProducts } from "@/lib/api/products";
import ProductsClient from "@/components/products/ProductsClient";
import { CACHE_TAGS } from "@/lib/api/cache-tags";
import { getFeaturedOffers } from "@/lib/api/offers";



export default async function ProductsPage() {
    const [products, featuredOffersRes] = await Promise.all([
        getAllProducts(undefined, { next: { tags: [CACHE_TAGS.PRODUCTS] } }),
        getFeaturedOffers()
    ]);

    const featuredOffers = (featuredOffersRes as any).success ? ((featuredOffersRes as any).data || []) : [];

    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50/50 pt-40 lg:pt-28 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" /></div>}>
            <ProductsClient initialProducts={products} initialFeaturedShops={featuredOffers} />
        </Suspense>
    );
}
