"use client";

import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { 
  Heart, 
  Store, 
  LogOut, 
  ExternalLink, 
  Bell, 
  ShieldAlert, 
  HelpCircle,
  FileText
} from "lucide-react";
import { UserProfileResponse } from "@/lib/types/profile";
import { cn } from "@/lib/utils";

interface ProfilePreferencesProps {
  profile: UserProfileResponse;
}

export function ProfilePreferences({ profile }: ProfilePreferencesProps) {
  const isMerchant = Boolean(profile.business_name || profile.shopId || profile.role === 2 || profile.role_id === 2);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Shortcuts Card */}
      <div className={cn(
        "rounded-3xl p-6 sm:p-8",
        "bg-card/90 backdrop-blur-xl border border-border/80 shadow-card",
        "relative overflow-hidden"
      )}>
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <span>Quick Access & Bookmarks</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/favorites"
            className={cn(
              "flex items-center justify-between p-4 rounded-2xl",
              "bg-background/80 hover:bg-rose-500/10 border border-border/80 hover:border-rose-500/30",
              "transition-all duration-300 group shadow-2xs hover:shadow-xs"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  My Favorites
                </div>
                <div className="text-xs text-muted-foreground">
                  Saved offers, flyers, and products
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-rose-500 transition-colors" />
          </Link>

          {isMerchant ? (
            <Link
              href="/shop-manager"
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl",
                "bg-background/80 hover:bg-primary/10 border border-border/80 hover:border-primary/30",
                "transition-all duration-300 group shadow-2xs hover:shadow-xs"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Store className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    Shop Manager
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Manage listings, posters, and products
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ) : (
            <Link
              href="/shop-registration"
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl",
                "bg-background/80 hover:bg-amber-500/10 border border-border/80 hover:border-amber-500/30",
                "transition-all duration-300 group shadow-2xs hover:shadow-xs"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Store className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Register Your Business
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Promote your store to nearby shoppers
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
            </Link>
          )}
        </div>
      </div>

      {/* Notifications & Preferences Card */}
      <div className={cn(
        "rounded-3xl p-6 sm:p-8",
        "bg-card/90 backdrop-blur-xl border border-border/80 shadow-card"
      )}>
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <span>Notifications & Legal</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-background/60 border border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-foreground">Local Deals Alerts</div>
                <div className="text-[11px] text-muted-foreground">Get notified when favorited stores post new flyers</div>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-primary transition-colors flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-primary transition-colors flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Help & Support
            </Link>
          </div>
        </div>
      </div>

      {/* Danger Zone: Sign Out */}
      <div className={cn(
        "rounded-3xl p-6 sm:p-8",
        "bg-card/90 backdrop-blur-xl border border-destructive/20 shadow-xs"
      )}>
        <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
          <span>Account Session</span>
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-6">
          Log out of your current session on this device.
        </p>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold",
            "bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20",
            "transition-all hover:scale-105 active:scale-95"
          )}
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Account</span>
        </button>
      </div>
    </div>
  );
}
