import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFavorites, addFavorite, removeFavorite, FavoriteItem } from "@/lib/api/favorites";
import { toast } from "sonner";

export const favoriteKeys = {
  all: ["favorites"] as const,
};

export function useFavorites() {
  return useQuery({
    queryKey: favoriteKeys.all,
    queryFn: getFavorites,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, type }: { itemId: string | number; type: 'offer' | 'product' }) => 
      addFavorite(itemId, type),
    onMutate: async ({ itemId, type }) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all });
      
      const previousFavorites = queryClient.getQueryData<FavoriteItem[]>(favoriteKeys.all);
      
      // Optimistically add to list
      if (previousFavorites) {
        const optimisticFavorite: FavoriteItem = {
          id: `temp-${Date.now()}`,
          item_id: itemId,
          type,
        };
        queryClient.setQueryData<FavoriteItem[]>(favoriteKeys.all, [...previousFavorites, optimisticFavorite]);
      }
      
      return { previousFavorites };
    },
    onError: (err, newFavorite, context) => {
      queryClient.setQueryData(favoriteKeys.all, context?.previousFavorites);
      toast.error("Failed to add to favorites. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
    onSuccess: () => {
      toast.success("Added to favorites");
    }
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFavorite,
    onMutate: async (favoriteId) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all });
      
      const previousFavorites = queryClient.getQueryData<FavoriteItem[]>(favoriteKeys.all);
      
      if (previousFavorites) {
        queryClient.setQueryData<FavoriteItem[]>(
          favoriteKeys.all,
          previousFavorites.filter(f => f.id !== favoriteId)
        );
      }
      
      return { previousFavorites };
    },
    onError: (err, favoriteId, context) => {
      queryClient.setQueryData(favoriteKeys.all, context?.previousFavorites);
      toast.error("Failed to remove from favorites. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
    onSuccess: () => {
      toast.success("Removed from favorites");
    }
  });
}
