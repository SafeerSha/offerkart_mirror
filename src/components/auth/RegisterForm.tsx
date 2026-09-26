"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="full_name" className="text-gray-700 font-medium">Full Name</Label>
                <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        id="full_name"
                        type="text"
                        placeholder="John Doe"
                        className={`pl-12 h-12 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl text-base ${errors.full_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
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

            <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className={`pl-12 h-12 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl text-base ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
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

            <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`pl-12 pr-12 h-12 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl text-base ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        {...register("password")}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.password.message}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-gray-700 font-medium">Confirm Password</Label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        id="confirm_password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`pl-12 pr-12 h-12 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl text-base ${errors.confirm_password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
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
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 mt-6"
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
