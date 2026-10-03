import { backend } from "./backendClient";
import { ENDPOINTS } from "./endpoints";
import { CACHE_TAGS } from "./cache-tags";

export interface Industry {
    id: number;
    name: string;
    slug: string;
}

export interface IndustryResponse {
    success: boolean;
    data: Industry[];
    error?: string;
}

interface RawIndustryResponse {
    success?: boolean;
    data?: Industry[];
    [key: string]: any;
}

export async function getIndustries(cacheOptions?: { next?: { tags?: string[]; revalidate?: number | false } }): Promise<IndustryResponse> {
    const response = await backend.get<RawIndustryResponse | Industry[]>(
        ENDPOINTS.INDUSTRY.BASE,
        {
            next: { tags: [CACHE_TAGS.OFFERS], revalidate: 86400 },
            ...cacheOptions,
        }
    );

    if (!response.success || !response.data) {
        return {
            success: false,
            data: [] as Industry[],
            error: response.error || "Failed to fetch industries",
        };
    }

    const rawData = response.data;
    let normalizedData: Industry[] = [];

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
