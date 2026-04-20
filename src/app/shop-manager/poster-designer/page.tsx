"use client";

import { Suspense } from "react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Heading, Text } from "@/components/shared/Typography";
import PosterDesigner from "@/components/shop-manager/PosterDesigner";

export default function PosterDesignerPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="h-20 lg:h-32" />

            <main className="w-full relative overflow-hidden bg-background min-h-screen">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="mx-auto relative px-4 lg:px-8 py-4 md:py-8 max-w-[1600px]">
                    <Breadcrumbs
                        items={[
                            { label: "Dashboard", href: "/shop-manager" },
                            { label: "Poster Designer" },
                        ]}
                    />

                    <Suspense
                        fallback={
                            <div className="flex items-center justify-center min-h-[500px]">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            </div>
                        }
                    >
                        <PosterDesigner />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
