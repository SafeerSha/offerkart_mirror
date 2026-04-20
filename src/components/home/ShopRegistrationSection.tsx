"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { MoveRight, Store, Rocket, BarChart3, ShieldCheck } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { Heading, Text, SectionTitle } from "@/components/shared/Typography";
import { cn } from "@/lib/utils";

export default function ShopRegistrationSection() {
    const { data: session, status } = useSession();
    const isShopOwner = !!(session?.user as any)?.business_name;
    const isLoading = status === "loading";

    if (isLoading) return null;

    return (
        <section className="relative py-20 overflow-hidden">
            {/* Background with Image and Gradient Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/shop-registration-bg-light.png"
                    alt="Put your business in the spotlight"
                    fill
                    className="object-cover opacity-80"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40" />
            </div>

            <div className="container relative z-10 mx-auto px-4">
                <PremiumCard
                    variant="glass"
                    padding="lg"
                    className="max-w-4xl border-none shadow-none bg-transparent"
                >
                    <div className="max-w-3xl">
                        <SectionTitle className="flex items-center gap-2 mb-6">
                            <Store className="w-4 h-4" /> Business Growth
                        </SectionTitle>

                        <Heading className="text-4xl md:text-5xl mb-6">
                            Ready to Put Your <span className="text-gradient">Business in the Spotlight</span>?
                        </Heading>

                        <Text className="text-lg mb-10 max-w-xl">
                            Join hundreds of elite local shops already connecting with a massive audience.
                            Amplify your reach, drive high-intent footfall, and build a powerful brand presence through our premier premium discovery network.
                        </Text>

                        <div className="flex flex-wrap gap-4">
                            <PremiumButton asChild size="lg" className="h-14 px-8 rounded-full shadow-xl shadow-primary/20">
                                <Link
                                    href={isShopOwner ? "/shop-manager" : "/shop-registration"}
                                    className="flex items-center"
                                >
                                    {isShopOwner ? "Manage your shop" : "Add your shop"}
                                    <MoveRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </PremiumButton>

                            <PremiumButton variant="outline" size="lg" className="h-14 px-8 rounded-full border-2 border-primary/20 hover:bg-primary/5 transition-all duration-300">
                                View Success Stories
                            </PremiumButton>
                        </div>

                        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-8">
                            <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
                                <div className="text-3xl font-bold text-gradient mb-1">500+</div>
                                <Text className="text-sm font-medium">Active Shops</Text>
                            </div>
                            <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
                                <div className="text-3xl font-bold text-gradient mb-1">10k+</div>
                                <Text className="text-sm font-medium">Daily Users</Text>
                            </div>
                            <div className="animate-fade-up md:block hidden" style={{ animationDelay: "300ms" }}>
                                <div className="text-3xl font-bold text-gradient mb-1">25%</div>
                                <Text className="text-sm font-medium">Avg. Growth</Text>
                            </div>
                        </div>
                    </div>
                </PremiumCard>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 right-0 w-1/3 h-full z-0 opacity-10 pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(circle_at_bottom_right,hsl(var(--color-primary))_0%,transparent_70%)]" />
            </div>
        </section>
    );
}
