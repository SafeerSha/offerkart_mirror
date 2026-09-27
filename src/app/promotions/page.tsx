import { Metadata } from "next";
import PromoGallery from "@/components/promotions/PromoGallery";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
    title: "Promotional Videos | OfferNearU",
    description: "Watch the latest ads and promotional videos from your favorite shops and discover amazing offers.",
};

export default function PromotionsPage() {
    return (
        <main className="min-h-screen bg-[#FAFAF9] dark:bg-slate-950 text-slate-800 dark:text-slate-100 pt-40 sm:pt-40 lg:pt-28 pb-20 selection:bg-orange-500 selection:text-white">
            <Suspense fallback={
                <div className="flex justify-center items-center py-32">
                    <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                </div>
            }>
                <PromoGallery />
            </Suspense>
        </main>
    );
}
