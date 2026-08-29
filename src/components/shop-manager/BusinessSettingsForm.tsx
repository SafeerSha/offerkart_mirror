"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumInput } from "@/components/shared/PremiumInput";
import {
    Building2,
    User,
    Mail,
    Phone,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    Loader2,
    Save,
    Briefcase
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function BusinessSettingsForm() {
    const router = useRouter();
    const { data: session } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    type SessionUser = {
        business_name?: string | null;
        full_name?: string | null;
        email?: string | null;
        phone?: string | null;
    } & Record<string, unknown>;
    const user = session?.user as SessionUser | undefined;

    const [formData, setFormData] = useState({
        // Business Details (matching registration form)
        fullName: "John Doe",
        businessName: "Artisan Crafts",
        email: "john@artisancrafts.com",
        phone: "+91 9876543210",

        // Security / Password Settings
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.full_name || prev.fullName,
                businessName: user.business_name || prev.businessName,
                email: user.email || prev.email,
                phone: user.phone || prev.phone,
            }));
        }
    }, [user]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Password validation if attempting to change password
        if (formData.newPassword) {
            if (formData.newPassword.length < 6) {
                toast.error("New password must be at least 6 characters long");
                setIsSubmitting(false);
                return;
            }
            if (formData.newPassword !== formData.confirmPassword) {
                toast.error("New passwords do not match");
                setIsSubmitting(false);
                return;
            }
            if (!formData.currentPassword) {
                toast.error("Please enter your current password to set a new password");
                setIsSubmitting(false);
                return;
            }
        }

        try {
            // Simulated / API submission
            await new Promise(resolve => setTimeout(resolve, 800));

            setIsSuccess(true);
            toast.success("Business details updated successfully!");

            setTimeout(() => {
                setIsSuccess(false);
            }, 3000);
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again later.");
            console.error("Update business details error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Page Header */}
            <div>
                <div className="mb-2">
                    <Breadcrumbs
                        items={[
                            { label: "Manage Shop", href: "/shop-manager" },
                            { label: "Business Details" }
                        ]}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-xs text-orange-500 shrink-0">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">Business Details</h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Update your business information and security credentials</p>
                    </div>
                </div>
            </div>

            {/* Two Column Layout for Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:items-stretch">
                {/* Business Information Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden lg:col-span-2 flex flex-col">
                    <div className="p-5 space-y-4 flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Person Name / Full Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-700">Full Name</label>
                                <PremiumInput
                                    placeholder="e.g. John Doe"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                                    icon={User}
                                    className="h-10 text-sm"
                                    required
                                />
                            </div>

                            {/* Business Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-700">Business Name</label>
                                <PremiumInput
                                    placeholder="e.g. Artisan Crafts"
                                    value={formData.businessName}
                                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                                    icon={Building2}
                                    className="h-10 text-sm"
                                    required
                                />
                            </div>

                            {/* Email Address */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-700">Email Address</label>
                                <PremiumInput
                                    type="email"
                                    placeholder="e.g. hello@artisan.com"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    icon={Mail}
                                    className="h-10 text-sm"
                                    required
                                />
                            </div>

                            {/* Mobile / Phone Number */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-700">Mobile Number</label>
                                <PremiumInput
                                    placeholder="e.g. +91 98765 43210"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                    icon={Phone}
                                    className="h-10 text-sm"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Settings Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden lg:col-span-1 flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                            <Lock className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 leading-none">Security Settings</h2>
                            <p className="text-xs text-gray-500 mt-1">Update login credentials and password</p>
                        </div>
                    </div>

                    <div className="p-5 space-y-3.5 flex-1">
                        {/* Current Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-700">Current Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Enter current password"
                                    value={formData.currentPassword}
                                    onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                                    className="w-full pl-9 pr-10 h-10 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-gray-900 placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-700">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    value={formData.newPassword}
                                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                                    className="w-full pl-9 pr-10 h-10 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-gray-900 placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm New Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-700">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                    className="w-full pl-9 pr-10 h-10 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-gray-900 placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions Bar (Single Row, Compact) */}
            <div className="flex flex-row items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                    type="button"
                    onClick={() => router.push("/shop-manager")}
                    className="flex-1 sm:flex-initial px-5 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors cursor-pointer text-center text-sm whitespace-nowrap"
                >
                    Cancel
                </button>
                <PremiumButton
                    type="submit"
                    disabled={isSubmitting}
                    leftIcon={isSubmitting ? Loader2 : isSuccess ? CheckCircle2 : Save}
                    className="flex-1 sm:flex-initial px-6 h-10 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-xs hover:shadow-sm transition-all min-w-[130px] sm:min-w-[160px] text-sm whitespace-nowrap"
                >
                    {isSubmitting ? "Updating..." : isSuccess ? "Updated!" : "Save Changes"}
                </PremiumButton>
            </div>
        </form>
    );
}
