import { backend, unwrapApiEnvelope } from "./backendClient";
import { ENDPOINTS } from "./endpoints";

export type FavoriteType = 'OFFER_PRODUCT' | 'OFFER' | 'product' | 'offer';

export interface ToggleFavoritePayload {
  type: 'OFFER_PRODUCT' | 'OFFER' | string;
  id: string;
}

export interface ToggleFavoriteResponse {
  success?: boolean;
  message?: string;
  isFavourite?: boolean;
  isFavorite?: boolean;
  data?: any;
}

export interface FavoriteItem {
  id: string | number;
  item_id: string | number;
  type: 'OFFER_PRODUCT' | 'OFFER' | 'product' | 'offer';
  created_at?: string;
  offer?: any;
  product?: any;
  raw?: any;
}

export function normalizeFavoriteType(type: string): 'OFFER_PRODUCT' | 'OFFER' {
  const upper = (type || "").toUpperCase();
  if (upper.includes("PRODUCT")) {
    return "OFFER_PRODUCT";
  }
  return "OFFER";
}

export function normalizeFavoriteItem(item: any): FavoriteItem {
  if (!item || typeof item !== "object") {
    const strVal = String(item ?? "");
    return {
      id: strVal,
      item_id: strVal,
      type: "OFFER_PRODUCT",
    };
  }

  // Determine type
  const rawType = String(item.type || "").toUpperCase();
  const isProduct =
    rawType.includes("PRODUCT") ||
    Boolean(
      item.product ||
      item.offerProduct ||
      item.productId ||
      item.offerProductId ||
      item.displayName ||
      item.offerPrice !== undefined
    );
  const isOffer =
    !isProduct &&
    (rawType === "OFFER" ||
      rawType.includes("OFFER") ||
      Boolean(
        item.offer ||
        (item.totalPosters !== undefined && item.defaultPoster !== undefined) ||
        item.offerId
      ));
  const finalType: 'OFFER_PRODUCT' | 'OFFER' = isProduct ? "OFFER_PRODUCT" : "OFFER";

  // Determine item ID (ensure product's offerId doesn't override product id)
  let itemId: any;
  if (finalType === "OFFER_PRODUCT") {
    itemId =
      item.product?.id ??
      item.product?._id ??
      item.product?.productId ??
      item.offerProduct?.id ??
      item.offerProduct?._id ??
      item.offerProduct?.productId ??
      item.productId ??
      item.product_id ??
      item.offerProductId ??
      item.offer_product_id ??
      item.id ??
      item.item_id ??
      item.itemId ??
      item.targetId ??
      item.target_id;
  } else {
    itemId =
      item.offer?.id ??
      item.offer?._id ??
      item.offer?.offerId ??
      item.offerId ??
      item.offer_id ??
      item.id ??
      item.item_id ??
      item.itemId ??
      item.targetId ??
      item.target_id;
  }

  const resolvedOffer = item.offer || (finalType === "OFFER" ? item : undefined);
  const resolvedProduct = item.product || item.offerProduct || (finalType === "OFFER_PRODUCT" ? item : undefined);

  return {
    id: item.favoriteId ?? item.id ?? itemId,
    item_id: String(itemId ?? item.id ?? ""),
    type: finalType,
    created_at: item.created_at || item.createdAt || item.favoritedAt,
    offer: resolvedOffer,
    product: resolvedProduct,
    raw: item,
  };
}

export function extractFavoritesArray(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  // Handle nested envelope e.g. { data: [...] }
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;

  // Handle { favorites: [...] } or { items: [...] }
  if (Array.isArray(raw.favorites)) return raw.favorites;
  if (Array.isArray(raw.items)) return raw.items;

  // Handle { products: [...], offers: [...] } or { offerProducts: [...], offers: [...] }
  const combined: any[] = [];
  if (Array.isArray(raw.products)) {
    combined.push(...raw.products.map((p: any) => ({ ...p, type: 'OFFER_PRODUCT' })));
  }
  if (Array.isArray(raw.offerProducts)) {
    combined.push(...raw.offerProducts.map((p: any) => ({ ...p, type: 'OFFER_PRODUCT' })));
  }
  if (Array.isArray(raw.offers)) {
    combined.push(...raw.offers.map((o: any) => ({ ...o, type: 'OFFER' })));
  }
  if (combined.length > 0) return combined;

  // If raw has a nested data object, recurse into it
  if (raw.data && typeof raw.data === 'object') {
    return extractFavoritesArray(raw.data);
  }

  return [];
}

export function isItemInFavorites(
  favorites: any[] | null | undefined,
  targetId: string | number | undefined,
  expectedType?: string
): boolean {
  if (!favorites || !Array.isArray(favorites) || targetId === undefined || targetId === null) {
    return false;
  }
  const strTargetId = String(targetId).trim();
  if (!strTargetId) return false;

  const normalizedExpected = expectedType ? normalizeFavoriteType(expectedType) : null;

  return favorites.some((fav) => {
    if (!fav) return false;

    // Direct string or number in array
    if (typeof fav === "string" || typeof fav === "number") {
      return String(fav).trim() === strTargetId;
    }

    const rawType = String(fav.type || "").toUpperCase();
    const isProduct =
      rawType.includes("PRODUCT") ||
      Boolean(fav.product || fav.offerProduct || fav.productId || fav.raw?.displayName);
    const isOffer =
      !isProduct &&
      (rawType === "OFFER" ||
        rawType.includes("OFFER") ||
        Boolean(fav.offer || fav.raw?.totalPosters !== undefined));

    // If expectedType is provided, also check type matching
    if (normalizedExpected) {
      if (normalizedExpected === "OFFER_PRODUCT" && !isProduct) {
        return false;
      }
      if (normalizedExpected === "OFFER" && !isOffer) {
        return false;
      }
    }

    // Check candidate IDs based on item type
    const candidateIds = isProduct
      ? [
          fav.item_id,
          fav.itemId,
          fav.productId,
          fav.product_id,
          fav.offerProductId,
          fav.offer_product_id,
          fav.product?.id,
          fav.product?._id,
          fav.product?.productId,
          fav.offerProduct?.id,
          fav.targetId,
          fav.target_id,
          fav.id,
          fav.favoriteId,
          fav.raw?.id,
          fav.raw?.favoriteId,
        ]
      : [
          fav.item_id,
          fav.itemId,
          fav.offerId,
          fav.offer_id,
          fav.offer?.id,
          fav.offer?._id,
          fav.offer?.offerId,
          fav.targetId,
          fav.target_id,
          fav.id,
          fav.favoriteId,
          fav.raw?.id,
          fav.raw?.favoriteId,
        ];

    return candidateIds
      .filter((val) => val !== undefined && val !== null)
      .some((val) => String(val).trim() === strTargetId);
  });
}

export const getFavorites = async (): Promise<FavoriteItem[]> => {
  try {
    const response = await backend.get<any>(ENDPOINTS.FAVORITE.BASE);
    if (!response.success) {
      return [];
    }

    const unwrapped = unwrapApiEnvelope(response.data);
    const rawList = extractFavoritesArray(unwrapped || response.data);
    return rawList.map(normalizeFavoriteItem);
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
    return [];
  }
};

/**
 * Toggles favorite status for an item (product or offer).
 * API Endpoint: POST /api/user/favorites/toggle
 * Payload: { type: "OFFER_PRODUCT" | "OFFER", id: string }
 */
export const toggleFavorite = async (
  itemId: string | number,
  type: FavoriteType
): Promise<ToggleFavoriteResponse> => {
  try {
    const normalizedType = normalizeFavoriteType(type);
    const payload: ToggleFavoritePayload = {
      type: normalizedType,
      id: String(itemId),
    };

    const response = await backend.post<any>(ENDPOINTS.FAVORITE.TOGGLE, payload);
    return response.data ?? response;
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    throw error;
  }
};

export const addFavorite = async (
  itemId: string | number,
  type: FavoriteType
): Promise<any> => {
  return toggleFavorite(itemId, type);
};

export const removeFavorite = async (
  favoriteIdOrItemId: string | number,
  type?: FavoriteType
): Promise<boolean> => {
  try {
    if (type) {
      await toggleFavorite(favoriteIdOrItemId, type);
      return true;
    }
    // Backward compatibility for deletion by favorite ID
    await backend.delete(ENDPOINTS.FAVORITE.DETAILS(favoriteIdOrItemId));
    return true;
  } catch (error) {
    console.error("Failed to remove favorite:", error);
    throw error;
  }
};
