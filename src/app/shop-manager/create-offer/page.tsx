import CreateOfferForm from "@/components/shop-manager/CreateOfferForm";
import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import { Heading, Text } from "@/components/shared/Typography";

export default function CreateOfferPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Spacer for Fixed Header */}
            <div className="h-24 lg:h-32" />

            <main className="container mx-auto px-4 py-8 md:py-12 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-3xl mx-auto mb-8 md:mb-12 relative">
                    <Link
                        href="/shop-manager"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4 md:mb-6"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Dashboard
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl gradient-futuristic flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <Heading className="text-3xl md:text-4xl text-gradient">Create New Offer</Heading>
                            <Text className="opacity-70">Fill in the details below to launch your next successful campaign.</Text>
                        </div>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto relative">
                    <CreateOfferForm />
                </div>
            </main>

            {/* Bottom Spacer */}
            <div className="py-12" />
        </div>
    );
}
