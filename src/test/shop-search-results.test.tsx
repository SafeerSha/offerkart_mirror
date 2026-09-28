import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { ShopSearchResults } from "@/components/layout/ShopSearchResults";
afterEach(cleanup);
const shop = { shopId: 3, shopName: "byte shop", logo: "https://example.com/logo.webp", distance: null };
describe("shop search results", () => {
    it("shows the name and logo with a direct, keyboard-focusable shop link", () => {
        const onSelect = vi.fn();
        render(<ShopSearchResults shops={[shop]} onSelect={onSelect} />);
        const link = screen.getByRole("link", { name: /byte shop/ });
        expect(link.getAttribute("href")).toBe("/shop/3");
        expect(screen.getByRole("img").getAttribute("src")).toBe(shop.logo);
        link.focus();
        expect(document.activeElement).toBe(link);
        fireEvent.click(link);
        expect(onSelect).toHaveBeenCalledOnce();
    });
    it("falls back after a broken logo while retaining navigation", () => {
        render(<ShopSearchResults shops={[shop]} onSelect={vi.fn()} />);
        fireEvent.error(screen.getByRole("img"));
        expect(screen.getByLabelText("byte shop logo unavailable")).toBeDefined();
        expect(screen.getByRole("link").getAttribute("href")).toBe("/shop/3");
    });
    it("supports absent logos and long names", () => {
        render(<ShopSearchResults shops={[{ ...shop, logo: null, shopName: "A very long shop name" }]} onSelect={vi.fn()} />);
        expect(screen.getByText("A very long shop name")).toBeDefined();
        expect(screen.queryByRole("img")).toBeNull();
    });
    it("hides the shops section when no shops match", () => {
        render(<ShopSearchResults shops={[]} onSelect={vi.fn()} />);
        expect(screen.queryByRole("region", { name: "Shops" })).toBeNull();
        expect(screen.queryByText("No matching shops found")).toBeNull();
        expect(screen.queryByRole("link")).toBeNull();
    });
});
