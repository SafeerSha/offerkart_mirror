import ShopSettingsForm from "@/components/shop-manager/ShopSettingsForm";
import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
import { Heading, Text } from "@/components/shared/Typography";

export default function ShopSettingsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Spacer for Fixed Header */}
            <div className="h-24 lg:h-32" />

            <main className="container mx-auto px-4 py-8 md:py-12">
                <div className="w-full">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href="/shop-manager"
                            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-6"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back to Dashboard
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                <Settings className="w-6 h-6 text-gray-700" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Shop Settings</h1>
                                <p className="text-gray-600 mt-1">Update your business information and security settings</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <ShopSettingsForm />
                </div>
            </main>

            {/* Bottom Spacer */}
            <div className="py-12" />
        </div>
    );
}