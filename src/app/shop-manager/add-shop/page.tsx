"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AddShopForm from "@/components/shop-manager/AddShopForm";

export default function AddShopPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Spacer for Fixed Header */}
            <div className="h-20 lg:h-32" />

            <main className="container mx-auto px-4 py-4 md:py-12">
                <div className="max-w-7xl mx-auto">
                    <Suspense fallback={
                        <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <p className="text-sm font-medium">Loading form...</p>
                        </div>
                    }>
                        <AddShopForm />
                    </Suspense>
                </div>
            </main>

            {/* Bottom Spacer */}
            <div className="py-12" />
        </div>
    );
}
