import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ENDPOINTS } from '@/lib/api/endpoints';

describe('ENDPOINTS', () => {
  it('should have all required endpoint groups', () => {
    expect(ENDPOINTS.AUTH).toBeDefined();
    expect(ENDPOINTS.SHOP).toBeDefined();
    expect(ENDPOINTS.BRANCH).toBeDefined();
    expect(ENDPOINTS.S3_IMAGE).toBeDefined();
    expect(ENDPOINTS.OFFER).toBeDefined();
    expect(ENDPOINTS.USER_OFFER).toBeDefined();
    expect(ENDPOINTS.CATEGORY).toBeDefined();
    expect(ENDPOINTS.OFFER_PRODUCT).toBeDefined();
  });

  it('should return valid URLs', () => {
    expect(ENDPOINTS.AUTH.LOGIN).toBe('business/auth/login');
    expect(ENDPOINTS.OFFER.BASE).toBe('business/offer');
    expect(ENDPOINTS.OFFER.DETAILS('123')).toBe('business/offer/123');
  });

  it('should have correct public paths in proxy', () => {
    expect(ENDPOINTS.AUTH.REGISTER).toBe('business/auth/register');
    expect(ENDPOINTS.USER_OFFER.BASE).toBe('user/offer');
  });
});
