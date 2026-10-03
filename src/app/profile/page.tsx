import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getProfile } from "./actions";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { AlertCircle, RotateCw } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "My Profile | OfferNearU",
  description: "Manage your personal information, security settings, and shopping bookmarks.",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/profile");
  }

  const profileResponse = await getProfile();

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

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {!profileResponse.success || !profileResponse.data ? (
          <div className="bg-card/90 backdrop-blur-xl border border-destructive/20 rounded-3xl p-8 max-w-xl mx-auto flex flex-col items-center justify-center text-center space-y-4 shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Failed to load profile</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {profileResponse.error || "An unexpected error occurred while fetching your profile."}
              </p>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 transition-all hover:scale-105"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Profile Identity & Header */}
            <ProfileHeader profile={profileResponse.data} />

            {/* Profile Navigation Tabs & Forms */}
            <ProfileTabs initialData={profileResponse.data} />
          </div>
        )}
      </div>
    </main>
  );
}
