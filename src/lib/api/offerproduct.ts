import { backend, type BackendRequestOptions } from "./backendClient";
import { ENDPOINTS } from "./endpoints";
import { CACHE_TAGS } from "./cache-tags";
import { OfferProductPayload } from "../types/product";
import { ApiResponse } from "../types/api";

/**
 * Creates a new offer product.
 * @param payload - The offer product data to create
 * @param shopId - The shop ID for the offer product
 * @returns Promise<ApiResponse<any>>
 */
export async function createOfferProduct(payload: OfferProductPayload, shopId: string): Promise<ApiResponse<any>> {
    return backend.post<any>(ENDPOINTS.OFFER_PRODUCT.BASE, payload, {
        headers: { shopId }
    });
}

export interface BusinessOfferProductsQuery {
    search?: string;
    page?: number;
    limit?: number;
    status?: "active" | "inactive" | string;
}

/**
 * Fetches all offer products for the current shop with optional filtering.
 * @param shopId - The optional shop ID to restrict fetch to
 * @param query - Optional search/filter/pagination params
 * @param cacheOptions - Optional Next.js cache options
 * @returns Promise<ApiResponse<any[]>>
 */
export async function getAllOfferProducts(
    shopId?: string,
    query: BusinessOfferProductsQuery = {},
    cacheOptions?: Pick<BackendRequestOptions, "next" | "tags" | "revalidate">
): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    if (query.search) params.set("search", query.search);
    if (query.status) params.set("status", query.status);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    return backend.get<any[]>(`${ENDPOINTS.OFFER_PRODUCT.BASE}${queryString}`, {
        headers: shopId ? { shopId } : {},
        next: { tags: [CACHE_TAGS.PRODUCTS] },
        ...cacheOptions,
    });
}

/**
 * Fetches a single offer product by ID.
 * @param id - The ID of the offer product to retrieve
 * @returns Promise<ApiResponse<any>>
 */
export async function getOfferProductById(id: string): Promise<ApiResponse<any>> {
    return backend.get<any>(ENDPOINTS.OFFER_PRODUCT.DETAILS(id), {
        next: { tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT(id)] },
    });
}

/**
 * Updates an offer product with the given ID.
 * @param id - The ID of the offer product to update
 * @param payload - The updated offer product data
 * @param shopId - The optional shop ID for the offer product
 * @returns Promise<ApiResponse<any>>
 */
export async function updateOfferProduct(id: string, payload: OfferProductPayload, shopId?: string): Promise<ApiResponse<any>> {
    if (payload.offerPrice >= payload.originalPrice && payload.originalPrice > 0) {
        return { success: false, error: "Offer price must be less than original price" };
    }
    return backend.put<any>(ENDPOINTS.OFFER_PRODUCT.DETAILS(id), payload, {
        headers: shopId ? { shopId } : {}
    });
}

/**
 * Toggles the active/inactive status of an offer product.
 * @param id - The ID of the offer product to toggle
 * @returns Promise<ApiResponse<any>>
 */
export async function toggleOfferProductStatus(id: string): Promise<ApiResponse<any>> {
    return backend.patch<any>(ENDPOINTS.OFFER_PRODUCT.INACTIVATE(id), null);
}

/**
 * Deletes an offer product by ID.
 * @param id - The ID of the offer product to delete
 * @returns Promise<ApiResponse<any>>
 */
export async function deleteOfferProduct(id: string): Promise<ApiResponse<any>> {
    return backend.delete<any>(ENDPOINTS.OFFER_PRODUCT.DETAILS(id));
}

/**
 * Fetches a single offer product by ID for end users.
 * @param id - The ID of the offer product to retrieve
 * @returns Promise<ApiResponse<any>>
 */
export async function getUserOfferProductById(id: string | number): Promise<ApiResponse<any>> {
    return backend.get<any>(ENDPOINTS.USER_OFFER.PRODUCT_DETAILS(id), {
        next: { tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT(String(id))] },
    });
}