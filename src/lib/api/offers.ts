import { FEATURED_SHOPS, FEATURED_OFFERS, ALL_OFFERS } from './mockData';
import { Offer, OfferPayload } from '../types/offer';
import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function createOffer(payload: OfferPayload, shopId: string) {
    return apiClient<Offer>(ENDPOINTS.OFFER.BASE, {
        method: 'POST',
        headers: {
            'shopId': shopId
        },
        body: JSON.stringify(payload)
    });
}

export async function updateOffer(id: string, payload: OfferPayload, shopId: string) {
    return apiClient<Offer>(ENDPOINTS.OFFER.DETAILS(id), {
        method: 'PUT',
        headers: {
            'shopId': shopId
        },
        body: JSON.stringify(payload)
    });
}

export async function deleteOffer(id: string, shopId: string) {
    return apiClient<void>(ENDPOINTS.OFFER.DETAILS(id), {
        method: 'DELETE',
        headers: {
            'shopId': shopId
        }
    });
}

export async function getFeaturedShops() {
    return {
        success: true,
        data: FEATURED_SHOPS
    };
}

export async function getFeaturedOffers() {
    return {
        success: true,
        data: FEATURED_OFFERS
    };
}

export async function getAllOffers(shopId?: string) {
    return apiClient<Offer[]>(ENDPOINTS.OFFER.BASE, {
        headers: shopId ? { 'shopId': shopId } : {}
    });
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
    return apiClient<Offer>(ENDPOINTS.OFFER.DETAILS(id));
}
