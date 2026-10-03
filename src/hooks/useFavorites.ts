import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFavorites,
  toggleFavorite,
  removeFavorite,
  FavoriteItem,
  FavoriteType,
  normalizeFavoriteType,
  isItemInFavorites,
} from "@/lib/api/favorites";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CACHE_TAGS } from "@/lib/api/cache-tags";

export const favoriteKeys = {
  all: ["favorites"] as const,
};

export function useFavorites() {
  const { status } = useSession();

  return useQuery({
    queryKey: favoriteKeys.all,
    queryFn: getFavorites,
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, type }: { itemId: string | number; type: FavoriteType }) =>
      toggleFavorite(itemId, type),
    onMutate: async ({ itemId, type }) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all });

      const previousFavorites = queryClient.getQueryData<FavoriteItem[]>(favoriteKeys.all) ?? [];
      const normalizedType = normalizeFavoriteType(type);
      const strId = String(itemId);

      const exists = isItemInFavorites(previousFavorites, strId, normalizedType);

      if (exists) {
        queryClient.setQueryData<FavoriteItem[]>(
          favoriteKeys.all,
          previousFavorites.filter((f) => !isItemInFavorites([f], strId, normalizedType))
        );
      } else {
        const optimisticFavorite: FavoriteItem = {
          id: `temp-${Date.now()}`,
          item_id: strId,
          type: normalizedType,
        };
        queryClient.setQueryData<FavoriteItem[]>(favoriteKeys.all, [
          ...previousFavorites,
          optimisticFavorite,
        ]);
      }

      // Optimistically update product queries cache
      const updateProductListCache = (oldData: any) => {
        if (!oldData) return oldData;
        if (Array.isArray(oldData)) {
          return oldData.map((item: any) => {
            if (String(item.id ?? item.productId) === strId) {
              return { ...item, isFavourite: !exists, isFavorite: !exists };
            }
            return item;
          });
        }
        if (oldData.data && Array.isArray(oldData.data)) {
          return {
            ...oldData,
            data: oldData.data.map((item: any) => {
              if (String(item.id ?? item.productId) === strId) {
                return { ...item, isFavourite: !exists, isFavorite: !exists };
              }
              return item;
            }),
          };
        }
        return oldData;
      };

      queryClient.setQueriesData({ queryKey: ["userProductsFiltered"] }, updateProductListCache);
      queryClient.setQueriesData({ queryKey: ["infiniteUserProducts"] }, (oldInfinite: any) => {
        if (!oldInfinite || !Array.isArray(oldInfinite.pages)) return oldInfinite;
        return {
          ...oldInfinite,
          pages: oldInfinite.pages.map((page: any) => updateProductListCache(page)),
        };
      });

      return { previousFavorites, wasFavorited: exists };
    },
    onError: (err, variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoriteKeys.all, context.previousFavorites);
      }
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
      queryClient.invalidateQueries({ queryKey: ["infiniteUserProducts"] });
      toast.error("Failed to update favorite. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
      queryClient.invalidateQueries({ queryKey: ["infiniteUserProducts"] });
      queryClient.invalidateQueries({ queryKey: ["allProducts"] });
      queryClient.invalidateQueries({ queryKey: ["infiniteUserOffers"] });
      queryClient.invalidateQueries({ queryKey: ["featuredOffers"] });
      queryClient.invalidateQueries({ queryKey: ["allOffers"] });
      queryClient.invalidateQueries({ queryKey: ["paginatedOffers"] });
      queryClient.invalidateQueries({ queryKey: [CACHE_TAGS.OFFERS] });
      queryClient.invalidateQueries({ queryKey: [CACHE_TAGS.PRODUCTS] });
    },
    onSuccess: (data, variables, context) => {
      if (context?.wasFavorited) {
        toast.success("Removed from favorites");
      } else {
        toast.success("Added to favorites");
      }
    },
  });
}

export function useAddFavorite() {
  return useToggleFavorite();
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (favoriteIdOrItemId: string | number) => removeFavorite(favoriteIdOrItemId),
    onMutate: async (favoriteId) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all });
      const previousFavorites = queryClient.getQueryData<FavoriteItem[]>(favoriteKeys.all) ?? [];
      const strId = String(favoriteId);

      queryClient.setQueryData<FavoriteItem[]>(
        favoriteKeys.all,
        previousFavorites.filter((f) => !isItemInFavorites([f], strId))
      );

      return { previousFavorites };
    },
    onError: (err, favoriteId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(favoriteKeys.all, context.previousFavorites);
      }
      toast.error("Failed to remove from favorites. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
      queryClient.invalidateQueries({ queryKey: ["infiniteUserProducts"] });
      queryClient.invalidateQueries({ queryKey: [CACHE_TAGS.OFFERS] });
      queryClient.invalidateQueries({ queryKey: [CACHE_TAGS.PRODUCTS] });
    },
    onSuccess: () => {
      toast.success("Removed from favorites");
    },
  });
}
