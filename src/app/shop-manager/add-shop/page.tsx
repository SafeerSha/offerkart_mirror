"use client";

import React from "react";
import { ChevronLeft, Store } from "lucide-react";
import Link from "next/link";
import { Heading, Text } from "@/components/shared/Typography";
import { PremiumButton } from "@/components/shared/PremiumButton";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AddShopForm from "@/components/shop-manager/AddShopForm";

export default function AddShopPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Spacer for Fixed Header */}
            <div className="h-24 lg:h-32" />

            <main className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-7xl mx-auto">
                    <AddShopForm />
                </div>
            </main>

            {/* Bottom Spacer */}
            <div className="py-12" />
        </div>
    );
}
