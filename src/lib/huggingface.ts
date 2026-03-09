const HF_TOKEN = "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";

export interface DetectedProduct {
    name: string;
    price: number;
    box: [number, number, number, number]; // [xmin, ymin, xmax, ymax] (0-1000)
}

/**
 * GLM-4.5V Vision via Hugging Face Router.
 * 
 * Notes:
 * - GLM-4.5V has a "Thinking Mode" that outputs reasoning in `reasoning_content`
 *   and the final answer in `content`. We need enough tokens for BOTH.
 * - max_tokens must be set high enough (4096+) to avoid `finish_reason: "length"`.
 * - If `content` is empty, we parse the reasoning_content as fallback.
 */
export async function detectProductsHF(base64Image: string): Promise<DetectedProduct[]> {
    try {
        const endpoint = "https://router.huggingface.co/v1/chat/completions";
        const model = "zai-org/GLM-4.5V";

        console.log("Calling GLM-4.5V (Vision) via HF Router for AI Marking...");

        const imageUrl = base64Image.startsWith("data:")
            ? base64Image
            : `data:image/jpeg;base64,${base64Image}`;

        // Concise prompt to minimize reasoning tokens
        const prompt = "List every product in this poster as JSON. For each product return: name, price (number), box [xmin,ymin,xmax,ymax] on 0-1000 scale. Return ONLY the JSON array, no explanation.";

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: imageUrl } }
                        ]
                    }
                ],
                // High token limit to accommodate thinking + final answer
                max_tokens: 4096,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HF Router Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const choice = data.choices?.[0];

        // GLM-4.5V puts thinking in reasoning_content, final answer in content
        let rawContent = (choice?.message?.content || "").trim();

        // Fallback: if content is empty, try to extract from reasoning_content
        if (!rawContent && choice?.message?.reasoning_content) {
            console.log("Content was empty, parsing reasoning_content as fallback...");
            rawContent = choice.message.reasoning_content.trim();
        }

        console.log("GLM-4.5V Raw Response Content:", rawContent.substring(0, 500));

        // Warn if truncated
        if (choice?.finish_reason === "length") {
            console.warn("WARNING: Response was truncated (finish_reason: length). Consider increasing max_tokens.");
        }

        // Try to parse the content directly first (GLM usually returns clean JSON)
        let products: any[];
        try {
            products = JSON.parse(rawContent);
        } catch {
            // Fallback: extract the outermost JSON array using greedy regex
            // Match from first [ to LAST ] to get the full array, not an inner box array
            const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.error("No JSON array found. Full response:", rawContent);
                throw new Error("AI could not produce structured output. The poster may be too complex — try with fewer products.");
            }
            try {
                products = JSON.parse(jsonMatch[0]);
            } catch (parseErr) {
                console.error("JSON Parse Error:", jsonMatch[0].substring(0, 300));
                throw new Error("AI returned malformed JSON. Please try again.");
            }
        }

        if (!Array.isArray(products)) {
            throw new Error("Parsed content is not an array.");
        }

        console.log(`Successfully parsed ${products.length} products from GLM-4.5V`);

        return products.map(p => ({
            name: String(p.name || "Unnamed Product"),
            price: Number(p.price) || 0,
            box: Array.isArray(p.box) && p.box.length === 4
                ? p.box.map(Number) as [number, number, number, number]
                : [0, 0, 0, 0]
        }));

    } catch (error: any) {
        console.error("detectProductsHF Failure:", error);
        throw error;
    }
}
