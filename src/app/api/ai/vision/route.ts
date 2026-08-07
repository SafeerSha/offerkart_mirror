import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { GoogleGenAI, Type } from '@google/genai';
import { authOptions } from '@/lib/auth';
import { PRODUCT_EXTRACTION_PROMPT } from '@/lib/ai/prompts';
import { logger } from '@/lib/logger';

// --- Rate Limiting (in-memory, use Redis in production) ---
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(userId);

    if (!record || now > record.resetTime) {
        // Simple garbage collection to prevent memory leaks
        if (rateLimitMap.size > 1000) {
            for (const [key, val] of rateLimitMap.entries()) {
                if (now > val.resetTime) rateLimitMap.delete(key);
            }
        }
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (record.count >= RATE_LIMIT) return false;
    record.count++;
    return true;
}

// --- Gemini Response Schema ---
const extractionSchema = {
    type: Type.OBJECT,
    properties: {
        productName: {
            type: Type.STRING,
            description: 'The actual product/item name (NOT the brand). e.g. "Galaxy S24 Ultra"',
        },
        brand: {
            type: Type.STRING,
            description: 'The brand/manufacturer name if present, otherwise empty string.',
        },
        description: {
            type: Type.STRING,
            description: 'Any remaining descriptive text about the product (features, specs, etc.).',
        },
        oldPrice: {
            type: Type.NUMBER,
            description: 'Original/crossed-out price as a number. Use 0 if not found.',
        },
        offerPrice: {
            type: Type.NUMBER,
            description: 'Sale/offer price as a number. Use 0 if not found.',
        },
        discount: {
            type: Type.STRING,
            description: 'Discount info if present (e.g. "25% OFF"), otherwise empty string.',
        },
        mainCategory: {
            type: Type.STRING,
            description:
                'One of: Electronics, Fashion, Food & Dining, Wellness, Fitness, Jewelry, Beauty, Grocery, Home & Garden, Other.',
        },
        subcategories: {
            type: Type.ARRAY,
            description: 'Relevant subcategories for the product.',
            items: { type: Type.STRING },
        },
    },
    required: [
        'productName',
        'brand',
        'description',
        'oldPrice',
        'offerPrice',
        'discount',
        'mainCategory',
        'subcategories',
    ],
};

// --- Helper: Exponential Backoff Retry Generator ---
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-2.0-flash'];

async function generateContentWithRetry(ai: GoogleGenAI, params: any, maxRetries = 3) {
    let lastError: any = null;

    for (const modelName of GEMINI_MODELS) {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                return {
                    response: await ai.models.generateContent({ ...params, model: modelName }),
                    modelUsed: modelName,
                };
            } catch (error: any) {
                attempt++;
                lastError = error;

                const isRateLimit =
                    error?.status === 429 ||
                    error?.statusCode === 429 ||
                    error?.message?.includes('429') ||
                    error?.message?.toLowerCase().includes('rate') ||
                    error?.message?.toLowerCase().includes('resource_exhausted');

                if (isRateLimit && attempt < maxRetries) {
                    const delayMs = Math.pow(2, attempt) * 1000;
                    logger.warn(`[Vision API] Gemini 429 Rate Limit hit. Retrying attempt ${attempt}/${maxRetries} after ${delayMs}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                } else if (!isRateLimit) {
                    if (error?.status === 404 || error?.message?.includes('404') || error?.message?.toLowerCase().includes('not found')) {
                        logger.warn(`[Vision API] Model ${modelName} not found (404). Skipping to next model...`);
                        break;
                    }
                    throw error;
                } else {
                    logger.warn(`[Vision API] Model ${modelName} exhausted retries due to 429 rate limit. Trying next model if available...`);
                    break;
                }
            }
        }
    }

    throw lastError;
}

export async function POST(req: NextRequest) {
    try {
        // 1. Auth check
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized. Please log in to use this feature.' },
                { status: 401 }
            );
        }

        // 2. Rate limit check by User Identity (more secure than IP)
        const userId = session.user?.email || session.user?.id || 'anonymous';
        if (!checkRateLimit(userId)) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        // 3. Parse body
        const body = await req.json();
        const { fileData, mimeType } = body;

        if (!fileData || !mimeType) {
            return NextResponse.json(
                { error: 'Missing fileData or mimeType in request body.' },
                { status: 400 }
            );
        }

        // 3a. Payload size limit (prevent memory exhaustion)
        // A 4MB limit is generous for a 768px downscaled image (which is usually < 500KB)
        const MAX_PAYLOAD_SIZE = 4 * 1024 * 1024; // 4MB
        if (fileData.length > MAX_PAYLOAD_SIZE) {
            return NextResponse.json(
                { error: 'Image payload is too large. Max size is 4MB.' },
                { status: 413 }
            );
        }

        // 3b. Validate MIME type to ensure it's an image
        if (!mimeType.startsWith('image/')) {
            return NextResponse.json(
                { error: 'Invalid mimeType. Only image types are allowed.' },
                { status: 400 }
            );
        }

        // 4. Validate API key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            logger.error('[Vision API] GEMINI_API_KEY is not set in environment variables.');
            return NextResponse.json(
                { error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.' },
                { status: 500 }
            );
        }

        // 5. Call Gemini with retry & exponential backoff
        const ai = new GoogleGenAI({ apiKey });

        const { response, modelUsed } = await generateContentWithRetry(ai, {
            contents: [
                {
                    inlineData: {
                        data: fileData,
                        mimeType: mimeType,
                    },
                },
                {
                    text: 'Extract the product information from this cropped poster/flyer image segment. Return the structured JSON.',
                },
            ],
            config: {
                systemInstruction: PRODUCT_EXTRACTION_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: extractionSchema,
                temperature: 0.1,
            },
        });

        const jsonText = response.text || '{}';

        let parsedData: any;
        try {
            parsedData = JSON.parse(jsonText);
        } catch {
            logger.error('[Vision API] Gemini returned unparsable JSON:', jsonText);
            return NextResponse.json(
                { error: 'AI returned unparsable content.', raw: jsonText },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: true,
            data: parsedData,
            model: modelUsed,
        });
    } catch (error: any) {
        logger.error('[Vision API] Error:', error);

        if (
            error?.status === 429 ||
            error?.message?.includes('429') ||
            error?.message?.toLowerCase().includes('resource_exhausted')
        ) {
            return NextResponse.json(
                { error: 'Gemini API rate limit exceeded. Please wait 1 minute before trying again.' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Internal server error during image extraction.' },
            { status: 500 }
        );
    }
}
