"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    Save
} from "lucide-react";
import { toast } from "sonner";

export default function ShopSettingsForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

        // Login Credentials
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

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

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setIsSuccess(true);
        toast.success("Shop settings updated successfully!");

        // Reset success state after 3 seconds
        setTimeout(() => setIsSuccess(false), 3000);
    };

    return (
        <div className="space-y-8">
            {/* Two Column Layout for Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-stretch">
                {/* Business Information Section */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden lg:col-span-2 lg:h-full">
                    <div className="px-8 py-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
                                <p className="text-sm text-gray-600">Update your business details and contact information</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Business Name</label>
                                <PremiumInput
                                    placeholder="Enter business name"
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">State</label>
                                <PremiumInput
                                    placeholder="Enter state"
                                    value={formData.state}
                                    onChange={(e) => handleInputChange("state", e.target.value)}
                                    icon={MapPin}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">District</label>
                                <PremiumInput
                                    placeholder="Enter district"
                                    value={formData.district}
                                    onChange={(e) => handleInputChange("district", e.target.value)}
                                    icon={MapPin}
                                    required
                                />
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
                            <label className="text-sm font-medium text-gray-700">Business Description</label>
                            <textarea
                                placeholder="Describe your business..."
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

            {/* Submit Button - Matches Security Card Width */}
            <div className="lg:col-span-1 lg:col-start-3 px-8 py-6 flex justify-end">
                <PremiumButton
                    type="submit"
                    disabled={isSubmitting}
                    leftIcon={isSubmitting ? Loader2 : isSuccess ? CheckCircle2 : Save}
                    className="w-full lg:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all min-w-[160px]"
                    onClick={handleSubmit}
                >
                    {isSubmitting ? "Updating..." : isSuccess ? "Updated!" : "Save Changes"}
                </PremiumButton>
            </div>
        </div>
    );
}