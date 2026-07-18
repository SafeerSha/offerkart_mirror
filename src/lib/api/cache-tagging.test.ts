import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_TAGS } from "./cache-tags";

const backendGetMock = vi.fn();

vi.mock("./backendClient", () => ({
  backend: {
    get: backendGetMock,
  },
}));

describe("API helper cache tagging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("tags paginated public offers with the offers cache tag", async () => {
    backendGetMock.mockResolvedValue({
      success: true,
      data: {
        data: [],
        page: 1,
        limit: 12,
        count: 0,
      },
    });

    const { getPaginatedOffers } = await import("./offers");
    await getPaginatedOffers(1, 12);

    expect(backendGetMock).toHaveBeenCalledWith(
      expect.stringContaining("page=1"),
      expect.objectContaining({
        next: {
          tags: [CACHE_TAGS.OFFERS],
        },
      })
    );
  });

  it("tags public offer detail fetches with list and item tags", async () => {
    backendGetMock.mockResolvedValue({
      success: true,
      data: {
        id: 42,
        offerName: "Flash Offer",
        shopName: "Store Partner",
        shopLogo: null,
        totalPosters: 1,
        defaultPoster: null,
        daysLeft: 3,
        distanceKm: 1.2,
      },
    });

    const { getUserOfferById } = await import("./offers");
    await getUserOfferById("42");

    expect(backendGetMock).toHaveBeenCalledWith(
      expect.stringContaining("/42"),
      expect.objectContaining({
        next: {
          tags: [CACHE_TAGS.OFFERS, CACHE_TAGS.OFFER("42")],
        },
      })
    );
  });

  it("tags product detail backend fetches with list and item tags", async () => {
    backendGetMock
      .mockResolvedValueOnce({
        success: true,
        data: {
          value: [],
          Count: 0,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: "999999",
          displayName: "Premium Mixer",
          shopName: "Store Partner",
          offerPrice: 1999,
          originalPrice: 2499,
          imageUrl: "/mixer.png",
          categoryId: 7,
          category: { id: 7, name: "Appliances", level: 1, parentId: null },
          displayDescription: "Premium quality guaranteed product.",
          isHighlighted: false,
          subcategoryId: null,
        },
      });

    const { getProductById } = await import("./products");
    const pending = getProductById("999999");
    await vi.advanceTimersByTimeAsync(150);
    await pending;

    expect(backendGetMock).toHaveBeenLastCalledWith(
      expect.stringContaining("/999999"),
      expect.objectContaining({
        next: {
          tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT("999999")],
        },
      })
    );
  });
});
