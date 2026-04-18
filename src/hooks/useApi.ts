import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyShops, getShops, getShopDetails, addShop, updateShop } from "@/lib/api/shop";
import { getBranches, addBranch, updateBranch, deleteBranch, getBranchDetails } from "@/lib/api/branch";
import { createOffer, updateOffer, deleteOffer, getAllOffers, getOfferById, getFeaturedShops, getFeaturedOffers, getPaginatedOffers, toggleOfferStatus } from "@/lib/api/offers";
import { getAllProducts } from "@/lib/api/products";
import { s3Api } from "@/lib/api/s3";


// Query Keys
export const queryKeys = {
  // Shop keys
  shops: ["shops"] as const,
  myShops: ["myShops"] as const,
  shopDetails: (id: string) => ["shopDetails", id] as const,
  
  // Branch keys
  branches: (shopId: string) => ["branches", shopId] as const,
  branchDetails: (shopId: string, branchId: string) => ["branchDetails", shopId, branchId] as const,
  
  // Offer keys
  offers: ["offers"] as const,
  allOffers: (shopId?: string) => ["allOffers", shopId] as const,
  offerDetails: (id: string) => ["offerDetails", id] as const,
  featuredShops: ["featuredShops"] as const,
  featuredOffers: ["featuredOffers"] as const,
  paginatedOffers: (page: number, limit: number) => ["paginatedOffers", page, limit] as const,

  // Product keys
  products: ["products"] as const,
};


// ============ SHOP HOOKS ============

export function useMyShops() {
  return useQuery({
    queryKey: queryKeys.myShops,
    queryFn: getMyShops,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useShops() {
  return useQuery({
    queryKey: queryKeys.shops,
    queryFn: getShops,
    staleTime: 5 * 60 * 1000,
  });
}

export function useShopDetails(shopId: string) {
  return useQuery({
    queryKey: queryKeys.shopDetails(shopId),
    queryFn: () => getShopDetails(shopId),
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myShops });
      queryClient.invalidateQueries({ queryKey: queryKeys.shops });
    },
  });
}

export function useUpdateShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, data }: { shopId: string; data: any }) => updateShop(shopId, data),
    onSuccess: (_, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myShops });
      queryClient.invalidateQueries({ queryKey: queryKeys.shopDetails(shopId) });
    },
  });
}

// ============ BRANCH HOOKS ============

export function useBranches(shopId: string) {
  return useQuery({
    queryKey: queryKeys.branches(shopId),
    queryFn: () => getBranches(shopId),
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBranchDetails(shopId: string, branchId: string) {
  return useQuery({
    queryKey: queryKeys.branchDetails(shopId, branchId),
    queryFn: () => getBranchDetails(shopId, branchId),
    enabled: !!shopId && !!branchId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, data }: { shopId: string; data: any }) => addBranch(shopId, data),
    onSuccess: (_, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.branches(shopId) });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, branchId, data }: { shopId: string; branchId: string; data: any }) => 
      updateBranch(shopId, branchId, data),
    onSuccess: (_, { shopId, branchId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.branches(shopId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.branchDetails(shopId, branchId) });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, branchId }: { shopId: string; branchId: string }) => 
      deleteBranch(shopId, branchId),
    onSuccess: (_, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.branches(shopId) });
    },
  });
}

// ============ OFFER HOOKS ============

export function useAllOffers(shopId?: string) {
  return useQuery({
    queryKey: queryKeys.allOffers(shopId),
    queryFn: () => getAllOffers(shopId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOfferById(id: string) {
  return useQuery({
    queryKey: queryKeys.offerDetails(id),
    queryFn: () => getOfferById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedShops() {
  return useQuery({
    queryKey: queryKeys.featuredShops,
    queryFn: getFeaturedShops,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedOffers() {
  return useQuery({
    queryKey: queryKeys.featuredOffers,
    queryFn: getFeaturedOffers,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePaginatedOffers(page: number = 1, limit: number = 8) {
  return useQuery({
    queryKey: queryKeys.paginatedOffers(page, limit),
    queryFn: () => getPaginatedOffers(page, limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, shopId }: { payload: any; shopId: string }) => createOffer(payload, shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers });
      queryClient.invalidateQueries({ queryKey: queryKeys.allOffers() });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, shopId }: { id: string; payload: any; shopId: string }) => 
      updateOffer(id, payload, shopId),
    onSuccess: (_, { id, shopId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers });
      queryClient.invalidateQueries({ queryKey: queryKeys.allOffers(shopId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.offerDetails(id) });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, shopId }: { id: string; shopId?: string }) => deleteOffer(id, shopId),
    onSuccess: (_, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers });
      queryClient.invalidateQueries({ queryKey: queryKeys.allOffers(shopId) });
    },
  });
}

export function useToggleOfferStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, shopId }: { id: string; shopId: string }) => toggleOfferStatus(id, shopId),
    onSuccess: (_, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers });
      queryClient.invalidateQueries({ queryKey: queryKeys.allOffers(shopId) });
    },
  });
}

// ============ S3/IMAGE HOOKS ============

export function useUploadImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: s3Api.uploadImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: s3Api.deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });
}

// ============ PRODUCT HOOKS ============

export function useAllProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: getAllProducts,
    staleTime: 5 * 60 * 1000,
  });
}