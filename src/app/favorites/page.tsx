import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import FavoritesList from "@/components/favorites/FavoritesList";

export const metadata: Metadata = {
  title: "My Favorites | OfferNearU",
  description: "View and manage your favorite offers and products.",
};

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/favorites");
  }

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 pt-44 sm:pt-40 lg:pt-28 pb-12">
      <div className="container mx-auto px-4 max-w-7xl pt-0">
        <FavoritesList />
      </div>
    </main>
  );
}
