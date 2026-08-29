import BusinessSettingsForm from "@/components/shop-manager/BusinessSettingsForm";

export const dynamic = "force-dynamic";

export default function ShopSettingsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Spacer for Fixed Header */}
            <div className="h-20 lg:h-24" />

            <main className="container mx-auto px-4 py-4 md:py-6">
                <div className="max-w-6xl mx-auto">
                    <BusinessSettingsForm />
                </div>
            </main>

            {/* Bottom Padding */}
            <div className="h-8" />
        </div>
    );
}
