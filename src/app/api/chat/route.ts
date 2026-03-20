import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { callOpenRouter } from "@/lib/openrouter";
import { callHuggingFace } from "@/lib/huggingface";

import { logger } from "@/lib/logger";
// Zod schema for chat request body
const chatRequestSchema = z.object({
    messages: z
        .array(
            z.object({
                role: z.string().min(1, "Message role is required."),
                content: z.string().min(1, "Message content is required.").max(5000, "Message content too long. Maximum 5000 characters."),
            })
        )
        .min(1, "At least one message is required.")
        .max(50, "Too many messages. Maximum 50 allowed."),
});

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // Max requests per minute
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    
    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    
    if (record.count >= RATE_LIMIT) {
        return false;
    }
    
    record.count++;
    return true;
}

function getClientIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0] || 
           req.headers.get('x-real-ip') || 
           'unknown';
}

export async function POST(req: NextRequest) {
    try {
        // Authentication check
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized. Please log in to use this feature." },
                { status: 401 }
            );
        }

        // Rate limiting check
        const clientIP = getClientIP(req);
        if (!checkRateLimit(clientIP)) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        // Validate request body with Zod
        const body = await req.json();
        const parsed = chatRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request body.", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { messages } = parsed.data;

        // Try Hugging Face first, then fall back to OpenRouter
        let result;
        try {
            logger.log("[Chat API] Trying HuggingFace...");
            result = await callHuggingFace(messages);
        } catch (hfError: any) {
            logger.warn(`[Chat API] HuggingFace failed: ${hfError.message}. Falling back to OpenRouter...`);
            result = await callOpenRouter(messages);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        logger.error("Chat API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process chat request" },
            { status: 500 }
        );
    }
}
