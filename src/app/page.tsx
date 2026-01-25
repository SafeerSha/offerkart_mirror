import Header from "@/components/layout/Header";
import FeaturedCarousel from "@/components/home/FeaturedCarousel";
import FeaturedOffers from "@/components/home/FeaturedOffers";
import FilterPanel from "@/components/home/FilterPanel";
import OfferGrid from "@/components/home/OfferGrid";
import { getFeaturedShops, getFeaturedOffers, getAllOffers } from "@/lib/api/offers";

// ISR: Revalidate every 5 minutes
export const revalidate = 300;

export default async function HomePage() {
  const [featuredShops, featuredOffers, allOffers] = await Promise.all([
    getFeaturedShops(),
    getFeaturedOffers(),
    getAllOffers(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Spacer for Fixed Header */}
      <div className="h-32 lg:h-24" />

      {/* Featured Shops Carousel */}
      <FeaturedCarousel shops={featuredShops} />

      {/* Featured Offers */}
      <FeaturedOffers offers={featuredOffers} />

      {/* Filter & Sorting Panel */}
      <FilterPanel />

      {/* Main Offer Grid */}
      <OfferGrid offers={allOffers} />

      {/* App Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose OfferKart?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover the best local deals and offers in your area with our comprehensive platform.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏪</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Shops</h3>
              <p className="text-muted-foreground">
                Find offers from trusted local businesses in your neighborhood.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Deals</h3>
              <p className="text-muted-foreground">
                Get access to exclusive coupons and discounts on various products.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Location Based</h3>
              <p className="text-muted-foreground">
                Easily find offers near you with our location-based search.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
