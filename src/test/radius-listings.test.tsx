import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FilterableOffers from "@/components/home/FilterableOffers";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import OffersClient from "@/components/offers/OffersClient";
import ProductsClient from "@/components/products/ProductsClient";
import type { NearbyShopSource } from "@/lib/distance";

type Item = NearbyShopSource & { id: number; name: string };
const state = vi.hoisted(() => ({
    items: [
        { id: 1, name: "Inside", shopId: 1, shopName: "Near shop", distanceKm: 4.99 },
        { id: 2, name: "Boundary", shopId: 2, shopName: "Boundary shop", distanceKm: 5 },
        { id: 3, name: "Far", shopId: 3, shopName: "Far shop", distanceKm: 20 },
        { id: 4, name: "Unknown", shopId: 4, shopName: "Unknown shop", distanceKm: null },
    ],
    error: null as Error | null,
    hasNextPage: false,
    isFetching: false,
    refetch: vi.fn(),
    setModalOpen: vi.fn(),
    fetchNextPage: vi.fn().mockResolvedValue(undefined),
    industries: { success: true, data: [] },
    location: { name: "Test", latitude: 0 as number | null, longitude: 0 as number | null },
}));
vi.mock("@/context/LocationContext", () => ({ useLocationContext: () => ({ location: state.location, hydrated: true, setModalOpen: state.setModalOpen }) }));
vi.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/hooks/useCategoryHierarchy", () => ({ useCategoryHierarchy: () => ({ categoryLookup: {}, getCategoryId: () => null, resolveHierarchyById: () => ({}) }) }));
vi.mock("@/components/home/FilterPanel", () => ({ default: () => null }));
vi.mock("@/components/home/FeaturedShops", () => ({ default: ({ shops }: { shops: { name: string }[] }) => <div>{shops.map(shop => <span key={shop.name}>{shop.name}</span>)}</div> }));
vi.mock("@/components/products/ProductCard", () => ({ default: ({ name }: { name: string }) => <span>{name}</span> }));
vi.mock("@/components/home/OfferGrid", () => ({ default: ({ offers }: { offers: Item[] }) => <div>{offers.map(item => <span key={item.id}>{item.name}</span>)}</div> }));
vi.mock("@/components/products/ProductGrid", () => ({ default: ({ products }: { products: Item[] }) => <div>{products.map(item => <span key={item.id}>{item.name}</span>)}</div> }));
vi.mock("@/hooks/useApi", () => ({
    useUserProductsFiltered: () => ({ data: state.items, isLoading: false }),
    useIndustries: () => ({ data: state.industries }),
    useProductShops: () => ({ data: { success: true, data: [] }, isLoading: false }),
    useInfiniteUserOffers: () => ({ data: { pages: [{ data: state.items }] }, ...state }),
    useInfiniteUserProducts: () => ({ data: { pages: [{ data: state.items }] }, ...state }),
}));
const storage = new Map<string, string>();
beforeEach(() => {
    storage.clear(); storage.set("offernearu_search_radius", "5");
    vi.stubGlobal("localStorage", { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) });
    vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
    state.error = null; state.hasNextPage = false; state.isFetching = false; state.location.latitude = 0; vi.clearAllMocks();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe.each(["offers", "products", "home offers", "home products"] as const)("%s radius integration", kind => {
    function mount() {
        return render(kind === "home offers" ? <FilterableOffers initialOffers={[]} buttonText="Explore" /> : kind === "home products" ? <FeaturedProducts products={[]} /> : kind === "offers" ? <OffersClient initialOffers={[]} initialFeaturedShops={[]} hasMoreInitial={false} /> : <ProductsClient initialProducts={[]} hasMoreInitial={false} />);
    }
    it("shows only strict matches and their shops", () => {
        mount();
        expect(screen.getByText("Inside")).toBeDefined();
        if (!kind.startsWith("home")) expect(screen.getByText("Near shop")).toBeDefined();
        expect(screen.queryByText("Boundary")).toBeNull();
        expect(screen.queryByText("Far")).toBeNull();
        expect(screen.queryByText("Unknown")).toBeNull();
    });
    it("offers expansion when no matches remain", () => {
        storage.set("offernearu_search_radius", "1");
        mount();
        expect(screen.getByRole("status").textContent).toContain("within 1 km");
        fireEvent.click(screen.getByRole("button", { name: "Expand the range" }));
        expect(state.setModalOpen).toHaveBeenCalledWith(true);
    });
    it("shows failure and retries without claiming no shops exist", () => {
        state.error = new Error("offline");
        mount();
        expect(screen.getByRole("alert")).toBeDefined();
        expect(screen.queryByText(/No shops/)).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Retry" }));
        expect(state.refetch).toHaveBeenCalledOnce();
    });
    it("does not show unfiltered content after location is removed", () => {
        state.location.latitude = null;
        mount();
        expect(screen.queryByText("Inside")).toBeNull();
        expect(screen.getByRole("button", { name: "Choose location" })).toBeDefined();
    });
});
