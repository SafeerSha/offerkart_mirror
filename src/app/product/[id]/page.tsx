import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById, getAllProducts } from "@/lib/api/products";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import { CACHE_TAGS } from "@/lib/api/cache-tags";

export const revalidate = false;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const product = await getProductById(params.id, {
        next: { tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT(params.id)] },
    });

    if (!product) {
        return {
            title: "Product Not Found - OfferKart",
            description: "This product could not be found.",
        };
    }

    return {
        title: `${product.name} at ${product.shopName} - OfferKart`,
        description: `Buy ${product.name} at ${product.shopName} in OfferKart for just ₹${product.price}.`,
        openGraph: {
            title: `${product.name} at ${product.shopName} - OfferKart`,
            description: `Buy ${product.name} at ${product.shopName} in OfferKart for just ₹${product.price}.`,
            type: "website",
            images: typeof product.image === "string" ? [product.image] : [],
        },
    };
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
    const [product, allProducts] = await Promise.all([
        getProductById(params.id, {
            next: { tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT(params.id)] },
        }),
        getAllProducts(undefined, { next: { tags: [CACHE_TAGS.PRODUCTS] } })
    ]);

    if (!product) {
        notFound();
    }

    const similarProducts = allProducts
        .filter((p: any) => String(p.id) !== params.id && p.category === product.category)
        .slice(0, 4);

    return (
        <ProductDetailClient product={product} similarProducts={similarProducts} />
    );
}
