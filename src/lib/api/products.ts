import { ALL_PRODUCTS } from './mockData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getAllProducts() {
    await delay(100);
    return ALL_PRODUCTS;
}

export async function getProductById(id: string) {
    await delay(100);
    const product = ALL_PRODUCTS.find(p => p.id.toString() === id);

    if (!product) return null;

    return {
        ...product,
        description: "This is a premium product available at " + product.shopName + ". Quality guaranteed.",
        specifications: [
            { label: "Category", value: product.category },
            { label: "Shop", value: product.shopName },
            { label: "Availability", value: "In Stock" }
        ],
        images: [product.image, product.image, product.image] // Mock multiple images
    };
}
