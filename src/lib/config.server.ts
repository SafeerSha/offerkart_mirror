import 'server-only';
import { z } from "zod";

/**
 * Validated configuration for server-side usage only.
 * This ensures that critical environment variables (including sensitive keys)
 * are present and correctly formatted on the server.
 */
const emptyStringToUndefined = (val: unknown) =>
  typeof val === "string" && val.trim() === "" ? undefined : val;

const optionalUrl = z.preprocess(emptyStringToUndefined, z.string().url().optional());
const optionalString = z.preprocess(emptyStringToUndefined, z.string().optional());

const serverConfigSchema = z.object({
  // API Configuration
  api: z.object({
    upstreamBaseUrl: z.preprocess(
      emptyStringToUndefined,
      z.string().url().default("https://offersnearu.vercel.app/api")
    ),
    proxyPrefix: z.preprocess(
      emptyStringToUndefined,
      z.string().default("/api/backend")
    ),
  }),

  // Auth Configuration
  auth: z.object({
    secret: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1, "NEXTAUTH_SECRET is required").default("dev-secret-placeholder")
    ),
    url: optionalUrl,
  }),

  // Site Configuration
  site: z.object({
    url: z.preprocess(
      emptyStringToUndefined,
      z.string().url().default("http://localhost:3000")
    ),
  }),

  // AI & External Services
  external: z.object({
    aiApiKey: optionalString,
    hfToken: optionalString,
  }),

  // Redis & Rate Limiting
  redis: z.object({
    url: optionalUrl,
    token: optionalString,
  }),
});

// Parse and validate environment variables on the server side
const envData = {
  api: {
    upstreamBaseUrl: process.env.UPSTREAM_API_BASE_URL || process.env.NEXT_PUBLIC_UPSTREAM_API_BASE_URL,
    proxyPrefix: process.env.BACKEND_PROXY_PREFIX || process.env.NEXT_PUBLIC_BACKEND_PROXY_PREFIX,
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL,
  },
  site: {
    url: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL,
  },
  external: {
    aiApiKey: process.env.AI_API_KEY,
    hfToken: process.env.HF_ACCESS_TOKEN,
  },
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
};

const result = serverConfigSchema.safeParse(envData);

if (!result.success) {
  const errors = result.error.flatten().fieldErrors;
  console.warn("⚠️ Server Configuration Warning:", JSON.stringify(errors, null, 2));
}

export const config = result.success 
  ? result.data 
  : serverConfigSchema.parse({});
