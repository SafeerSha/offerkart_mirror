import { backend } from "./backendClient";
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

/**
 * Fetches all offer products for the current shop.
 * @param shopId - The optional shop ID to restrict fetch to
 * @returns Promise<ApiResponse<any[]>>
 */
export async function getAllOfferProducts(shopId?: string): Promise<ApiResponse<any[]>> {
    return backend.get<any[]>(ENDPOINTS.OFFER_PRODUCT.BASE, {
        headers: shopId ? { shopId } : {},
        next: { tags: [CACHE_TAGS.PRODUCTS] },
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