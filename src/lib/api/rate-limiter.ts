import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstashConfig = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

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

export async function checkRateLimit(identifier: string) {
  if (!rateLimit) {
    console.warn("Upstash Redis not configured. Rate limiting is bypassed.");
    return { success: true, limit: 50, remaining: 50, reset: 0 };
  }
  
  return await rateLimit.limit(identifier);
}
