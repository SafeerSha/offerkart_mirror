import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PromoHeader from "@/components/promotions/PromoHeader";
import { PromoToolbar } from "@/components/promotions/PromoToolbar";
import { PromoCard } from "@/components/promotions/PromoCard";
import { PromoEmptyState } from "@/components/promotions/PromoEmptyState";
import { PromoSkeleton } from "@/components/promotions/PromoSkeleton";
import { OfferSocialLink } from "@/lib/types/socialLinks";

describe("Promotions Page Components", () => {
  const mockOfferSocialLink: OfferSocialLink = {
    id: 101,
    title: "Weekend Flash Sale 50% Off",
    validTo: "2026-12-31T00:00:00.000Z",
    shop_name: "Super Grocers",
    logo_url: "https://example.com/logo.jpg",
    distance: 1.5,
    defaultPoster: "https://example.com/poster.jpg",
    socialLinks: [
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        platform: "YOUTUBE",
      },
    ],
  };

  describe("PromoHeader", () => {
    it("renders headline, breadcrumbs, and stats chips correctly", () => {
      render(
        <PromoHeader
          totalVideosCount={24}
          totalShopsCount={8}
        />
      );

      expect(screen.getAllByText("Promotions & Videos").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Store Video Showcase")).toBeDefined();
      expect(screen.getByText("24+")).toBeDefined();
      expect(screen.getByText("8")).toBeDefined();
      expect(screen.getByText("Live Commercials")).toBeDefined();
    });
  });

  describe("PromoToolbar", () => {
    it("handles platform filter selection and search callbacks", () => {
      const onSearch = vi.fn();
      const onPlatform = vi.fn();
      const onIndustry = vi.fn();
      const onReset = vi.fn();

      render(
        <PromoToolbar
          searchQuery=""
          onSearchChange={onSearch}
          selectedPlatform="all"
          onPlatformChange={onPlatform}
          industryId="all"
          onIndustryChange={onIndustry}
          industries={[{ id: 1, name: "Food & Dining" }]}
          hasActiveFilters={true}
          onResetFilters={onReset}
        />
      );

      // Verify platforms exist
      expect(screen.getByText("All Platforms")).toBeDefined();
      expect(screen.getByText("YouTube")).toBeDefined();
      expect(screen.getByText("Reels")).toBeDefined();

      // Click YouTube tab
      fireEvent.click(screen.getByText("YouTube"));
      expect(onPlatform).toHaveBeenCalledWith("youtube");

      // Type in search
      const input = screen.getByPlaceholderText("Search commercials, shops, products...");
      fireEvent.change(input, { target: { value: "Grocers" } });
      expect(onSearch).toHaveBeenCalledWith("Grocers");

      // Click reset
      const resetBtn = screen.getByText("Reset Filters");
      fireEvent.click(resetBtn);
      expect(onReset).toHaveBeenCalled();
    });
  });

  describe("PromoCard", () => {
    it("renders card title, shop name, and YouTube platform badge", () => {
      const onPlay = vi.fn();
      render(<PromoCard item={mockOfferSocialLink} onPlay={onPlay} />);

      expect(screen.getByText("Weekend Flash Sale 50% Off")).toBeDefined();
      expect(screen.getByText("Super Grocers")).toBeDefined();
      expect(screen.getByText("YouTube")).toBeDefined();
      expect(screen.getByText("1.5km")).toBeDefined();

      // Click card to play
      fireEvent.click(screen.getByText("Weekend Flash Sale 50% Off"));
      expect(onPlay).toHaveBeenCalledWith(mockOfferSocialLink);
    });
  });

  describe("PromoEmptyState", () => {
    it("renders filtered empty state with reset button", () => {
      const onReset = vi.fn();
      render(
        <PromoEmptyState
          type="filtered"
          searchQuery="Nonexistent"
          onResetFilters={onReset}
        />
      );

      expect(screen.getByText("No matching videos found")).toBeDefined();
      expect(screen.getByText('No commercials matching "Nonexistent".')).toBeDefined();

      const btn = screen.getByText("Reset Search & Filters");
      fireEvent.click(btn);
      expect(onReset).toHaveBeenCalled();
    });

    it("renders global empty state with exploration link", () => {
      render(<PromoEmptyState type="global" />);

      expect(screen.getByText("No Commercials Available")).toBeDefined();
      expect(screen.getByText("Explore Local Offers")).toBeDefined();
    });
  });

  describe("PromoSkeleton", () => {
    it("renders loading shimmer placeholders", () => {
      const { container } = render(<PromoSkeleton />);
      const shimmers = container.querySelectorAll(".skeleton-shimmer");
      expect(shimmers.length).toBeGreaterThan(5);
    });
  });
});
