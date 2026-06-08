import { z } from "zod";

/**
 * Validated configuration for client-safe usage.
 * This file is bundled on the client side and MUST NOT contain any sensitive server secrets.
 */
const clientConfigSchema = z.object({
  // API Configuration
  api: z.object({
    upstreamBaseUrl: z.string().url().default("https://offersnearu.vercel.app/api"),
    proxyPrefix: z.string().default("/api/backend"),
  }),

  // Site Configuration
  site: z.object({
    url: z.string().url().default("http://localhost:3000"),
  }),
});

// Only parse client-safe, public environment variables
const envData = {
  api: {
    upstreamBaseUrl: process.env.NEXT_PUBLIC_UPSTREAM_API_BASE_URL || process.env.UPSTREAM_API_BASE_URL,
    proxyPrefix: process.env.NEXT_PUBLIC_BACKEND_PROXY_PREFIX || process.env.BACKEND_PROXY_PREFIX,
  },
  site: {
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

const result = clientConfigSchema.safeParse(envData);

if (!result.success) {
  const errors = result.error.flatten().fieldErrors;
  console.warn("⚠️ Client Configuration Warning:", JSON.stringify(errors, null, 2));
}

export const config = result.success 
  ? result.data 
  : clientConfigSchema.parse({});
