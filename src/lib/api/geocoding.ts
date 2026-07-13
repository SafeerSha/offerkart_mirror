export interface GeocodeResult {
    lat: number;
    lng: number;
}

export interface ReverseGeocodeAddress {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    village?: string;
    city_district?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
    district?: string;
    state_district?: string;
    county?: string;
    country?: string;
    country_code?: string;
    display_name?: string;
}

/**
 * Forward geocodes an address string to coordinates in India.
 */
export async function forwardGeocode(query: string): Promise<GeocodeResult | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`
        );
        const data = await response.json();
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            if (!isNaN(lat) && !isNaN(lng)) {
                return { lat, lng };
            }
        }
    } catch (error) {
        console.error("forwardGeocode failed:", error);
    }
    return null;
}

/**
 * Reverse geocodes coordinates to address components.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{ address: ReverseGeocodeAddress; display_name: string } | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
        );
        const data = await response.json();
        if (data && data.address) {
            return {
                address: data.address,
                display_name: data.display_name || ""
            };
        }
    } catch (error) {
        console.error("reverseGeocode failed:", error);
    }
    return null;
}
