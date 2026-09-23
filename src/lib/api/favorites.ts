import { backend } from "./backendClient";
import { ENDPOINTS } from "./endpoints";

export interface FavoriteItem {
  id: string | number;
  item_id: string | number;
  type: 'offer' | 'product';
  created_at?: string;
  offer?: any;
  product?: any;
}

import { unwrapApiEnvelope } from "./backendClient";

export const getFavorites = async (): Promise<FavoriteItem[]> => {
  try {
    const response = await backend.get<any>(ENDPOINTS.FAVORITE.BASE);
    if (!response.success) {
      return [];
    }
    
    const unwrapped = unwrapApiEnvelope(response.data);
    if (Array.isArray(unwrapped)) {
      return unwrapped;
    } else if (unwrapped && Array.isArray(unwrapped.data)) {
      return unwrapped.data;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
    return [];
  }
};

export const addFavorite = async (itemId: string | number, type: 'offer' | 'product'): Promise<FavoriteItem | null> => {
  try {
    const response = await backend.post<FavoriteItem>(ENDPOINTS.FAVORITE.BASE, { item_id: itemId, type });
    return response.data ?? null;
  } catch (error) {
    console.error("Failed to add favorite:", error);
    throw error;
  }
};

export const removeFavorite = async (favoriteId: string | number): Promise<boolean> => {
  try {
    await backend.delete(ENDPOINTS.FAVORITE.DETAILS(favoriteId));
    return true;
  } catch (error) {
    console.error("Failed to remove favorite:", error);
    throw error;
  }
};
