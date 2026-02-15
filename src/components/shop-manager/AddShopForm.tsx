"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Store,
    Upload,
    Mail,
    Phone,
    MapPin,
    Globe,
    CheckCircle2,
    AlertCircle,
    FileText,
    Loader2,
    ChevronLeft,
    Save,
    Building2,
    Settings
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { addShop, updateShop, getShopDetails } from "@/lib/api/shop";
import { Shop } from "@/lib/types/shop";

const MapPicker = dynamic(() => import("@/components/shared/MapPicker"), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Loading Map...</div>
});

import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { PremiumButton } from "@/components/shared/PremiumButton";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    shop_name: z.string().min(2, "Shop name must be at least 2 characters"),
    description: z.string().min(10, "Please tell us a bit more about what you list"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Invalid phone number"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    city: z.string().min(2, "City is required"),
    district: z.string().min(2, "District is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().length(6, "Pincode must be 6 digits"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isActive: z.boolean(),
    logo: z.any().optional(),
    license: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddShopForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const shopId = searchParams.get('id');
    const isEditMode = !!shopId;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            shop_name: "",
            description: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            district: "",
            state: "",
            pincode: "",
            latitude: undefined,
            longitude: undefined,
            isActive: true,
        },
    });

    // Fetch shop details if in edit mode
    useEffect(() => {
        const fetchShopDetails = async () => {
            if (!shopId) return;

            setIsLoading(true);
            try {
                const response = await getShopDetails(shopId);

                if (response.success && response.data) {
                    const shop = response.data as Shop;

                    // Populate form with existing data
                    form.reset({
                        shop_name: shop.shop_name || "",
                        description: shop.description || "",
                        email: shop.email || "",
                        phone: shop.phone || "",
                        address: shop.address || "",
                        city: shop.city || "",
                        district: shop.district || "",
                        state: shop.state || "",
                        pincode: shop.pincode || "",
                        latitude: shop.latitude || undefined,
                        longitude: shop.longitude || undefined,
                        isActive: shop.is_active ?? true,
                    });

                    // Set logo preview if exists
                    if (shop.logo_url) {
                        setLogoPreview(shop.logo_url);
                    }
                } else {
                    toast.error("Failed to load shop details");
                    router.push("/shop-manager");
                }
            } catch (error) {
                console.error("Error fetching shop details:", error);
                toast.error("Failed to load shop details");
                router.push("/shop-manager");
            } finally {
                setIsLoading(false);
            }
        };

        fetchShopDetails();
    }, [shopId, form, router]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        console.log("File selected:", file);
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                console.log("Reader result:", reader.result ? "Result exists" : "No result");
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            console.log("Submitting values:", values);
            console.log("Edit mode:", isEditMode, "Shop ID:", shopId);

            // Construct FormData as per CURL spec
            const formData = new FormData();
            formData.append("shop_name", values.shop_name);
            formData.append("email", values.email || "");
            formData.append("latitude", values.latitude?.toString() || "");
            formData.append("longitude", values.longitude?.toString() || "");
            formData.append("state", values.state);
            formData.append("district", values.district);
            formData.append("city", values.city);
            formData.append("pincode", values.pincode);
            formData.append("address", values.address);
            formData.append("phone", values.phone);

            if (logoFile) {
                formData.append("file", logoFile);
            }

            formData.append("is_active", values.isActive.toString());

            console.log("FormData contents:");
            for (const [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            let response;
            if (isEditMode && shopId) {
                console.log("Calling updateShop with ID:", shopId);
                response = await updateShop(shopId, formData);
            } else {
                console.log("Calling addShop");
                response = await addShop(formData);
            }

            console.log("API Response:", response);

            if (response.success || (response as any).status === "success" || (response as any).status === 200) {
                toast.success(isEditMode ? "Shop updated successfully!" : "Shop added successfully!");
                router.push("/shop-manager");
                router.refresh();
            } else {
                const errorMessage = response.error || (response as any).message || `Failed to ${isEditMode ? 'update' : 'add'} shop. Please check the details.`;
                console.error("API Error:", errorMessage);
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error(`${isEditMode ? 'Update' : 'Add'} shop error:`, error);
            toast.error("An unexpected error occurred. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                {/* Page Header Skeleton */}
                <div className="mb-8">
                    <div className="h-4 w-48 bg-gray-200 rounded mb-6"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                            <div>
                                <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
                                <div className="h-4 w-64 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        <div className="h-12 w-40 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>

                {/* Form Cards Skeleton */}
                <div className="space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
                                <div>
                                    <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                                    <div className="h-3 w-48 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="h-20 bg-gray-100 rounded-xl"></div>
                            <div className="h-20 bg-gray-100 rounded-xl"></div>
                        </div>
                    </div>

                    {/* Contact Info Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
                                <div>
                                    <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                                    <div className="h-3 w-48 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="h-20 bg-gray-100 rounded-xl"></div>
                                <div className="h-20 bg-gray-100 rounded-xl"></div>
                            </div>
                        </div>
                    </div>

                    {/* Location Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
                                <div>
                                    <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                                    <div className="h-3 w-48 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="h-[450px] bg-gray-100 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="mb-8">
                    <Breadcrumbs
                        items={[
                            { label: "Shop Dashboard", href: "/shop-manager" },
                            { label: isEditMode ? "Edit Shop" : "Add New Shop" }
                        ]}
                    />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                <Building2 className="w-6 h-6 text-gray-700" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                    {isEditMode ? "Edit Shop" : "Add New Shop"}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {isEditMode ? "Update your shop information" : "Register a new business branch or location"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* General Information Section */}
                    <PremiumCard padding="none" className="lg:col-span-8 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Store className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">General Information</h2>
                                    <p className="text-sm text-gray-600">Tell us about your shop and what you offer</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6 bg-white">
                            <FormField
                                control={form.control}
                                name="shop_name"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-medium text-gray-700">Shop Name</FormLabel>
                                        <FormControl>
                                            <PremiumInput
                                                placeholder="Enter shop name"
                                                icon={Store}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-sm font-medium text-gray-700">Shop Email</FormLabel>
                                            <FormControl>
                                                <PremiumInput
                                                    placeholder="shop@example.com"
                                                    icon={Mail}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-sm font-medium text-gray-700">Phone Number</FormLabel>
                                            <FormControl>
                                                <PremiumInput
                                                    placeholder="+91 00000 00000"
                                                    icon={Phone}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-medium text-gray-700">Tell us what you list</FormLabel>
                                        <FormControl>
                                            <textarea
                                                placeholder="Describe the items or services you provide..."
                                                className="w-full min-h-[120px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none text-gray-900 placeholder-gray-500"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">A brief description helps customers find you.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            /> */}
                        </div>
                    </PremiumCard>

                    {/* Shop Logo Section */}
                    <PremiumCard padding="none" className="lg:col-span-4 overflow-hidden">
                        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                    <Upload className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Shop Logo</h2>
                                    <p className="text-sm text-gray-600">Represent your brand</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-8 flex flex-col items-center justify-center space-y-3 sm:space-y-4 bg-white">
                            <div className={cn(
                                "w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 transition-all hover:border-blue-400 group relative",
                                logoPreview && "border-solid"
                            )}>
                                {logoPreview ? (
                                    <>
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 z-0">
                                            <Store className="w-10 h-10 sm:w-12 sm:h-12" />
                                        </div>
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className="w-full h-full object-cover relative z-10"
                                            onError={(e) => {
                                                console.error("Image load error:", e);
                                                // (e.currentTarget as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </>
                                ) : (
                                    <Store className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />
                                )}
                            </div>
                            <div className="w-full">
                                <label htmlFor="logo-upload" className="cursor-pointer">
                                    <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                                        <Upload className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2 text-gray-600" />
                                        <span className="text-xs sm:text-sm font-medium text-gray-700">Select Logo</span>
                                    </div>
                                </label>
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                            </div>
                        </div>
                    </PremiumCard>

                    {/* Location Details Section */}
                    <PremiumCard padding="none" className="lg:col-span-8 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Location Details</h2>
                                    <p className="text-sm text-gray-600">Where can customers find your business?</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6 bg-white">
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-medium text-gray-700">Full Address</FormLabel>
                                        <FormControl>
                                            <textarea
                                                placeholder="Shop no, Building, Street..."
                                                className="w-full min-h-[100px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none text-gray-900 placeholder-gray-500"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-sm font-medium text-gray-700">City</FormLabel>
                                            <FormControl>
                                                <PremiumInput placeholder="Enter city" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="district"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-sm font-medium text-gray-700">District</FormLabel>
                                            <FormControl>
                                                <PremiumInput placeholder="Enter district" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-sm font-medium text-gray-700">State</FormLabel>
                                            <FormControl>
                                                <PremiumInput placeholder="Enter state" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pincode"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-sm font-medium text-gray-700">Pincode</FormLabel>
                                            <FormControl>
                                                <PremiumInput placeholder="6-digit code" maxLength={6} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2 text-gray-700">
                                    <Globe className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-semibold">Map Picker</span>
                                </div>
                                <div className="h-[350px] sm:h-[450px] bg-white rounded-lg overflow-hidden border border-gray-100 shadow-inner">
                                    <FormField
                                        control={form.control}
                                        name="latitude"
                                        render={({ field }) => (
                                            <FormControl>
                                                <MapPicker
                                                    value={form.getValues("latitude") && form.getValues("longitude") ? {
                                                        lat: form.getValues("latitude") as number,
                                                        lng: form.getValues("longitude") as number
                                                    } : undefined}
                                                    onChange={(coords) => {
                                                        form.setValue("latitude", coords.lat);
                                                        form.setValue("longitude", coords.lng);
                                                    }}
                                                />
                                            </FormControl>
                                        )}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Coordinates: {form.watch("latitude")?.toFixed(4) || "0"}, {form.watch("longitude")?.toFixed(4) || "0"}
                                </p>
                            </div>
                        </div>
                    </PremiumCard>

                    {/* Verification & Status Section */}
                    <PremiumCard padding="none" className="lg:col-span-4 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Verification</h2>
                                    <p className="text-sm text-gray-600">Business compliance</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6 bg-white">
                            <div className="space-y-4 opacity-60 grayscale pointer-events-none">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700">Shop License</label>
                                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Coming Soon</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 transition-all group">
                                    <FileText className="w-10 h-10 mb-2 text-gray-300" />
                                    <span className="text-xs text-center text-gray-500 mb-4 px-2">
                                        Upload trade license or certificate (PDF, JPG, PNG)
                                    </span>
                                    <PremiumButton type="button" variant="outline" size="sm" className="rounded-full bg-white" disabled>
                                        Select File
                                    </PremiumButton>
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 rounded-xl border border-gray-100 bg-blue-50/50">
                                        <FormControl>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-sm font-semibold text-gray-900">
                                                Active Shop
                                            </FormLabel>
                                            <FormDescription className="text-[10px] text-gray-500">
                                                Go live immediately.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </PremiumCard>
                </div>

                <div className="flex justify-end gap-4">
                    <PremiumButton variant="outline" asChild className="rounded-xl">
                        <Link href="/shop-manager">Cancel</Link>
                    </PremiumButton>
                    <PremiumButton
                        type="submit"
                        disabled={isSubmitting || isLoading}
                        className="rounded-xl px-10 bg-blue-600 hover:bg-blue-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {isEditMode ? "Updating..." : "Registering..."}
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {isEditMode ? "Save Changes" : "Register Shop"}
                            </>
                        )}
                    </PremiumButton>
                </div>
            </form>
        </Form>
    );
}
