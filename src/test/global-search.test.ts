import { describe, it, expect, vi, beforeEach } from "vitest";
import { getGlobalSearch } from "@/lib/api/userOffersService";
import { backend } from "@/lib/api/backendClient";

vi.mock("@/lib/api/backendClient", () => ({
    backend: { get: vi.fn() }, unwrapApiEnvelope: vi.fn(),
}));
const shop = { shopId: 3, shopName: "byte shop", logo: "https://example.com/logo.webp", distance: null };
describe("global search contract", () => {
    beforeEach(() => vi.clearAllMocks());
    it.each([
        { products: [], offers: [], shops: [shop] },
        { success: true, data: { products: [], offers: [], shops: [shop] } },
    ])("preserves shops from direct and enveloped payloads", async data => {
        vi.mocked(backend.get).mockResolvedValue({ success: true, data });
        const result = await getGlobalSearch(" byte ", 0, 0);
        expect(result.data.shops).toEqual([shop]);
        expect(backend.get).toHaveBeenCalledWith("user/offer/search?search=byte&latitude=0&longitude=0");
    });
    it("passes radius parameter when present", async () => {
        vi.mocked(backend.get).mockResolvedValue({ success: true, data: { products: [], offers: [], shops: [shop] } });
        await getGlobalSearch("byte", 19.076, 72.877, 30);
        expect(backend.get).toHaveBeenCalledWith("user/offer/search?search=byte&latitude=19.076&longitude=72.877&radius=30");
    });
    it("retains products and offers alongside shops", async () => {
        const data = { products: [{ name: "Laptop", category: "Tech", shopCount: 1, totalOfferProducts: 2 }], offers: [{ offerId: 1, offerName: "Sale" }], shops: [shop] };
        vi.mocked(backend.get).mockResolvedValue({ success: true, data });
        expect((await getGlobalSearch("byte")).data).toEqual(data);
    });
    it("supports legacy responses and no matches", async () => {
        vi.mocked(backend.get).mockResolvedValue({ success: true, data: { products: [], offers: [] } });
        expect(await getGlobalSearch("none")).toEqual({ success: true, data: { products: [], offers: [], shops: [] } });
    });
    it.each([0, -1, 1.5, "bad"])("rejects invalid shop IDs (%s) so no invalid destination is rendered", async shopId => {
        vi.mocked(backend.get).mockResolvedValue({ success: true, data: { shops: [{ ...shop, shopId }] } });
        expect((await getGlobalSearch("byte")).success).toBe(false);
    });
    it.each([null, "javascript:alert(1)", "not a url"])("normalizes missing or unsafe logos (%s)", async logo => {
        vi.mocked(backend.get).mockResolvedValue({ success: true, data: { shops: [{ ...shop, logo }] } });
        expect((await getGlobalSearch("byte")).data.shops[0].logo).toBeNull();
    });
    it.each([null, {}, { shops: "bad" }, { success: false, data: { shops: [] } }])("reports malformed/rejected results as errors", async data => {
        vi.mocked(backend.get).mockResolvedValue({ success: true, data });
        expect((await getGlobalSearch("byte")).success).toBe(false);
    });
    it("reports transport failures", async () => {
        vi.mocked(backend.get).mockRejectedValue(new Error("offline"));
        expect((await getGlobalSearch("byte")).success).toBe(false);
        vi.mocked(backend.get).mockResolvedValue({ success: false, data: null });
        expect((await getGlobalSearch("byte")).success).toBe(false);
    });
    it.each(["", "  ", "ab"])("does not request short input (%s)", async query => {
        await getGlobalSearch(query);
        expect(backend.get).not.toHaveBeenCalled();
    });
});
