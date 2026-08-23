export const PRODUCT_EXTRACTION_PROMPT = `Extract from the poster image into JSON:
{
  "productName": string, // include brand if present
  "description": string, // brief specs/features from image text
  "oldPrice": number, // 0 if missing, no currency symbol
  "offerPrice": number, // 0 if missing, no currency symbol
  "discount": string, // e.g. "25% OFF", or "" if none
  "mainCategory": Electronics|Fashion|Food & Dining|Wellness|Fitness|Jewelry|Beauty|Grocery|Home & Garden|Other,
  "subcategories": [string]
}
Return only the JSON.`;

export const AI_PROMPTS: Record<string, string> = {
    category_suggestion: `Categorize this product from the text below. Return JSON only:
{
  "mainCategory": Electronics|Fashion|Food & Dining|Wellness|Fitness|Jewelry|Beauty|Grocery|Home & Garden|Other,
  "subcategories": [string]
}`,

    description_generator: `Write a compelling 1-2 sentence marketing description for this product, for an offer listing. Return JSON only:
{
  "description": string
}`,
};

export type AIRole = keyof typeof AI_PROMPTS;
