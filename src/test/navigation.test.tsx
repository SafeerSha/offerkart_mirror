import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import OffersClient from '@/components/offers/OffersClient';
import ProductsClient from '@/components/products/ProductsClient';

// Mock IntersectionObserver for testing environment as a constructible class
global.IntersectionObserver = class IntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor() {}
} as any;

// Setup router mock variables
const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/offers',
}));

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    locale: 'en',
    t: (key: string) => key,
    changeLocale: vi.fn(),
  })
}));

// Mock useCategoryHierarchy
vi.mock('@/hooks/useCategoryHierarchy', () => ({
  useCategoryHierarchy: () => ({
    isLoading: false,
    isError: false,
    error: null,
    categoryHierarchy: {
      "Electronics": ["Phones"],
      "Fashion": ["Shirts"]
    },
    mainCategories: ["Electronics", "Fashion"],
    categoryLookup: {
      "Electronics": { id: 1, name: "Electronics", subcategories: { "Phones": { id: 11, name: "Phones" } } },
      "Fashion": { id: 2, name: "Fashion", subcategories: { "Shirts": { id: 21, name: "Shirts" } } }
    },
    getCategoryId: (main: string, sub?: string) => {
      if (main === "Electronics") return sub === "Phones" ? 11 : 1;
      if (main === "Fashion") return sub === "Shirts" ? 21 : 2;
      return null;
    },
    resolveHierarchyById: (id: any) => ({ main: "", sub: "" })
  })
}));

// Mock getPaginatedOffers from @/lib/api/offers
vi.mock('@/lib/api/offers', () => ({
  getPaginatedOffers: vi.fn().mockResolvedValue({
    success: true,
    data: [],
    hasMore: false
  })
}));

// Mock getUserProducts from @/lib/api/products
vi.mock('@/lib/api/products', () => ({
  getUserProducts: vi.fn().mockResolvedValue({
    success: true,
    data: {
      data: [],
      pagination: { total: 0 }
    }
  })
}));

describe('Category Click Navigation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe('OffersClient', () => {
    it('should navigate to products page with category query param when a category is selected', async () => {
      render(
        <OffersClient
          initialOffers={[]}
          initialFeaturedShops={[]}
          hasMoreInitial={false}
        />
      );

      // Find a category button (e.g. "Electronics" or "Fashion")
      const categoryButton = screen.getByText('Electronics');
      expect(categoryButton).toBeDefined();

      await act(async () => {
        fireEvent.click(categoryButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/products?category=Electronics');
    });
  });

  describe('ProductsClient', () => {
    it('should initialize activeFilters from URL search parameters', async () => {
      mockSearchParams = new URLSearchParams('category=Fashion');
      
      const { getUserProducts } = await import('@/lib/api/products');
      
      render(
        <ProductsClient initialProducts={[]} />
      );

      // Verify that category heading is showing "Fashion"
      const categoryHeader = screen.getByRole('heading', { level: 2, name: 'Fashion' });
      expect(categoryHeader).toBeDefined();

      // On mount, since category is "Fashion" (not "All"), it should call getUserProducts with correct category ID
      await waitFor(() => {
        expect(getUserProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            categoryId: '2', // Fashion category id is 2
          })
        );
      });
    });

    it('should update the URL when a category is clicked on Products Listing page', async () => {
      render(
        <ProductsClient initialProducts={[]} />
      );

      // Initially category header is "catalog.allProducts" (t("catalog.allProducts"))
      const allProductsHeader = screen.getByText('catalog.allProducts');
      expect(allProductsHeader).toBeDefined();

      const fashionButton = screen.getByText('Fashion');
      expect(fashionButton).toBeDefined();

      await act(async () => {
        fireEvent.click(fashionButton);
      });

      // Verify push is called to update URL
      expect(mockPush).toHaveBeenCalledWith('/products?category=Fashion');
    });
  });
});
