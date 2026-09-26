"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { HeartCrack, Loader2 } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import OfferCard from "@/components/offer/OfferCard";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FavoritesList() {
  const { data: favorites, isLoading, error } = useFavorites();
  const { t } = useTranslation("common");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="mt-4 text-slate-500 dark:text-slate-400">Loading your favorites...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500">Failed to load favorites. Please try again later.</p>
      </div>
    );
  }

  const mockFavorites: any[] = [
    {
      id: "m1",
      item_id: "o1",
      type: "offer",
      offer: {
        id: "o1",
        offerName: "50% Off Summer Sale",
        shopName: "Fashion Hub",
        image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=400&q=80",
        discount: "50% OFF",
        daysLeft: 5
      }
    },
    {
      id: "m2",
      item_id: "o2",
      type: "offer",
      offer: {
        id: "o2",
        offerName: "Buy 1 Get 1 Free",
        shopName: "Electro World",
        image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400&q=80",
        discount: "BOGO",
        daysLeft: 2
      }
    },
    {
      id: "m3",
      item_id: "p1",
      type: "product",
      product: {
        id: "p1",
        name: "Wireless Noise Cancelling Headphones",
        price: 2999,
        originalPrice: 4999,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
        shopName: "Audio Plus",
        rating: 4.8,
        category: "Electronics"
      }
    },
    {
      id: "m4",
      item_id: "p2",
      type: "product",
      product: {
        id: "p2",
        name: "Smart Fitness Watch",
        price: 1499,
        originalPrice: 2499,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
        shopName: "Tech Wear",
        rating: 4.5,
        category: "Electronics"
      }
    }
  ];

  // Use mock data if the API is empty so the user can preview the layout
  const displayFavorites = (favorites && favorites.length > 0) ? favorites : mockFavorites;

  if (!displayFavorites || displayFavorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <HeartCrack className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">No favorites yet</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
          Save your favorite offers and products to keep track of the best deals and find them easily later.
        </p>
        <Link 
          href="/"
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-full transition-colors shadow-lg shadow-orange-500/30"
        >
          Explore Now
        </Link>
      </div>
    );
  }

  const offers = displayFavorites.filter(f => f.type === 'offer');
  const products = displayFavorites.filter(f => f.type === 'product');

  return (
    <div className="space-y-6">
      <Tabs defaultValue={offers.length > 0 ? "offers" : "products"} className="w-full">
        <div className="flex justify-center w-full mb-8">
          <TabsList className="h-auto p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl inline-flex w-full sm:w-auto justify-start sm:justify-center overflow-hidden">
            <TabsTrigger value="offers" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-orange-500 data-[state=active]:shadow-sm">
              <span className="flex items-center gap-2 font-semibold">
                Offers
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs py-0.5 px-2 rounded-full">
                  {offers.length}
                </span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-orange-500 data-[state=active]:shadow-sm">
              <span className="flex items-center gap-2 font-semibold">
                Products
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs py-0.5 px-2 rounded-full">
                  {products.length}
                </span>
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="offers" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          {offers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {offers.map((favorite) => {
                const offer = favorite.offer || { id: favorite.item_id, offerName: "Unknown Offer" };
                return (
                  <div key={favorite.id}>
                    <OfferCard
                      id={offer.id}
                      offerId={offer.id}
                      offerName={offer.offerName || offer.title}
                      shopName={offer.shop?.business_name || offer.shopName}
                      image={offer.image || offer.posterSrc}
                      posters={offer.posters}
                      totalPosters={offer.totalPosters}
                      daysLeft={offer.daysLeft}
                      discount={offer.discount}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800">
              <HeartCrack className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No favorite offers yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">Save your favorite offers to easily find them here.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {products.map((favorite) => {
                const product = favorite.product || { id: favorite.item_id, name: "Unknown Product", price: 0 };
                return (
                  <div key={favorite.id}>
                    <ProductCard
                      id={product.id}
                      name={product.name || product.productName}
                      shopName={product.shop?.business_name || product.shopName}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      image={product.image || product.productImages?.[0]}
                      category={product.category || "General"}
                      rating={product.rating}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800">
              <HeartCrack className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No favorite products yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">Save your favorite products to easily find them here.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
