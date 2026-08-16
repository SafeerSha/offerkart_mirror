export const PRODUCT_EXTRACTION_PROMPT = `Extract product details from retail poster image into JSON:
{
  "productName": "product name including brand name if available",
  "description": "brief product specs or features from text",
  "oldPrice": 0,
  "offerPrice": 0,
  "discount": "discount text like 25% OFF or empty string",
  "mainCategory": "one of: Electronics, Fashion, Food & Dining, Wellness, Fitness, Jewelry, Beauty, Grocery, Home & Garden, Other",
  "subcategories": ["subcategory1"]
}
Rules:
- productName: item name including brand if present.
- oldPrice & offerPrice: numeric values without currency symbols (use 0 if missing).
- Return ONLY JSON.`;

export const AI_PROMPTS: Record<string, string> = {
    category_suggestion: `You are a product categorization assistant. Based on the product text provided, suggest the best category and subcategories.

Return ONLY valid JSON:
{
  "mainCategory": "one of: Electronics, Fashion, Food & Dining, Wellness, Fitness, Jewelry, Beauty, Grocery, Home & Garden, Other",
  "subcategories": ["relevant", "subcategories"]
}

Return ONLY the JSON object, nothing else.`,

    description_generator: `You are a marketing copywriter. Based on the product information provided, generate a compelling short product description suitable for an offer listing.

Return ONLY valid JSON:
{
  "description": "A compelling 1-2 sentence marketing description"
}

Return ONLY the JSON object, nothing else.`,
};

export type AIRole = keyof typeof AI_PROMPTS;
