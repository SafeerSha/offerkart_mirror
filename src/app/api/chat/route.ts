import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { callOpenRouter } from "@/lib/openrouter";
import { callHuggingFace } from "@/lib/huggingface";
import { createStructuredLogger } from "@/lib/logger";

const chatLogger = createStructuredLogger("ChatApi");

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.string().min(1, "Message role is required."),
        content: z.string().min(1, "Message content is required.").max(5000, "Message content too long. Maximum 5000 characters."),
      })
    )
    .min(1, "At least one message is required.")
    .max(50, "Too many messages. Maximum 50 allowed."),
  sessionId: z.string().uuid().optional(),
});

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      chatLogger.warn("Unauthorized chat attempt");
      return NextResponse.json(
        { error: "Unauthorized. Please log in to use this feature." },
        { status: 401 }
      );
    }

    const clientIP = getClientIP(req);
    const rateCheck = checkRateLimit(clientIP);
    
    if (!rateCheck.allowed) {
      chatLogger.warn("Rate limit exceeded", { ip: clientIP });
      return NextResponse.json(
        { error: "Too many requests. Please try again later.", retryAfter: RATE_LIMIT_WINDOW_MS },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)),
          },
        }
      );
    }

    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      chatLogger.warn("Invalid request body", { errors: parsed.error.flatten().fieldErrors });
      return NextResponse.json(
        { error: "Invalid request body.", details: parsed.error.flatten().fieldErrors, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { messages } = parsed.data;

    let result;
    try {
      chatLogger.debug("Trying HuggingFace");
      result = await callHuggingFace(messages);
    } catch (hfError: any) {
      chatLogger.warn("HuggingFace failed, falling back to OpenRouter", { error: hfError.message });
      result = await callOpenRouter(messages);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    chatLogger.error("Chat API error", error instanceof Error ? error : new Error(String(error)));
    const isProd = process.env.NODE_ENV === "production";
    return NextResponse.json(
      { 
        error: isProd ? "Failed to process chat request" : (error?.message || "Failed to process chat request"), 
        code: "INTERNAL_ERROR" 
      },
      { status: 500 }
    );
  }
}

