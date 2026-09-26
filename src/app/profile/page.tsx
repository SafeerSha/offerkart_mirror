import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getProfile } from "./actions";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { AlertCircle } from "lucide-react";

export const metadata = {
    title: "My Profile - OfferNearU",
    description: "Manage your personal information and account settings.",
};

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    const profileResponse = await getProfile();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-44 sm:pt-40 pb-12 px-4 sm:px-6 lg:px-8 lg:pt-28">
            <div className="max-w-4xl mx-auto space-y-8">
             

                {!profileResponse.success || !profileResponse.data ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Failed to load profile</h3>
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                {profileResponse.error || "An unexpected error occurred while fetching your profile."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <ProfileTabs initialData={profileResponse.data} />
                )}
            </div>
        </div>
    );
}
