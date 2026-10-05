"use client";

import React from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { 
  Mail, 
  Phone, 
  ShieldCheck, 
  Store, 
  Copy, 
  Check, 
  Sparkles,
  Heart
} from "lucide-react";
import { UserProfileResponse } from "@/lib/types/profile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProfileHeaderProps {
  profile: UserProfileResponse;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const [copied, setCopied] = React.useState(false);

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return "OU";
  };

  const copyEmail = () => {
    if (profile.email) {
      navigator.clipboard?.writeText(profile.email);
      setCopied(true);
      toast.success("Email copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isMerchant = Boolean(profile.business_name || profile.shopId || profile.role === 2 || profile.role_id === 2);

  return (
    <div className="space-y-2 mb-3 sm:mb-4">
      {/* Standard Shared Breadcrumb Navigation */}
      <Breadcrumbs items={[{ label: "My Profile" }]} className="mb-1" />

      {/* Hero Banner Card */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-6",
        "bg-card/90 backdrop-blur-xl border border-border/80 shadow-card",
        "transition-all duration-300"
      )}>
        {/* Subtle Ambient Background Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[90px] pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-accent/10 rounded-full blur-[80px] pointer-events-none -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-6">
          {/* Avatar and User Info */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Gradient Avatar with Status Ring */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-amber-500 p-0.5 shadow-md shadow-primary/20">
                <div className="w-full h-full rounded-[10px] sm:rounded-[14px] bg-card flex items-center justify-center font-black text-lg sm:text-2xl text-primary font-sans">
                  {getInitials(profile.full_name, profile.email)}
                </div>
              </div>
              <div 
                title="Active Account"
                className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center text-white shadow-xs"
              >
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
              </div>
            </div>

            {/* Names & Badges */}
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight font-sans truncate">
                  {profile.full_name || "Account User"}
                </h1>
                
                {/* Role Pill */}
                {isMerchant ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Store className="w-3 h-3" />
                    Store Partner
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="w-3 h-3" />
                    Member
                  </span>
                )}
              </div>

              {/* Email & Phone */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:text-sm text-muted-foreground">
                {profile.email && (
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors group cursor-pointer"
                    title="Click to copy email"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary/70" />
                    <span className="truncate max-w-[180px] sm:max-w-none">{profile.email}</span>
                    {copied ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    )}
                  </button>
                )}

                {profile.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary/70" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>

              {profile.business_name && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium pt-0.5">
                  <Store className="w-3 h-3 text-amber-500" />
                  <span>Business: <strong className="text-foreground">{profile.business_name}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats / Action Badges */}
          <div className="grid grid-cols-2 md:flex items-center gap-2 sm:gap-3 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-border/50">
            <Link
              href="/favorites"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl",
                "bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20",
                "text-rose-600 dark:text-rose-400 transition-all hover:scale-105 active:scale-95 shadow-2xs"
              )}
            >
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-rose-500/30" />
              <div className="text-left">
                <div className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-rose-500/80">Wishlist</div>
                <div className="text-xs font-bold">Saved Items</div>
              </div>
            </Link>

            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl",
              "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
              "shadow-2xs"
            )}>
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <div className="text-left">
                <div className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-emerald-500/80">Status</div>
                <div className="text-xs font-bold">Verified</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
