import { describe, it, expect } from 'vitest';
import { 
    getShopIdFromShopName, 
    calculateDistance 
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
});
