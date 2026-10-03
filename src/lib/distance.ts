export const DISTANCE_OPTIONS = [1, 5, 10, 20, 30, 40, 50, 60, 80, 100] as const;
export const DEFAULT_RADIUS = 30;
export type SearchRadius = number | null;

export function isSearchRadius(value: unknown): value is SearchRadius {
    return value === null || (typeof value === "number" && Number.isFinite(value) && value > 0);
}

export function isAllLocation(name?: string | null): boolean {
    if (!name) return false;
    const n = name.trim().toLowerCase();
    return n === "all" || n.startsWith("all,") || n.startsWith("all ");
}

export function hasCoordinates(latitude: unknown, longitude: unknown): boolean {
    return typeof latitude === "number" && Number.isFinite(latitude) && Math.abs(latitude) <= 90
        && typeof longitude === "number" && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
}

export function validDistance(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function withinRadius(distance: unknown, radius: SearchRadius): boolean {
    const km = validDistance(distance);
    return radius === null || (km !== null && km < radius);
}

export function nextRadius(radius: SearchRadius): SearchRadius {
    return DISTANCE_OPTIONS.find(option => radius !== null && option > radius) ?? null;
}

export function parseDistanceValue(value: unknown): number | null {
    if (typeof value === "number") {
        return Number.isFinite(value) && value >= 0 ? value : null;
    }
    if (typeof value === "string") {
        const cleaned = value.replace(/km|kilometer|kilometers|m|miles/gi, "").trim();
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    }
    return null;
}

export function formatDistanceKm(value: unknown): string | null {
    const km = parseDistanceValue(value);
    if (km === null) return null;
    return km > 0 && km < 0.1 ? "<0.1 km away" : `${Number(km.toFixed(1))} km away`;
}

/** Prefer the API's kilometre/distance property; otherwise use actual shop coordinates. */
export function resolveShopDistance(item: unknown, latitude?: number | null, longitude?: number | null): number | null {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    const reported = parseDistanceValue(
        record.kilometer ??
        record.kilometers ??
        record.distanceKm ??
        record.distance_km ??
        record.distance ??
        record.distanceInKm ??
        record.km ??
        (record.shop as any)?.kilometer ??
        (record.shop as any)?.kilometers ??
        (record.shop as any)?.distanceKm ??
        (record.shop as any)?.distance_km ??
        (record.shop as any)?.distance
    );
    if (reported !== null) return reported;
    const shop = record.shop && typeof record.shop === "object" ? record.shop as Record<string, unknown> : record;
    const lat = shop.latitude ?? record.latitude;
    const lon = shop.longitude ?? record.longitude;
    if (!hasCoordinates(latitude, longitude) || !hasCoordinates(lat, lon)) return null;
    const radians = Math.PI / 180;
    const a = Math.sin(((lat as number) - (latitude as number)) * radians / 2) ** 2
        + Math.cos((latitude as number) * radians) * Math.cos((lat as number) * radians)
        * Math.sin(((lon as number) - (longitude as number)) * radians / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

export interface NearbyShopSource {
    shopId?: number | string | null;
    shopName?: string;
    shopLogo?: string | null;
    distanceKm?: number | null;
}

export function shopsFromResults(items: readonly NearbyShopSource[]) {
    const shops = new Map<string, { id: string | number; name: string; logo: string; distanceKm: number | null }>();
    for (const item of items) {
        if (item.shopId == null || !item.shopName) continue;
        shops.set(String(item.shopId), { id: item.shopId, name: item.shopName, logo: item.shopLogo ?? "", distanceKm: validDistance(item.distanceKm) });
    }
    return [...shops.values()];
}
