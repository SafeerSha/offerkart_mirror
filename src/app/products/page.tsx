import ProductsLoader from "@/components/products/ProductsLoader";

export default function ProductsPage(props: {
    searchParams?: Promise<{ category?: string; subcategory?: string | string[]; shopId?: string; search?: string; sort?: string }> | { category?: string; subcategory?: string | string[]; shopId?: string; search?: string; sort?: string };
}) {
    return (
        <ProductsLoader searchParams={props.searchParams} />
    );
}
