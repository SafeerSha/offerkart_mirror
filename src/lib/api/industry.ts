import { backend } from "./backendClient";
import { ENDPOINTS } from "./endpoints";

export interface Industry {
    id: number;
    name: string;
    slug: string;
}

interface RawIndustryResponse {
    success?: boolean;
    data?: Industry[];
    [key: string]: any;
}

export async function getIndustries() {
    const response = await backend.get<RawIndustryResponse | Industry[]>(ENDPOINTS.INDUSTRY.BASE);

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
