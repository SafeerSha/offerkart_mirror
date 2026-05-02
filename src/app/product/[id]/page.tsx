import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById, getAllProducts } from "@/lib/api/products";
import ProductDetailClient from "@/components/products/ProductDetailClient";

export const revalidate = 600;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const product = await getProductById(params.id);

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
        getProductById(params.id),
        getAllProducts()
    ]);

    if (!product) {
        notFound();
    }

    const similarProducts = allProducts
        .filter((p) => String(p.id) !== params.id && p.category === product.category)
        .slice(0, 4);

    return (
        <ProductDetailClient product={product} similarProducts={similarProducts} />
    );
}
