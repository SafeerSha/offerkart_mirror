import { describe, expect, it } from "vitest";
import { hasCoordinates, isSearchRadius, withinRadius, nextRadius, resolveShopDistance, formatDistanceKm, shopsFromResults } from "@/lib/distance";

describe("shop distance", () => {
    it.each([1, 5, 7, 10, 15, 20, 30, 40, 50, 60, 80, 100, null])("accepts available radius %s", radius => expect(isSearchRadius(radius)).toBe(true));
    it.each([-1, 0, NaN, Infinity, "5", undefined])("rejects invalid radius %s", radius => expect(isSearchRadius(radius)).toBe(false));
    it("uses a strict boundary without rounding", () => {
        expect(withinRadius(4.999, 5)).toBe(true);
        expect(withinRadius(5, 5)).toBe(false);
        expect(withinRadius(5.001, 5)).toBe(false);
        expect(withinRadius(0, 1)).toBe(true);
    });
    it.each([null, undefined, NaN, Infinity, -1, "1"])("excludes unknown or invalid distance %s", distance => {
        expect(withinRadius(distance, 5)).toBe(false);
        expect(withinRadius(distance, null)).toBe(true);
    });
    it("accepts zero coordinates and rejects invalid/missing coordinates", () => {
        expect(hasCoordinates(0, 0)).toBe(true);
        expect(hasCoordinates(91, 0)).toBe(false);
        expect(hasCoordinates(0, -181)).toBe(false);
        expect(hasCoordinates(null, 0)).toBe(false);
        expect(hasCoordinates(NaN, Infinity)).toBe(false);
    });
    it("expands to the next available radius or any distance", () => {
        expect(nextRadius(5)).toBe(10);
        expect(nextRadius(30)).toBe(40);
        expect(nextRadius(40)).toBe(50);
        expect(nextRadius(60)).toBe(80);
        expect(nextRadius(80)).toBe(100);
        expect(nextRadius(100)).toBeNull();
    });
    it("uses reported distances or calculates from actual shop coordinates", () => {
        expect(resolveShopDistance({ distanceKm: 0 }, 0, 0)).toBe(0);
        expect(resolveShopDistance({ distance: 2 }, 0, 0)).toBe(2);
        expect(resolveShopDistance({ shop: { latitude: 0, longitude: 1 } }, 0, 0)).toBeCloseTo(111.195, 2);
        expect(resolveShopDistance({ latitude: 0, longitude: 0 }, 0, 0)).toBe(0);
        expect(resolveShopDistance({}, 0, 0)).toBeNull();
        expect(resolveShopDistance({ latitude: 0, longitude: 1 }, null, null)).toBeNull();
    });
    it("formats kilometres without claiming that invalid distances are zero", () => {
        expect(formatDistanceKm(0)).toBe("0 km away");
        expect(formatDistanceKm(0.01)).toBe("<0.1 km away");
        expect(formatDistanceKm(3.23)).toBe("3.2 km away");
        expect(formatDistanceKm(null)).toBeNull();
    });
    it("deduplicates nearby shops and omits invalid destinations", () => {
        expect(shopsFromResults([{ shopId: 3, shopName: "Byte", distanceKm: 2 }, { shopId: 3, shopName: "Byte", distanceKm: 2 }, { shopName: "Unknown" }])).toHaveLength(1);
    });
});
