"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { registerShop } from "@/lib/api/shop";
import { useRouter } from "next/navigation";
import { useRegistration } from "@/hooks/useRegistration";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { Heading, Text, SectionTitle } from "@/components/shared/Typography";
import { Building2, User, Mail, Phone, MapPin, MessageSquare, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    companyName: z.string().min(2, "Company name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    email: z.string().email("Invalid email address"),
    state: z.string().min(2, "State is required"),
    district: z.string().min(2, "District is required"),
    locality: z.string().min(2, "Locality is required"),
    message: z.string().min(10, "Message must be at least 10 characters"),
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
            const response = await registerShop(values);
            if (response.success) {
                toast.success(response.message);
                setRegistrationStatus(true);
                router.push("/shop-manager");
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        }
    }

    return (
        <PremiumCard
            className="max-w-3xl mx-auto group border-primary/10"
            variant="glass"
            padding="none"
        >
            <div className="p-5 md:p-8 lg:p-10">
                <div className="text-center mb-8 md:mb-12 mt-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 mb-4 animate-in fade-in zoom-in duration-500">
                        <Building2 className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                    </div>
                    <Heading className="text-2xl md:text-3xl lg:text-4xl text-gradient mb-3">Register Your Shop</Heading>
                    <Text className="text-sm md:text-base max-w-sm md:max-w-md mx-auto opacity-80">
                        Join our premium discovery platform and reach thousands of daily shoppers.
                    </Text>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 md:space-y-10">
                        {/* Section: Basic Info */}
                        <div className="space-y-6">
                            <SectionTitle className="flex items-center gap-2 mb-0">
                                <User className="w-4 h-4" /> Basic Information
                            </SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field, fieldState: { error } }) => (
                                        <PremiumInput
                                            label="Contact Name"
                                            placeholder="John Doe"
                                            icon={User}
                                            error={error?.message}
                                            {...field}
                                        />
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field, fieldState: { error } }) => (
                                        <PremiumInput
                                            label="Business Name"
                                            placeholder="Artisan Crafts"
                                            icon={Building2}
                                            error={error?.message}
                                            {...field}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Section: Contact Details */}
                        <div className="space-y-6">
                            <SectionTitle className="flex items-center gap-2 mb-0">
                                <Phone className="w-4 h-4" /> Contact Details
                            </SectionTitle>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field, fieldState: { error } }) => (
                                        <PremiumInput
                                            label="Business Email"
                                            placeholder="hello@artisan.com"
                                            type="email"
                                            icon={Mail}
                                            error={error?.message}
                                            {...field}
                                        />
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field, fieldState: { error } }) => (
                                        <PremiumInput
                                            label="Phone Number"
                                            placeholder="+91 98765 43210"
                                            icon={Phone}
                                            error={error?.message}
                                            {...field}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Section: Location */}
                        <div className="space-y-6">
                            <SectionTitle className="flex items-center gap-2 mb-0">
                                <MapPin className="w-4 h-4" /> Location Details
                            </SectionTitle>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({ field, fieldState: { error } }) => (
                                        <PremiumInput
                                            label="State"
                                            placeholder="Kerala"
                                            error={error?.message}
                                            {...field}
                                        />
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="district"
                                    render={({ field, fieldState: { error } }) => (
                                        <PremiumInput
                                            label="District"
                                            placeholder="Ernakulam"
                                            error={error?.message}
                                            {...field}
                                        />
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="locality"
                                    render={({ field, fieldState: { error } }) => (
                                        <PremiumInput
                                            label="Locality"
                                            placeholder="Kochi"
                                            error={error?.message}
                                            {...field}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field, fieldState: { error } }) => (
                                <FormItem>
                                    <div className="space-y-2">
                                        <SectionTitle className="flex items-center gap-2 mb-0 normal-case tracking-normal">
                                            <MessageSquare className="w-3 h-3" /> Tell us what you list
                                        </SectionTitle>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Example: We sell handmade ceramic pottery and lifestyle products..."
                                                className={cn(
                                                    "min-h-[120px] bg-background/40 border-primary/10 focus:border-primary/50 transition-all rounded-xl resize-none p-4",
                                                    error && "border-destructive focus:ring-destructive/20"
                                                )}
                                                {...field}
                                            />
                                        </FormControl>
                                        {error && <p className="text-xs font-medium text-destructive ml-1">{error.message}</p>}
                                    </div>
                                </FormItem>
                            )}
                        />

                        <PremiumButton
                            type="submit"
                            className="w-full h-12 md:h-14 text-base md:text-lg font-semibold"
                            rightIcon={Send}
                            isLoading={form.formState.isSubmitting}
                        >
                            Complete Registration
                        </PremiumButton>
                    </form>
                </Form>

                {/* Subtle bottom accent */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50 mt-10 md:mt-12" />
            </div>
        </PremiumCard>
    );
}
