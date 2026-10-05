import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FavoritesHeader from "@/components/favorites/FavoritesHeader";
import FavoritesToolbar from "@/components/favorites/FavoritesToolbar";
import FavoritesEmptyState from "@/components/favorites/FavoritesEmptyState";
import FavoritesSkeleton from "@/components/favorites/FavoritesSkeleton";

describe("Favorites Page Components", () => {
  describe("FavoritesHeader", () => {
    it("renders headline and stats cards correctly", () => {
      render(
        <FavoritesHeader
          totalCount={7}
          offersCount={3}
          productsCount={4}
          storesCount={2}
        />
      );

      expect(screen.getAllByText("Favorites").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Total Saved")).toBeDefined();
      expect(screen.getByText("Offers & Flyers")).toBeDefined();
      expect(screen.getByText("Saved Products")).toBeDefined();
      expect(screen.getByText("Local Stores")).toBeDefined();
      expect(screen.getByText("7")).toBeDefined();
    });
  });

  describe("FavoritesToolbar", () => {
    it("handles tab changes, search input, and filter callbacks", () => {
      const onTabChange = vi.fn();
      const onSearchChange = vi.fn();
      const onStoreChange = vi.fn();
      const onSortChange = vi.fn();
      const onViewModeChange = vi.fn();
      const onClearFilters = vi.fn();

      render(
        <FavoritesToolbar
          activeTab="all"
          onTabChange={onTabChange}
          totalCount={5}
          offersCount={2}
          productsCount={3}
          searchQuery=""
          onSearchChange={onSearchChange}
          selectedStore="all"
          onStoreChange={onStoreChange}
          availableStores={["Sheba Biriyani", "Byte Shop"]}
          sortBy="recent"
          onSortChange={onSortChange}
          viewMode="grid"
          onViewModeChange={onViewModeChange}
          hasActiveFilters={true}
          onClearFilters={onClearFilters}
        />
      );

      // Verify tabs exist
      expect(screen.getByText("All Items")).toBeDefined();
      expect(screen.getByText("Offers & Flyers")).toBeDefined();
      expect(screen.getByText("Products")).toBeDefined();

      // Click on Offers tab
      fireEvent.click(screen.getByText("Offers & Flyers"));
      expect(onTabChange).toHaveBeenCalledWith("offers");

      // Type in search input
      const searchInput = screen.getByPlaceholderText("Search saved offers, products, stores...");
      fireEvent.change(searchInput, { target: { value: "biriyani" } });
      expect(onSearchChange).toHaveBeenCalledWith("biriyani");

      // Click on Reset button
      const resetBtn = screen.getByText("Reset");
      fireEvent.click(resetBtn);
      expect(onClearFilters).toHaveBeenCalled();
    });
  });

  describe("FavoritesEmptyState", () => {
    it("renders global empty state with exploration buttons", () => {
      render(<FavoritesEmptyState type="global" />);
      expect(screen.getByText("Your Wishlist is Empty")).toBeDefined();
      expect(screen.getByText("Explore Local Offers")).toBeDefined();
      expect(screen.getByText("Browse Products")).toBeDefined();
    });

    it("renders filtered empty state with reset button", () => {
      const onReset = vi.fn();
      render(
        <FavoritesEmptyState
          type="filtered"
          searchQuery="unknown item"
          onResetFilters={onReset}
        />
      );
      expect(screen.getByText("No matches found")).toBeDefined();
      expect(screen.getByText('No saved items matching "unknown item".')).toBeDefined();

      const resetBtn = screen.getByText("Reset Search & Filters");
      fireEvent.click(resetBtn);
      expect(onReset).toHaveBeenCalled();
    });
  });

  describe("FavoritesSkeleton", () => {
    it("renders loading skeleton properly", () => {
      const { container } = render(<FavoritesSkeleton />);
      const shimmers = container.querySelectorAll(".skeleton-shimmer");
      expect(shimmers.length).toBeGreaterThan(5);
    });
  });
});
