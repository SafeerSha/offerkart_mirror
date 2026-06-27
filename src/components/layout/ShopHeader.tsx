"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User, Menu, X, Loader2, Store, LayoutDashboard, Tags, Package } from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMyShops } from "@/hooks/useApi";
import Image from "next/image";

export default function ShopHeader() {
    const [scrolled, setScrolled] = useState(false);
    const { data: session, status } = useSession();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const pathname = usePathname();

    type SessionUser = {
        business_name?: string | null;
        full_name?: string | null;
    } & Record<string, unknown>;
    const user = session?.user as SessionUser | undefined;

    const { data: shopsResponse } = useMyShops();
    const shops = useMemo(() => {
        if (!shopsResponse?.success || !shopsResponse?.data) return [];
        const result = shopsResponse.data as any;
        return Array.isArray(result) ? result : (result.data || []);
    }, [shopsResponse]);
    const shopLogo = shops.length > 0 ? shops[0].logo_url : null;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await signOut({ callbackUrl: "/" });
    };


    const [islandExpanded, setIslandExpanded] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300">
            {/* Background Blobs (fade out on scroll) */}
            <div className={cn(
                "absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-500",
                scrolled ? "opacity-0" : "opacity-100"
            )}>
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-0 right-1/4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl animate-pulse delay-1000" />
            </div>

            <div
                className="pointer-events-auto absolute left-0 right-0 top-0 w-full"
                onMouseEnter={() => scrolled && setIslandExpanded(true)}
                onMouseLeave={() => scrolled && setIslandExpanded(false)}
            >
                {/* Visual Background Layer */}
                <div
                    className={cn(
                        "absolute left-1/2 -translate-x-1/2 transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu origin-top pointer-events-none",
                        scrolled
                            ? (scrolled && !islandExpanded)
                                ? "top-4 w-[min(520px,calc(100vw-1.5rem))] h-12 rounded-full border shadow-xl bg-background/55 backdrop-blur-xl backdrop-saturate-150 border-border/50"
                                : "top-0 w-full h-full rounded-none border-transparent bg-white/80 backdrop-blur-md shadow-md border-b border-gray-200/50"
                            : "top-0 w-full h-full rounded-none border-transparent bg-transparent shadow-none"
                    )}
                />

                <div className="relative w-full z-10">
                    {/* Full Header Content */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out origin-top",
                        (scrolled && !islandExpanded)
                            ? "opacity-0 pointer-events-none absolute inset-x-0 top-0 scale-[0.95] translate-y-2"
                            : "opacity-100 scale-100 relative translate-y-0"
                    )}>
                        <div className="container mx-auto px-4 relative">
                            <div className="flex items-center justify-between h-16 lg:h-20">
                                {/* Logo */}
                                <div className="flex-1 flex justify-start">
                                    <Link href="/" className="flex items-center flex-shrink-0 group cursor-pointer border-0 outline-none focus:ring-0">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-500 flex items-center justify-center transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-primary/20">
                                                    <Store className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-sans text-lg sm:text-xl font-black block text-gray-900 group-hover:text-primary transition-colors leading-none">
                                                    OfferKart
                                                </span>
                                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-0.5">
                                                    Business
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>

                                {/* Right side Actions */}
                                <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4">
                                    <LanguageSwitcher className="[&>button]:h-9 [&>button]:rounded-xl" />

                                    {status === "authenticated" && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="flex items-center gap-2 px-2 py-1.5 sm:px-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm outline-none">
                                                    <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-primary/10 shrink-0">
                                                        {shopLogo ? (
                                                            <Image src={shopLogo} alt="Shop Logo" width={28} height={28} className="w-full h-full object-cover" unoptimized />
                                                        ) : (
                                                            <User className="w-4 h-4 text-primary" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-700 hidden sm:block max-w-[120px] truncate">
                                                        {user?.business_name || user?.full_name || "Shop Owner"}
                                                    </span>
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl mt-2 shadow-xl border-gray-100/50 bg-white/95 backdrop-blur-md">
                                                <div className="px-2 py-2 mb-2 border-b border-gray-100">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{user?.business_name || user?.full_name}</p>
                                                    <p className="text-xs text-gray-500 font-medium">Shop Manager</p>
                                                </div>

                                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 rounded-xl cursor-pointer font-medium hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700">
                                                    {isLoggingOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                                                    Logout
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mini Island Content */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out origin-top max-w-[min(520px,calc(100vw-1.5rem))] mx-auto pt-4",
                        (scrolled && !islandExpanded)
                            ? "opacity-100 scale-100 relative translate-y-0"
                            : "opacity-0 pointer-events-none absolute inset-x-0 top-0 scale-[0.95] -translate-y-2"
                    )}>
                        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-1 px-4 text-foreground h-12">
                            <div className="flex items-center gap-1 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center font-bold text-sm shrink-0 text-orange-600">
                                    <Store className="w-4 h-4" />
                                </div>
                                <span className="font-sans text-sm font-semibold truncate">
                                    OfferKart
                                </span>
                            </div>
                            <div className="flex justify-end min-w-0 cursor-pointer pr-1" onClick={() => setIslandExpanded(true)}>
                                <div className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/40 dark:bg-white/10 border border-white/30 dark:border-white/10 max-w-[240px]">
                                    <span className="text-xs font-semibold truncate text-orange-500">
                                        {user?.business_name || user?.full_name || "Shop Manager"}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right min-w-0 flex justify-end">
                                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-primary/10 shrink-0">
                                    {shopLogo ? (
                                        <Image src={shopLogo} alt="Shop Logo" width={24} height={24} className="w-full h-full object-cover" unoptimized />
                                    ) : (
                                        <User className="w-3.5 h-3.5 text-primary" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
