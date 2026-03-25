import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { AI_PROMPTS } from '@/lib/ai/prompts';
import { callOpenRouter } from '@/lib/openrouter';
import { callHuggingFace } from '@/lib/huggingface';
import { logger } from "@/lib/logger";

const MAX_RESPONSE_SIZE = 10000;

const visionRequestSchema = z.object({
    text: z.string().max(10000, "Input text too long. Maximum 10000 characters allowed.").optional(),
    image: z.string().optional(),
    role: z.string().min(1, "Role is required."),
}).refine(data => data.text || data.image, {
    message: "Either text or image must be provided",
});

// In-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (record.count >= RATE_LIMIT) return false;

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
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized. Please log in to use this feature.' },
                { status: 401 }
            );
        }

        const clientIP = getClientIP(req);
        if (!checkRateLimit(clientIP)) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const parsed = visionRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request body.', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { text, image, role } = parsed.data;

        const targetRole = role === 'product_extraction' ? 'extract product name, prices, description' : role;

        const systemPrompt = AI_PROMPTS[targetRole];
        if (!systemPrompt) {
            return NextResponse.json(
                { error: `Unknown AI role: ${targetRole}. Available: ${Object.keys(AI_PROMPTS).join(', ')}` },
                { status: 400 }
            );
        }

        const messages = image ? [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: [
                    { type: 'text', text: text ? `Here is the raw OCR text extracted: \n\n${text}\n\nAlso, review the provided cropped image segment. Parse the product name, prices, and description.` : `Examine the provided cropped product segment. Extract the product name, prices, and description.` },
                    { type: 'image_url', image_url: { url: image } }
                ]
            }
        ] : [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: `Here is the raw OCR text extracted from a product/offer poster:\n\n---\n${text}\n---\n\nParse this text and return the structured JSON.`,
            },
        ];

        logger.log(`[Vision API] Requesting extraction using role: ${targetRole} | HasImage: ${!!image}`);

        let result;
        let provider = "HuggingFace";

        try {
            result = await callHuggingFace(messages);
        } catch (hfError: any) {
            logger.warn(`[Vision API] HuggingFace failed: ${hfError.message}. Falling back to OpenRouter...`);
            provider = "OpenRouter";
            result = await callOpenRouter(messages);
        }

        let parsedData: any;
        try {
            const jsonMatch = result.content.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonStr = jsonMatch ? jsonMatch[1].trim() : result.content.trim();

            if (jsonStr.length > MAX_RESPONSE_SIZE) {
                throw new Error(`AI response too large (${jsonStr.length} chars). Maximum ${MAX_RESPONSE_SIZE} allowed.`);
            }
            parsedData = JSON.parse(jsonStr);
        } catch (e) {
            logger.error(`[Vision API] Unparsable response from ${result.model}:`, result.content);
            return NextResponse.json(
                { error: 'AI returned unparsable content.', raw: result.content },
                { status: 502 }
            );
        }

        return NextResponse.json({ success: true, data: parsedData, model: result.model });

    } catch (error: any) {
        logger.error('Vision API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
