"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { registerShop } from "@/lib/api/shop";
import { useRouter } from "next/navigation";
import { useRegistration } from "@/hooks/useRegistration";
import { Building2, User, Mail, Phone, MapPin, MessageSquare, ArrowRight } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    companyName: z.string().min(2, "Company name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    email: z.string().email("Invalid email address"),
    state: z.string().min(2, "State is required"),
    district: z.string().min(2, "District is required"),
    locality: z.string().min(2, "Locality is required"),
    message: z.string().optional(),
});

export default function ShopRegistrationForm() {
    const router = useRouter();
    const { setRegistrationStatus } = useRegistration();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            companyName: "",
            phone: "",
            email: "",
            state: "",
            district: "",
            locality: "",
            message: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const response = await registerShop({ ...values, message: values.message || "" });
            if (response.success) {
                toast.success(response.message);
                setRegistrationStatus(true);
                router.push("/shop-manager");
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        }
    }

    const inputClassName = "pl-12 h-12 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl text-base";
    const labelClassName = "text-gray-700 font-medium";

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4" /> Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field, fieldState: { error } }) => (
                                <div className="space-y-2">
                                    <Label className={labelClassName}>Contact Name</Label>
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
                            name="companyName"
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

                {/* Contact Details */}
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
                                    <Label className={labelClassName}>Business Email</Label>
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

                {/* Location Details */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Location Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="state"
                            render={({ field, fieldState: { error } }) => (
                                <div className="space-y-2">
                                    <Label className={labelClassName}>State</Label>
                                    <Input
                                        placeholder="Kerala"
                                        className="h-12 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl text-base"
                                        {...field}
                                    />
                                    {error && <p className="text-xs text-red-500">{error.message}</p>}
                                </div>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="district"
                            render={({ field, fieldState: { error } }) => (
                                <div className="space-y-2">
                                    <Label className={labelClassName}>District</Label>
                                    <Input
                                        placeholder="Ernakulam"
                                        className="h-12 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl text-base"
                                        {...field}
                                    />
                                    {error && <p className="text-xs text-red-500">{error.message}</p>}
                                </div>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="locality"
                            render={({ field, fieldState: { error } }) => (
                                <div className="space-y-2">
                                    <Label className={labelClassName}>Locality</Label>
                                    <Input
                                        placeholder="Kochi"
                                        className="h-12 bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl text-base"
                                        {...field}
                                    />
                                    {error && <p className="text-xs text-red-500">{error.message}</p>}
                                </div>
                            )}
                        />
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Tell us what you list
                    </h3>
                    <FormField
                        control={form.control}
                        name="message"
                        render={({ field, fieldState: { error } }) => (
                            <div className="space-y-2">
                                <Textarea
                                    placeholder="Example: We sell handmade ceramic pottery and lifestyle products..."
                                    className="min-h-[100px] bg-gray-50 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl text-base resize-none p-4"
                                    {...field}
                                />
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
            </form>
        </Form>
    );
}
