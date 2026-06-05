/**
 * Centralized cache tag constants for on-demand revalidation.
 * 
 * These tags are used in two places:
 * 1. In server-side fetch calls via `next: { tags: [...] }` to tag cached responses
 * 2. In the backend proxy via `revalidateTag()` to invalidate those caches after mutations
 */
export const CACHE_TAGS = {
    /** Tag for the home page's aggregated data (offers + shops + products) */
    HOME: 'home',

    /** Tag for all offers listings (pages that show multiple offers) */
    OFFERS: 'offers',

    /** Tag for a specific offer detail page */
    OFFER: (id: string | number) => `offer-${id}`,

    /** Tag for all products listings */
    PRODUCTS: 'products',

    /** Tag for a specific product detail page */
    PRODUCT: (id: string | number) => `product-${id}`,

    /** Tag for shop-related data visible on public pages */
    SHOPS: 'shops',
} as const;
