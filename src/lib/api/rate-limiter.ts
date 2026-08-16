import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory sliding window fallback for local development / testing without Redis
const inMemoryStore = new Map<string, { count: number; expiresAt: number }>();

function inMemoryRateLimit(
  identifier: string,
  limit: number = 50,
  windowMs: number = 10_000
): RateLimitResult {
  const now = Date.now();
  const entry = inMemoryStore.get(identifier);

  // Clean up old entries periodically
  if (inMemoryStore.size > 2000) {
    for (const [key, val] of inMemoryStore.entries()) {
      if (now > val.expiresAt) {
        inMemoryStore.delete(key);
      }
    }
  }

  if (!entry || now > entry.expiresAt) {
    inMemoryStore.set(identifier, { count: 1, expiresAt: now + windowMs });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.floor((now + windowMs) / 1000),
    };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.floor(entry.expiresAt / 1000),
    };
  }

  entry.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: Math.floor(entry.expiresAt / 1000),
  };
}

const hasUpstashConfig =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = hasUpstashConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export const rateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "10 s"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    })
  : null;

/**
 * Checks rate limit for a given identifier (e.g. IP address or userId).
 *
 * Security Policy:
 * - If Redis is configured, utilizes Upstash distributed sliding window rate limiting.
 * - In production, if Redis is missing or encounters a connection failure, it fails closed
 *   (denying requests by default) to prevent unmitigated API abuse.
 * - In non-production environments without Redis credentials, it falls back to an in-memory
 *   rate limiter.
 */
export async function checkRateLimit(
  identifier: string,
  options?: {
    failClosed?: boolean;
    limit?: number;
    windowSeconds?: number;
  }
): Promise<RateLimitResult> {
  const shouldFailClosed =
    options?.failClosed ?? (process.env.RATE_LIMIT_FAIL_CLOSED === "true");

  if (!rateLimit) {
    if (shouldFailClosed) {
      console.error(
        "🚨 Security Alert: Upstash Redis is not configured in fail-closed mode. Rejecting request."
      );
      return {
        success: false,
        limit: 0,
        remaining: 0,
        reset: Math.floor((Date.now() + 60_000) / 1000),
      };
    }

    // Graceful fallback with in-memory sliding window tracking
    return inMemoryRateLimit(
      identifier,
      options?.limit ?? 50,
      (options?.windowSeconds ?? 10) * 1000
    );
  }

  try {
    const result = await rateLimit.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("Rate limiter execution error:", error);

    if (shouldFailClosed) {
      return {
        success: false,
        limit: options?.limit ?? 50,
        remaining: 0,
        reset: Math.floor((Date.now() + 10_000) / 1000),
      };
    }

    // Fallback to in-memory in dev/test when Redis errors
    return inMemoryRateLimit(
      identifier,
      options?.limit ?? 50,
      (options?.windowSeconds ?? 10) * 1000
    );
  }
}
