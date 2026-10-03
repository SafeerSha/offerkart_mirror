"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
  Lock, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  User, 
  KeyRound,
  Eye, 
  EyeOff, 
  Check, 
  X,
  Sparkles
} from "lucide-react";
import { PasswordChangeFormData, PasswordChangeSchema, UserProfileResponse } from "@/lib/types/profile";
import { changePassword } from "@/app/profile/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PasswordFormProps {
  initialData: UserProfileResponse;
}

export function PasswordForm({ initialData }: PasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset,
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(PasswordChangeSchema),
    mode: "onChange",
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const newPasswordValue = watch("new_password") || "";
  const confirmPasswordValue = watch("confirm_password") || "";

  // Password strength calculation
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const strength = calculateStrength(newPasswordValue);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  const strengthColors = [
    "bg-slate-300 dark:bg-slate-700",
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-emerald-600",
  ];

  const onSubmit = async (data: PasswordChangeFormData) => {
    setIsSubmitting(true);
    try {
      const result = await changePassword(data);

      if (result.success) {
        toast.success("Password updated successfully!");
        reset();
      } else {
        toast.error(result.error || "Failed to change password. Please check your current password.");
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
      {/* Decorative ambient background orb */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-sans">
            Security & Password
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground ml-11">
          Update your login password to ensure your account and saved deals remain protected.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl relative z-10">
        {/* Read-only Account Email */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm font-semibold text-foreground">
            Account Identifier
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <User className="h-4 w-4" />
            </div>
            <Input
              type="text"
              value={initialData.email || ""}
              readOnly
              className="pl-10 h-11 rounded-2xl bg-muted/40 text-muted-foreground cursor-not-allowed border-border/60"
            />
          </div>
        </div>

        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="current_password" className="text-xs sm:text-sm font-semibold text-foreground">
            Current Password <span className="text-primary">*</span>
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <KeyRound className="h-4 w-4" />
            </div>
            <Input
              id="current_password"
              type={showCurrent ? "text" : "password"}
              placeholder="Enter current password"
              className={cn(
                "pl-10 pr-10 h-11 rounded-2xl bg-background/70 border-border/80 text-foreground placeholder:text-muted-foreground",
                "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all",
                errors.current_password && "border-destructive focus-visible:ring-destructive"
              )}
              {...register("current_password")}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.current_password && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.current_password.message}
            </p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="new_password" className="text-xs sm:text-sm font-semibold text-foreground">
            New Password <span className="text-primary">*</span>
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <Input
              id="new_password"
              type={showNew ? "text" : "password"}
              placeholder="Minimum 6 characters"
              className={cn(
                "pl-10 pr-10 h-11 rounded-2xl bg-background/70 border-border/80 text-foreground placeholder:text-muted-foreground",
                "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all",
                errors.new_password && "border-destructive focus-visible:ring-destructive"
              )}
              {...register("new_password")}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password strength indicator */}
          {newPasswordValue.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Password strength:</span>
                <span className="font-semibold text-foreground">{strengthLabels[strength]}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 h-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      lvl <= strength ? strengthColors[strength] : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {errors.new_password && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.new_password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirm_password" className="text-xs sm:text-sm font-semibold text-foreground">
            Confirm New Password <span className="text-primary">*</span>
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <Input
              id="confirm_password"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter new password"
              className={cn(
                "pl-10 pr-10 h-11 rounded-2xl bg-background/70 border-border/80 text-foreground placeholder:text-muted-foreground",
                "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all",
                errors.confirm_password && "border-destructive focus-visible:ring-destructive"
              )}
              {...register("confirm_password")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.confirm_password.message}
            </p>
          )}
        </div>

        {/* Real-time Checklist */}
        <div className="p-3.5 rounded-2xl bg-background/50 border border-border/60 text-xs space-y-2">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Password Checklist
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
            <div className="flex items-center gap-2">
              {newPasswordValue.length >= 6 ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
              )}
              <span className={cn(newPasswordValue.length >= 6 && "text-foreground font-medium")}>
                At least 6 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              {confirmPasswordValue.length > 0 && newPasswordValue === confirmPasswordValue ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
              )}
              <span className={cn(confirmPasswordValue.length > 0 && newPasswordValue === confirmPasswordValue && "text-foreground font-medium")}>
                Passwords match
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 flex items-center justify-end border-t border-border/60">
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className={cn(
              "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl text-xs sm:text-sm font-bold",
              "bg-primary text-primary-foreground hover:opacity-95 shadow-md shadow-primary/25",
              "transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
