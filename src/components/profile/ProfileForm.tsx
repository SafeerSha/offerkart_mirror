"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Phone, 
  Loader2, 
  Save, 
  AlertCircle, 
  Store,
  Sparkles,
  Info
} from "lucide-react";
import { UserProfileFormData, UserProfileSchema, UserProfileResponse } from "@/lib/types/profile";
import { updateProfile } from "@/app/profile/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  initialData: UserProfileResponse;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalEmail] = useState(initialData.email);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(UserProfileSchema),
    mode: "onChange",
    defaultValues: {
      full_name: initialData.full_name || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      business_name: initialData.business_name || "",
    },
  });

  const currentEmail = watch("email");
  const emailChanged = currentEmail !== originalEmail && currentEmail !== "";

  const onSubmit = async (data: UserProfileFormData) => {
    setIsSubmitting(true);
    try {
      const result = await updateProfile(data);

      if (result.success) {
        toast.success(result.message || "Profile updated successfully!");
        if (emailChanged) {
          toast.info("A verification link has been sent to your new email address.", {
            duration: 5000,
          });
        }
        reset(data);
      } else {
        toast.error(result.error || "Failed to update profile.");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn(
      "relative rounded-3xl p-6 sm:p-8",
      "bg-card/90 backdrop-blur-xl border border-border/80 shadow-card",
      "overflow-hidden animate-fade-in"
    )}>
      {/* Subtle Ambient Ornaments */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="mb-8 relative z-10 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-sans">
              Personal Information
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground ml-11">
            Update your public profile and manage personal account details.
          </p>
        </div>

        {isDirty && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
            <Info className="w-3.5 h-3.5" />
            Unsaved Changes
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl relative z-10">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-xs sm:text-sm font-semibold text-foreground">
            Full Name <span className="text-primary">*</span>
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <User className="h-4 w-4" />
            </div>
            <Input
              id="full_name"
              type="text"
              placeholder="e.g. Alex Johnson"
              className={cn(
                "pl-10 h-11 rounded-2xl bg-background/70 border-border/80 text-foreground placeholder:text-muted-foreground",
                "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all",
                errors.full_name && "border-destructive focus-visible:ring-destructive"
              )}
              {...register("full_name")}
            />
          </div>
          {errors.full_name && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.full_name.message}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-foreground">
              Email Address <span className="text-primary">*</span>
            </Label>
            {emailChanged && (
              <span className="text-[11px] text-amber-500 font-medium">
                Requires email re-verification
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="alex@example.com"
              className={cn(
                "pl-10 h-11 rounded-2xl bg-background/70 border-border/80 text-foreground placeholder:text-muted-foreground",
                "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all",
                errors.email && "border-destructive focus-visible:ring-destructive"
              )}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-xs sm:text-sm font-semibold text-foreground">
            Phone Number
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Phone className="h-4 w-4" />
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 9876543210"
              className={cn(
                "pl-10 h-11 rounded-2xl bg-background/70 border-border/80 text-foreground placeholder:text-muted-foreground",
                "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all",
                errors.phone && "border-destructive focus-visible:ring-destructive"
              )}
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Business Name (Optional / Partner) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="business_name" className="text-xs sm:text-sm font-semibold text-foreground">
              Store / Business Name
            </Label>
            <span className="text-[11px] text-muted-foreground">Optional</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Store className="h-4 w-4" />
            </div>
            <Input
              id="business_name"
              type="text"
              placeholder="e.g. Fresh Mart Grocery"
              className={cn(
                "pl-10 h-11 rounded-2xl bg-background/70 border-border/80 text-foreground placeholder:text-muted-foreground",
                "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all",
                errors.business_name && "border-destructive focus-visible:ring-destructive"
              )}
              {...register("business_name")}
            />
          </div>
          {errors.business_name && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.business_name.message}
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60">
          <div className="text-xs text-muted-foreground">
            {isDirty ? (
              <span className="text-amber-500 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Don&apos;t forget to save your changes
              </span>
            ) : (
              <span>Your profile is up to date</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isDirty || !isValid}
            className={cn(
              "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl text-xs sm:text-sm font-bold",
              "bg-primary text-primary-foreground hover:opacity-95 shadow-md shadow-primary/25",
              "transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
