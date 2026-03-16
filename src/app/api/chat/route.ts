import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";
import { callHuggingFace } from "@/lib/huggingface";

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
        // Rate limiting check
        const clientIP = getClientIP(req);
        if (!checkRateLimit(clientIP)) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: "Invalid messages format. Expected an array." },
                { status: 400 }
            );
        }

        // Validate message structure and limit array size
        if (messages.length > 50) {
            return NextResponse.json(
                { error: "Too many messages. Maximum 50 allowed." },
                { status: 400 }
            );
        }

        for (const msg of messages) {
            if (!msg.role || !msg.content || typeof msg.content !== 'string') {
                return NextResponse.json(
                    { error: "Each message must have role and content fields." },
                    { status: 400 }
                );
            }
            if (msg.content.length > 5000) {
                return NextResponse.json(
                    { error: "Message content too long. Maximum 5000 characters per message." },
                    { status: 400 }
                );
            }
        }

        // Try Hugging Face first, then fall back to OpenRouter
        let result;
        try {
            console.log("[Chat API] Trying HuggingFace...");
            result = await callHuggingFace(messages);
        } catch (hfError: any) {
            console.warn(`[Chat API] HuggingFace failed: ${hfError.message}. Falling back to OpenRouter...`);
            result = await callOpenRouter(messages);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process chat request" },
            { status: 500 }
        );
    }
}
