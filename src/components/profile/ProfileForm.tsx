"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User, Mail, Phone, Loader2, Save, AlertCircle, Store } from "lucide-react";
import { UserProfileFormData, UserProfileSchema, UserProfileResponse } from "@/lib/types/profile";
import { updateProfile } from "@/app/profile/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
        reset
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
                // Reset form with new data to reset isDirty state
                reset(data);
            } else {
                toast.error(result.error || "Failed to update profile.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-200 dark:border-slate-800 p-6 md:p-8 mt-6 overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="mb-8 relative z-10">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                    </div>
                    Personal Information
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 pl-11">
                    Update your profile details and manage your account.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                {/* Full Name */}
                <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                            id="full_name"
                            type="text"
                            placeholder="John Doe"
                            className={`pl-10 ${errors.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            {...register("full_name")}
                        />
                    </div>
                    {errors.full_name && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.full_name.message}
                        </p>
                    )}
                </div>

                {/* Business Name (Only for Shop Owners / Role 2) */}
                {initialData.role === 2 && (
                    <div className="space-y-2">
                        <Label htmlFor="business_name" className="text-sm font-medium">Business Name <span className="text-red-500">*</span></Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Store className="h-5 w-5 text-slate-400" />
                            </div>
                            <Input
                                id="business_name"
                                type="text"
                                placeholder="Your Shop Name"
                                className={`pl-10 ${errors.business_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                {...register("business_name")}
                            />
                        </div>
                        {errors.business_name && (
                            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-4 h-4" />
                                {errors.business_name.message}
                            </p>
                        )}
                    </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            {...register("email")}
                        />
                    </div>
                    {errors.email && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.email.message}
                        </p>
                    )}
                    {emailChanged && !errors.email && (
                        <p className="text-sm text-orange-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            Changing your email requires verification.
                        </p>
                    )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="+1234567890"
                            className={`pl-10 ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            {...register("phone")}
                        />
                    </div>
                    {errors.phone && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.phone.message}
                        </p>
                    )}
                </div>

                <div className="pt-4 mt-6 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
                    <Button 
                        type="submit" 
                        disabled={!isDirty || !isValid || isSubmitting}
                        className="w-full sm:w-[200px] bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
