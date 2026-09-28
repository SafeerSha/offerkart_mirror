import { cleanup, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getGlobalSearch } from "@/lib/api/userOffersService";
import Header from "@/components/layout/Header";
import { LocationProvider } from "@/context/LocationContext";

vi.mock("@/lib/api/userOffersService", () => ({ getGlobalSearch: vi.fn() }));
vi.mock("@/hooks/useCategoryHierarchy", () => ({ useCategoryHierarchy: () => ({ resolveHierarchyById: () => ({ main: "", sub: "" }) }) }));
vi.mock("@/hooks/useApi", () => ({ useMyShops: () => ({ data: null }) }));
vi.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ locale: "en", t: (key: string) => key }) }));
vi.mock("@/components/i18n/LanguageSwitcher", () => ({ LanguageSwitcher: () => null }));
const storage = new Map<string, string>();
beforeEach(() => {
    storage.clear();
    vi.stubGlobal("localStorage", {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
    });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("location popup distance setting", () => {
    it("lets a user select location, set radius, and finish without reopening", async () => {
        render(<LocationProvider><Header /></LocationProvider>);
        const dialog = await screen.findByRole("dialog");
        expect((within(dialog).getByRole("combobox", { name: "Search radius" }) as HTMLSelectElement).disabled).toBe(true);
        fireEvent.click(within(dialog).getByRole("button", { name: /Kochi/ }));
        expect(screen.getByRole("dialog")).toBeDefined();
        const radius = within(dialog).getByRole("combobox", { name: "Search radius" });
        expect((radius as HTMLSelectElement).disabled).toBe(false);
        fireEvent.change(radius, { target: { value: "5" } });
        expect(storage.get("offernearu_search_radius")).toBe("5");
        fireEvent.change(radius, { target: { value: "12" } });
        expect(storage.get("offernearu_search_radius")).toBe("12");
        fireEvent.click(within(dialog).getByRole("button", { name: "Done" }));
        expect(screen.queryByRole("dialog")).toBeNull();
    });
    it("applies the saved radius to global shop search and expands empty results", async () => {
        storage.set("offernearu_location", "Kochi");
        storage.set("offernearu_latitude", "0");
        storage.set("offernearu_longitude", "0");
        storage.set("offernearu_search_radius", "1");
        vi.mocked(getGlobalSearch).mockResolvedValue({ success: true, data: {
            products: [], offers: [], shops: [
                { shopId: 1, shopName: "Nearby", logo: null, distance: 1 },
                { shopId: 2, shopName: "Boundary", logo: null, distance: 5 },
                { shopId: 3, shopName: "Unknown", logo: null, distance: null },
            ],
        } });
        render(<LocationProvider><Header /></LocationProvider>);
        const input = screen.getAllByRole("textbox", { name: "Search shops, offers, products" })[0];
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: "shop" } });
        await waitFor(() => expect(screen.getAllByRole("button", { name: "Expand the range" })).toHaveLength(2));
        expect(screen.queryByText("Nearby")).toBeNull();
        fireEvent.click(screen.getAllByRole("button", { name: "Expand the range" })[0]);
        const dialog = await screen.findByRole("dialog");
        expect(dialog).toBeDefined();
        const radiusInput = within(dialog).getByRole("combobox", { name: "Search radius" });
        fireEvent.change(radiusInput, { target: { value: "5" } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Done" }));
        await waitFor(() => expect(screen.getAllByText("Nearby")).toHaveLength(2));
        expect(screen.queryByText("Boundary")).toBeNull();
        expect(screen.queryByText("Unknown")).toBeNull();
    });
    it("leaves radius disabled after geolocation is denied", async () => {
        const getCurrentPosition = vi.fn((_success, failure) => failure({ code: 1, PERMISSION_DENIED: 1 }));
        Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
        vi.spyOn(window, "alert").mockImplementation(() => {});
        render(<LocationProvider><Header /></LocationProvider>);
        const dialog = await screen.findByRole("dialog");
        fireEvent.click(within(dialog).getByRole("button", { name: "Use current location" }));
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("denied"));
        expect((within(dialog).getByRole("combobox") as HTMLSelectElement).disabled).toBe(true);
        expect(storage.has("offernearu_search_radius")).toBe(false);
    });
    it("closes the modal when the close button is clicked", async () => {
        render(<LocationProvider><Header /></LocationProvider>);
        const dialog = await screen.findByRole("dialog");
        const closeBtn = within(dialog).getByRole("button", { name: "Close" });
        fireEvent.click(closeBtn);
        expect(screen.queryByRole("dialog")).toBeNull();
    });
});
