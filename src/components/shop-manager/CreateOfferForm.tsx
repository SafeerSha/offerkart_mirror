"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Heading, Text } from "@/components/shared/Typography";
import {
    Tag,
    Image as ImageIcon,
    Calendar,
    Percent,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Loader2
} from "lucide-react";

const CATEGORIES = [
    "Food & Dining",
    "Fashion",
    "Wellness",
    "Electronics",
    "Entertainment",
    "Services",
    "Others"
];

export default function CreateOfferForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "Food & Dining",
        discount: "",
        validUntil: "",
        originalPrice: "",
        offerPrice: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setIsSuccess(true);

        // Redirect after success
        setTimeout(() => {
            router.push("/shop-manager");
        }, 2000);
    };

    if (isSuccess) {
        return (
            <PremiumCard className="p-12 text-center animate-fade-in">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-primary animate-bounce" />
                </div>
                <Heading className="text-3xl mb-4">Offer Created Successfully!</Heading>
                <Text className="mb-8">Your new offer is now live and visible to shoppers. Redirecting to your dashboard...</Text>
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </PremiumCard>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
            <PremiumCard className="p-6 md:p-8">
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Tag className="w-4 h-4 text-primary" />
                                Offer Title
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="e.g., 50% Off on All Main Courses"
                                className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-primary" />
                                Description
                            </label>
                            <textarea
                                required
                                rows={4}
                                placeholder="Tell shoppers what makes this offer special..."
                                className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Details Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <LayoutDashboard className="w-4 h-4 text-primary" />
                                Category
                            </label>
                            <select
                                className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                Valid Until
                            </label>
                            <input
                                required
                                type="date"
                                className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                value={formData.validUntil}
                                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Pricing & Discount */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Percent className="w-4 h-4 text-primary" />
                                Discount (e.g., 50% OFF)
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="50% OFF"
                                className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                value={formData.discount}
                                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-primary" />
                                Original Price
                            </label>
                            <input
                                type="text"
                                placeholder="$99"
                                className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                value={formData.originalPrice}
                                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-primary" />
                                Offer Price
                            </label>
                            <input
                                type="text"
                                placeholder="$49"
                                className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                value={formData.offerPrice}
                                onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Image Upload Placeholder */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-primary" />
                            Offer Banner Image
                        </label>
                        <div className="w-full h-48 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/10 transition-all">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <PlusCircle className="w-6 h-6 text-primary" />
                            </div>
                            <Text className="text-sm opacity-60">Click to upload or drag and drop</Text>
                            <Text className="text-xs opacity-40">PNG, JPG up to 5MB</Text>
                        </div>
                    </div>
                </div>
            </PremiumCard>

            <div className="flex gap-4">
                <PremiumButton
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-2xl h-14"
                    onClick={() => router.back()}
                >
                    Cancel
                </PremiumButton>
                <PremiumButton
                    type="submit"
                    className="flex-[2] rounded-2xl h-14 shadow-xl shadow-primary/20"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Publishing...
                        </>
                    ) : (
                        "Publish Offer"
                    )}
                </PremiumButton>
            </div>
        </form>
    );
}

// Sub-component imports for icons needed
import { LayoutDashboard, PlusCircle } from "lucide-react";
