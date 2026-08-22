import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById, getAllProducts } from "@/lib/api/products";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import { CACHE_TAGS } from "@/lib/api/cache-tags";

export const dynamic = "force-static";
export const revalidate = false;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const product = await getProductById(resolvedParams.id, {
        next: { tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT(resolvedParams.id)] },
    });

    if (!product) {
        return {
            title: "Product Not Found - OfferNearU",
            description: "This product could not be found.",
        };
    }

    return {
        title: `${product.name} at ${product.shopName} - OfferNearU`,
        description: `Buy ${product.name} at ${product.shopName} in OfferNearU for just ₹${product.price}.`,
        openGraph: {
            title: `${product.name} at ${product.shopName} - OfferNearU`,
            description: `Buy ${product.name} at ${product.shopName} in OfferNearU for just ₹${product.price}.`,
            type: "website",
            images: typeof product.image === "string" ? [product.image] : [],
        },
    };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const [product, allProducts] = await Promise.all([
        getProductById(resolvedParams.id, {
            next: { tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT(resolvedParams.id)] },
        }),
        getAllProducts(undefined, { next: { tags: [CACHE_TAGS.PRODUCTS] } })
    ]);

    if (!product) {
        notFound();
    }

    const similarProducts = allProducts
        .filter((p: any) => String(p.id) !== resolvedParams.id && p.category === product.category)
        .slice(0, 4);

    return (
        <ProductDetailClient product={product} similarProducts={similarProducts} />
    );
}
