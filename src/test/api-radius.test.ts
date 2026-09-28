import { describe, it, expect, vi, beforeEach } from "vitest";
import { backend } from "@/lib/api/backendClient";
import {
    getPaginatedOffers,
    getFeaturedOffers,
    getFeaturedShops,
    getUserOfferSimilar
} from "@/lib/api/offers";
import {
    getUserProducts,
    getProductShops,
    getUserProductSimilar
} from "@/lib/api/products";
import {
    getUserOffersList,
    getUserOfferProducts,
    getGlobalSearch
} from "@/lib/api/userOffersService";

vi.mock("@/lib/api/backendClient", () => ({
    backend: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
    },
    unwrapApiEnvelope: (data: any) => data?.data ?? data,
}));

describe("public offers & products API radius propagation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("offers APIs", () => {
        it("getPaginatedOffers includes radius when positive number", async () => {
            vi.mocked(backend.get).mockResolvedValue({
                success: true,
                data: { data: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0 } },
            });
            await getPaginatedOffers(1, 12, { latitude: 19.076, longitude: 72.877, radius: 30 });
            const url = vi.mocked(backend.get).mock.calls[0][0];
            expect(url).toContain("radius=30");
            expect(url).toContain("latitude=19.076");
            expect(url).toContain("longitude=72.877");
        });

        it("getPaginatedOffers omits radius when null or undefined", async () => {
            vi.mocked(backend.get).mockResolvedValue({
                success: true,
                data: { data: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0 } },
            });
            await getPaginatedOffers(1, 12, { latitude: 19.076, longitude: 72.877, radius: null });
            const url = vi.mocked(backend.get).mock.calls[0][0];
            expect(url).not.toContain("radius=");
        });

        it("getFeaturedOffers includes radius when provided", async () => {
            vi.mocked(backend.get).mockResolvedValue({
                success: true,
                data: { data: [] },
            });
            await getFeaturedOffers(19.076, 72.877, 30);
            const url = vi.mocked(backend.get).mock.calls[0][0];
            expect(url).toContain("radius=30");
            expect(url).toContain("latitude=19.076");
            expect(url).toContain("longitude=72.877");
        });

        it("getFeaturedShops includes radius when provided", async () => {
            vi.mocked(backend.get).mockResolvedValue({
                success: true,
                data: { data: [] },
            });
            await getFeaturedShops(19.076, 72.877, "All", 40);
            const url = vi.mocked(backend.get).mock.calls[0][0];
            expect(url).toContain("radius=40");
            expect(url).toContain("latitude=19.076");
            expect(url).toContain("longitude=72.877");
        });

        it("getUserOfferSimilar includes radius when provided", async () => {
            vi.mocked(backend.get).mockResolvedValue({
                success: true,
                data: { data: [] },
            });
            await getUserOfferSimilar(123, { latitude: 19.076, longitude: 72.877, radius: 25 });
            const url = vi.mocked(backend.get).mock.calls[0][0];
            expect(url).toContain("radius=25");
            expect(url).toContain("latitude=19.076");
            expect(url).toContain("longitude=72.877");
        });

        it("getUserOffersList includes radius when provided", async () => {
            vi.mocked(backend.get).mockResolvedValue({
                success: true,
                data: [],
            });
            await getUserOffersList({ latitude: 19.076, longitude: 72.877, radius: 60 });
            const url = vi.mocked(backend.get).mock.calls[0][0];
            expect(url).toContain("radius=60");
            expect(url).toContain("latitude=19.076");
            expect(url).toContain("longitude=72.877");
        });
    });

    describe("products APIs", () => {
        it("getUserProducts includes radius when positive number", async () => {
            vi.mocked(backend.get).mockResolvedValue({
                success: true,
                data: { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } },
            });
            await getUserProducts({ latitude: 19.076, longitude: 72.877, radius: 50 });
            const url = vi.mocked(backend.get).mock.calls[0][0];
            expect(url).toContain("radius=50");
            expect(url).toContain("latitude=19.076");
            expect(url).toContain("longitude=72.877");
        });

        it("getUserProducts omits radius when null or undefined", async () => {
            vi.mocked(backend.get).mockResolvedValue({
                success: true,
                data: { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } },
            });
            await getUserProducts({ latitude: 19.076, longitude: 72.877, radius: null });
            const url = vi.mocked(backend.get).mock.calls[0][0];
            expect(url).not.toContain("radius=");
        });

        it("getProductShops includes radius when provided", async () => {
            vi.mocked(backend.get).mockResolvedValue({
                success: true,
                data: { data: [] },
            });
            await getProductShops(19.076, 72.877, undefined, undefined, undefined, 80);
            const url = vi.mocked(backend.get).mock.calls[0][0];
            expect(url).toContain("radius=80");
            expect(url).toContain("latitude=19.076");
            expect(url).toContain("longitude=72.877");
        });

        it("getUserProductSimilar includes radius when provided", async () => {
            vi.mocked(backend.get).mockResolvedValue({
                success: true,
                data: { data: [] },
            });
            await getUserProductSimilar(456, { latitude: 19.076, longitude: 72.877, radius: 15 });
            const url = vi.mocked(backend.get).mock.calls[0][0];
            expect(url).toContain("radius=15");
            expect(url).toContain("latitude=19.076");
            expect(url).toContain("longitude=72.877");
        });

        it("getUserOfferProducts includes radius when provided", async () => {
            vi.mocked(backend.get).mockResolvedValue({
                success: true,
                data: { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } },
            });
            await getUserOfferProducts({ latitude: 19.076, longitude: 72.877, radius: 30 });
            const url = vi.mocked(backend.get).mock.calls[0][0];
            expect(url).toContain("radius=30");
            expect(url).toContain("latitude=19.076");
            expect(url).toContain("longitude=72.877");
        });
    });

    describe("global search API", () => {
        it("getGlobalSearch includes radius when provided", async () => {
            vi.mocked(backend.get).mockResolvedValue({
                success: true,
                data: { products: [], offers: [], shops: [] },
            });
            await getGlobalSearch("tech", 19.076, 72.877, 30);
            const url = vi.mocked(backend.get).mock.calls[0][0];
            expect(url).toContain("radius=30");
            expect(url).toContain("latitude=19.076");
            expect(url).toContain("longitude=72.877");
        });
    });
});
