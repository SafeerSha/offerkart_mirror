"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { Heading, Text } from "@/components/shared/Typography";
import {
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Save,
    Camera,
    Upload,
    Search as SearchIcon,
    ChevronDown,
    X,
    Settings
} from "lucide-react";
import { toast } from "sonner";
import { updateShop } from "@/lib/api/shop";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ImagePreviewModal } from "@/components/shared/ImagePreviewModal";

export default function ShopSettingsForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [formData, setFormData] = useState({
        // Shop Details
        companyName: "Artisan Crafts",
        contactName: "John Doe",
        email: "john@artisancrafts.com",
        phone: "+91 9876543210",
        state: "Maharashtra",
        district: "Mumbai",
        locality: "Andheri West",
        description: "Premium handmade crafts and artisanal products",
        logo: null as string | null,

        // Login Credentials
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [indiaData, setIndiaData] = useState<{ [state: string]: string[] }>({});
    const [showStateSuggestions, setShowStateSuggestions] = useState(false);
    const [showDistrictSuggestions, setShowDistrictSuggestions] = useState(false);

    const stateContainerRef = useRef<HTMLDivElement>(null);
    const districtContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (stateContainerRef.current && !stateContainerRef.current.contains(event.target as Node)) {
                setShowStateSuggestions(false);
            }
            if (districtContainerRef.current && !districtContainerRef.current.contains(event.target as Node)) {
                setShowDistrictSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchIndiaData = async () => {
            try {
                const response = await fetch("https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json");
                const data = await response.json();
                const formattedData: { [state: string]: string[] } = {};
                data.states.forEach((stateObj: any) => {
                    formattedData[stateObj.state] = stateObj.districts;
                });
                setIndiaData(formattedData);
            } catch (error) {
                console.error("Error fetching India data:", error);
            }
        };
        fetchIndiaData();
    }, []);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Basic validation
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            toast.error("New passwords do not match");
            setIsSubmitting(false);
            return;
        }

        try {
            // Construct FormData as per CURL spec
            const body = new FormData();
            body.append("shop_name", formData.companyName);
            body.append("latitude", "10.8505"); // Default from CURL
            body.append("longitude", "76.2711"); // Default from CURL
            body.append("state", formData.state);
            body.append("district", formData.district);
            body.append("city", formData.locality);
            body.append("pincode", "682001"); // Default from CURL
            body.append("address", formData.locality);
            body.append("phone", formData.phone);
            body.append("is_active", "true");

            if (logoFile) {
                body.append("file", logoFile);
            }

            // Using dummy ID "1" as in CURL or could be from session/props
            const shopId = "1";
            const response = await updateShop(shopId, body);

            if (response.success || (response as any).status === "success") {
                setIsSuccess(true);
                toast.success("Shop settings updated successfully!");

                setTimeout(() => {
                    router.push("/shop-manager?tab=shops");
                }, 500);
            } else {
                toast.error(response.error || "Failed to update shop settings. Please try again.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again later.");
            console.error("Update shop error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="mb-8">
                <Breadcrumbs
                    items={[
                        { label: "Shop Dashboard", href: "/shop-manager" },
                        { label: "Business Settings" }
                    ]}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                            <Settings className="w-6 h-6 text-gray-700" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Business Settings</h1>
                            <p className="text-gray-600 mt-1">Update your shop information and security settings</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <PremiumButton
                            type="submit"
                            disabled={isSubmitting}
                            leftIcon={isSubmitting ? Loader2 : isSuccess ? CheckCircle2 : Save}
                            className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all min-w-[160px]"
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? "Updating..." : isSuccess ? "Updated!" : "Save Changes"}
                        </PremiumButton>
                    </div>
                </div>
            </div>

            {/* Two Column Layout for Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-stretch">
                {/* Business Information Section */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden lg:col-span-2 lg:h-full">
                    <div className="px-8 py-6 border-b border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Shop Information</h2>
                                    <p className="text-sm text-gray-600">Update your shop details and contact information</p>
                                </div>
                            </div>

                            {/* Logo Upload Section */}
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                                        {formData.logo ? (
                                            <Image
                                                src={formData.logo}
                                                alt="Shop Logo"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <Building2 className="w-8 h-8 text-gray-300" />
                                        )}
                                        <div
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            onClick={() => setIsPreviewOpen(true)}
                                        >
                                            <Eye className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Shop Logo</p>
                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors flex items-center gap-1"
                                        >
                                            <Upload className="w-3 h-3" />
                                            Update Logo
                                        </button>
                                        {formData.logo && (
                                            <button
                                                type="button"
                                                onClick={() => setIsPreviewOpen(true)}
                                                className="text-xs text-gray-600 font-semibold hover:text-gray-900 transition-colors flex items-center gap-1"
                                            >
                                                <Eye className="w-3 h-3" />
                                                View Large
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {formData.logo && (
                                    <ImagePreviewModal
                                        src={formData.logo}
                                        alt="Shop Logo"
                                        isOpen={isPreviewOpen}
                                        onClose={() => setIsPreviewOpen(false)}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Shop Name</label>
                                <PremiumInput
                                    placeholder="Enter shop name"
                                    value={formData.companyName}
                                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                                    icon={Building2}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Contact Person</label>
                                <PremiumInput
                                    placeholder="Enter contact name"
                                    value={formData.contactName}
                                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                                    icon={User}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email Address</label>
                                <PremiumInput
                                    type="email"
                                    placeholder="Enter email address"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    icon={Mail}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                <PremiumInput
                                    placeholder="Enter phone number"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                    icon={Phone}
                                    required
                                />
                            </div>

                            <div className="space-y-2 relative" ref={stateContainerRef}>
                                <label className="text-sm font-medium text-gray-700">State</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                                    <input
                                        type="text"
                                        placeholder="Search or select state..."
                                        value={formData.state}
                                        onChange={(e) => {
                                            handleInputChange("state", e.target.value);
                                            handleInputChange("district", "");
                                            setShowStateSuggestions(true);
                                        }}
                                        onFocus={() => setShowStateSuggestions(true)}
                                        className="w-full pl-12 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-900 placeholder-gray-500"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        {formData.state && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleInputChange("state", "");
                                                    handleInputChange("district", "");
                                                    setShowStateSuggestions(false);
                                                }}
                                                className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <ChevronDown className={cn(
                                            "w-4 h-4 text-gray-400 transition-transform",
                                            showStateSuggestions && "rotate-180"
                                        )} />
                                    </div>
                                </div>

                                {showStateSuggestions && (
                                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="max-h-60 overflow-y-auto py-1">
                                            {Object.keys(indiaData)
                                                .filter(s => s.toLowerCase().includes(formData.state.toLowerCase()))
                                                .map(state => (
                                                    <div
                                                        key={state}
                                                        onClick={() => {
                                                            handleInputChange("state", state);
                                                            handleInputChange("district", "");
                                                            setShowStateSuggestions(false);
                                                        }}
                                                        className={cn(
                                                            "px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors",
                                                            formData.state === state && "bg-blue-50 text-blue-700 font-medium"
                                                        )}
                                                    >
                                                        {state}
                                                    </div>
                                                ))}
                                            {Object.keys(indiaData).filter(s => s.toLowerCase().includes(formData.state.toLowerCase())).length === 0 && (
                                                <div className="px-4 py-4 text-center text-sm text-gray-500 italic">
                                                    No states found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 relative" ref={districtContainerRef}>
                                <label className="text-sm font-medium text-gray-700">District</label>
                                <div className={cn(
                                    "relative",
                                    !formData.state && "opacity-50 cursor-not-allowed"
                                )}>
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                                    <input
                                        type="text"
                                        placeholder={formData.state ? "Search or select district..." : "Select a state first"}
                                        value={formData.district}
                                        onChange={(e) => {
                                            handleInputChange("district", e.target.value);
                                            setShowDistrictSuggestions(true);
                                        }}
                                        onFocus={() => formData.state && setShowDistrictSuggestions(true)}
                                        disabled={!formData.state}
                                        className="w-full pl-12 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-900 placeholder-gray-500"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        {formData.district && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleInputChange("district", "");
                                                    setShowDistrictSuggestions(false);
                                                }}
                                                className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <ChevronDown className={cn(
                                            "w-4 h-4 text-gray-400 transition-transform",
                                            showDistrictSuggestions && "rotate-180"
                                        )} />
                                    </div>
                                </div>

                                {showDistrictSuggestions && formData.state && (
                                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="max-h-60 overflow-y-auto py-1">
                                            {indiaData[formData.state]
                                                ?.filter(d => d.toLowerCase().includes(formData.district.toLowerCase()))
                                                .map(district => (
                                                    <div
                                                        key={district}
                                                        onClick={() => {
                                                            handleInputChange("district", district);
                                                            setShowDistrictSuggestions(false);
                                                        }}
                                                        className={cn(
                                                            "px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors",
                                                            formData.district === district && "bg-blue-50 text-blue-700 font-medium"
                                                        )}
                                                    >
                                                        {district}
                                                    </div>
                                                ))}
                                            {(!indiaData[formData.state] || indiaData[formData.state].filter(d => d.toLowerCase().includes(formData.district.toLowerCase())).length === 0) && (
                                                <div className="px-4 py-4 text-center text-sm text-gray-500 italic">
                                                    No districts found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Locality</label>
                            <PremiumInput
                                placeholder="Enter locality/area"
                                value={formData.locality}
                                onChange={(e) => handleInputChange("locality", e.target.value)}
                                icon={MapPin}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Shop Description</label>
                            <textarea
                                placeholder="Describe your shop..."
                                value={formData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                className="w-full min-h-[120px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none text-gray-900 placeholder-gray-500"
                                required
                            />
                        </div>
                    </form>
                </div>

                {/* Security Settings Section */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden lg:col-span-1 lg:h-full">
                    <div className="px-8 py-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                                <p className="text-sm text-gray-600">Update your login credentials and security preferences</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Current Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Current Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Enter current password"
                                    value={formData.currentPassword}
                                    onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-900 placeholder-gray-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Enter new password (leave empty to keep current)"
                                    value={formData.newPassword}
                                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-900 placeholder-gray-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm New Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-900 placeholder-gray-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
