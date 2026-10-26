import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import Header from "@/components/layout/Header";
import { getGlobalSearch } from "@/lib/api/userOffersService";
import type { SearchResponse } from "@/lib/types/search";
import { resetSearchSync } from "@/hooks/useSearchSync";

vi.mock("@/lib/api/userOffersService", () => ({ getGlobalSearch: vi.fn() }));
vi.mock("@/hooks/useCategoryHierarchy", () => ({ useCategoryHierarchy: () => ({ resolveHierarchyById: () => ({ main: "", sub: "" }) }) }));
vi.mock("@/hooks/useApi", () => ({ useMyShops: () => ({ data: null }) }));
vi.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ locale: "en", t: (key: string) => key }) }));
vi.mock("@/components/i18n/LanguageSwitcher", () => ({ LanguageSwitcher: () => null }));
vi.mock("@/context/LocationContext", () => ({ useLocationContext: () => ({
    location: { name: "Kochi", latitude: null, longitude: null }, isLocationSet: true,
    isModalOpen: false, setLocation: vi.fn(), setModalOpen: vi.fn(), hydrated: true,
}) }));
const success: SearchResponse = { success: true, data: { products: [], offers: [], shops: [{ shopId: 3, shopName: "byte shop", logo: null, distance: null }] } };
async function search(value: string) {
    const input = screen.getAllByRole("textbox", { name: "Search shops, offers, products" })[0];
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value } });
    await act(async () => { vi.advanceTimersByTime(300); });
    return input;
}
describe("global search in both header layouts", () => {
    beforeEach(() => { resetSearchSync(); vi.useFakeTimers(); vi.mocked(getGlobalSearch).mockReset(); });
    afterEach(() => { cleanup(); resetSearchSync(); vi.useRealTimers(); });
    it("renders shop-only responses in desktop and mobile and closes on selection", async () => {
        vi.mocked(getGlobalSearch).mockResolvedValue(success);
        render(<Header />);
        await search("byte");
        const links = screen.getAllByRole("link", { name: /byte shop/ });
        expect(links).toHaveLength(2);
        expect(links.every(link => link.getAttribute("href") === "/shop/3")).toBe(true);
        fireEvent.click(links[0]);
        expect(screen.queryByText("byte shop")).toBeNull();
    });
    it("hides the shops section while displaying other results", async () => {
        vi.mocked(getGlobalSearch).mockResolvedValue({ success: true, data: { products: [], offers: [{ offerId: 1, offerName: "Sale" }], shops: [] } });
        render(<Header />);
        await search("sale");
        expect(screen.queryByRole("region", { name: "Shops" })).toBeNull();
        expect(screen.queryByText("No matching shops found")).toBeNull();
        expect(screen.getAllByRole("link", { name: /Sale/ })).toHaveLength(2);
    });
    it("shows errors instead of no matches and retries", async () => {
        vi.mocked(getGlobalSearch).mockRejectedValueOnce(new Error("offline")).mockResolvedValue(success);
        render(<Header />);
        await search("byte");
        expect(screen.getAllByRole("alert")).toHaveLength(2);
        expect(screen.queryByText("No matching shops found")).toBeNull();
        fireEvent.click(screen.getAllByRole("button", { name: "Retry search" })[0]);
        await act(async () => { vi.advanceTimersByTime(300); });
        expect(screen.getAllByText("byte shop")).toHaveLength(2);
    });
    it("ignores stale requests and clears on Escape", async () => {
        let resolveOld!: (response: SearchResponse) => void;
        vi.mocked(getGlobalSearch).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockResolvedValue({ success: true, data: { products: [], offers: [], shops: [] } });
        render(<Header />);
        await search("byte");
        expect(screen.getAllByText("Finding results...")).toHaveLength(2);
        const input = await search("other");
        await act(async () => { resolveOld(success); });
        expect(screen.queryByText("byte shop")).toBeNull();
        expect(screen.getAllByText("No matching shops found")).toHaveLength(2);
        fireEvent.keyDown(input, { key: "Escape" });
        expect(screen.queryByText("No matching shops found")).toBeNull();
    });
    it("keeps desktop results open when keyboard focus moves into a shop link", async () => {
        vi.mocked(getGlobalSearch).mockResolvedValue(success);
        render(<Header />);
        const input = await search("byte");
        const link = screen.getAllByRole("link", { name: /byte shop/ })[0];
        fireEvent.blur(input, { relatedTarget: link });
        expect(screen.getAllByText("byte shop")).toHaveLength(2);
        fireEvent.keyDown(link, { key: "Escape" });
        expect(screen.queryByText("byte shop")).toBeNull();
    });
    it("does not restore pending results after clearing the input", async () => {
        let resolve!: (response: SearchResponse) => void;
        vi.mocked(getGlobalSearch).mockImplementation(() => new Promise(done => { resolve = done; }));
        render(<Header />);
        const input = await search("byte");
        fireEvent.change(input, { target: { value: "" } });
        await act(async () => { resolve(success); });
        expect(screen.queryByText("byte shop")).toBeNull();
    });
    it("handles rejected responses from mobile input", async () => {
        vi.mocked(getGlobalSearch).mockResolvedValue({ success: false, data: { products: [], offers: [], shops: [] } });
        render(<Header />);
        fireEvent.change(screen.getAllByRole("textbox", { name: "Search shops, offers, products" })[1], { target: { value: "byte" } });
        await act(async () => { vi.advanceTimersByTime(300); });
        expect(screen.getByRole("alert").textContent).toContain("Search failed");
        expect(screen.queryByText("No matching shops found")).toBeNull();
    });
    it("prompts for short input without requesting results", async () => {
        render(<Header />);
        await search("ab");
        expect(getGlobalSearch).not.toHaveBeenCalled();
        expect(screen.getAllByText("Enter at least 3 characters to search")).toHaveLength(2);
    });
});
