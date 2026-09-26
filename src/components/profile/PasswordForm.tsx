"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Lock, Loader2, AlertCircle, KeyRound, ShieldCheck, User, Save } from "lucide-react";
import { PasswordChangeFormData, PasswordChangeSchema, UserProfileResponse } from "@/lib/types/profile";
import { changePassword } from "@/app/profile/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PasswordFormProps {
    initialData: UserProfileResponse;
}

export function PasswordForm({ initialData }: PasswordFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset
    } = useForm<PasswordChangeFormData>({
        resolver: zodResolver(PasswordChangeSchema),
        mode: "onChange",
        defaultValues: {
            current_password: "",
            new_password: "",
            confirm_password: "",
        },
    });

    const onSubmit = async (data: PasswordChangeFormData) => {
        setIsSubmitting(true);
        try {
            const result = await changePassword(data);
            
            if (result.success) {
                toast.success("Password changed successfully!");
                reset(); // Clear the form
            } else {
                toast.error(result.error || "Failed to change password. Please check your current password.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative bg-gradient-to-br from-white to-orange-50/50 dark:from-slate-900 dark:to-orange-950/20 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-orange-100 dark:border-orange-900/30 p-6 md:p-8 mt-6 overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="mb-8 relative z-10">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-xl">
                        <ShieldCheck className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                    </div>
                    Security Settings
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 pl-11">
                    Update your password to keep your account secure.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl relative z-10">
                {/* Readonly Username Display */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Username</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                            type="text"
                            value={initialData.email || ""}
                            readOnly
                            className="pl-10 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700"
                        />
                    </div>
                </div>

                {/* Current Password */}
                <div className="space-y-2">
                    <Label htmlFor="current_password" className="text-sm font-medium">Current Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                            id="current_password"
                            type="password"
                            placeholder="••••••••"
                            className={`pl-10 ${errors.current_password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            {...register("current_password")}
                        />
                    </div>
                    {errors.current_password && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.current_password.message}
                        </p>
                    )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                    <Label htmlFor="new_password" className="text-sm font-medium">New Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyRound className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                            id="new_password"
                            type="password"
                            placeholder="••••••••"
                            className={`pl-10 ${errors.new_password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            {...register("new_password")}
                        />
                    </div>
                    {errors.new_password && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.new_password.message}
                        </p>
                    )}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                    <Label htmlFor="confirm_password" className="text-sm font-medium">Confirm New Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyRound className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                            id="confirm_password"
                            type="password"
                            placeholder="••••••••"
                            className={`pl-10 ${errors.confirm_password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            {...register("confirm_password")}
                        />
                    </div>
                    {errors.confirm_password && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.confirm_password.message}
                        </p>
                    )}
                </div>

                <div className="pt-4 mt-6 flex items-center justify-end border-t border-orange-100 dark:border-orange-900/30">
                    <Button 
                        type="submit" 
                        disabled={!isValid || isSubmitting}
                        className="w-full sm:w-[200px] bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Change Password
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
