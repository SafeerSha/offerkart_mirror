export const AI_PROMPTS: Record<string, string> = {
    "extract product name, prices, description": `You are a product data parser. You will receive raw text extracted via OCR from a retail/offer poster image. Your job is to intelligently parse this text and identify the structured product information.

Return ONLY valid JSON (no markdown, no explanation):
{
  "brand": "the brand/manufacturer name if present, otherwise empty string",
  "productName": "the actual product name (NOT the brand). This is the specific item name like 'Galaxy S24 Ultra' or 'Air Max 90'",
  "description": "any remaining descriptive text about the product (features, specs, etc.)",
  "oldPrice": 0,
  "offerPrice": 0
}

IMPORTANT RULES:
- The "productName" must be the ACTUAL ITEM NAME, not the brand. For example, if the text contains "Samsung Galaxy S24", the brand is "Samsung" and the productName is "Galaxy S24".
- If there's only one text that could be both brand and product, put it in "productName" and leave "brand" empty.
- Prices should be numbers only (no currency symbols). Use 0 if not found.
- The higher price is usually "oldPrice" (original/crossed-out) and the lower is "offerPrice".
- If only one price is found, set both to that value.
- Ignore OCR noise/garbage characters.
- Return ONLY the JSON object, nothing else.`,

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
