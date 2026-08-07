import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callOpenRouter } from "@/lib/openrouter";
import { createStructuredLogger } from "@/lib/logger";
import { getToken } from "next-auth/jwt";
import { config } from "@/lib/config.server";
import { checkRateLimit } from "@/lib/api/rate-limiter";
import { sanitizeInput } from "@/lib/security";

const aiLogger = createStructuredLogger("AIApi");

const AIRequestSchema = z.object({
  type: z.enum(["taglines", "palette"]),
  productName: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  imageUrl: z.string().url().optional(),
  tone: z.string().max(50).optional(),
}).refine(data => {
  if (data.type === "taglines") return !!data.productName && !!data.category;
  if (data.type === "palette") return true;
  return false;
}, {
  message: "Invalid request: taglines requires productName and category",
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limit Check
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = await checkRateLimit(`ai:${ip}`);
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many AI requests. Please try again later." }, { status: 429 });
    }

    // 2. Authentication Check
    const token = await getToken({ req, secret: config.auth.secret });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access to AI services" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = AIRequestSchema.safeParse(body);

    if (!parsed.success) {
      aiLogger.warn("Invalid AI request", { errors: parsed.error.errors });
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, productName, category, imageUrl, tone } = parsed.data;

    // Sanitize user inputs for prompt construction
    const safeProduct = productName ? sanitizeInput(productName).replace(/[\r\n`]/g, " ") : "";
    const safeCategory = category ? sanitizeInput(category).replace(/[\r\n`]/g, " ") : "";
    const safeTone = tone ? sanitizeInput(tone).replace(/[\r\n`]/g, " ") : "exciting";

    let prompt = "";
    let systemPrompt = "You are a professional retail marketing assistant.";

    if (type === "taglines") {
      systemPrompt = "You are a professional copywriter for a retail marketing app.";
      prompt = `Generate 5 catchy, high-conversion marketing taglines for a ${safeCategory} product named "${safeProduct}". 
      The tone should be ${safeTone}. 
      Each tagline should be short (max 10 words).
      Return only the taglines, one per line, no numbers or bullets.`;
    } else if (type === "palette") {
      systemPrompt = "You are a senior UI/UX designer. You respond only with HEX color codes separated by commas.";
      prompt = imageUrl 
          ? "Analyze this product image and suggest a professional 3-color palette (HEX codes only) that complements it. Return as a comma-separated list like #FFFFFF,#000000,#FF0000."
          : "Suggest 3 vibrant, professional HEX colors for a retail offer poster. Return as a comma-separated list like #FFFFFF,#000000,#000000.";
    }

    aiLogger.debug("Processing AI request", { type, category, hasImage: !!imageUrl });

    const userContent = (type === "palette" && imageUrl)
        ? [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        : prompt;

    const response = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent as any }
    ]);

    return NextResponse.json({ content: response.content });
  } catch (error: any) {
    aiLogger.error("AI API processing failed", error instanceof Error ? error : new Error(String(error)));

    if (error.message?.includes("OPENROUTER_API_KEY")) {
      return NextResponse.json(
        { error: "AI service not configured. Please add OPENROUTER_API_KEY to your .env file.", code: "CONFIG_MISSING" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process AI request", code: "AI_ERROR" },
      { status: 500 }
    );
  }
}
