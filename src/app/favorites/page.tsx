import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import FavoritesList from "@/components/favorites/FavoritesList";

export const metadata: Metadata = {
  title: "My Favorites | OfferNearU",
  description: "View, filter, and manage your saved local offers, flyers, and favorite products in one place.",
};

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/favorites");
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden pt-44 sm:pt-40 lg:pt-32 pb-20">
      {/* Ambient Atmospheric Background Glows */}
      <div 
        aria-hidden="true"
        className="absolute top-16 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[130px] pointer-events-none -translate-y-1/2" 
      />
      <div 
        aria-hidden="true"
        className="absolute top-80 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none translate-y-1/3" 
      />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <FavoritesList />
      </div>
    </main>
  );
}
