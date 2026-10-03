"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { HeartCrack, Loader2 } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import OfferCard from "@/components/offer/OfferCard";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FavoritesList() {
  const { data: favorites, isLoading, error } = useFavorites();

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

  if (!favorites || favorites.length === 0) {
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

  const offers = favorites.filter((f) => {
    const t = String(f.type || "").toUpperCase();
    return t === 'OFFER' || (!t.includes('PRODUCT') && Boolean(f.offer));
  });
  const products = favorites.filter((f) => {
    const t = String(f.type || "").toUpperCase();
    return t.includes('PRODUCT') || Boolean(f.product);
  });

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
                const offer = favorite.offer || favorite.raw || favorite;
                const offerId = offer.id ?? offer.offerId ?? favorite.item_id;
                const offerTitle = offer.title || offer.offerName || offer.name || "Special Offer";
                const shopName = offer.shop_name || offer.shopName || offer.shop?.business_name || offer.shop?.shop_name || offer.shop?.name;
                const poster = offer.defaultPoster || offer.image || offer.posterSrc || offer.poster_url || offer.posters?.[0]?.posterSrc;
                const shopLogo = offer.logo_url || offer.shopLogo || offer.shop?.logo_url || offer.shop?.logo;
                const totalPosters = offer.totalPosters !== undefined ? Number(offer.totalPosters) : (offer.posters?.length ?? 1);

                return (
                  <div key={favorite.id || offerId}>
                    <OfferCard
                      {...offer}
                      id={offerId}
                      offerId={Number(offerId)}
                      offerName={offerTitle}
                      title={offerTitle}
                      shopName={shopName}
                      shop_name={shopName}
                      image={poster}
                      defaultPoster={poster}
                      shopLogo={shopLogo}
                      logo_url={shopLogo}
                      posters={offer.posters}
                      totalPosters={totalPosters}
                      daysLeft={offer.daysLeft}
                      discount={offer.discount}
                      distanceKm={offer.distanceKm ?? offer.kilometer ?? offer.distance_km ?? offer.distance}
                      isFavorite={true}
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
                const product = favorite.product || favorite.raw || favorite;
                const productId = Number(product.id ?? product.productId ?? favorite.item_id);
                const productName = product.displayName || product.name || product.productName || product.title || "Product";
                const shopName = product.shop_name || product.shopName || product.shop?.business_name || product.shop?.shop_name || product.shop?.name;
                const productImage = product.imageUrl || product.image || product.product_image || product.productImages?.[0] || product.image_url;
                const price = product.offerPrice !== undefined ? Number(product.offerPrice) : (product.price !== undefined ? Number(product.price) : 0);
                const originalPrice = product.originalPrice !== null && product.originalPrice !== undefined ? Number(product.originalPrice) : undefined;
                const savingPercentage = product.savingPercentage !== undefined ? Number(product.savingPercentage) : undefined;

                return (
                  <div key={favorite.id || productId}>
                    <ProductCard
                      {...product}
                      id={productId}
                      name={productName}
                      displayName={productName}
                      shopName={shopName}
                      shop_name={shopName}
                      price={price}
                      offerPrice={price}
                      originalPrice={originalPrice}
                      image={productImage}
                      imageUrl={productImage}
                      category={product.category}
                      rating={product.rating}
                      savingPercentage={savingPercentage}
                      daysLeft={product.daysLeft}
                      distanceKm={product.distanceKm ?? product.kilometer ?? product.distance_km ?? product.distance}
                      isFavorite={true}
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
