import { describe, it, expect } from 'vitest';
import { 
    getShopIdFromShopName, 
    calculateDistance, 
    getMockUserOffers, 
    getMockUserOfferDetails, 
    getMockUserProducts 
} from '@/lib/api/userOffersService';

describe('User Offers & Products Service', () => {
    describe('getShopIdFromShopName', () => {
        it('should map known shop names to consistent IDs', () => {
            expect(getShopIdFromShopName('Artisan Coffee House')).toBe(1);
            expect(getShopIdFromShopName('Bella Boutique')).toBe(2);
            expect(getShopIdFromShopName('Zen Spa & Wellness')).toBe(3);
        });

        it('should fallback consistently for unknown shop names', () => {
            const id1 = getShopIdFromShopName('Unknown Shop');
            const id2 = getShopIdFromShopName('Unknown Shop');
            expect(id1).toBe(id2);
            expect(id1).toBeGreaterThanOrEqual(1);
            expect(id1).toBeLessThanOrEqual(20);
        });
    });

    describe('calculateDistance', () => {
        it('should calculate correct distance between coordinates', () => {
            // Distance between Mumbai Center (19.076, 72.8777) and Bella Boutique (19.082, 72.882)
            const dist = calculateDistance(19.0760, 72.8777, 19.0820, 72.8820);
            expect(dist).toBeCloseTo(0.81, 1); // around ~0.8 km
        });
    });

    describe('getMockUserOffers', () => {
        it('should return paginated user offers list', () => {
            const res = getMockUserOffers({ page: 1, limit: 5, sort: 'latest' });
            expect(res.success).toBe(true);
            expect(res.data.length).toBe(5);
            expect(res.count).toBeGreaterThan(5);
            expect(res.data[0].id).toBeDefined();
            expect(res.data[0].offerName).toBeDefined();
        });

        it('should filter by shopId', () => {
            const res = getMockUserOffers({ shopId: '1', page: 1, limit: 10, sort: 'latest' });
            expect(res.success).toBe(true);
            expect(res.data.every(item => item.shopId === 1)).toBe(true);
        });

        it('should sort by nearest when location is provided', () => {
            const res = getMockUserOffers({ 
                page: 1, 
                limit: 10, 
                latitude: 19.0760, 
                longitude: 72.8777, 
                sort: 'nearest' 
            });
            expect(res.success).toBe(true);
            // Verify items are in ascending order of distance
            for (let i = 0; i < res.data.length - 1; i++) {
                if (res.data[i].distanceKm !== null && res.data[i+1].distanceKm !== null) {
                    expect(res.data[i].distanceKm).toBeLessThanOrEqual(res.data[i+1].distanceKm!);
                }
            }
        });
    });

    describe('getMockUserOfferDetails', () => {
        it('should return offer details for a valid ID', () => {
            const res = getMockUserOfferDetails(1);
            expect(res.success).toBe(true);
            expect(res.data).toBeDefined();
            expect(res.data?.id).toBe(1);
            expect(res.data?.posters?.length).toBeGreaterThanOrEqual(1);
        });

        it('should return error for invalid ID', () => {
            const res = getMockUserOfferDetails(9999);
            expect(res.success).toBe(false);
            expect(res.error).toBe('Offer not found');
        });
    });

    describe('getMockUserProducts', () => {
        it('should filter products by search term', () => {
            const res = getMockUserProducts({ search: 'Arabica', page: 1, limit: 10, sort: 'newest' });
            expect(res.success).toBe(true);
            expect(res.data.data.length).toBe(1);
            expect(res.data.data[0].displayName).toContain('Arabica');
        });

        it('should filter products by minPrice and maxPrice', () => {
            const res = getMockUserProducts({ minPrice: 1000, maxPrice: 3000, page: 1, limit: 10, sort: 'newest' });
            expect(res.success).toBe(true);
            expect(res.data.data.every(p => p.offerPrice >= 1000 && p.offerPrice <= 3000)).toBe(true);
        });
    });
});
