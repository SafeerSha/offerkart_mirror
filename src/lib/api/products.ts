import { backend, type BackendRequestOptions, unwrapApiEnvelope } from './backendClient';
import { ENDPOINTS } from './endpoints';
import { OfferProductPayload, Product, PaginatedResponse } from '../types';
import { updateOfferProduct, getAllOfferProducts, deleteOfferProduct } from './offerproduct';
import { CACHE_TAGS } from './cache-tags';
import { getUserOfferProducts } from './userOffersService';


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

    const shopName = item.shop_name || item.shopName || item.shop?.shop_name || item.shop?.name || "Store Partner";
    const shopLogo = item.logo_url || item.logo || item.shop?.logo_url || item.shop?.logo || item.shopLogo || item.logoUrl || null;

    return {
        id: item.id,
        name: item.displayName || item.name || "Unnamed Product",
        shopName,
        shopLogo,
        shopId: item.shop?.id || item.shopId || item.shop_id || null,
        price: finalOfferPrice,
        originalPrice: finalOriginalPrice,
        savingPercentage: finalSavingPercentage,
        image: primaryImage,
        description: item.displayDescription || item.description || "",
        category: item.mainCategory || item.categoryName || item.category?.name || (typeof item.category === 'string' && !/^\d+$/.test(item.category) && item.category.trim() !== '' ? item.category : "Product"),
        subcategory: item.subcategory || (Array.isArray(item.subcategories) ? item.subcategories[0] : item.subcategories) || (item.category?.level === 2 ? item.category?.name : null) || null,
        categoryId: item.categoryId,
        rating: item.rating || 5,
        reviews: item.reviews || 0,
        discount: item.discount || (finalSavingPercentage > 0 ? `${finalSavingPercentage}% OFF` : undefined),
        specifications: [
            { label: "Category", value: item.mainCategory || item.categoryName || item.category?.name || (typeof item.category === 'string' && !/^\d+$/.test(item.category) && item.category.trim() !== '' ? item.category : "Product") }
        ],
        images: [primaryImage],
        offerId: item.offerId || item.offer_id || null,
        daysLeft: item.daysLeft !== undefined ? item.daysLeft : null,
        validFrom: item.validFrom ?? null,
        validTo: item.validTo ?? null,
        availableBranches: item.availableBranches || null,
    };
}

export async function getAllProducts(
    shopId?: string,
    cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">
) {
    if (!shopId || shopId === "all" || shopId === "undefined" || shopId === "null" || shopId === "") {
        try {
            const userProductsRes = await getUserProducts({ limit: 100 }, cacheOptions);
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
        const backendRes = await getAllOfferProducts(shopId, cacheOptions);
        
        if (backendRes.success && backendRes.data) {
            // Backend returns { value: [...], Count: N } envelope
            const rawData = backendRes.data;
            const items: any[] = Array.isArray(rawData)
                ? rawData
                : Array.isArray((rawData as any).value)
                    ? (rawData as any).value
                    : [];

            // Use shared mapper, then extend with business-specific fields
            const backendProducts = items.map((item: any) => {
                const base = mapUserProductToProduct(item);
                return {
                    ...base,
                    // Business-specific fields not in the shared mapper
                    parentCategoryId: item.category?.parentId ?? item.category?.categoryId ?? null,
                    subcategoryId: (item.category?.level === 2 ? item.category?.id : item.subcategoryId) ?? null,
                    categoryObject: item.category,
                    branchIds: item.offerBranches?.map((ob: any) => String(ob.branchId)) ?? [],
                    isHighlighted: item.isHighlighted,
                    isActive: item.isActive,
                    status: item.isActive ? "active" : "inactive",
                    currencyId: item.currencyId,
                };
            });
            return backendProducts;
        }
    } catch (error) {
        console.error(`[API] Critical error fetching products for shopId: ${shopId}:`, error);
    }

    return [];
}

export async function getProductById(
    id: string,
    cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">
) {
    // Try fetching from the new user-facing product details API
    try {
        const { getUserOfferProductById } = await import('./offerproduct');
        const res = await getUserOfferProductById(id);
        if (res.success && res.data) {
            let data = res.data;
            // Check if nested inside a data property
            if (data.data && typeof data.data === 'object') {
                data = data.data;
            }
            const product = mapUserProductToProduct(data);
            if (product) {
                return {
                    ...product,
                    description: product.description || "Premium quality guaranteed product.",
                    specifications: product.specifications || [
                        { label: "Category", value: product.category || "Product" }
                    ],
                };
            }
        }
    } catch (e) {
        console.error(`Error fetching product ${id} via user API:`, e);
    }

    // Fallback: try fetching from actual business backend API (legacy fallback)
    try {
        const res = await backend.get<any>(ENDPOINTS.OFFER_PRODUCT.DETAILS(id), {
            next: { tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT(id)] },
            ...cacheOptions,
        });
        if (res.success && res.data) {
            const data = res.data;
            return {
                ...mapUserProductToProduct(data),
                description: data.displayDescription || "Premium quality guaranteed product.",
                specifications: [
                    { label: "Category", value: data.category?.name || "Product" },
                    { label: "Status", value: data.isHighlighted ? "Featured" : "Standard" }
                ],
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
    subcategoryId?: string;
    shopId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
    latitude?: number;
    longitude?: number;
}, cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">): Promise<PaginatedResponse<Product>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const sort = query.sort || "newest";
    const { search, categoryId, subcategoryId, shopId, minPrice, maxPrice, latitude, longitude } = query;

    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
    });
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (subcategoryId) params.set("subcategoryId", subcategoryId);
    if (shopId) params.set("shopId", shopId);
    if (minPrice !== undefined) params.set("minPrice", String(minPrice));
    if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice));
    if (latitude !== undefined) params.set("latitude", String(latitude));
    if (longitude !== undefined) params.set("longitude", String(longitude));

    let response: any;
    try {
        response = await backend.get<any>(`${ENDPOINTS.USER_OFFER.PRODUCTS}?${params.toString()}`, {
            next: { tags: [CACHE_TAGS.PRODUCTS] },
            ...cacheOptions,
        });
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
    const apiData = unwrapApiEnvelope(result.data);

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

    if (!pagination) {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = mappedProducts.slice(startIndex, endIndex);
        return {
            success: true,
            data: {
                data: paginatedData,
                pagination: {
                    total: mappedProducts.length,
                    page,
                    limit,
                    totalPages: Math.ceil(mappedProducts.length / limit)
                }
            }
        };
    }

    // Ensure totalPages exists in pagination for reliable infinite scrolling
    const finalPagination = { ...pagination };
    if (finalPagination.totalPages === undefined && finalPagination.total !== undefined) {
        const pagLimit = finalPagination.limit || limit;
        finalPagination.totalPages = Math.ceil(finalPagination.total / pagLimit);
    }

    return {
        success: true,
        data: {
            data: mappedProducts,
            pagination: finalPagination
        }
    };
}

/**
 * Fetches similar products for a given product ID, optionally filtered by latitude/longitude.
 */
export async function getUserProductSimilar(
    id: string | number,
    query: { latitude?: number | null; longitude?: number | null } = {},
    cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">
) {
    const params = new URLSearchParams();
    const normalizedLatitude = query.latitude !== undefined && query.latitude !== null ? String(query.latitude) : undefined;
    const normalizedLongitude = query.longitude !== undefined && query.longitude !== null ? String(query.longitude) : undefined;

    if (normalizedLatitude) params.set("latitude", normalizedLatitude);
    if (normalizedLongitude) params.set("longitude", normalizedLongitude);

    let response: any;
    try {
        response = await backend.get<any>(
            `${ENDPOINTS.USER_OFFER.PRODUCT_SIMILAR(id)}?${params.toString()}`,
            {
                next: { tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT(id)] },
                ...cacheOptions,
            }
        );
    } catch (e: any) {
        console.error("getUserProductSimilar backend call failed:", e);
        response = { success: false };
    }

    if (!response || !response.success || !response.data) {
        return {
            success: false,
            data: [],
            error: response?.error || "Failed to fetch similar products",
        };
    }

    const apiData = unwrapApiEnvelope(response.data);
    const productsArray = Array.isArray(apiData) ? apiData : (Array.isArray(apiData.data) ? apiData.data : []);
    const mappedProducts = productsArray.map((p: any) => mapUserProductToProduct(p));

    return {
        success: true,
        data: mappedProducts,
    };
}

export async function getProductShops(
    latitude?: number | null,
    longitude?: number | null,
    categoryId?: number | string | null,
    subcategoryId?: number | string | null,
    search?: string | null,
    cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">
): Promise<{ success: boolean; data: any[] }> {
    try {
        const params = new URLSearchParams();
        if (latitude !== undefined && latitude !== null) {
            params.set("latitude", String(latitude));
        }
        if (longitude !== undefined && longitude !== null) {
            params.set("longitude", String(longitude));
        }
        if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
            params.set("categoryId", String(categoryId));
        }
        if (subcategoryId !== undefined && subcategoryId !== null && subcategoryId !== "") {
            params.set("subcategoryId", String(subcategoryId));
        }
        if (search !== undefined && search !== null && search !== "") {
            params.set("search", String(search));
        }
        const queryString = params.toString() ? `?${params.toString()}` : "";

        const response = await backend.get<any>(`${ENDPOINTS.USER_OFFER.PRODUCTS_SHOPS}${queryString}`, {
            next: { tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.HOME], revalidate: 60 },
            ...cacheOptions,
        });

        if (response && response.success && response.data) {
            const apiData = response.data;
            const shops: any[] = Array.isArray(apiData.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);
            return {
                success: true,
                data: shops.map((shop) => {
                    return {
                        id: shop.id,
                        name: shop.shop_name,
                        logo: shop.logo_url || null
                    };
                })
            };
        }
    } catch (e) {
        console.error("Failed to fetch product shops from API:", e);
    }
    return {
        success: true,
        data: [],
    };
}
