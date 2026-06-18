import ShopSettingsForm from "@/components/shop-manager/ShopSettingsForm";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Heading, Text } from "@/components/shared/Typography";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function ShopSettingsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Spacer for Fixed Header */}
            <div className="h-40 lg:h-32" />

            <main className="container mx-auto px-4 py-4 md:py-12">
                <div className="w-full">
                    {/* Form (Includes Header & Breadcrumbs) */}
                    <ShopSettingsForm />
                </div>
            </main>

            {/* Bottom Spacer */}
            <div className="py-12" />
        </div>
    );
}
