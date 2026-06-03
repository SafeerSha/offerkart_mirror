import { describe, it, expect } from 'vitest';
import type { Offer, Product, Poster, MarkedItem } from '@/lib/types/offer';
import type { OfferProductPayload } from '@/lib/types/product';

describe('Type contracts', () => {
  it('should allow valid Offer shape', () => {
    const offer: Offer = {
      id: 1,
      isActive: true,
      status: 'active',
      title: 'Test Offer',
      description: 'A test',
      validFrom: '2025-01-01',
      validTo: '2025-12-31',
      branchIds: [1],
      posters: [],
    };
    expect(offer.isActive).toBe(true);
  });

  it('should allow valid Product shape', () => {
    const product = {
      id: 1,
      name: 'Widget',
      shopName: 'Shop',
      price: 100,
      image: '/img.jpg',
      category: 'General',
      rating: 4.5,
    } satisfies Partial<import('@/lib/types/product').Product>;
    expect(product.price).toBe(100);
  });

  it('should allow valid Poster with MarkedItems', () => {
    const poster: Poster = {
      id: 'p1',
      posterSrc: '/poster.jpg',
      type: 'marked_poster',
      markedItems: [
        {
          id: 'm1',
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          name: 'Product',
          description: 'Desc',
          productImage: '/prod.jpg',
          currency: '$',
          oldPrice: 100,
          offerPrice: 50,
        } as MarkedItem,
      ],
    };
    expect(poster.markedItems?.[0].offerPrice).toBe(50);
  });

  it('should allow valid OfferProductPayload', () => {
    const payload: OfferProductPayload = {
      displayName: 'Prod',
      displayDescription: 'Desc',
      imageUrl: '/img.jpg',
      categoryId: 1,
      originalPrice: 100,
      offerPrice: 80,
      currencyId: 1,
      branchIds: [1],
      isHighlighted: true,
    };
    expect(payload.offerPrice).toBeLessThan(payload.originalPrice);
  });
});
