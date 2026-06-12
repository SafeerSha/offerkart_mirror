import { backend } from "./backendClient";
import { ENDPOINTS } from "./endpoints";

export interface BackendSubCategory {
    id: number;
    name: string;
    categoryId?: number;
}

export interface BackendCategory {
    id: number;
    name: string;
    description?: string;
    subcategories?: BackendSubCategory[];
}

/**
 * Response shape expected from the raw server JSON.
 * Matches the envelope pattern used elsewhere in the app.
 */
interface RawCategoryResponse {
    success?: boolean;
    data?: BackendCategory[];
    [key: string]: any; // fallback for any other root keys
}

/**
 * Fetches all categories from the upstream server.
 * Normalizes the response to always present a flat array of categories 
 * in the data field of the ApiResponse object.
 */
export async function getCategories() {
    const response = await backend.get<RawCategoryResponse | BackendCategory[]>(ENDPOINTS.CATEGORY.BASE);

    if (!response.success || !response.data) {
        return {
            success: false,
            data: [] as BackendCategory[],
            error: response.error || "Failed to fetch categories",
        };
    }

    // Normalize shape: handle both wrapped { success, data } and raw array []
    const rawData = response.data;
    let normalizedData: BackendCategory[] = [];

    if (Array.isArray(rawData)) {
        normalizedData = rawData;
    } else if (rawData && typeof rawData === 'object' && Array.isArray(rawData.data)) {
        normalizedData = rawData.data;
    } else if (rawData && typeof rawData === 'object') {
        // Sometimes nested under a custom key or returned directly as the object?
        console.warn("[Categories API] Unrecognized shape in payload:", rawData);
    }

    // Preload all subcategories in parallel so they are ready on page load
    try {
        const categoriesWithSubcategories = await Promise.all(
            normalizedData.map(async (category) => {
                if (category.subcategories && category.subcategories.length > 0) {
                    return category;
                }
                const subRes = await getSubCategories(category.id);
                return {
                    ...category,
                    subcategories: subRes.success && subRes.data ? subRes.data : [],
                };
            })
        );
        normalizedData = categoriesWithSubcategories;
    } catch (err) {
        console.error("Failed to preload subcategories in parallel:", err);
    }

    return {
        success: true,
        data: normalizedData,
    };
}

export async function getSubCategories(categoryId: number | string) {
    const response = await backend.get<RawCategoryResponse | BackendSubCategory[]>(ENDPOINTS.CATEGORY.SUBCATEGORIES(categoryId));

    if (!response.success || !response.data) {
        return {
            success: false,
            data: [] as BackendSubCategory[],
            error: response.error || "Failed to fetch subcategories",
        };
    }

    const rawData = response.data;
    let normalizedData: BackendSubCategory[] = [];

    if (Array.isArray(rawData)) {
        normalizedData = rawData;
    } else if (rawData && typeof rawData === 'object' && Array.isArray(rawData.data)) {
        normalizedData = rawData.data;
    }

    return {
        success: true,
        data: normalizedData,
    };
}
