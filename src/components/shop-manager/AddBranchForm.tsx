"use client";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Store,
    Mail,
    Phone,
    MapPin,
    Globe,
    AlertCircle,
    Loader2,
    Save,
    GitBranch,
    CheckCircle2,
    FileText,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { addBranch, updateBranch, getBranchDetails } from "@/lib/api/branch";
import { getShopDetails } from "@/lib/api/shop";
import { useLocation } from "@/hooks/useLocation";
import { SearchableSelect } from "@/components/shared/SearchableSelect";

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

const branchSchema = z.object({
    branch_name: z.string().min(2, "Branch name must be at least 2 characters"),
    email: z.string().email("Invalid email address").or(z.literal("")),
    phone: z.string().min(10, "Invalid phone number").or(z.literal("")),
    address: z.string().min(5, "Address must be at least 5 characters"),
    city: z.string().min(2, "City is required"),
    district: z.string().min(2, "District is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().length(6, "Pincode must be 6 digits"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    licence_no: z.string().optional(),
    isActive: z.boolean(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

interface AddBranchFormProps {
    shopId: string;
}

export default function AddBranchForm({ shopId }: AddBranchFormProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const branchId = searchParams.get("branchId");
    const returnTo = searchParams.get("returnTo");
    const isEditMode = !!branchId;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [shopName, setShopName] = useState<string>("");

    const form = useForm<BranchFormValues>({
        resolver: zodResolver(branchSchema),
        defaultValues: {
            branch_name: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            district: "",
            state: "",
            pincode: "",
            latitude: undefined,
            longitude: undefined,
            licence_no: "",
            isActive: true,
        },
    });

    const locations = useLocation();

    // When state changes, load districts instantly (offline)
    const handleStateChange = useCallback((stateName: string) => {
        form.setValue("state", stateName);
        form.setValue("district", "");
        form.setValue("city", "");
        form.setValue("pincode", "");
        locations.selectState(stateName);
    }, [form, locations]);

    // When district changes, load cities (offline)
    const handleDistrictChange = useCallback((districtName: string) => {
        form.setValue("district", districtName);
        form.setValue("city", "");
        form.setValue("pincode", "");
        locations.selectDistrict(districtName);
    }, [form, locations]);

    // When city changes, auto-fill pincode
    const handleCityChange = useCallback((cityName: string) => {
        form.setValue("city", cityName);
        if (cityName) {
            const pincode = locations.lookupPincode(cityName);
            if (pincode) {
                form.setValue("pincode", pincode);
            }
        }
    }, [form, locations]);

    // Fetch shop name for breadcrumbs
    useEffect(() => {
        const fetchShopName = async () => {
            try {
                const response = await getShopDetails(shopId);
                if (response.success && response.data) {
                    const shop = response.data as any;
                    setShopName(shop.shop_name || shop.data?.shop_name || `Shop #${shopId}`);
                }
            } catch {
                setShopName(`Shop #${shopId}`);
            }
        };
        fetchShopName();
    }, [shopId]);

    // Fetch branch details if in edit mode
    useEffect(() => {
        const fetchBranch = async () => {
            if (!branchId) return;
            setIsLoading(true);
            try {
                const response = await getBranchDetails(shopId, branchId);
                if (response.success && response.data) {
                    const branch = response.data as any;
                    const branchData = branch.data || branch;
                    form.reset({
                        branch_name: branchData.branch_name || "",
                        email: branchData.email || "",
                        phone: branchData.phone || "",
                        address: branchData.address || "",
                        city: branchData.city || "",
                        district: branchData.district || "",
                        state: branchData.state || "",
                        pincode: branchData.pincode || "",
                        latitude: branchData.latitude || undefined,
                        longitude: branchData.longitude || undefined,
                        licence_no: branchData.licence_no || "",
                        isActive: branchData.is_active ?? true,
                    });
                } else {
                    toast.error("Failed to load branch details");
                    router.push(`/shop-manager/${shopId}/branches`);
                }
            } catch (error) {
                console.error("Error fetching branch:", error);
                toast.error("Failed to load branch details");
                router.push(`/shop-manager/${shopId}/branches`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBranch();
    }, [branchId, shopId, form, router]);

    const onSubmit = async (values: BranchFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                branch_name: values.branch_name,
                email: values.email || "",
                phone: values.phone,
                address: values.address,
                city: values.city,
                district: values.district,
                state: values.state,
                pincode: values.pincode,
                latitude: values.latitude,
                longitude: values.longitude,
                licence_no: values.licence_no,
                is_active: values.isActive,
            };

            let response;
            if (isEditMode && branchId) {
                response = await updateBranch(shopId, branchId, payload);
            } else {
                response = await addBranch(shopId, payload);
            }

            if (response.success || (response as any).status === "success") {
                toast.success(isEditMode ? "Branch updated!" : "Branch added!");
                router.push(returnTo || `/shop-manager/${shopId}/branches`);
                router.refresh();
            } else {
                const errorMessage = response.error || (response as any).message || "Failed to save branch.";
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Branch submit error:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="mb-8">
                    <div className="h-4 w-48 bg-gray-200 rounded mb-6" />
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-200" />
                        <div>
                            <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
                            <div className="h-4 w-64 bg-gray-200 rounded" />
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-100">
                                <div className="h-5 w-32 bg-gray-200 rounded" />
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="h-20 bg-gray-100 rounded-xl" />
                                <div className="h-20 bg-gray-100 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Header */}
                <div className="mb-8">
                    <Breadcrumbs
                        items={[
                            { label: "Shop Dashboard", href: "/shop-manager" },
                            { label: shopName || "Shop", href: `/shop-manager/${shopId}/branches` },
                            { label: isEditMode ? "Edit Branch" : "Add Branch" }
                        ]}
                    />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                <GitBranch className="w-6 h-6 text-gray-700" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                    {isEditMode ? "Edit Branch" : "Add New Branch"}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {isEditMode ? "Update branch information" : `Create a new branch for ${shopName || "your shop"}`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Branch Info */}
                    <PremiumCard padding="none" className="lg:col-span-8 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                    <Store className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Branch Information</h2>
                                    <p className="text-sm text-gray-600">Basic details about this branch</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6 bg-white">
                            <FormField
                                control={form.control}
                                name="branch_name"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-medium text-gray-700">Branch Name</FormLabel>
                                        <FormControl>
                                            <PremiumInput
                                                placeholder="e.g. Downtown Branch, Mall Outlet"
                                                icon={GitBranch}
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
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-sm font-medium text-gray-700">Branch Email <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (session?.user?.email) {
                                                            form.setValue("email", session.user.email);
                                                            toast.success("Email filled from account");
                                                        } else {
                                                            toast.error("No registered email found");
                                                        }
                                                    }}
                                                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline transition-colors"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Fill from profile
                                                </button>
                                            </div>
                                            <FormControl>
                                                <PremiumInput
                                                    placeholder="branch@example.com"
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
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-sm font-medium text-gray-700">Phone Number <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (session?.user?.phone) {
                                                            form.setValue("phone", session.user.phone);
                                                            toast.success("Phone filled from account");
                                                        } else {
                                                            toast.error("No registered phone found");
                                                        }
                                                    }}
                                                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline transition-colors"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Fill from profile
                                                </button>
                                            </div>
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
                        </div>
                    </PremiumCard>

                    {/* Status & Verification Card */}
                    <PremiumCard padding="none" className="lg:col-span-4 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Status & Verification</h2>
                                    <p className="text-sm text-gray-600">Visibility & compliance</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6 bg-white">
                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 rounded-xl border border-gray-100 bg-orange-50/50">
                                        <FormControl>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                checked={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-sm font-semibold text-gray-900">
                                                Active Branch
                                            </FormLabel>
                                            <FormDescription className="text-[10px] text-gray-500">
                                                Make this branch visible to customers.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    <span className="font-semibold text-gray-700">Tip:</span> Each branch operates independently. You can activate or deactivate branches without affecting the parent shop.
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100"></div>

                            {/* License Section */}
                            <FormField
                                control={form.control}
                                name="licence_no"
                                render={({ field }) => (
                                    <FormItem className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                Branch License Number
                                            </label>
                                        </div>
                                        <FormControl>
                                            <PremiumInput
                                                placeholder="e.g. KER123456"
                                                icon={FileText}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </PremiumCard>

                    {/* Location Details */}
                    <PremiumCard padding="none" className="lg:col-span-12 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Branch Location</h2>
                                    <p className="text-sm text-gray-600">Where is this branch located?</p>
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
                                                className="w-full min-h-[100px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all resize-none text-gray-900 placeholder-gray-500"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* State → District → City → Pincode */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-sm font-medium text-gray-700">State</FormLabel>
                                            <FormControl>
                                                <SearchableSelect
                                                    options={locations.states}
                                                    value={field.value}
                                                    onChange={(val) => handleStateChange(val)}
                                                    placeholder="Select state"
                                                />
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
                                                <SearchableSelect
                                                    options={locations.districts}
                                                    value={field.value}
                                                    onChange={(val) => handleDistrictChange(val)}
                                                    placeholder={form.getValues("state") ? "Select district" : "Select state first"}
                                                    disabled={!form.getValues("state")}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-sm font-medium text-gray-700">City</FormLabel>
                                            <FormControl>
                                                <SearchableSelect
                                                    options={locations.cities.map(c => c.name)}
                                                    value={field.value}
                                                    onChange={(val) => handleCityChange(val)}
                                                    placeholder={form.getValues("district") ? "Select city" : "Select district first"}
                                                    disabled={!form.getValues("district")}
                                                />
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
                                                <PremiumInput
                                                    placeholder="Auto-filled or enter manually"
                                                    maxLength={6}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                <div className="flex items-center gap-2 mb-2 text-gray-700">
                                    <Globe className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm font-semibold">Map Picker</span>
                                </div>
                                <div className="h-[350px] sm:h-[400px] bg-white rounded-lg overflow-hidden border border-gray-100 shadow-inner">
                                    <FormField
                                        control={form.control}
                                        name="latitude"
                                        render={() => (
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

                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <PremiumButton variant="outline" asChild className="rounded-xl">
                        <Link href={`/shop-manager/${shopId}/branches`}>Cancel</Link>
                    </PremiumButton>
                    <PremiumButton
                        type="submit"
                        disabled={isSubmitting || isLoading}
                        className="rounded-xl px-10 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {isEditMode ? "Updating..." : "Creating..."}
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {isEditMode ? "Save Changes" : "Create Branch"}
                            </>
                        )}
                    </PremiumButton>
                </div>
            </form>
        </Form>
    );
}
