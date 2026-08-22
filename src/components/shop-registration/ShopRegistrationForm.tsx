"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { registerShop } from "@/lib/api/shop";
import { useRouter } from "next/navigation";
import { Building2, User, Mail, Phone, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { hasSuspiciousPattern } from "@/lib/security";
import OtpVerificationModal from "./OtpVerificationModal";

const generatePassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*";
    const all = lowercase + numbers + special;
    let password = "";
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    for (let i = 3; i < 8; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }
    return password.split("").sort(() => Math.random() - 0.5).join("");
};

const formSchema = z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    business_name: z.string().min(2, "Business name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters").refine(
        (val) => /[0-9]/.test(val),
        "Password must contain at least one number"
    ).refine(
        (val) => /[^a-z0-9]/.test(val),
        "Password must contain at least one special character"
    ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export default function ShopRegistrationForm() {
    type FormValues = z.infer<typeof formSchema>;
    type RegisterPayload = Omit<FormValues, "confirmPassword">;

    const router = useRouter();
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [userId, setUserId] = useState<number | undefined>(undefined);
    const [pendingValues, setPendingValues] = useState<RegisterPayload | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            full_name: "",
            business_name: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values: FormValues) {
        const { confirmPassword, ...payloadValues } = values;
        if (Object.values(payloadValues).some(val => hasSuspiciousPattern(val))) {
            toast.error("Suspicious active content detected. Please review your input.");
            return;
        }

        setPendingValues(payloadValues);

        const response = await registerShop({
            ...payloadValues,
            user_type: "BUSINESS"
        });
        if (response.success) {
            const anyData = response.data as any;
            const extractedId = anyData?.id || anyData?.data?.id || anyData?.user?.id;
            console.log("[Registration] Extracted ID:", extractedId, "Raw response:", response);
            setUserId(extractedId ? Number(extractedId) : undefined);
            setShowOtpModal(true);
        } else {
            toast.error(response.error || "Registration failed. Please try again.");
        }
    }

    async function handleOtpVerified() {
        setShowOtpModal(false);
        toast.success("Shop registered successfully! Please log in.");
        router.push("/login");
    }

    const inputClassName = "pl-12 h-12 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl text-base";
    const labelClassName = "text-gray-700 font-medium";

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4" /> Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field, fieldState: { error } }) => (
                                <div className="space-y-2">
                                    <Label className={labelClassName}>Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            placeholder="John Doe"
                                            className={inputClassName}
                                            {...field}
                                        />
                                    </div>
                                    <div className={`grid transition-all duration-300 ease-in-out ${error ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <p className="text-xs text-red-500 pt-1.5">{error?.message}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="business_name"
                            render={({ field, fieldState: { error } }) => (
                                <div className="space-y-2">
                                    <Label className={labelClassName}>Business Name</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            placeholder="Artisan Crafts"
                                            className={inputClassName}
                                            {...field}
                                        />
                                    </div>
                                    <div className={`grid transition-all duration-300 ease-in-out ${error ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <p className="text-xs text-red-500 pt-1.5">{error?.message}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Contact Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field, fieldState: { error } }) => (
                                <div className="space-y-2">
                                    <Label className={labelClassName}>Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type="email"
                                            placeholder="hello@artisan.com"
                                            className={inputClassName}
                                            {...field}
                                        />
                                    </div>
                                    <div className={`grid transition-all duration-300 ease-in-out ${error ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <p className="text-xs text-red-500 pt-1.5">{error?.message}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field, fieldState: { error } }) => (
                                <div className="space-y-2">
                                    <Label className={labelClassName}>Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            placeholder="+91 98765 43210"
                                            className={inputClassName}
                                            {...field}
                                        />
                                    </div>
                                    <div className={`grid transition-all duration-300 ease-in-out ${error ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <p className="text-xs text-red-500 pt-1.5">{error?.message}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Security
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field, fieldState: { error } }) => (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between h-5">
                                        <Label className={labelClassName}>Password</Label>
                                        <button
                                            type="button"
                                            className="text-xs text-orange-600 hover:text-orange-700 hover:underline whitespace-nowrap font-medium"
                                            onClick={() => {
                                                const newPassword = generatePassword();
                                                form.setValue("password", newPassword);
                                                form.setValue("confirmPassword", newPassword);
                                                setShowPassword(true);
                                                setShowConfirmPassword(true);
                                            }}
                                        >
                                            Generate Password
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Minimum 6 characters"
                                            className={inputClassName}
                                            {...field}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-orange-500"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    <div className={`grid transition-all duration-300 ease-in-out ${error ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <p className="text-xs text-red-500 pt-1.5">{error?.message}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field, fieldState: { error } }) => (
                                <div className="space-y-1.5">
                                    <div className="flex items-center h-5">
                                        <Label className={labelClassName}>Confirm Password</Label>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Re-enter password"
                                            className={inputClassName}
                                            {...field}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-orange-500"
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    <div className={`grid transition-all duration-300 ease-in-out ${error ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <p className="text-xs text-red-500 pt-1.5">{error?.message}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={form.formState.isSubmitting || !form.formState.isValid}
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                    {form.formState.isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            Continue
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>

                <OtpVerificationModal
                    open={showOtpModal}
                    onOpenChange={setShowOtpModal}
                    email={form.getValues("email")}
                    userId={userId}
                    onVerified={handleOtpVerified}
                    isSubmitting={form.formState.isSubmitting}
                />
            </form>
        </Form>
    );
}
