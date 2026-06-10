import { backend, BackendRequestOptions } from './backendClient';
import { ENDPOINTS } from './endpoints';
import { OfferProductPayload } from '../types/product';
import { updateOfferProduct, getAllOfferProducts, deleteOfferProduct } from './offerproduct';
import { CACHE_TAGS } from './cache-tags';
import { getUserOfferProducts } from './userOffersService';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function mapUserProductToProduct(item: any): any {
    if (!item) return null;
    const primaryImage = item.imageUrl || item.image || null;
    const finalOriginalPrice = item.originalPrice !== undefined ? item.originalPrice : (item.price !== undefined ? item.price : 0);
    const finalOfferPrice = item.offerPrice !== undefined ? item.offerPrice : (item.price !== undefined ? item.price : 0);
    const finalSavingPercentage = item.savingPercentage !== undefined 
        ? item.savingPercentage 
        : (finalOriginalPrice && finalOfferPrice && finalOriginalPrice > finalOfferPrice 
            ? Math.round(((finalOriginalPrice - finalOfferPrice) / finalOriginalPrice) * 100) 
            : 0);

    return {
        id: item.id,
        name: item.displayName || item.name || "Unnamed Product",
        shopName: item.shop?.shop_name || item.shopName || "Store Partner",
        price: finalOfferPrice,
        originalPrice: finalOriginalPrice,
        savingPercentage: finalSavingPercentage,
        image: primaryImage,
        description: item.displayDescription || item.description || "",
        category: item.category?.name || item.category || String(item.categoryId || 1),
        categoryId: item.categoryId,
        rating: item.rating || 5,
        reviews: item.reviews || 0,
        discount: item.discount || (finalSavingPercentage > 0 ? `${finalSavingPercentage}% OFF` : undefined),
        specifications: [
            { label: "Category", value: item.category?.name || item.category || String(item.categoryId || 1) },
            { label: "Availability", value: "In Stock" }
        ],
        images: [primaryImage]
    };
}

export async function getAllProducts(
    shopId?: string,
    cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">
) {
    void cacheOptions;
    if (!shopId || shopId === "all" || shopId === "undefined" || shopId === "null" || shopId === "") {
        try {
            const userProductsRes = await getUserProducts({ limit: 100 });
            if (userProductsRes && userProductsRes.success && userProductsRes.data && userProductsRes.data.data) {
                return userProductsRes.data.data;
            }
        } catch (e) {
            console.error("getAllProducts (end user) failed:", e);
        }
        return [];
    }

    try {
        // Try to fetch from backend API first
        console.log(`[API] Fetching products for shopId: ${shopId}`);
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

            const backendProducts = items.map((item: any) => {
                const finalOriginalPrice = item.originalPrice !== undefined ? item.originalPrice : (item.price !== undefined ? item.price : 0);
                const finalOfferPrice = item.offerPrice !== undefined ? item.offerPrice : (item.price !== undefined ? item.price : 0);
                const finalSavingPercentage = item.savingPercentage !== undefined 
                    ? item.savingPercentage 
                    : (finalOriginalPrice && finalOfferPrice && finalOriginalPrice > finalOfferPrice 
                        ? Math.round(((finalOriginalPrice - finalOfferPrice) / finalOriginalPrice) * 100) 
                        : 0);
                return {
                    id: item.id,
                    name: item.displayName || item.name,
                    shopName: item.shop?.shop_name || item.shopName || "Store Partner",
                    price: finalOfferPrice,
                    originalPrice: finalOriginalPrice,
                    savingPercentage: finalSavingPercentage,
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
                };
            });
            return backendProducts;
        } else if (!backendRes.success) {
            console.warn(`[API] Backend products fetch failed for shopId: ${shopId}. Error: ${backendRes.error}`);
        } else {
            console.warn(`[API] Backend products fetch returned no data for shopId: ${shopId}`);
        }
    } catch (error) {
        console.error(`[API] Critical error fetching products for shopId: ${shopId}:`, error);
    }

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
    return customProducts;
}

export async function getProductById(
    id: string,
    cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">
) {
    await delay(100);

    // First try to look up in all end-user products
    try {
        const userProductsRes = await getUserProducts({ limit: 1000 });
        if (userProductsRes && userProductsRes.success && userProductsRes.data && userProductsRes.data.data) {
            const product = userProductsRes.data.data.find((p: any) => p && p.id != null && p.id.toString() === id);
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
        }
    } catch (e) {
        console.error("getProductById from user API failed:", e);
    }

    const all = await getAllProducts(undefined, cacheOptions);
    const product = all.find((p: any) => p && p.id != null && p.id.toString() === id);

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
        const res = await backend.get<any>(ENDPOINTS.OFFER_PRODUCT.DETAILS(id), {
            next: { tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT(id)] },
            ...cacheOptions,
        });
        if (res.success && res.data) {
            const data = res.data;
            // Map backend payload format back to application Product format
            const finalOriginalPrice = data.originalPrice !== undefined ? data.originalPrice : (data.price !== undefined ? data.price : 0);
            const finalOfferPrice = data.offerPrice !== undefined ? data.offerPrice : (data.price !== undefined ? data.price : 0);
            const finalSavingPercentage = data.savingPercentage !== undefined 
                ? data.savingPercentage 
                : (finalOriginalPrice && finalOfferPrice && finalOriginalPrice > finalOfferPrice 
                    ? Math.round(((finalOriginalPrice - finalOfferPrice) / finalOriginalPrice) * 100) 
                    : 0);
            return {
                id: data.id,
                name: data.displayName,
                shopName: data.shop?.shop_name || data.shopName || "Store Partner",
                price: finalOfferPrice,
                originalPrice: finalOriginalPrice,
                savingPercentage: finalSavingPercentage,
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
    if (payload.offerPrice >= payload.originalPrice && payload.originalPrice > 0) {
        return { success: false, error: "Offer price must be less than original price" };
    }
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

export async function getUserProducts(query: {
    search?: string;
    categoryId?: string;
    shopId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
}) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const sort = query.sort || "newest";
    const { search, categoryId, shopId, minPrice, maxPrice } = query;

    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
    });
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (shopId) params.set("shopId", shopId);
    if (minPrice !== undefined) params.set("minPrice", String(minPrice));
    if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice));

    let response: any;
    try {
        response = await backend.get<any>(`user/offer/products?${params.toString()}`);
    } catch (e: any) {
        console.error("getUserProducts backend call failed:", e);
        response = { success: false };
    }

    if (!response || !response.success || !response.data) {
        return {
            success: false,
            data: {
                data: [],
                pagination: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0
                }
            },
            error: response?.error || "Failed to fetch products"
        };
    }

    const result = response;
    let apiData = result.data;
    if (apiData && typeof apiData === "object" && apiData.success !== undefined) {
        apiData = apiData.data;
    }

    let productsArray: any[] = [];
    let pagination: any = null;

    if (apiData && typeof apiData === "object") {
        if (Array.isArray(apiData.data)) {
            productsArray = apiData.data;
            pagination = apiData.pagination || null;
        } else if (Array.isArray(apiData)) {
            productsArray = apiData;
        }
    }

    const mappedProducts = productsArray.map((p: any) => mapUserProductToProduct(p));

    return {
        success: true,
        data: {
            data: mappedProducts,
            pagination: pagination || {
                total: mappedProducts.length,
                page,
                limit,
                totalPages: Math.ceil(mappedProducts.length / limit)
            }
        }
    };
}
