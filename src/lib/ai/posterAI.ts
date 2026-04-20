/**
 * Client-side utilities for AI Studio.
 * These functions now call our internal secure API route instead of OpenRouter directly.
 */

export async function generateTaglines(productName: string, category: string, tone: string = "exciting"): Promise<string[]> {
    try {
        const response = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "taglines", productName, category, tone })
        });

        const data = await response.json();
        
        if (!response.ok) {
            if (data.code === "CONFIG_MISSING") {
                throw new Error("AI Setup Required: Please add your API key to .env");
            }
            throw new Error(data.error || "AI API Failure");
        }

        return data.content.split("\n").filter((line: string) => line.trim().length > 0).slice(0, 5);
    } catch (error) {
        console.error("AI Tagline generation failed:", error);
        // Fallback catch-all taglines
        return [
            "Premium Quality Guaranteed",
            "Exclusive Offer Inside",
            "Shop the Best Deals Today",
            "Limited Time - Act Fast!",
            "Your Daily Essential, Reimagined"
        ];
    }
}

export async function suggestPalette(imageUrl?: string): Promise<string[]> {
    try {
        const response = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "palette", imageUrl })
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || "AI API Failure");

        const colors = data.content.match(/#[0-9A-Fa-f]{6}/g);
        return colors || ["#f97316", "#ffffff", "#1e293b"];
    } catch (error) {
        console.error("AI Palette suggestion failed:", error);
        return ["#f97316", "#ffffff", "#1e293b"];
    }
}
