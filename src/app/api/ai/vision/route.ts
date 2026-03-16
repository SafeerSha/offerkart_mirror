import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AI_PROMPTS } from '@/lib/ai/prompts';
import { callOpenRouter } from '@/lib/openrouter';
import { callHuggingFace } from '@/lib/huggingface';

const MAX_REQUEST_TEXT_LENGTH = 10000; // 10KB max for input text
const MAX_RESPONSE_SIZE = 10000; // 10KB max for AI response
const REQUEST_TIMEOUT_MS = 60000; // 60 second timeout for AI requests

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
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { text, role } = body;

        // Map old role to new one if necessary
        const targetRole = role === 'product_extraction' ? 'extract product name, prices, description' : role;

        // Input validation and size limits
        if (!text || typeof text !== 'string' || !targetRole) {
            return NextResponse.json(
                { error: 'Missing required fields: text and role' },
                { status: 400 }
            );
        }

        if (text.length > MAX_REQUEST_TEXT_LENGTH) {
            return NextResponse.json(
                { error: `Input text too long. Maximum ${MAX_REQUEST_TEXT_LENGTH} characters allowed.` },
                { status: 400 }
            );
        }

        const systemPrompt = AI_PROMPTS[targetRole];
        if (!systemPrompt) {
            return NextResponse.json(
                { error: `Unknown AI role: ${targetRole}. Available: ${Object.keys(AI_PROMPTS).join(', ')}` },
                { status: 400 }
            );
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: `Here is the raw OCR text extracted from a product/offer poster:\n\n---\n${text}\n---\n\nParse this text and return the structured JSON.`,
            },
        ];

        console.log(`[Vision API] Requesting extraction for text (${text.length} chars) using role: ${targetRole}`);
        
        // Try Hugging Face first, then fall back to OpenRouter
        let result;
        let provider = "HuggingFace";
        
        try {
            result = await callHuggingFace(messages);
        } catch (hfError: any) {
            console.warn(`[Vision API] HuggingFace failed: ${hfError.message}. Falling back to OpenRouter...`);
            provider = "OpenRouter";
            result = await callOpenRouter(messages);
        }

        // Parse JSON from response with size limits
        let parsedData: any;
        try {
            const jsonMatch = result.content.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonStr = jsonMatch ? jsonMatch[1].trim() : result.content.trim();
            
            if (jsonStr.length > MAX_RESPONSE_SIZE) {
                throw new Error(`AI response too large (${jsonStr.length} chars). Maximum ${MAX_RESPONSE_SIZE} allowed.`);
            }
            parsedData = JSON.parse(jsonStr);
        } catch (e) {
            console.error(`[Vision API] Unparsable response from ${result.model}:`, result.content);
            return NextResponse.json(
                { error: 'AI returned unparsable content.', raw: result.content },
                { status: 502 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            data: parsedData, 
            model: result.model 
        });

    } catch (error: any) {
        console.error('Vision API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
