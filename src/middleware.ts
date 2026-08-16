import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Route Protection: Redirect unauthenticated users from /shop-manager/* to /login
    if (pathname.startsWith('/shop-manager')) {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
            return NextResponse.redirect(loginUrl);
        }
    }

    // 2. Detect locale from cookie or Accept-Language header
    const cookieLocale = request.cookies.get('locale')?.value;
    let localeToSet: string | null = null;

    if (cookieLocale !== 'en' && cookieLocale !== 'ml') {
        const acceptLanguage = request.headers.get('accept-language') || '';
        localeToSet = acceptLanguage.toLowerCase().includes('ml') ? 'ml' : 'en';
    }

    const response = NextResponse.next();

    // 3. Set cookie if it needs initialization
    if (localeToSet) {
        response.cookies.set('locale', localeToSet, {
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/',
        });
    }

    // 4. Remove X-Powered-By header (defense-in-depth alongside next.config poweredByHeader: false)
    response.headers.delete('X-Powered-By');

    // 5. Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    return response;
}

export const config = {
    matcher: [
        // Match all routes except static files and Next.js internals
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
