import { getAllProducts } from "@/lib/api/products";
import ProductsClient from "@/components/products/ProductsClient";

// ISR: Revalidate every 5 minutes
export const revalidate = 300;

export default async function ProductsPage() {
    // Fetch initial data on the server for ISR
    const products = await getAllProducts();

    return (
        <ProductsClient initialProducts={products} />
    );
}
