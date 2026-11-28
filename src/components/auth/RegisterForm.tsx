"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRegistrationSchema, UserRegistrationFormData } from "@/lib/types/auth";
import { registerShop } from "@/lib/api/shop"; // Reusing the register API logic

export function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<UserRegistrationFormData>({
        resolver: zodResolver(UserRegistrationSchema),
        mode: "onChange",
        defaultValues: {
            full_name: "",
            email: "",
            password: "",
            confirm_password: "",
        },
    });

    const onSubmit = async (data: UserRegistrationFormData) => {
        setIsLoading(true);
        try {
            // Using the existing registerShop API which calls ENDPOINTS.AUTH.REGISTER
            const res = await registerShop({
                full_name: data.full_name,
                email: data.email,
                password: data.password,
                user_type: "USER",
            });

            if (res.success) {
                toast.success("Account created successfully! Please log in.");
                router.push("/login");
            } else {
                toast.error(res.error || "Failed to create account. Please try again.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
            console.error("Registration error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-stone-800 dark:text-slate-200 font-medium text-sm">Full Name</Label>
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-stone-400" />
                    <Input
                        id="full_name"
                        type="text"
                        placeholder="John Doe"
                        className={`pl-11 h-12 bg-[#fcfaf7] dark:bg-slate-950 border-stone-200/90 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-xl text-sm sm:text-base transition-all ${errors.full_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`}
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

            <div className="space-y-1.5">
                <Label htmlFor="email" className="text-stone-800 dark:text-slate-200 font-medium text-sm">Email Address</Label>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-stone-400" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className={`pl-11 h-12 bg-[#fcfaf7] dark:bg-slate-950 border-stone-200/90 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-xl text-sm sm:text-base transition-all ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`}
                        {...register("email")}
                    />
                </div>
                {errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email.message}
                    </p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="password" className="text-stone-800 dark:text-slate-200 font-medium text-sm">Password</Label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-stone-400" />
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`pl-11 pr-12 h-12 bg-[#fcfaf7] dark:bg-slate-950 border-stone-200/90 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-xl text-sm sm:text-base transition-all ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`}
                        {...register("password")}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.password.message}
                    </p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="confirm_password" className="text-stone-800 dark:text-slate-200 font-medium text-sm">Confirm Password</Label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-stone-400" />
                    <Input
                        id="confirm_password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`pl-11 pr-12 h-12 bg-[#fcfaf7] dark:bg-slate-950 border-stone-200/90 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-xl text-sm sm:text-base transition-all ${errors.confirm_password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`}
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

            <button
                type="submit"
                disabled={!isValid || isLoading}
                className="w-full h-12 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 mt-5 cursor-pointer"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        Sign Up
                        <ArrowRight className="w-5 h-5" />
                    </>
                )}
            </button>
        </form>
    );
}
