import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, productName, category, imageUrl, tone } = body;

        let prompt = "";
        let systemPrompt = "You are a professional retail marketing assistant.";

        if (type === "taglines") {
            systemPrompt = "You are a professional copywriter for a retail marketing app.";
            prompt = `Generate 5 catchy, high-conversion marketing taglines for a ${category} product named "${productName}". 
            The tone should be ${tone || "exciting"}. 
            Each tagline should be short (max 10 words).
            Return only the taglines, one per line, no numbers or bullets.`;
        } else if (type === "palette") {
            systemPrompt = "You are a senior UI/UX designer. You respond only with HEX color codes separated by commas.";
            prompt = imageUrl 
                ? "Analyze this product image and suggest a professional 3-color palette (HEX codes only) that complements it. Return as a comma-separated list like #FFFFFF,#000000,#FF0000."
                : "Suggest 3 vibrant, professional HEX colors for a retail offer poster. Return as a comma-separated list like #FFFFFF,#000000,#000000.";
        } else {
            return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
        }

        const response = await callOpenRouter([
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ]);

        return NextResponse.json({ content: response.content });
    } catch (error: any) {
        console.error("[AI API Error]:", error);
        
        // Check for missing API key specifically
        if (error.message?.includes("OPENROUTER_API_KEY")) {
            return NextResponse.json({ 
                error: "AI service not configured. Please add OPENROUTER_API_KEY to your .env file.",
                code: "CONFIG_MISSING"
            }, { status: 500 });
        }

        return NextResponse.json({ 
            error: error.message || "Failed to process AI request" 
        }, { status: 500 });
    }
}
