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
    try {
        const [categoriesRes, subcategoriesRes] = await Promise.all([
            backend.get<RawCategoryResponse | BackendCategory[]>(ENDPOINTS.CATEGORY.BASE),
            backend.get<any>(ENDPOINTS.CATEGORY.ALL_SUBCATEGORIES)
        ]);

        if (!categoriesRes.success || !categoriesRes.data) {
            return {
                success: false,
                data: [] as BackendCategory[],
                error: categoriesRes.error || "Failed to fetch categories",
            };
        }

        const rawCats = categoriesRes.data;
        let categories: BackendCategory[] = [];
        if (Array.isArray(rawCats)) {
            categories = rawCats;
        } else if (rawCats && typeof rawCats === 'object' && Array.isArray(rawCats.data)) {
            categories = rawCats.data;
        }

        let subcategories: any[] = [];
        if (subcategoriesRes && subcategoriesRes.success && subcategoriesRes.data) {
            const rawSubs = subcategoriesRes.data;
            if (Array.isArray(rawSubs)) {
                subcategories = rawSubs;
            } else if (rawSubs && typeof rawSubs === 'object' && Array.isArray(rawSubs.data)) {
                subcategories = rawSubs.data;
            }
        }

        const subcategoriesByParentId: Record<number, BackendSubCategory[]> = {};
        subcategories.forEach((sub: any) => {
            const parentId = sub.parent?.id || sub.categoryId;
            if (parentId) {
                if (!subcategoriesByParentId[parentId]) {
                    subcategoriesByParentId[parentId] = [];
                }
                subcategoriesByParentId[parentId].push({
                    id: sub.id,
                    name: sub.name,
                    categoryId: parentId
                });
            }
        });

        const mergedCategories = categories.map((cat) => {
            return {
                ...cat,
                subcategories: subcategoriesByParentId[cat.id] || cat.subcategories || []
            };
        });

        return {
            success: true,
            data: mergedCategories,
        };
    } catch (err) {
        console.error("Failed to fetch categories and subcategories:", err);
        return {
            success: false,
            data: [] as BackendCategory[],
            error: "Failed to fetch categories",
        };
    }
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
