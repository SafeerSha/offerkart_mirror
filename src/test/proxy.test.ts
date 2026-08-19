import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/proxy';
import { getToken } from 'next-auth/jwt';

vi.mock('next-auth/jwt', () => ({
    getToken: vi.fn(),
}));

describe('Proxy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should redirect unauthenticated users accessing /shop-manager to /login with callbackUrl', async () => {
        vi.mocked(getToken).mockResolvedValueOnce(null);

        const request = new NextRequest('http://localhost:3000/shop-manager');
        const response = await proxy(request);

        expect(response.status).toBe(307); // NextResponse.redirect default status
        const location = response.headers.get('location');
        expect(location).toContain('/login?callbackUrl=%2Fshop-manager');
    });

    it('should redirect unauthenticated users accessing subpaths under /shop-manager/products to /login with query params', async () => {
        vi.mocked(getToken).mockResolvedValueOnce(null);

        const request = new NextRequest('http://localhost:3000/shop-manager/products?page=2');
        const response = await proxy(request);

        expect(response.status).toBe(307);
        const location = response.headers.get('location');
        expect(location).toContain('/login?callbackUrl=%2Fshop-manager%2Fproducts%3Fpage%3D2');
    });

    it('should allow authenticated users to access /shop-manager routes and attach security headers', async () => {
        vi.mocked(getToken).mockResolvedValueOnce({
            id: '1',
            email: 'admin@example.com',
        } as any);

        const request = new NextRequest('http://localhost:3000/shop-manager');
        const response = await proxy(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
        expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
        expect(response.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=(self)');
        expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
    });

    it('should allow public routes without authentication and attach security headers', async () => {
        const request = new NextRequest('http://localhost:3000/offers');
        const response = await proxy(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should detect Malayalam locale from accept-language header and set locale cookie', async () => {
        const request = new NextRequest('http://localhost:3000/', {
            headers: {
                'accept-language': 'ml-IN,ml;q=0.9,en-US;q=0.8,en;q=0.7',
            },
        });

        const response = await proxy(request);

        expect(response.status).toBe(200);
        const setCookieHeader = response.headers.get('set-cookie');
        expect(setCookieHeader).toContain('locale=ml');
    });

    it('should detect English locale by default if accept-language does not contain ml', async () => {
        const request = new NextRequest('http://localhost:3000/', {
            headers: {
                'accept-language': 'en-US,en;q=0.9',
            },
        });

        const response = await proxy(request);

        expect(response.status).toBe(200);
        const setCookieHeader = response.headers.get('set-cookie');
        expect(setCookieHeader).toContain('locale=en');
    });

    it('should preserve existing valid locale cookie without re-setting it', async () => {
        const request = new NextRequest('http://localhost:3000/', {
            headers: {
                cookie: 'locale=ml',
                'accept-language': 'en-US,en;q=0.9',
            },
        });

        const response = await proxy(request);

        expect(response.status).toBe(200);
        const setCookieHeader = response.headers.get('set-cookie');
        expect(setCookieHeader).toBeNull();
    });
});
