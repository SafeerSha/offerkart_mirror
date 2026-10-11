"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  Loader2, 
  Save, 
  AlertCircle, 
  Store, 
  Sparkles, 
  Info,
  ShieldCheck
} from "lucide-react";
import { 
  BasicProfileFormData, 
  BasicProfileSchema, 
  UserProfileResponse, 
  ContactChangeType 
} from "@/lib/types/profile";
import { updateProfile } from "@/app/profile/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ContactChangeModal } from "@/components/profile/ContactChangeModal";

interface ProfileFormProps {
  initialData: UserProfileResponse;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEmail, setCurrentEmail] = useState(initialData.email || "");
  const [currentPhone, setCurrentPhone] = useState(initialData.phone || "");
  const [contactModal, setContactModal] = useState<{
    isOpen: boolean;
    type: ContactChangeType;
    currentValue: string;
  }>({
    isOpen: false,
    type: "EMAIL",
    currentValue: "",
  });

  const { update: updateSession } = useSession();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm<BasicProfileFormData>({
    resolver: zodResolver(BasicProfileSchema),
    mode: "onChange",
    defaultValues: {
      full_name: initialData.full_name || "",
      business_name: initialData.business_name || "",
    },
  });

  const onSubmit = async (data: BasicProfileFormData) => {
    setIsSubmitting(true);
    try {
      const result = await updateProfile(data);

      if (result.success) {
        toast.success(result.message || "Profile updated successfully!");
        try {
          if (updateSession) {
            await updateSession({
              user: {
                full_name: data.full_name,
                business_name: data.business_name,
              },
            });
          }
        } catch (err) {
          console.warn("Could not update client session immediately:", err);
        }
        reset(data);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update profile.");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenContactModal = (type: ContactChangeType, currentValue: string) => {
    setContactModal({
      isOpen: true,
      type,
      currentValue,
    });
  };

  const handleContactChangeSuccess = async (type: ContactChangeType, newValue: string) => {
    if (type === "EMAIL") {
      setCurrentEmail(newValue);
    } else {
      setCurrentPhone(newValue);
    }

    try {
      if (updateSession) {
        await updateSession({
          user: type === "EMAIL" ? { email: newValue } : { phone: newValue },
        });
      }
    } catch (err) {
      console.warn("Could not update client session immediately:", err);
    }

    router.refresh();
  };

  return (
    <>
      <div className={cn(
        "relative rounded-2xl sm:rounded-3xl p-4 sm:p-7",
        "bg-card/90 backdrop-blur-xl border border-border/80 shadow-card",
        "overflow-hidden animate-fade-in"
      )}>
        {/* Subtle Ambient Ornaments */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header section */}
        <div className="mb-4 sm:mb-6 relative z-10 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-foreground tracking-tight font-sans">
                Personal Information
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-9 sm:ml-11">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 sm:space-y-5 max-w-2xl relative z-10">
          {/* Full Name */}
          <div className="space-y-1 sm:space-y-1.5">
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
                  "pl-10 h-10 sm:h-11 rounded-xl sm:rounded-2xl bg-background/70 border-border/80 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground",
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

          {/* Email Address (Secure Contact) */}
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-foreground">
                Email Address <span className="text-primary">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Verified Account ID
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  readOnly
                  value={currentEmail}
                  className="pl-10 h-10 sm:h-11 rounded-xl sm:rounded-2xl bg-muted/30 border-border/60 text-xs sm:text-sm text-foreground/90 cursor-not-allowed font-medium"
                />
              </div>
              <button
                type="button"
                onClick={() => handleOpenContactModal("EMAIL", currentEmail)}
                className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-1.5 hover:scale-102 active:scale-98"
              >
                <span>Change</span>
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Changing your email requires two-step OTP verification for account security.
            </p>
          </div>

          {/* Phone Number (Secure Contact) */}
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="phone" className="text-xs sm:text-sm font-semibold text-foreground">
                Phone Number
              </Label>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                2-Step Protected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  readOnly
                  value={currentPhone || "Not configured"}
                  className="pl-10 h-10 sm:h-11 rounded-xl sm:rounded-2xl bg-muted/30 border-border/60 text-xs sm:text-sm text-foreground/90 cursor-not-allowed font-medium"
                />
              </div>
              <button
                type="button"
                onClick={() => handleOpenContactModal("PHONE", currentPhone)}
                className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-1.5 hover:scale-102 active:scale-98"
              >
                <span>Change</span>
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Verification codes are sent to your current phone before updating.
            </p>
          </div>

          {/* Business Name (Optional / Partner) */}
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="business_name" className="text-xs sm:text-sm font-semibold text-foreground">
                Business Name
              </Label>
              {/* <span className="text-[11px] text-muted-foreground">Optional</span> */}
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
                  "pl-10 h-10 sm:h-11 rounded-xl sm:rounded-2xl bg-background/70 border-border/80 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground",
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
          <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-border/60">

            <button
              type="submit"
              disabled={isSubmitting || !isDirty || !isValid}
              className={cn(
                "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold",
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

      {/* Contact Change Multi-Step OTP Modal */}
      <ContactChangeModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal((prev) => ({ ...prev, isOpen: false }))}
        type={contactModal.type}
        currentValue={contactModal.currentValue}
        onSuccess={handleContactChangeSuccess}
      />
    </>
  );
}
