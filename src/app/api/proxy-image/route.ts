import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ProxyImageQuerySchema = z.object({
  url: z.string().url('Invalid URL format'),
});

const TRUSTED_DOMAINS = [
  '.amazonaws.com',
  '.unsplash.com',
  '.vercel.app',
];

function isTrustedDomain(hostname: string): boolean {
  return TRUSTED_DOMAINS.some(domain => hostname === domain || hostname.endsWith(domain));
}

export async function GET(req: NextRequest) {
  const query = ProxyImageQuerySchema.safeParse({
    url: req.nextUrl.searchParams.get('url'),
  });

  if (!query.success) {
    return NextResponse.json(
      { error: query.error.errors[0]?.message || 'Invalid request' },
      { status: 400 }
    );
  }

  const url = query.data.url;

  try {
    const parsed = new URL(url);
    if (!isTrustedDomain(parsed.hostname)) {
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
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status }
      );
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
