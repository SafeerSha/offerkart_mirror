import { FEATURED_SHOPS, FEATURED_OFFERS, ALL_OFFERS } from './mockData';
import { Offer } from '../types/offer';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getFeaturedShops() {
    return FEATURED_SHOPS;
}

export async function getFeaturedOffers() {
    return FEATURED_OFFERS;
}

export async function getAllOffers() {
    return ALL_OFFERS;
}

export async function getPaginatedOffers(page: number = 1, limit: number = 8) {
    await delay(800); // Simulate network latency
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = ALL_OFFERS.slice(startIndex, endIndex);

    return {
        data: paginatedItems,
        hasMore: endIndex < ALL_OFFERS.length
    };
}

export async function getOfferById(id: string) {
    await delay(100);
    // For demo, just reuse one of the offers and enrich it if needed
    // In real app, this would fetch specific details
    const basicOffer = ALL_OFFERS.find(o => o.id.toString() === id) || ALL_OFFERS[0];

    return {
        ...basicOffer,
        // Add detail-specific fields
        images: [basicOffer.image, basicOffer.image, basicOffer.image], // Mock multiple images
        description: "Experience the best services with our premium package. Valid on selected items.",
        reviews: 128,
        fullLocation: "123 Main St, Downtown, New York",
        price: "₹4.99",
        originalPrice: "₹7.49"
    };
}
