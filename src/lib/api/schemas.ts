import { z } from "zod";
import { PosterType, OfferStatus } from "../types";

// ============ BASIC SCHEMAS ============

export const MarkedItemSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  name: z.string(),
  description: z.string(),
  productImage: z.string(),
  currency: z.string(),
  oldPrice: z.number(),
  offerPrice: z.number(),
  subcategoryId: z.number().optional(),
  mainCategory: z.string().optional(),
  subcategories: z.array(z.string()).optional(),
});

export const PosterSchema = z.object({
  id: z.string().optional(),
  posterSrc: z.string(),
  type: z.enum([PosterType.JUST_POST, PosterType.MARKED_POSTER, PosterType.UNCLASSIFIED]),
  order: z.number().optional(),
  markedItems: z.array(MarkedItemSchema).optional(),
  title: z.string().optional(),
});

// ============ MODEL SCHEMAS ============

export const ShopSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  shop_name: z.string(),
  logo_url: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string(),
  latitude: z.union([z.number(), z.string()]), // API can be inconsistent
  longitude: z.union([z.number(), z.string()]),
  state: z.string(),
  district: z.string(),
  city: z.string(),
  pincode: z.string(),
  address: z.string(),
  is_active: z.boolean(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const OfferSchema = z.object({
  offerId: z.number().optional(),
  id: z.union([z.number(), z.string()]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(OfferStatus).optional(),
  isActive: z.boolean().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  posters: z.array(PosterSchema).optional(),
  posterSrc: z.string().optional(),
  shopLogo: z.string().nullable().optional(),
  distanceKm: z.number().nullable().optional(),
  daysLeft: z.number().nullable().optional(),
});

export const ProductSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string(),
  shopName: z.string(),
  price: z.number(),
  originalPrice: z.number().optional(),
  image: z.any(),
  category: z.string(),
  rating: z.number(),
});

// ============ WRAPPER SCHEMAS ============

export const ShopListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ShopSchema).optional(),
});

export const OfferListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(OfferSchema).optional(),
});
