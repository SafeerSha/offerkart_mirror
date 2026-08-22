import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/avif',
];

const ProxyImageQuerySchema = z.object({
  url: z.string().url('Invalid URL format'),
});

const TRUSTED_DOMAINS = [
  'offersnearu.s3.eu-north-1.amazonaws.com',
  'unsplash.com',
  'vercel.app',
];

function isTrustedDomain(hostname: string): boolean {
  const lowerHost = hostname.toLowerCase();
  return TRUSTED_DOMAINS.some(domain => lowerHost === domain || lowerHost.endsWith('.' + domain));
}

function isImageContentType(contentType: string): boolean {
  const base = contentType.split(';')[0].trim().toLowerCase();
  return ALLOWED_IMAGE_TYPES.includes(base) || base.startsWith('image/');
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

    const contentType = response.headers.get('content-type') || '';
    if (!isImageContentType(contentType)) {
      return NextResponse.json({ error: 'Non-image content is not allowed' }, { status: 415 });
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image exceeds maximum allowed size' }, { status: 413 });
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    const reader = response.body?.getReader();

    if (!reader) {
      return NextResponse.json({ error: 'Empty upstream response' }, { status: 502 });
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Image exceeds maximum allowed size' }, { status: 413 });
      }

      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks.map(c => Buffer.from(c)));

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
