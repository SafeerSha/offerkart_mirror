"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { registerShop } from "@/lib/api/shop";
import { useRouter } from "next/navigation";
import { Building2, User, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import { hasSuspiciousPattern } from "@/lib/security";
import OtpVerificationModal from "./OtpVerificationModal";

const formSchema = z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    business_name: z.string().min(2, "Business name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(4, "Password must be at least 4 characters"),
});

export default function ShopRegistrationForm() {
    const router = useRouter();
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [pendingValues, setPendingValues] = useState<z.infer<typeof formSchema> | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            full_name: "",
            business_name: "",
            email: "",
            phone: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const payloadValues = Object.values(values);
        if (payloadValues.some(val => hasSuspiciousPattern(val))) {
            toast.error("Suspicious active content detected. Please review your input.");
            return;
        }
        setPendingValues(values);
        setShowOtpModal(true);
    }

    async function handleOtpVerified() {
        if (!pendingValues) return;

        const response = await registerShop(pendingValues);
        if (response.success) {
            setShowOtpModal(false);
            toast.success(response.message || "Shop registered successfully! Please log in.");
            router.push("/login");
        } else {
            setShowOtpModal(false);
            toast.error(response.error || "Something went wrong. Please try again.");
        }
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
                                    {error && <p className="text-xs text-red-500">{error.message}</p>}
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
                                    {error && <p className="text-xs text-red-500">{error.message}</p>}
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
                                    {error && <p className="text-xs text-red-500">{error.message}</p>}
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
                                    {error && <p className="text-xs text-red-500">{error.message}</p>}
                                </div>
                            )}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Security
                    </h3>
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field, fieldState: { error } }) => (
                            <div className="space-y-2">
                                <Label className={labelClassName}>Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        type="password"
                                        placeholder="Min 4 characters"
                                        className={inputClassName}
                                        {...field}
                                    />
                                </div>
                                {error && <p className="text-xs text-red-500">{error.message}</p>}
                            </div>
                        )}
                    />
                </div>

                <button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                    {form.formState.isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            Complete Registration
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>

                <OtpVerificationModal
                    open={showOtpModal}
                    onOpenChange={setShowOtpModal}
                    email={form.getValues("email")}
                    phone={form.getValues("phone")}
                    onVerified={handleOtpVerified}
                    isSubmitting={form.formState.isSubmitting}
                />
            </form>
        </Form>
    );
}
