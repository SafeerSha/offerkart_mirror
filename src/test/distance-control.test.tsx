import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DistanceControl, DistanceEmptyState, DistanceListingFeedback } from "@/components/shared/DistanceControl";
import { useDistancePreference } from "@/hooks/useDistancePreference";
import { useRadiusResults } from "@/hooks/useRadiusResults";

const location = vi.hoisted(() => ({ latitude: 0 as number | null, longitude: 0 as number | null }));
const openModal = vi.hoisted(() => vi.fn());
vi.mock("@/context/LocationContext", () => ({ useLocationContext: () => ({ location, hydrated: true, setModalOpen: openModal }) }));
const storage = new Map<string, string>();
beforeEach(() => { vi.stubGlobal("localStorage", { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key), clear: () => storage.clear() }); localStorage.clear(); location.latitude = 0; location.longitude = 0; vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("distance preference and controls", () => {
    it("updates and persists the selection across mounted consumers", () => {
        render(<><DistanceControl /><DistanceControl /></>);
        fireEvent.change(screen.getAllByRole("combobox", { name: "Search radius" })[0], { target: { value: "5" } });
        expect(localStorage.getItem("offernearu_search_radius")).toBe("5");
        expect((screen.getAllByRole("combobox")[1] as HTMLSelectElement).value).toBe("5");
        fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "all" } });
        expect(localStorage.getItem("offernearu_search_radius")).toBe("all");
    });
    it("defaults to 30km when no preference is stored", () => {
        const { result } = renderHook(useDistancePreference);
        expect(result.current.radius).toBe(30);
    });
    it("disables radius selection without coordinates and opens location settings", () => {
        location.latitude = null;
        render(<DistanceControl />);
        expect((screen.getByRole("combobox") as HTMLSelectElement).disabled).toBe(true);
        fireEvent.click(screen.getByRole("button", { name: "Choose location" }));
        expect(openModal).toHaveBeenCalledWith(true);
    });
    it("restores valid settings and rejects unsupported saved values", () => {
        localStorage.setItem("offernearu_search_radius", "5");
        const { result } = renderHook(useDistancePreference);
        expect(result.current.radius).toBe(5);
        act(() => { localStorage.setItem("offernearu_search_radius", "7"); window.dispatchEvent(new Event("storage")); });
        expect(result.current.radius).toBe(7);
        act(() => { localStorage.setItem("offernearu_search_radius", "-1"); window.dispatchEvent(new Event("storage")); });
        expect(result.current.radius).toBeNull();
        expect(() => result.current.setRadius(-1 as any)).toThrow(RangeError);
    });
    it("remains usable when localStorage is blocked", () => {
        vi.spyOn(localStorage, "getItem").mockImplementation(() => { throw new Error("denied"); });
        vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("denied"); });
        const { result } = renderHook(useDistancePreference);
        act(() => result.current.setRadius(10));
        expect(result.current.radius).toBe(10);
        act(() => result.current.setRadius(null));
    });
    it("updates immediately when storage can be read but cannot be written", () => {
        vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("quota"); });
        const { result } = renderHook(useDistancePreference);
        act(() => result.current.setRadius(25));
        expect(result.current.radius).toBe(25);
        act(() => result.current.setRadius(null));
    });
    it("expands an empty result by opening the radius preference popup", () => {
        localStorage.setItem("offernearu_search_radius", "5");
        render(<DistanceEmptyState />);
        expect(screen.getByRole("status").textContent).toContain("No shops found within 5 km");
        fireEvent.click(screen.getByRole("button", { name: "Expand the range" }));
        expect(openModal).toHaveBeenCalledWith(true);
    });
    it("separates errors from empty results and retries", () => {
        localStorage.setItem("offernearu_search_radius", "5");
        const retry = vi.fn();
        render(<DistanceListingFeedback subject="offers" error onRetry={retry} />);
        expect(screen.getByRole("alert").textContent).toContain("Could not load offers");
        expect(screen.queryByText(/No shops/)).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Retry" }));
        expect(retry).toHaveBeenCalledOnce();
    });
    it("allows choosing No range limit option from dropdown to see all offers in location", () => {
        render(<DistanceControl inLocationModal />);
        const input = screen.getByRole("combobox", { name: "Search radius" });
        fireEvent.click(input);
        const noRangeOption = screen.getByRole("option", { name: /No range limit/i });
        expect(noRangeOption).toBeDefined();
        fireEvent.click(noRangeOption);
        expect(localStorage.getItem("offernearu_search_radius")).toBe("all");
    });
});

describe("radius filtering across pages", () => {
    it("keeps searching past an empty first page and filters boundary/unknown distances", () => {
        const fetchNextPage = vi.fn().mockResolvedValue(undefined);
        const { result, rerender } = renderHook(({ items, hasNextPage }) => useRadiusResults({
            items, hasNextPage, radius: 5, locationReady: true, isFetching: false, error: null,
            fetchNextPage, distance: item => item.distance,
        }), { initialProps: { items: [{ distance: 5 }, { distance: null }], hasNextPage: true } });
        expect(result.current.items).toEqual([]);
        expect(result.current.searching).toBe(true);
        expect(fetchNextPage).toHaveBeenCalledOnce();
        rerender({ items: [{ distance: 5 }, { distance: null }, { distance: 4.9 }], hasNextPage: false });
        expect(result.current.items).toEqual([{ distance: 4.9 }]);
        expect(result.current.searching).toBe(false);
    });
    it("never fetches more on errors or missing location", () => {
        const fetchNextPage = vi.fn().mockResolvedValue(undefined);
        const defaults = { items: [{ distance: 1 }], radius: 5 as const, hasNextPage: true, locationReady: true, isFetching: false, error: null as unknown, fetchNextPage, distance: (item: { distance: number }) => item.distance };
        const { result, rerender } = renderHook(props => useRadiusResults(props), { initialProps: { ...defaults, error: new Error("offline") } });
        expect(result.current.searching).toBe(false);
        rerender({ ...defaults, locationReady: false });
        expect(result.current.items).toEqual([]);
        expect(fetchNextPage).not.toHaveBeenCalled();
    });
});
