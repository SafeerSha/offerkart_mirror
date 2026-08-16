import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit } from '@/lib/api/rate-limiter';

describe('Rate Limiter', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should allow requests and decrement remaining in development mode with in-memory fallback', async () => {
    process.env.NODE_ENV = 'development';
    process.env.RATE_LIMIT_FAIL_CLOSED = 'false';

    const id = 'test-dev-user-1';
    const res1 = await checkRateLimit(id, { failClosed: false, limit: 3, windowSeconds: 5 });
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await checkRateLimit(id, { failClosed: false, limit: 3, windowSeconds: 5 });
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await checkRateLimit(id, { failClosed: false, limit: 3, windowSeconds: 5 });
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);

    // 4th request exceeds limit
    const res4 = await checkRateLimit(id, { failClosed: false, limit: 3, windowSeconds: 5 });
    expect(res4.success).toBe(false);
    expect(res4.remaining).toBe(0);
  });

  it('should fail closed in production when Redis is not configured', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const res = await checkRateLimit('test-prod-user', { failClosed: true });
    expect(res.success).toBe(false);
    expect(res.remaining).toBe(0);
    expect(res.limit).toBe(0);
  });
});
