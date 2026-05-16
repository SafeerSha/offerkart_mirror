import { backend } from './backendClient';
import { ENDPOINTS } from './endpoints';
import { ALL_PRODUCTS } from './mockData';
import { Product, OfferProductPayload } from '../types/product';
import { updateOfferProduct, getOfferProductById, getAllOfferProducts, deleteOfferProduct } from './offerproduct';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getAllProducts(shopId?: string) {
    try {
        // Try to fetch from backend API first
        console.log(`[API] Fetching products for shopId: ${shopId || 'all'}`);
        const backendRes = await getAllOfferProducts(shopId);
        
        if (backendRes.success && backendRes.data) {
            console.log(`[API] Successfully fetched products. Count: ${Array.isArray(backendRes.data) ? backendRes.data.length : (backendRes.data as any).Count || 'unknown'}`);
            // Backend returns { value: [...], Count: N } envelope
            const rawData = backendRes.data;
            const items: any[] = Array.isArray(rawData)
                ? rawData
                : Array.isArray((rawData as any).value)
                    ? (rawData as any).value
                    : [];

            const backendProducts = items.map((item: any) => ({
                id: item.id,
                name: item.displayName,
                shopName: item.shopName || "Store Partner",
                price: item.offerPrice,
                originalPrice: item.originalPrice,
                image: item.imageUrl || null,
                // Use nested category name if available, else fallback to categoryId string
                category: item.category?.name || String(item.categoryId),
                categoryId: item.categoryId,
                // Support both legacy object structures and new api structure {id, parentId, level}
                parentCategoryId: item.category?.parentId ?? item.category?.categoryId ?? null,
                subcategoryId: (item.category?.level === 2 ? item.category?.id : item.subcategoryId) ?? null,
                categoryObject: item.category,
                description: item.displayDescription || "",
                specifications: [
                    { label: "Category", value: item.category?.name || String(item.categoryId) },
                    { label: "Status", value: item.isHighlighted ? "Featured" : "Standard" },
                    { label: "Availability", value: "In Stock" }
                ],
                images: [item.imageUrl],
                rating: 5,
                reviews: 0,
                // Backend returns offerBranches: [{ branchId, branch: {...} }]
                branchIds: item.offerBranches?.map((ob: any) => String(ob.branchId)) ?? [],
                isHighlighted: item.isHighlighted,
                isActive: item.isActive,
                status: item.isActive ? "active" : "inactive",
                currencyId: item.currencyId,
                validFrom: item.validFrom ?? null,
                validTo: item.validTo ?? null,
            }));
            return backendProducts;
        } else if (!backendRes.success) {
            console.warn(`[API] Backend products fetch failed for shopId: ${shopId}. Error: ${backendRes.error}`);
        } else {
            console.warn(`[API] Backend products fetch returned no data for shopId: ${shopId}`);
        }
    } catch (error) {
        console.error(`[API] Critical error fetching products for shopId: ${shopId}:`, error);
    }

    console.log("[API] Falling back to mock data (ALL_PRODUCTS)");

    // Fallback to local storage + mock data
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

    if (product) {
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

    // Try fetching from actual backend API for dynamic IDs not in static mocks
    try {
        const res = await getOfferProductById(id);
        if (res.success && res.data) {
            const data = res.data;
            // Map backend payload format back to application Product format
            return {
                id: data.id,
                name: data.displayName,
                shopName: data.shopName || "Store Partner",
                price: data.offerPrice,
                originalPrice: data.originalPrice,
                image: data.imageUrl,
                category: data.category?.name || String(data.categoryId),
                categoryId: data.categoryId,
                parentCategoryId: data.category?.parentId ?? data.category?.categoryId ?? null,
                subcategoryId: (data.category?.level === 2 ? data.category?.id : data.subcategoryId) ?? null,
                categoryObject: data.category,
                description: data.displayDescription || "Premium quality guaranteed product.",
                specifications: [
                    { label: "Category", value: String(data.categoryId) },
                    { label: "Status", value: data.isHighlighted ? "Featured" : "Standard" },
                    { label: "Availability", value: "In Stock" }
                ],
                images: [data.imageUrl],
                rating: 5, // Default rating placeholder for backend items
                reviews: 0
            };
        }
    } catch (error) {
        console.error(`Error fetching backend product ${id}:`, error);
    }

    return null;
}

/**
 * Dispatches creation payload to the backend offer product endpoint.
 */
export async function createProduct(payload: OfferProductPayload, shopId?: string) {
    try {
        const response = await backend.post<any>(ENDPOINTS.OFFER_PRODUCT.BASE, payload, {
            headers: shopId ? { shopId } : {}
        });
        
        return response;
    } catch (error) {
        console.error("Error creating product:", error);
        return { success: false, error: "API Call failed" };
    }
}

export async function updateProduct(id: string, payload: OfferProductPayload, shopId?: string) {
    return updateOfferProduct(id, payload, shopId);
}

export async function deleteProduct(id: string) {
    return deleteOfferProduct(id);
}
