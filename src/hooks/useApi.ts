import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getMyShops, getShops, getShopDetails, addShop, updateShop } from "@/lib/api/shop";
import { getBranches, addBranch, updateBranch, deleteBranch, getBranchDetails } from "@/lib/api/branch";
import { createOffer, updateOffer, deleteOffer, getAllOffers, getOfferById, getFeaturedShops, getFeaturedOffers, getPaginatedOffers, toggleOfferStatus } from "@/lib/api/offers";
import { getAllProducts, createProduct, updateProduct, deleteProduct, getUserProducts } from "@/lib/api/products";
import { getOfferProductById, toggleOfferProductStatus } from "@/lib/api/offerproduct";
import { s3Api } from "@/lib/api/s3";
import { getCategories, getSubCategories } from "@/lib/api/categories";
import { getIndustries } from "@/lib/api/industry";
import { cleanupOfferImages, cleanupProductImages } from "@/lib/imageUtils";


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
  allOffers: (shopId?: string) => ["allOffers", shopId] as const,
  offerDetails: (id: string) => ["offerDetails", id] as const,
  featuredShops: ["featuredShops"] as const,
  featuredOffers: ["featuredOffers"] as const,
  paginatedOffers: (page: number, limit: number) => ["paginatedOffers", page, limit] as const,
  infiniteUserOffers: (filters: any) => ["infiniteUserOffers", filters] as const,

  // Product keys
  allProducts: (shopId?: string) => ["allProducts", shopId] as const,
  productDetails: (id: string) => ["productDetails", id] as const,
  userProductsFiltered: (filters: any) => ["userProductsFiltered", filters] as const,

  // Category keys
  categories: ["categories"] as const,
  subcategories: (categoryId: string | number) => ["subcategories", categoryId] as const,
  industries: ["industries"] as const,
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
  return useQuery<{ success: boolean; data: any[] }>({
    queryKey: queryKeys.featuredOffers,
    queryFn: () => getFeaturedOffers(),
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

export function useInfiniteUserOffers(limit: number = 8, filters: any = {}, options: { enabled?: boolean } = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.infiniteUserOffers(filters),
    enabled: options.enabled ?? true,
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getPaginatedOffers(pageParam as number, limit, filters);
      if (!result.success) throw new Error(result.error || "Failed to load offers");
      return result;
    },
    getNextPageParam: (lastPage: any, pages) => {
      return lastPage.hasMore ? (lastPage.page || pages.length) + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, shopId }: { payload: any; shopId: string }) => createOffer(payload, shopId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allOffers(variables?.shopId) });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, shopId }: { id: string; payload: any; shopId: string }) => 
      updateOffer(id, payload, shopId),
    onSuccess: (_, { id, shopId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allOffers(shopId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.offerDetails(id) });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, shopId, offer }: { id: string; shopId?: string; offer?: any }) => deleteOffer(id, shopId),
    onSuccess: (_, { shopId, offer }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allOffers(shopId) });
      if (offer) {
        cleanupOfferImages(offer).catch(err => console.error("Failed to cleanup offer images:", err));
      }
    },
  });
}

export function useToggleOfferStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, shopId }: { id: string; shopId: string }) => toggleOfferStatus(id, shopId),
    onMutate: async ({ id, shopId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.allOffers(shopId) });

      // Snapshot the previous value
      const previousOffers = queryClient.getQueryData(queryKeys.allOffers(shopId));

      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.allOffers(shopId), (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((offer: any) => {
          const currentId = String(offer.offerId || offer.id || offer.batchId);
          return currentId === String(id) 
            ? { ...offer, status: offer.status === 'active' ? 'inactive' : 'active' } 
            : offer;
        });
      });

      return { previousOffers };
    },
    onError: (err, { shopId }, context: any) => {
      // If failed, roll back
      if (context?.previousOffers) {
        queryClient.setQueryData(queryKeys.allOffers(shopId), context.previousOffers);
      }
    },
    onSettled: (_, __, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allOffers(shopId) });
    },
  });
}

// ============ S3/IMAGE HOOKS ============

export function useUploadImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, folder }: { file: File; folder?: string }) => s3Api.uploadImage(file, folder),
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

export function useAllProducts(shopId?: string) {
  return useQuery({
    queryKey: queryKeys.allProducts(shopId),
    queryFn: () => getAllProducts(shopId),
    enabled: !!shopId && shopId !== "all" && shopId !== "undefined" && shopId !== "null",
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductDetails(id: string) {
  return useQuery({
    queryKey: queryKeys.productDetails(id),
    queryFn: () => getOfferProductById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserProductsFiltered(filters: any, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.userProductsFiltered(filters),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const res = await getUserProducts(filters);
      if (res && res.success && res.data && res.data.data) {
        return res.data.data;
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, shopId }: { payload: any; shopId?: string }) => createProduct(payload, shopId),
    onSuccess: (_, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allProducts(shopId) });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, shopId }: { id: string; payload: any; shopId?: string }) => updateProduct(id, payload, shopId),
    onSuccess: (_, { id, shopId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allProducts(shopId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.productDetails(id) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, shopId, product }: { id: string; shopId?: string; product?: any }) => deleteProduct(id),
    onSuccess: (_, { shopId, product }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allProducts(shopId) });
      if (product) {
        cleanupProductImages(product).catch(err => console.error("Failed to cleanup product images:", err));
      }
    },
  });
}

export function useToggleOfferProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, shopId }: { id: string; shopId?: string }) => toggleOfferProductStatus(id),
    onMutate: async ({ id, shopId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.allProducts(shopId) });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData(queryKeys.allProducts(shopId));

      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.allProducts(shopId), (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((product: any) => 
          String(product.id) === String(id) 
            ? { ...product, status: product.status === 'active' ? 'inactive' : 'active' } 
            : product
        );
      });

      return { previousProducts };
    },
    onError: (err, { shopId }, context: any) => {
      // If failed, roll back to previous state
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.allProducts(shopId), context.previousProducts);
      }
    },
    onSettled: (_, __, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allProducts(shopId) });
    },
  });
}

// ============ CATEGORY HOOKS ============

export function useCategories(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: getCategories,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,    // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled,
  });
}

export function useSubcategories(categoryId: string | number | null) {
  return useQuery({
    queryKey: categoryId ? queryKeys.subcategories(categoryId) : ["subcategories", "none"],
    queryFn: () => getSubCategories(categoryId!),
    enabled: !!categoryId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,    // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useIndustries(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.industries,
    queryFn: getIndustries,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,    // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled,
  });
}