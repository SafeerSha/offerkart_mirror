import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side image proxy to bypass CORS for S3 images during poster capture.
 * Usage: /api/proxy-image?url=https://offersnearu.s3.eu-north-1.amazonaws.com/...
 * 
 * Only allows proxying from trusted S3 domains.
 */
export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');
    
    if (!url) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Security: Only allow proxying from trusted S3 domains
    try {
        const parsed = new URL(url);
        if (!parsed.hostname.endsWith('.amazonaws.com') && !parsed.hostname.endsWith('.unsplash.com')) {
            return NextResponse.json({ error: 'Untrusted domain' }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'image/*',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Upstream returned ${response.status}` }, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || 'image/png';
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (err: any) {
        console.error('[proxy-image] Fetch error:', err?.message || err);
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
    }
}
