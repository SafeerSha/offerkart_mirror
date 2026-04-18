import { z } from "zod";

/**
 * Validated configuration for the application.
 * This ensures that critical environment variables are present and correctly formatted.
 */
const configSchema = z.object({
  // API Configuration
  api: z.object({
    upstreamBaseUrl: z.string().url().default("https://offersnearu.vercel.app/api"),
    proxyPrefix: z.string().default("/api/backend"),
  }),

  // Auth Configuration
  auth: z.object({
    secret: z.string().min(1, "NEXTAUTH_SECRET is required"),
    url: z.string().url().optional(),
  }),

  // Site Configuration
  site: z.object({
    url: z.string().url().default("http://localhost:3000"),
  }),

  // AI & External Services
  external: z.object({
    aiApiKey: z.string().optional(),
    hfToken: z.string().optional(),
  }),
});

// Parse and validate environment variables
const result = configSchema.safeParse({
  api: {
    upstreamBaseUrl: process.env.UPSTREAM_API_BASE_URL,
    proxyPrefix: process.env.BACKEND_PROXY_PREFIX,
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL,
  },
  site: {
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
  external: {
    aiApiKey: process.env.AI_API_KEY,
    hfToken: process.env.HF_ACCESS_TOKEN,
  },
});

if (!result.success) {
  const errors = result.error.flatten().fieldErrors;
  console.error("❌ Invalid Environment Configuration:", JSON.stringify(errors, null, 2));
  
  // In production, we might want to shut down or throw a hard error
  if (process.env.NODE_ENV === "production") {
    throw new Error("Invalid Environment Configuration");
  }
}

export const config = result.success ? result.data : ({} as z.infer<typeof configSchema>);
