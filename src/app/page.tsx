import FeaturedCarousel from "@/components/home/FeaturedCarousel";
import FeaturedOffers from "@/components/home/FeaturedOffers";
import FilterPanel from "@/components/home/FilterPanel";
import OfferGrid from "@/components/home/OfferGrid";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import ShopRegistrationSection from "@/components/home/ShopRegistrationSection";
import { getFeaturedShops, getFeaturedOffers, getPaginatedOffers } from "@/lib/api/offers";
import { getAllProducts } from "@/lib/api/products";
import { CACHE_TAGS } from "@/lib/api/cache-tags";
import { Store, Ticket, MapPin, Award } from "lucide-react";
import { Heading, Subheading, Text } from "@/components/shared/Typography";
import { cn } from "@/lib/utils";
import { getTranslations } from "@/lib/i18n/server";

export const revalidate = false;

export default async function HomePage() {
  const [featuredShopsRes, featuredOffersRes, allOffersRes, allProducts] = await Promise.all([
    getFeaturedShops(),
    getFeaturedOffers(),
    getPaginatedOffers(1, 8, {}, { next: { tags: [CACHE_TAGS.HOME, CACHE_TAGS.OFFERS] } }),
    getAllProducts(undefined, { next: { tags: [CACHE_TAGS.PRODUCTS] } }),
  ]);

  const featuredShops = (featuredShopsRes as any).success ? ((featuredShopsRes as any).data || []) : [];
  const featuredOffers = (featuredOffersRes as any).success ? ((featuredOffersRes as any).data || []) : [];
  const allOffers = allOffersRes.success ? allOffersRes.data : [];

  const { t } = await getTranslations("home");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Spacer for Fixed Header */}
      <div className="h-32 lg:h-24" />

      {/* Featured Shops Carousel */}
      <FeaturedCarousel shops={featuredShops} />

      {/* Featured Offers */}
      <FeaturedOffers offers={featuredOffers} />

      {/* Offers Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Filter & Sorting Panel */}
          <FilterPanel />

          {/* Main Offer Grid */}
          <OfferGrid
            offers={allOffers}
            redirectToOffers={true}
            buttonText={t("hero.exploreAllOffers")}
            columns={4}
          />
        </div>
      </section>

      {/* Featured Products */}
      <FeaturedProducts products={allProducts || []} />

      {/* Shop Registration Section */}
      <ShopRegistrationSection />

      {/* Premium Choice Section */}
      <section className="py-24 md:py-32 relative overflow-hidden bg-white">
        {/* Decorative Background Ornaments */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] translate-y-1/2 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-6 animate-fade-in border border-primary/10">
              <Award className="w-4 h-4" />
              <span>{t("features.badge")}</span>
            </div>
            <Heading className="text-4xl md:text-5xl lg:text-6xl mb-6">
              {t("features.titlePrefix")}
              <span className="text-gradient">{t("features.titleSuffix")}</span>
            </Heading>
            <Text className="max-w-2xl mx-auto text-lg opacity-70">
              {t("features.subheading")}
            </Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                icon: Store,
                title: t("features.localShops.title"),
                desc: t("features.localShops.desc"),
                color: "from-orange-500/10 to-transparent",
                iconColor: "text-orange-500",
                delay: "0s"
              },
              {
                icon: Ticket,
                title: t("features.bestDeals.title"),
                desc: t("features.bestDeals.desc"),
                color: "from-blue-500/10 to-transparent",
                iconColor: "text-blue-500",
                delay: "0.1s"
              },
              {
                icon: MapPin,
                title: t("features.locationBased.title"),
                desc: t("features.locationBased.desc"),
                color: "from-purple-500/10 to-transparent",
                iconColor: "text-purple-500",
                delay: "0.2s"
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative p-10 rounded-[3rem] bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-700 hover:-translate-y-4 text-center animate-fade-in"
                style={{ animationDelay: feature.delay }}
              >
                {/* Internal Glow on Hover */}
                <div className={cn(
                  "absolute inset-0 rounded-[3rem] bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
                  feature.color
                )} />

                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 mx-auto group-hover:scale-110 group-hover:border-primary/20 transition-all duration-500 group-hover:rotate-6 shadow-sm">
                    <feature.icon className={cn("w-10 h-10", feature.iconColor)} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight text-slate-900 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed group-hover:text-slate-600 transition-colors">
                    {feature.desc}
                  </p>
                </div>

                {/* Bottom Interactive Line */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-0 h-1.5 bg-gradient-to-r from-primary to-secondary rounded-full group-hover:w-1/4 transition-all duration-700 ease-out" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
