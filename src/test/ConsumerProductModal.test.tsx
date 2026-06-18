import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ConsumerProductModal } from '@/components/offer/ConsumerProductModal';
import { getUserOfferProductById } from '@/lib/api/offerproduct';

// Mock getUserOfferProductById
vi.mock('@/lib/api/offerproduct', () => ({
  getUserOfferProductById: vi.fn(),
}));

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    locale: 'en',
    t: (key: string) => key,
    changeLocale: vi.fn(),
  }),
}));

// Mock @/components/ui/drawer
vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children, open }: any) => open ? <div data-testid="drawer">{children}</div> : null,
  DrawerClose: ({ children }: any) => <div data-testid="drawer-close">{children}</div>,
  DrawerContent: ({ children }: any) => <div data-testid="drawer-content">{children}</div>,
  DrawerTitle: ({ children }: any) => <h3 data-testid="drawer-title">{children}</h3>,
}));

const mockMarkedItems = [
  {
    id: 'item-1',
    name: 'Artisan Espresso',
    description: 'Fresh organic coffee beans.',
    productImage: '/images/coffee.jpg',
    currency: '₹',
    oldPrice: 300,
    offerPrice: 240,
    x: 10,
    y: 20,
    width: 30,
    height: 40,
    mainCategory: 'Beverages',
  },
  {
    id: 'item-2',
    name: 'Zara Jacket',
    description: 'Warm winter jacket.',
    productImage: '/images/jacket.jpg',
    currency: '₹',
    oldPrice: 5000,
    offerPrice: 4000,
    x: 50,
    y: 60,
    width: 30,
    height: 40,
    mainCategory: 'Clothing',
  }
];

describe('ConsumerProductModal Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open and shows active product details', async () => {
    vi.mocked(getUserOfferProductById).mockResolvedValue({
      success: true,
      data: {
        success: true,
        data: {
          branches: [
            { branchName: 'Bandra West' },
            { branchName: 'Colaba' }
          ]
        }
      }
    } as any);

    render(
      <ConsumerProductModal
        open={true}
        onOpenChange={vi.fn()}
        markedItems={mockMarkedItems}
        initialItemId="item-1"
        offerCategory="Coffee"
        shopName="Artisan Coffee"
      />
    );

    expect(screen.getByText('Artisan Espresso')).toBeDefined();
    expect(screen.getByText('Fresh organic coffee beans.')).toBeDefined();

    expect(screen.queryByText('Prev Product')).toBeNull();
    expect(screen.queryByText('Next Product')).toBeNull();
    expect(screen.queryByText('Prev Offer')).toBeNull();
    expect(screen.queryByText('Next Offer')).toBeNull();

    // Wait for the locations to render so the async state updates settle within the test
    await waitFor(() => {
      expect(screen.getByText('Bandra West')).toBeDefined();
    });
  });

  it('fetches store locations from API and renders them', async () => {
    vi.mocked(getUserOfferProductById).mockResolvedValue({
      success: true,
      data: {
        success: true,
        data: {
          offerBranches: [
            { branch: { branchName: 'Bandra West' } },
            { branch: { branchName: 'Colaba' } }
          ]
        }
      }
    } as any);

    render(
      <ConsumerProductModal
        open={true}
        onOpenChange={vi.fn()}
        markedItems={mockMarkedItems}
        initialItemId="item-1"
        offerCategory="Coffee"
        shopName="Artisan Coffee"
      />
    );

    expect(getUserOfferProductById).toHaveBeenCalledWith('item-1');

    await waitFor(() => {
      expect(screen.getByText('Bandra West')).toBeDefined();
      expect(screen.getByText('Colaba')).toBeDefined();
    });
  });

  it('uses mock locations fallback based on shop name if API returns empty locations', async () => {
    vi.mocked(getUserOfferProductById).mockResolvedValue({
      success: true,
      data: {
        success: true,
        data: {
          branches: []
        }
      }
    } as any);

    render(
      <ConsumerProductModal
        open={true}
        onOpenChange={vi.fn()}
        markedItems={mockMarkedItems}
        initialItemId="item-1"
        offerCategory="Coffee"
        shopName="Zara Store"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Phoenix Palladium (Lower Parel)')).toBeDefined();
      expect(screen.getByText('Juhu')).toBeDefined();
      expect(screen.getByText('Oberoi Mall (Goregaon)')).toBeDefined();
    });
  });
});
