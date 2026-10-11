"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mail, 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  requestCurrentContactOtp, 
  verifyCurrentContactOtp, 
  requestNewContactOtp, 
  verifyNewContactOtp 
} from "@/app/profile/actions";
import { ContactChangeType } from "@/lib/types/profile";

interface ContactChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ContactChangeType;
  currentValue: string;
  onSuccess: (type: ContactChangeType, newValue: string) => void;
}

type Step = 
  | "INIT_CURRENT"       // Confirm current contact and prompt to send OTP
  | "VERIFY_CURRENT"     // Enter OTP sent to current contact
  | "ENTER_NEW"          // Enter new email/phone and request OTP
  | "VERIFY_NEW"         // Enter OTP sent to new contact
  | "SUCCESS";           // Success state before auto-closing

// Segmented 6-digit OTP Input
function SegmentedOtpInput({
  value,
  onChange,
  disabled,
  autoFocus = true,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const length = 6;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const chars = value.split("");
    chars[index] = char.slice(-1);
    const result = chars.join("").slice(0, length);
    onChange(result);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    const targetIdx = Math.min(pasted.length, length - 1);
    inputRefs.current[targetIdx]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-2.5 justify-center py-2">
      {Array.from({ length }).map((_, i) => {
        const isCurrentActive = value.length === i || (i === length - 1 && value.length === length);
        const hasChar = Boolean(value[i]);

        return (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              "w-10 sm:w-12 h-12 sm:h-14 text-center font-mono font-bold text-lg sm:text-xl",
              "rounded-xl sm:rounded-2xl border transition-all outline-none",
              "bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-xs",
              hasChar 
                ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400"
                : isCurrentActive 
                  ? "border-orange-500 ring-2 ring-orange-500/20" 
                  : "border-stone-200 dark:border-zinc-700 hover:border-stone-300 dark:hover:border-zinc-600",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
        );
      })}
    </div>
  );
}

export function ContactChangeModal({
  isOpen,
  onClose,
  type,
  currentValue,
  onSuccess,
}: ContactChangeModalProps) {
  const [step, setStep] = useState<Step>("INIT_CURRENT");
  const [currentOtp, setCurrentOtp] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newOtp, setNewOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep("INIT_CURRENT");
      setCurrentOtp("");
      setNewValue("");
      setNewOtp("");
      setIsLoading(false);
      setErrorMessage(null);
      setResendCooldown(0);
    }
  }, [isOpen]);

  const isEmail = type === "EMAIL";
  const label = isEmail ? "Email Address" : "Phone Number";
  const Icon = isEmail ? Mail : Phone;

  // 1. Request OTP on current contact
  const handleRequestCurrentOtp = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await requestCurrentContactOtp();
      if (res.success) {
        toast.success(`Verification code sent to your current ${label.toLowerCase()}!`);
        setStep("VERIFY_CURRENT");
        setResendCooldown(30);
      } else {
        setErrorMessage(res.error || "Failed to send verification code. Please try again.");
      }
    } catch {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify current contact OTP
  const handleVerifyCurrentOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentOtp.trim().length < 4) {
      setErrorMessage("Please enter the complete verification code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await verifyCurrentContactOtp({ otp: currentOtp.trim() });
      if (res.success) {
        toast.success("Current contact verified successfully!");
        setStep("ENTER_NEW");
        setResendCooldown(0);
      } else {
        setErrorMessage(res.error || "Invalid verification code. Please check and try again.");
      }
    } catch {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Request OTP on new contact
  const handleRequestNewOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanValue = newValue.trim();
    if (!cleanValue) {
      setErrorMessage(`Please enter your new ${label.toLowerCase()}.`);
      return;
    }

    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!isEmail && !/^\+?[0-9]{10,15}$/.test(cleanValue)) {
      setErrorMessage("Please enter a valid phone number (10-15 digits).");
      return;
    }

    if (cleanValue === currentValue) {
      setErrorMessage(`The new ${label.toLowerCase()} cannot be the same as your current one.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await requestNewContactOtp({
        type,
        newValue: cleanValue,
      });

      if (res.success) {
        toast.success(`Verification code sent to your new ${label.toLowerCase()}!`);
        setStep("VERIFY_NEW");
        setResendCooldown(30);
      } else {
        setErrorMessage(res.error || `Failed to send code to new ${label.toLowerCase()}.`);
      }
    } catch {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Verify new contact OTP & finalize
  const handleVerifyNewOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOtp.trim().length < 4) {
      setErrorMessage("Please enter the complete verification code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await verifyNewContactOtp({
        type,
        otp: newOtp.trim(),
      });

      if (res.success) {
        setStep("SUCCESS");
        toast.success(`${label} updated successfully!`);
        onSuccess(type, newValue.trim());
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMessage(res.error || "Invalid verification code. Please check and try again.");
      }
    } catch {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border border-stone-200/90 dark:border-zinc-800 shadow-2xl rounded-3xl bg-white dark:bg-zinc-900">
        {/* ── Brand Gradient Header Banner ── */}
        <div className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 px-6 sm:px-8 py-5 sm:py-6 text-white overflow-hidden">
          <div className="absolute -right-10 -top-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-black/10 rounded-full blur-xl pointer-events-none" />

          <DialogHeader className="text-left relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner shrink-0">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-white font-sans tracking-tight">
                  Update {label}
                </DialogTitle>
                <DialogDescription className="text-white/85 text-xs sm:text-sm mt-0.5">
                  Two-step identity protection
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* ── Modal Content Body ── */}
        <div className="p-6 sm:p-7 space-y-5 bg-white dark:bg-zinc-900">
          {/* Segmented Stepper */}
          {step !== "SUCCESS" && (
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-zinc-800 rounded-2xl border border-stone-200/80 dark:border-zinc-700/80">
              <div className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all",
                (step === "INIT_CURRENT" || step === "VERIFY_CURRENT")
                  ? "bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-xs border border-stone-200/80 dark:border-zinc-700"
                  : "text-stone-500 dark:text-zinc-400"
              )}>
                <span className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] flex items-center justify-center font-black">1</span>
                <span>Current Contact</span>
              </div>
              <div className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all",
                (step === "ENTER_NEW" || step === "VERIFY_NEW")
                  ? "bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-xs border border-stone-200/80 dark:border-zinc-700"
                  : "text-stone-500 dark:text-zinc-400"
              )}>
                <span className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] flex items-center justify-center font-black">2</span>
                <span>New {isEmail ? "Email" : "Phone"}</span>
              </div>
            </div>
          )}

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug font-medium">{errorMessage}</span>
            </div>
          )}

          {/* ── STEP 1: Request OTP on current contact ── */}
          {step === "INIT_CURRENT" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-zinc-400 font-medium">Currently Registered:</span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
                <p className="font-mono text-sm sm:text-base font-bold text-stone-900 dark:text-zinc-100 break-all">
                  {currentValue || "Not configured"}
                </p>
                <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed pt-1">
                  To protect your account, we will send a one-time verification code to confirm your identity before changing your {label.toLowerCase()}.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRequestCurrentOtp}
                disabled={isLoading}
                className={cn(
                  "w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm",
                  "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white",
                  "shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 active:scale-[0.99] transition-all",
                  "flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── STEP 2: Verify current OTP ── */}
          {step === "VERIFY_CURRENT" && (
            <form onSubmit={handleVerifyCurrentOtp} className="space-y-4">
              <div className="space-y-2 text-center">
                <Label className="text-xs sm:text-sm font-semibold text-foreground">
                  Enter 6-Digit Code Sent to Current Contact
                </Label>
                <p className="text-xs text-muted-foreground">
                  Check your inbox / messages for the one-time code
                </p>

                <SegmentedOtpInput
                  value={currentOtp}
                  onChange={(val) => {
                    setCurrentOtp(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep("INIT_CURRENT")}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={handleRequestCurrentOtp}
                  className="text-primary hover:text-primary/80 disabled:opacity-50 flex items-center gap-1 font-semibold transition-colors"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || currentOtp.trim().length < 4}
                className={cn(
                  "w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm",
                  "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white",
                  "shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 active:scale-[0.99] transition-all",
                  "flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 3: Enter new contact value ── */}
          {step === "ENTER_NEW" && (
            <form onSubmit={handleRequestNewOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new_contact_value" className="text-xs sm:text-sm font-semibold text-foreground">
                  New {label}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <Input
                    id="new_contact_value"
                    type={isEmail ? "email" : "tel"}
                    placeholder={isEmail ? "e.g. newemail@example.com" : "e.g. +91 9876543210"}
                    value={newValue}
                    onChange={(e) => {
                      setNewValue(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoFocus
                    className="pl-10 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700 text-xs sm:text-sm text-stone-900 dark:text-zinc-100 focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:border-orange-500 transition-all shadow-xs"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  We will send a confirmation code to this new {label.toLowerCase()} to verify ownership.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep("VERIFY_CURRENT")}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !newValue.trim()}
                className={cn(
                  "w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm",
                  "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white",
                  "shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 active:scale-[0.99] transition-all",
                  "flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Code to New {label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 4: Verify new contact OTP ── */}
          {step === "VERIFY_NEW" && (
            <form onSubmit={handleVerifyNewOtp} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-800 text-xs text-stone-500 dark:text-zinc-400 flex items-center justify-between">
                <div>
                  <span className="text-[11px] block text-stone-400 dark:text-zinc-500">Verification code sent to:</span>
                  <span className="font-mono font-bold text-sm text-stone-900 dark:text-zinc-100 break-all">{newValue}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("ENTER_NEW")}
                  className="text-orange-600 dark:text-orange-400 hover:underline text-xs font-bold"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-2 text-center">
                <Label className="text-xs sm:text-sm font-semibold text-foreground">
                  Enter 6-Digit Code Sent to New {label}
                </Label>

                <SegmentedOtpInput
                  value={newOtp}
                  onChange={(val) => {
                    setNewOtp(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep("ENTER_NEW")}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={handleRequestNewOtp}
                  className="text-primary hover:text-primary/80 disabled:opacity-50 flex items-center gap-1 font-semibold transition-colors"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || newOtp.trim().length < 4}
                className={cn(
                  "w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm",
                  "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white",
                  "shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 active:scale-[0.99] transition-all",
                  "flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Update {label}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── SUCCESS STATE ── */}
          {step === "SUCCESS" && (
            <div className="py-6 text-center space-y-3 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/25 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-foreground font-sans">
                {label} Updated!
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Your new {label.toLowerCase()} has been verified and safely saved to your OfferNearU account.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
