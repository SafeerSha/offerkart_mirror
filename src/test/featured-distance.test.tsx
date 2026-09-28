import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FeaturedShops from "@/components/home/FeaturedShops";
import FeaturedCarousel from "@/components/home/FeaturedCarousel";

const state = vi.hoisted(() => ({
    radius: 5 as number | null,
    shops: [
        { id: 1, name: "Near shop", logo: "", distanceKm: 4 },
        { id: 2, name: "Boundary shop", logo: "", distanceKm: 5 },
        { id: 3, name: "Unknown shop", logo: "", distanceKm: null },
    ],
}));
vi.mock("@/hooks/useDistancePreference", () => ({ useDistancePreference: () => ({ radius: state.radius, locationReady: true }) }));
vi.mock("@/context/LocationContext", () => ({ useLocationContext: () => ({ location: { latitude: 0, longitude: 0 }, hydrated: true }) }));
vi.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("embla-carousel-react", () => ({ default: () => [vi.fn(), null] }));
vi.mock("@/hooks/useApi", () => ({
    useFeaturedShops: () => ({ data: { success: true, data: state.shops }, isLoading: false }),
    useFeaturedOffers: () => ({ data: { success: true, data: state.shops.map(shop => ({ ...shop, offer: shop.name, image: "/logo.png", badge: "Featured", rating: 5 })) } }),
}));
afterEach(() => { cleanup(); state.radius = 5; });
describe("featured home sections respect distance", () => {
    it("filters dynamic shop responses at the strict radius boundary", () => {
        render(<FeaturedShops shops={[]} />);
        expect(screen.getByRole("button", { name: "Near shop" })).toBeDefined();
        expect(screen.queryByRole("button", { name: "Boundary shop" })).toBeNull();
        expect(screen.queryByRole("button", { name: "Unknown shop" })).toBeNull();
    });
    it("also filters supplied shops when dynamic fetching is disabled", () => {
        render(<FeaturedShops shops={state.shops} disableDynamicFetch />);
        expect(screen.getByRole("button", { name: "Near shop" })).toBeDefined();
        expect(screen.queryByRole("button", { name: "Boundary shop" })).toBeNull();
    });
    it("shows all distances when the preference is cleared", () => {
        state.radius = null;
        render(<FeaturedShops shops={[]} />);
        expect(screen.getByRole("button", { name: "Boundary shop" })).toBeDefined();
        expect(screen.getByRole("button", { name: "Unknown shop" })).toBeDefined();
    });
    it("filters carousel cards too", () => {
        render(<FeaturedCarousel offers={[]} />);
        expect(screen.getAllByText("Near shop").length).toBeGreaterThan(0);
        expect(screen.queryByText("Boundary shop")).toBeNull();
        expect(screen.queryByText("Unknown shop")).toBeNull();
    });
    it("centers single featured offer card on mobile view", () => {
        render(<FeaturedCarousel offers={[]} />);
        const mobileButton = screen.getAllByRole("button").find(b => b.className.includes("max-w-[380px]"));
        expect(mobileButton).toBeDefined();
        expect(mobileButton?.parentElement?.className).toContain("justify-center");
    });
});
