import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getMyShops, getShops, getShopDetails, addShop, updateShop } from "@/lib/api/shop";
import { getBranches, addBranch, updateBranch, deleteBranch, getBranchDetails } from "@/lib/api/branch";
import { createOffer, updateOffer, deleteOffer, getAllOffers, getOfferById, getFeaturedShops, getFeaturedOffers, getPaginatedOffers, toggleOfferStatus, BusinessOffersQuery } from "@/lib/api/offers";
import { getAllProducts, createProduct, updateProduct, deleteProduct, getUserProducts, getProductShops } from "@/lib/api/products";
import { getOfferProductById, toggleOfferProductStatus, BusinessOfferProductsQuery } from "@/lib/api/offerproduct";
import { s3Api } from "@/lib/api/s3";
import { getCategories, getSubCategories } from "@/lib/api/categories";
import { getIndustries } from "@/lib/api/industry";
import { getDashboardAnalytics, getOfferViewsAnalytics, getProductViewsAnalytics, ViewsAnalyticsQuery } from "@/lib/api/analytics";
import { getUserOfferSocialLinks } from "@/lib/api/userOffersService";
import type { SocialLinksQuery } from "@/lib/types/socialLinks";
import { cleanupOfferImages, cleanupProductImages } from "@/lib/imageUtils";

// Query Keys
export const queryKeys = {
  // Social Links / Promo Ads keys
  socialLinks: (query?: any) => ["socialLinks", query] as const,
  infiniteSocialLinks: (filters?: any) => ["infiniteSocialLinks", filters] as const,

  // Shop keys
  shops: ["shops"] as const,
  myShops: ["myShops"] as const,
  shopDetails: (id: string) => ["shopDetails", id] as const,
  
  // Branch keys
  branches: (shopId: string) => ["branches", shopId] as const,
  branchDetails: (shopId: string, branchId: string) => ["branchDetails", shopId, branchId] as const,
  
  // Offer keys
  allOffers: (shopId?: string, query?: BusinessOffersQuery) => ["allOffers", shopId, query] as const,
  offerDetails: (id: string) => ["offerDetails", id] as const,
  featuredShops: (latitude?: number | null, longitude?: number | null, industryId?: number | string | null, radius?: number | null) => ["featuredShops", latitude, longitude, industryId, radius] as const,
  featuredOffers: (latitude?: number | null, longitude?: number | null, radius?: number | null) => ["featuredOffers", latitude, longitude, radius] as const,
  paginatedOffers: (page: number, limit: number) => ["paginatedOffers", page, limit] as const,
  infiniteUserOffers: (filters: any) => ["infiniteUserOffers", filters] as const,

  // Product keys
  allProducts: (shopId?: string, query?: BusinessOfferProductsQuery) => ["allProducts", shopId, query] as const,
  productDetails: (id: string) => ["productDetails", id] as const,
  userProductsFiltered: (filters: any) => ["userProductsFiltered", filters] as const,
  productShops: (latitude?: number | null, longitude?: number | null, categoryId?: number | string | null, subcategoryId?: number | string | null, search?: string | null, radius?: number | null) => ["productShops", latitude, longitude, categoryId, subcategoryId, search, radius] as const,
  infiniteUserProducts: (filters: any) => ["infiniteUserProducts", filters] as const,

  // Category keys
  categories: ["categories"] as const,
  subcategories: (categoryId: string | number) => ["subcategories", categoryId] as const,
  industries: ["industries"] as const,
  dashboardAnalytics: (shopId: string) => ["dashboardAnalytics", shopId] as const,
  offerViewsAnalytics: (shopId: string, query?: ViewsAnalyticsQuery) => ["offerViewsAnalytics", shopId, query] as const,
  productViewsAnalytics: (shopId: string, query?: ViewsAnalyticsQuery) => ["productViewsAnalytics", shopId, query] as const,

  // Similar keys
  similarOffers: (offerId: string | number, latitude?: number | null, longitude?: number | null, radius?: number | null) => ["similarOffers", offerId, latitude, longitude, radius] as const,
  similarProducts: (productId: string | number, latitude?: number | null, longitude?: number | null, radius?: number | null) => ["similarProducts", productId, latitude, longitude, radius] as const,
};


// ============ SHOP HOOKS ============

export function useMyShops(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.myShops,
    queryFn: getMyShops,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled ?? true,
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

export function useAllOffers(shopId?: string, query: BusinessOffersQuery = {}) {
  return useQuery({
    queryKey: queryKeys.allOffers(shopId, query),
    queryFn: () => getAllOffers(shopId, query),
    enabled: !!shopId,
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
  radiusOrOptions?: number | null | { enabled?: boolean },
  options: { enabled?: boolean } = {}
) {
  const radius = typeof radiusOrOptions === "object" && radiusOrOptions !== null ? undefined : radiusOrOptions;
  const finalOptions = typeof radiusOrOptions === "object" && radiusOrOptions !== null ? radiusOrOptions : options;
  return useQuery({
    queryKey: queryKeys.featuredShops(latitude, longitude, industryId, radius),
    queryFn: () => getFeaturedShops(latitude, longitude, industryId, radius),
    staleTime: 5 * 60 * 1000,
    ...finalOptions,
  });
}

export function useFeaturedOffers(
  latitude?: number | null,
  longitude?: number | null,
  radiusOrOptions?: number | null | { enabled?: boolean },
  options: { enabled?: boolean } = {}
) {
  const radius = typeof radiusOrOptions === "object" && radiusOrOptions !== null ? undefined : radiusOrOptions;
  const finalOptions = typeof radiusOrOptions === "object" && radiusOrOptions !== null ? radiusOrOptions : options;
  return useQuery({
    queryKey: queryKeys.featuredOffers(latitude, longitude, radius),
    queryFn: () => getFeaturedOffers(latitude, longitude, radius),
    staleTime: 5 * 60 * 1000,
    ...finalOptions,
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
      queryClient.invalidateQueries({ queryKey: ["featuredOffers"] });
      queryClient.invalidateQueries({ queryKey: ["featuredShops"] });
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
      queryClient.invalidateQueries({ queryKey: ["featuredOffers"] });
      queryClient.invalidateQueries({ queryKey: ["featuredShops"] });
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, shopId, offer }: { id: string; shopId?: string; offer?: any }) => deleteOffer(id, shopId),
    onSuccess: (_, { shopId, offer }) => {
      // Invalidate the base query key so it matches all queries with params (e.g. { limit: 50 })
      queryClient.invalidateQueries({ queryKey: ["allOffers", shopId] });
      queryClient.invalidateQueries({ queryKey: ["infiniteUserOffers"] });
      queryClient.invalidateQueries({ queryKey: ["featuredOffers"] });
      queryClient.invalidateQueries({ queryKey: ["featuredShops"] });
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
      await queryClient.cancelQueries({ queryKey: ["allOffers"] });

      const updateOfferList = (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((offer: any) => {
            const currentId = String(offer.offerId || offer.id || offer.batchId);
            if (currentId === String(id)) {
              const nextStatus = (offer.status === 'active' || offer.status === 'ACTIVE') ? 'inactive' : 'active';
              return { ...offer, status: nextStatus, isActive: nextStatus === 'active' };
            }
            return offer;
          });
        }
        if (old.data && Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((offer: any) => {
              const currentId = String(offer.offerId || offer.id || offer.batchId);
              if (currentId === String(id)) {
                const nextStatus = (offer.status === 'active' || offer.status === 'ACTIVE') ? 'inactive' : 'active';
                return { ...offer, status: nextStatus, isActive: nextStatus === 'active' };
              }
              return offer;
            })
          };
        }
        return old;
      };

      queryClient.setQueriesData({ queryKey: ["allOffers"] }, updateOfferList);
    },
    onSettled: (_, __, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: ["allOffers"] });
      queryClient.invalidateQueries({ queryKey: ["infiniteUserOffers"] });
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
      queryClient.invalidateQueries({ queryKey: ["allProducts"] });
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

export function useAllProducts(shopId?: string, query: BusinessOfferProductsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.allProducts(shopId, query),
    queryFn: () => getAllProducts(shopId, query),
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
  radiusOrOptions?: number | null | { enabled?: boolean },
  options: { enabled?: boolean } = {}
) {
  const radius = typeof radiusOrOptions === "object" && radiusOrOptions !== null ? undefined : radiusOrOptions;
  const finalOptions = typeof radiusOrOptions === "object" && radiusOrOptions !== null ? radiusOrOptions : options;
  return useQuery({
    queryKey: queryKeys.productShops(latitude, longitude, categoryId, subcategoryId, search, radius),
    queryFn: () => getProductShops(latitude, longitude, categoryId, subcategoryId, search, radius),
    staleTime: 5 * 60 * 1000,
    ...finalOptions,
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
      await queryClient.cancelQueries({ queryKey: ["allProducts"] });

      const updateProductList = (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((product: any) => {
            if (String(product.id) === String(id)) {
              const nextStatus = (product.status === 'active' || product.status === 'ACTIVE') ? 'inactive' : 'active';
              return { ...product, status: nextStatus, isActive: nextStatus === 'active' };
            }
            return product;
          });
        }
        if (old.data && Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((product: any) => {
              if (String(product.id) === String(id)) {
                const nextStatus = (product.status === 'active' || product.status === 'ACTIVE') ? 'inactive' : 'active';
                return { ...product, status: nextStatus, isActive: nextStatus === 'active' };
              }
              return product;
            })
          };
        }
        return old;
      };

      queryClient.setQueriesData({ queryKey: ["allProducts"] }, updateProductList);
    },
    onSettled: (_, __, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: ["allProducts"] });
      queryClient.invalidateQueries({ queryKey: ["userProductsFiltered"] });
      queryClient.invalidateQueries({ queryKey: ["allOffers"] });
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

export function useDashboardAnalytics(shopId: string) {
  return useQuery({
    queryKey: queryKeys.dashboardAnalytics(shopId),
    queryFn: () => getDashboardAnalytics(shopId),
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOfferViewsAnalytics(shopId: string, query: ViewsAnalyticsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.offerViewsAnalytics(shopId, query),
    queryFn: () => getOfferViewsAnalytics(shopId, query),
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductViewsAnalytics(shopId: string, query: ViewsAnalyticsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.productViewsAnalytics(shopId, query),
    queryFn: () => getProductViewsAnalytics(shopId, query),
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============ SIMILAR ITEMS HOOKS ============

export function useSimilarOffers(
  offerId: string | number,
  latitude?: number | null,
  longitude?: number | null,
  radiusOrOptions?: number | null | { enabled?: boolean },
  options: { enabled?: boolean } = {}
) {
  const radius = typeof radiusOrOptions === "object" && radiusOrOptions !== null ? undefined : radiusOrOptions;
  const finalOptions = typeof radiusOrOptions === "object" && radiusOrOptions !== null ? radiusOrOptions : options;
  return useQuery({
    queryKey: queryKeys.similarOffers(offerId, latitude, longitude, radius),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (latitude !== null && latitude !== undefined) params.set("latitude", String(latitude));
      if (longitude !== null && longitude !== undefined) params.set("longitude", String(longitude));
      if (radius !== null && radius !== undefined && Number(radius) > 0) params.set("radius", String(radius));

      const res = await fetch(`/api/user/offer/${offerId}/similar?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data
          .filter((o: any) => String(o.id) !== String(offerId))
          .slice(0, 5)
          .map((o: any) => ({
            id: Number(o.id) || o.id,
            shopName: o.shopName || "OfferNearU",
            offerName: o.offerName || o.title || "Untitled Offer",
            image: typeof o.image === "string" ? o.image : o.posters?.[0]?.posterSrc || "/images/shop-registration-bg-light.png",
            category: o.category || "Offers",
            location: o.location || "Location unavailable",
            validFrom: o.validFrom || "",
            validTo: o.validTo || "",
            discount: o.discount,
            branchName: o.branchNames?.[0] || o.branchName,
          }));
      }
      return [];
    },
    enabled: !!offerId && (finalOptions.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSimilarProducts(
  productId: string | number,
  latitude?: number | null,
  longitude?: number | null,
  radiusOrOptions?: number | null | { enabled?: boolean },
  options: { enabled?: boolean } = {}
) {
  const radius = typeof radiusOrOptions === "object" && radiusOrOptions !== null ? undefined : radiusOrOptions;
  const finalOptions = typeof radiusOrOptions === "object" && radiusOrOptions !== null ? radiusOrOptions : options;
  return useQuery({
    queryKey: queryKeys.similarProducts(productId, latitude, longitude, radius),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (latitude !== null && latitude !== undefined) params.set("latitude", String(latitude));
      if (longitude !== null && longitude !== undefined) params.set("longitude", String(longitude));
      if (radius !== null && radius !== undefined && Number(radius) > 0) params.set("radius", String(radius));

      const res = await fetch(`/api/user/offer/products/${productId}/similar?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data.slice(0, 5);
      }
      return [];
    },
    enabled: !!productId && (finalOptions.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
}

// ============ SOCIAL LINKS / PROMO ADS HOOKS ============

export function useSocialLinks(query: SocialLinksQuery = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.socialLinks(query),
    queryFn: () => getUserOfferSocialLinks(query),
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInfiniteSocialLinks(
  limit: number = 8,
  filters: Omit<SocialLinksQuery, "page" | "limit"> = {},
  options: { enabled?: boolean } = {}
) {
  return useInfiniteQuery({
    queryKey: queryKeys.infiniteSocialLinks({ limit, ...filters }),
    enabled: options.enabled ?? true,
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getUserOfferSocialLinks({
        page: pageParam as number,
        limit,
        ...filters,
      });
      if (!result.success) throw new Error(result.error || "Failed to load promo ads");
      return result;
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage.hasMore ? (lastPage.page || 1) + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });
}