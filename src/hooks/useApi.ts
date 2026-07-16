import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getMyShops, getShops, getShopDetails, addShop, updateShop } from "@/lib/api/shop";
import { getBranches, addBranch, updateBranch, deleteBranch, getBranchDetails } from "@/lib/api/branch";
import { createOffer, updateOffer, deleteOffer, getAllOffers, getOfferById, getFeaturedShops, getFeaturedOffers, getPaginatedOffers, toggleOfferStatus } from "@/lib/api/offers";
import { getAllProducts, createProduct, updateProduct, deleteProduct, getUserProducts, getProductShops } from "@/lib/api/products";
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
  featuredShops: (latitude?: number | null, longitude?: number | null, industryId?: number | string | null) => ["featuredShops", latitude, longitude, industryId] as const,
  featuredOffers: (latitude?: number | null, longitude?: number | null) => ["featuredOffers", latitude, longitude] as const,
  paginatedOffers: (page: number, limit: number) => ["paginatedOffers", page, limit] as const,
  infiniteUserOffers: (filters: any) => ["infiniteUserOffers", filters] as const,

  // Product keys
  allProducts: (shopId?: string) => ["allProducts", shopId] as const,
  productDetails: (id: string) => ["productDetails", id] as const,
  userProductsFiltered: (filters: any) => ["userProductsFiltered", filters] as const,
  productShops: (latitude?: number | null, longitude?: number | null, categoryId?: number | string | null, subcategoryId?: number | string | null, search?: string | null) => ["productShops", latitude, longitude, categoryId, subcategoryId, search] as const,
  infiniteUserProducts: (filters: any) => ["infiniteUserProducts", filters] as const,

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

export function useFeaturedShops(
  latitude?: number | null,
  longitude?: number | null,
  industryId?: number | string | null,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.featuredShops(latitude, longitude, industryId),
    queryFn: () => getFeaturedShops(latitude, longitude, industryId),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useFeaturedOffers(
  latitude?: number | null,
  longitude?: number | null,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.featuredOffers(latitude, longitude),
    queryFn: () => getFeaturedOffers(latitude, longitude),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function usePaginatedOffers(page: number = 1, limit: number = 8) {
  return useQuery({
    queryKey: queryKeys.paginatedOffers(page, limit),
    queryFn: () => getPaginatedOffers(page, limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInfiniteUserOffers(limit: number = 8, filters: any = {}, options: { enabled?: boolean; initialData?: any } = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.infiniteUserOffers(filters),
    enabled: options.enabled ?? true,
    initialData: options.initialData,
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
      // Keep the public, on-demand-ISR offers list fresh without a manual refresh
      queryClient.invalidateQueries({ queryKey: ["infiniteUserOffers"] });
      // An offer's validity gates its products' visibility, so refresh the products list too
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
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
      queryClient.invalidateQueries({ queryKey: ["infiniteUserOffers"] });
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, shopId, offer }: { id: string; shopId?: string; offer?: any }) => deleteOffer(id, shopId),
    onSuccess: (_, { shopId, offer }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allOffers(shopId) });
      queryClient.invalidateQueries({ queryKey: ["infiniteUserOffers"] });
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
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
      queryClient.invalidateQueries({ queryKey: ["infiniteUserOffers"] });
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
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

export function useUserProductsFiltered(filters: any, options: { enabled?: boolean; initialData?: any } = {}) {
  return useQuery({
    queryKey: queryKeys.userProductsFiltered(filters),
    enabled: options.enabled ?? true,
    initialData: options.initialData,
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

export function useInfiniteUserProducts(limit: number = 12, filters: any = {}, options: { enabled?: boolean; initialData?: any } = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.infiniteUserProducts(filters),
    enabled: options.enabled ?? true,
    initialData: options.initialData,
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getUserProducts({ ...filters, page: pageParam as number, limit });
      if (!result.success) throw new Error(result.error || "Failed to load products");
      return result.data;
    },
    getNextPageParam: (lastPage: any) => {
      const pag = lastPage.pagination;
      if (!pag) return undefined;
      return pag.page < pag.totalPages ? pag.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductShops(
  latitude?: number | null,
  longitude?: number | null,
  categoryId?: number | string | null,
  subcategoryId?: number | string | null,
  search?: string | null,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.productShops(latitude, longitude, categoryId, subcategoryId, search),
    queryFn: () => getProductShops(latitude, longitude, categoryId, subcategoryId, search),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, shopId }: { payload: any; shopId?: string }) => createProduct(payload, shopId),
    onSuccess: (_, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allProducts(shopId) });
      // Keep the public, on-demand-ISR products list fresh without a manual refresh
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
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
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, shopId, product }: { id: string; shopId?: string; product?: any }) => deleteProduct(id),
    onSuccess: (_, { shopId, product }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allProducts(shopId) });
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
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
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
    },
  });
}

// ============ CATEGORY HOOKS ============

export function useCategories(enabled: boolean = true, initialData?: any) {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: getCategories,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week
    gcTime: 7 * 24 * 60 * 60 * 1000,    // 1 week
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled,
    initialData,
  });
}

export function useSubcategories(categoryId: string | number | null) {
  return useQuery({
    queryKey: categoryId ? queryKeys.subcategories(categoryId) : ["subcategories", "none"],
    queryFn: () => getSubCategories(categoryId!),
    enabled: !!categoryId,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week
    gcTime: 7 * 24 * 60 * 60 * 1000,    // 1 week
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useIndustries(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.industries,
    queryFn: getIndustries,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week
    gcTime: 7 * 24 * 60 * 60 * 1000,    // 1 week
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled,
  });
}