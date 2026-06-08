import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash is configured
const hasUpstashConfig = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis only if config is present, otherwise fallback to null
export const redis = hasUpstashConfig 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Create a new ratelimiter, that allows 50 requests per 10 seconds
export const rateLimit = redis 
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "10 s"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    })
  : null;

/**
 * Helper to check rate limit for a given identifier (usually IP).
 * If Redis is not configured, it bypasses the limit with a warning.
 */
export async function checkRateLimit(identifier: string) {
  if (!rateLimit) {
    console.warn("Upstash Redis not configured. Rate limiting is bypassed.");
    return { success: true, limit: 50, remaining: 50, reset: 0 };
  }
  
  return await rateLimit.limit(identifier);
}
