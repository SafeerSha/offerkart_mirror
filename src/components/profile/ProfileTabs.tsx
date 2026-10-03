"use client";

import React, { useState } from "react";
import { User, ShieldCheck, Settings, Sparkles, CheckCircle2 } from "lucide-react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PasswordForm } from "@/components/profile/PasswordForm";
import { ProfilePreferences } from "@/components/profile/ProfilePreferences";
import { UserProfileResponse } from "@/lib/types/profile";
import { cn } from "@/lib/utils";

interface ProfileTabsProps {
  initialData: UserProfileResponse;
}

export type ProfileTabType = "personal" | "security" | "preferences";

export function ProfileTabs({ initialData }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabType>("personal");

  const tabs = [
    {
      id: "personal" as const,
      label: "Personal Details",
      description: "Manage your name, contact, & store info",
      icon: User,
    },
    {
      id: "security" as const,
      label: "Security & Login",
      description: "Password change & account protection",
      icon: ShieldCheck,
    },
    {
      id: "preferences" as const,
      label: "Preferences & Session",
      description: "Wishlist, alerts, & sign out",
      icon: Settings,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── Left Sidebar Nav (4 cols on lg) ── */}
      <div className="lg:col-span-4 space-y-4">
        {/* Mobile: Pill Switcher */}
        <div className="flex lg:hidden p-1.5 bg-slate-100 dark:bg-card border border-border/80 rounded-2xl overflow-x-auto shadow-2xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all shrink-0",
                  isActive
                    ? "bg-white dark:bg-muted text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{tab.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop: Vertical Card Navigation */}
        <nav className="hidden lg:flex flex-col space-y-2 p-2 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/80 shadow-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-start gap-3.5 p-3.5 rounded-2xl text-left w-full transition-all duration-200 group cursor-pointer",
                  isActive
                    ? "bg-primary/10 border border-primary/20 shadow-xs text-primary"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border/60 group-hover:text-primary group-hover:border-primary/30"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div
                    className={cn(
                      "text-sm font-bold tracking-tight",
                      isActive ? "text-primary" : "text-foreground"
                    )}
                  >
                    {tab.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-snug line-clamp-1 mt-0.5">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Quick Security Tip Box in Sidebar */}
        <div className="hidden lg:block p-4 rounded-3xl bg-gradient-to-br from-primary/5 via-amber-500/5 to-transparent border border-border/60 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Account Security</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
            Keep your contact details up to date so store merchants and offer notifications reach you directly.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>2-Step Protection Active</span>
          </div>
        </div>
      </div>

      {/* ── Right Content Area (8 cols on lg) ── */}
      <div className="lg:col-span-8">
        {activeTab === "personal" && <ProfileForm initialData={initialData} />}
        {activeTab === "security" && <PasswordForm initialData={initialData} />}
        {activeTab === "preferences" && <ProfilePreferences profile={initialData} />}
      </div>
    </div>
  );
}
