import ShopRegistrationForm from "@/components/shop-registration/ShopRegistrationForm";
import Link from "next/link";
import { ChevronLeft, Rocket, BarChart3, Gem } from "lucide-react";
import { Heading, Text } from "@/components/shared/Typography";

export default function ShopRegistrationPage() {
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
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4 md:mb-6"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Home
                    </Link>

                    <div className="space-y-3">
                        <Heading className="text-3xl md:text-4xl lg:text-5xl text-gradient leading-tight">Put Your Business in the Spotlight</Heading>
                        <Text className="text-base md:text-lg opacity-90">
                            Amplify your business's reach and connect with thousands of ready-to-buy local shoppers through our most influential premium discovery platform.
                        </Text>
                    </div>
                </div>

                <ShopRegistrationForm />

                {/* Trust markers */}
                <div className="max-w-4xl mx-auto mt-20 md:mt-24">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
                        {/* Connecting Line - Desktop Only */}
                        <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2 z-0" />

                        {[
                            {
                                icon: Rocket,
                                title: "Fast Listing",
                                desc: "Get your offers live in less than 24 hours.",
                                color: "text-orange-500",
                                bg: "bg-orange-500/10",
                            },
                            {
                                icon: BarChart3,
                                title: "Insightful Data",
                                desc: "Detailed analytics on how your offers perform.",
                                color: "text-blue-500",
                                bg: "bg-blue-500/10",
                            },
                            {
                                icon: Gem,
                                title: "Premium Support",
                                desc: "Dedicated account manager for your business.",
                                color: "text-purple-500",
                                bg: "bg-purple-500/10",
                            },
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="group relative z-10 p-8 rounded-3xl glass-card transition-all duration-500 hover:scale-105 hover:-translate-y-2 border border-primary/5 hover:border-primary/20 bg-white/40 backdrop-blur-xl shadow-xl shadow-primary/5 hover:shadow-primary/10"
                            >
                                {/* Active Glow Effect */}
                                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                <div className="relative flex flex-col items-center text-center">
                                    <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 rotate-3 group-hover:rotate-6`}>
                                        <feature.icon className={`w-8 h-8 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>

                                {/* Bottom Accent Line */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-primary rounded-full group-hover:w-1/3 transition-all duration-500 ease-out" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer-like spacer */}
            <div className="py-20" />
        </div>
    );
}
