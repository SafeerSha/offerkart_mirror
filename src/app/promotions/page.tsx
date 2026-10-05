import { Metadata } from "next";
import PromoGallery from "@/components/promotions/PromoGallery";
import { Suspense } from "react";
import { PromoSkeleton } from "@/components/promotions/PromoSkeleton";

export const metadata: Metadata = {
  title: "Promotional Videos & Commercials | OfferNearU",
  description: "Watch commercial reels, shop video spotlights, and product demonstrations from local verified merchants near you.",
};

export default function PromotionsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden pt-36 sm:pt-32 lg:pt-24 pb-20">
      {/* Atmospheric Background Ambient Glows */}
      <div 
        aria-hidden="true"
        className="absolute top-16 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[130px] pointer-events-none -translate-y-1/2" 
      />
      <div 
        aria-hidden="true"
        className="absolute top-80 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none translate-y-1/3" 
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <Suspense fallback={<PromoSkeleton />}>
          <PromoGallery />
        </Suspense>
      </div>
    </main>
  );
}
