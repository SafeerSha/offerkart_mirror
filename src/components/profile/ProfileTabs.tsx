"use client";

import { useState } from "react";
import { User, ShieldCheck } from "lucide-react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PasswordForm } from "@/components/profile/PasswordForm";
import { UserProfileResponse } from "@/lib/types/profile";
import { cn } from "@/lib/utils";

interface ProfileTabsProps {
    initialData: UserProfileResponse;
}

export function ProfileTabs({ initialData }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");

    const tabs = [
        { id: "personal" as const, label: "Profile Details", icon: User },
        { id: "security" as const, label: "Security Settings", icon: ShieldCheck },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Left: Vertical Sidebar Nav (desktop) + Pill Switcher (mobile) ── */}
            <div className="lg:col-span-1">
                {/* Mobile: pill switcher */}
                <div className="flex lg:hidden p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl overflow-hidden shadow-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300",
                                activeTab === tab.id
                                    ? "bg-white dark:bg-slate-900 text-orange-600 shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Desktop: vertical nav */}
                <nav className="hidden lg:flex flex-col space-y-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left w-full group",
                                activeTab === tab.id
                                    ? "bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-500 shadow-sm border border-orange-100 dark:border-orange-900/30"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
                            )}
                        >
                            <span className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                                activeTab === tab.id
                                    ? "bg-orange-50 dark:bg-orange-900/20 text-orange-500"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20 group-hover:text-orange-500"
                            )}>
                                <tab.icon className="w-4 h-4" />
                            </span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* ── Right: Tab Content (full width) ── */}
            <div className="lg:col-span-2">
                {activeTab === "personal" ? (
                    <ProfileForm initialData={initialData} />
                ) : (
                    <PasswordForm initialData={initialData} />
                )}
            </div>
        </div>
    );
}
