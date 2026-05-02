import { ALL_PRODUCTS } from './mockData';
import { Product } from '../types/product';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getAllProducts() {
    await delay(100);
    let customProducts: any[] = [];
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("customProducts");
        if (stored) {
            try {
                customProducts = JSON.parse(stored);
            } catch (e) {
                console.error(e);
            }
        }
    }
    return [...customProducts, ...ALL_PRODUCTS];
}

export async function getProductById(id: string) {
    await delay(100);
    const all = await getAllProducts();
    const product = all.find(p => p.id.toString() === id);

    if (!product) return null;

    return {
        ...product,
        description: product.description || "This is a premium product available at " + product.shopName + ". Quality guaranteed.",
        specifications: product.specifications || [
            { label: "Category", value: product.category },
            { label: "Shop", value: product.shopName },
            { label: "Availability", value: "In Stock" }
        ],
        images: product.images || [product.image, product.image, product.image]
    };
}

export async function createProduct(payload: any) {
    await delay(100);
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("customProducts");
        let customProducts = stored ? JSON.parse(stored) : [];
        const newProduct = {
            id: String(Date.now()),
            ...payload,
            rating: 5,
            reviews: 0
        };
        customProducts = [newProduct, ...customProducts];
        localStorage.setItem("customProducts", JSON.stringify(customProducts));
        return { success: true, data: newProduct };
    }
    return { success: false };
}

export async function updateProduct(id: string, payload: any) {
    await delay(100);
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("customProducts");
        let customProducts = stored ? JSON.parse(stored) : [];
        customProducts = customProducts.map((p: any) => p.id === id ? { ...p, ...payload } : p);
        localStorage.setItem("customProducts", JSON.stringify(customProducts));
        return { success: true };
    }
    return { success: false };
}

export async function deleteProduct(id: string) {
    await delay(100);
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("customProducts");
        let customProducts = stored ? JSON.parse(stored) : [];
        customProducts = customProducts.filter((p: any) => p.id !== id);
        localStorage.setItem("customProducts", JSON.stringify(customProducts));
        return { success: true };
    }
    return { success: false };
}
