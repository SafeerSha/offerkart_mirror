"use client";

import React, { useState, useMemo } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { useQueryClient } from "@tanstack/react-query";
import { favoriteKeys } from "@/hooks/useFavorites";
import { 
  AlertCircle, 
  RotateCw, 
  Ticket, 
  ShoppingBag 
} from "lucide-react";
import { FavoriteItem } from "@/lib/api/favorites";
import ProductCard from "@/components/products/ProductCard";
import OfferCard from "@/components/offer/OfferCard";
import FavoritesHeader from "./FavoritesHeader";
import FavoritesToolbar, { FavoritesTabType, SortOptionType } from "./FavoritesToolbar";
import FavoritesEmptyState from "./FavoritesEmptyState";
import FavoritesSkeleton from "./FavoritesSkeleton";
import { cn } from "@/lib/utils";

export default function FavoritesList() {
  const queryClient = useQueryClient();
  const { data: favorites, isLoading, error, refetch, isRefetching } = useFavorites();

  const [activeTab, setActiveTab] = useState<FavoritesTabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [sortBy, setSortBy] = useState<SortOptionType>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");

  // Raw separated lists
  const rawOffers = useMemo(() => {
    if (!favorites || !Array.isArray(favorites)) return [];
    return favorites.filter((f) => {
      const t = String(f.type || "").toUpperCase();
      return t === "OFFER" || (!t.includes("PRODUCT") && Boolean(f.offer));
    });
  }, [favorites]);

  const rawProducts = useMemo(() => {
    if (!favorites || !Array.isArray(favorites)) return [];
    return favorites.filter((f) => {
      const t = String(f.type || "").toUpperCase();
      return t.includes("PRODUCT") || Boolean(f.product);
    });
  }, [favorites]);

  // Extract all distinct store names
  const availableStores = useMemo(() => {
    const storeSet = new Set<string>();

    rawOffers.forEach((fav) => {
      const o = fav.offer || fav.raw || fav;
      const s = o.shop_name || o.shopName || o.shop?.business_name || o.shop?.shop_name || o.shop?.name;
      if (s && typeof s === "string" && s.trim()) {
        storeSet.add(s.trim());
      }
    });

    rawProducts.forEach((fav) => {
      const p = fav.product || fav.raw || fav;
      const s = p.shop_name || p.shopName || p.shop?.business_name || p.shop?.shop_name || p.shop?.name;
      if (s && typeof s === "string" && s.trim()) {
        storeSet.add(s.trim());
      }
    });

    return Array.from(storeSet).sort();
  }, [rawOffers, rawProducts]);

  // Normalized Offer item parser
  const normalizeOffer = (favorite: FavoriteItem) => {
    const offer = favorite.offer || favorite.raw || favorite;
    const offerId = offer.id ?? offer.offerId ?? favorite.item_id;
    const title = offer.title || offer.offerName || offer.name || "Special Offer";
    const shopName = offer.shop_name || offer.shopName || offer.shop?.business_name || offer.shop?.shop_name || offer.shop?.name || "Local Store";
    const poster = offer.defaultPoster || offer.image || offer.posterSrc || offer.poster_url || offer.posters?.[0]?.posterSrc;
    const shopLogo = offer.logo_url || offer.shopLogo || offer.shop?.logo_url || offer.shop?.logo;
    const totalPosters = offer.totalPosters !== undefined ? Number(offer.totalPosters) : (offer.posters?.length ?? 1);
    const daysLeft = offer.daysLeft !== undefined && offer.daysLeft !== null ? Number(offer.daysLeft) : null;
    const discount = offer.discount;
    const distanceKm = offer.distanceKm ?? offer.kilometer ?? offer.distance_km ?? offer.distance;
    const category = offer.category || "";

    return {
      rawFavorite: favorite,
      offer,
      offerId,
      title,
      shopName,
      poster,
      shopLogo,
      totalPosters,
      daysLeft,
      discount,
      distanceKm,
      category,
    };
  };

  // Normalized Product item parser
  const normalizeProduct = (favorite: FavoriteItem) => {
    const product = favorite.product || favorite.raw || favorite;
    const productId = Number(product.id ?? product.productId ?? favorite.item_id);
    const name = product.displayName || product.name || product.productName || product.title || "Product";
    const shopName = product.shop_name || product.shopName || product.shop?.business_name || product.shop?.shop_name || product.shop?.name || "Local Store";
    const image = product.imageUrl || product.image || product.product_image || product.productImages?.[0] || product.image_url;
    const price = product.offerPrice !== undefined ? Number(product.offerPrice) : (product.price !== undefined ? Number(product.price) : 0);
    const originalPrice = product.originalPrice !== null && product.originalPrice !== undefined ? Number(product.originalPrice) : undefined;
    const savingPercentage = product.savingPercentage !== undefined ? Number(product.savingPercentage) : undefined;
    const daysLeft = product.daysLeft !== undefined && product.daysLeft !== null ? Number(product.daysLeft) : null;
    const distanceKm = product.distanceKm ?? product.kilometer ?? product.distance_km ?? product.distance;
    const rating = product.rating;
    const category = product.category || "";

    return {
      rawFavorite: favorite,
      product,
      productId,
      name,
      shopName,
      image,
      price,
      originalPrice,
      savingPercentage,
      daysLeft,
      distanceKm,
      rating,
      category,
    };
  };

  // Filtered & Sorted Offers
  const filteredOffers = useMemo(() => {
    let list = rawOffers.map(normalizeOffer);

    // Filter by query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.shopName.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // Filter by store
    if (selectedStore !== "all") {
      list = list.filter((item) => item.shopName.toLowerCase() === selectedStore.toLowerCase());
    }

    // Sort
    if (sortBy === "expiring") {
      list.sort((a, b) => {
        if (a.daysLeft === null) return 1;
        if (b.daysLeft === null) return -1;
        return a.daysLeft - b.daysLeft;
      });
    }

    return list;
  }, [rawOffers, searchQuery, selectedStore, sortBy]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let list = rawProducts.map(normalizeProduct);

    // Filter by query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.shopName.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // Filter by store
    if (selectedStore !== "all") {
      list = list.filter((item) => item.shopName.toLowerCase() === selectedStore.toLowerCase());
    }

    // Sort
    if (sortBy === "price_asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "savings") {
      list.sort((a, b) => (b.savingPercentage ?? 0) - (a.savingPercentage ?? 0));
    } else if (sortBy === "expiring") {
      list.sort((a, b) => {
        if (a.daysLeft === null) return 1;
        if (b.daysLeft === null) return -1;
        return a.daysLeft - b.daysLeft;
      });
    }

    return list;
  }, [rawProducts, searchQuery, selectedStore, sortBy]);

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedStore !== "all" || sortBy !== "recent");

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedStore("all");
    setSortBy("recent");
  };

  // Loading State
  if (isLoading) {
    return <FavoritesSkeleton />;
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl bg-card border border-destructive/20 shadow-xs max-w-xl mx-auto my-8 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          Unable to load favorites
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
          We encountered an issue fetching your saved items. Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
            refetch();
          }}
          disabled={isRefetching}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <RotateCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
          <span>{isRefetching ? "Refreshing..." : "Try Again"}</span>
        </button>
      </div>
    );
  }

  // Global Empty State (Zero Favorites)
  if (!favorites || favorites.length === 0) {
    return (
      <>
        <FavoritesHeader
          totalCount={0}
          offersCount={0}
          productsCount={0}
          storesCount={0}
        />
        <FavoritesEmptyState type="global" />
      </>
    );
  }

  const gridClass =
    viewMode === "grid"
      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto";

  const totalFilteredCount =
    activeTab === "all"
      ? filteredOffers.length + filteredProducts.length
      : activeTab === "offers"
      ? filteredOffers.length
      : filteredProducts.length;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <FavoritesHeader
        totalCount={favorites.length}
        offersCount={rawOffers.length}
        productsCount={rawProducts.length}
        storesCount={availableStores.length}
      />

      {/* Toolbar: Tabs, Search, Filter, Sort, View Toggle */}
      <FavoritesToolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalCount={favorites.length}
        offersCount={rawOffers.length}
        productsCount={rawProducts.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStore={selectedStore}
        onStoreChange={setSelectedStore}
        availableStores={availableStores}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Content Rendering */}
      {totalFilteredCount === 0 ? (
        <FavoritesEmptyState
          type="filtered"
          searchQuery={searchQuery}
          selectedStore={selectedStore}
          onResetFilters={handleClearFilters}
        />
      ) : (
        <div className="space-y-10 animate-fade-in">
          {/* ALL ITEMS TAB */}
          {activeTab === "all" && (
            <>
              {/* Offers Section */}
              {filteredOffers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground font-sans">
                        Offers & Flyers
                      </h2>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {filteredOffers.length}
                      </span>
                    </div>
                  </div>

                  <div className={gridClass}>
                    {filteredOffers.map((item) => (
                      <div key={item.rawFavorite.id || item.offerId} className="h-full">
                        <OfferCard
                          {...item.offer}
                          id={item.offerId}
                          offerId={Number(item.offerId)}
                          offerName={item.title}
                          title={item.title}
                          shopName={item.shopName}
                          shop_name={item.shopName}
                          image={item.poster}
                          defaultPoster={item.poster}
                          shopLogo={item.shopLogo}
                          logo_url={item.shopLogo}
                          posters={item.offer?.posters}
                          totalPosters={item.totalPosters}
                          daysLeft={item.daysLeft}
                          discount={item.discount}
                          distanceKm={item.distanceKm}
                          isFavorite={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Section */}
              {filteredProducts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground font-sans">
                        Saved Products
                      </h2>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                        {filteredProducts.length}
                      </span>
                    </div>
                  </div>

                  <div className={gridClass}>
                    {filteredProducts.map((item) => (
                      <div key={item.rawFavorite.id || item.productId} className="h-full">
                        <ProductCard
                          {...item.product}
                          id={item.productId}
                          name={item.name}
                          displayName={item.name}
                          shopName={item.shopName}
                          shop_name={item.shopName}
                          price={item.price}
                          offerPrice={item.price}
                          originalPrice={item.originalPrice}
                          image={item.image}
                          imageUrl={item.image}
                          category={item.category}
                          rating={item.rating}
                          savingPercentage={item.savingPercentage}
                          daysLeft={item.daysLeft}
                          distanceKm={item.distanceKm}
                          isFavorite={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* OFFERS TAB ONLY */}
          {activeTab === "offers" && (
            <div className={gridClass}>
              {filteredOffers.map((item) => (
                <div key={item.rawFavorite.id || item.offerId} className="h-full">
                  <OfferCard
                    {...item.offer}
                    id={item.offerId}
                    offerId={Number(item.offerId)}
                    offerName={item.title}
                    title={item.title}
                    shopName={item.shopName}
                    shop_name={item.shopName}
                    image={item.poster}
                    defaultPoster={item.poster}
                    shopLogo={item.shopLogo}
                    logo_url={item.shopLogo}
                    posters={item.offer?.posters}
                    totalPosters={item.totalPosters}
                    daysLeft={item.daysLeft}
                    discount={item.discount}
                    distanceKm={item.distanceKm}
                    isFavorite={true}
                  />
                </div>
              ))}
            </div>
          )}

          {/* PRODUCTS TAB ONLY */}
          {activeTab === "products" && (
            <div className={gridClass}>
              {filteredProducts.map((item) => (
                <div key={item.rawFavorite.id || item.productId} className="h-full">
                  <ProductCard
                    {...item.product}
                    id={item.productId}
                    name={item.name}
                    displayName={item.name}
                    shopName={item.shopName}
                    shop_name={item.shopName}
                    price={item.price}
                    offerPrice={item.price}
                    originalPrice={item.originalPrice}
                    image={item.image}
                    imageUrl={item.image}
                    category={item.category}
                    rating={item.rating}
                    savingPercentage={item.savingPercentage}
                    daysLeft={item.daysLeft}
                    distanceKm={item.distanceKm}
                    isFavorite={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
