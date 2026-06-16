"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Search, User, LogIn, Menu, X, PlusCircle, MapPin, ChevronDown, LayoutDashboard, Plus, Loader2, Home, Percent, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { cn } from "@/lib/utils";
import { getPlacesByPin } from "indian_places";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

const locations = [
    "All",
    "Kochi",
    "Thiruvananthapuram",
    "Kozhikode",
    "Thrissur",
    "Palakkad",
    "Kollam",
    "Kannur",
    "Alappuzha",
    "Kottayam",
    "Malappuram",
    "Pathanamthitta",
    "Idukki",
    "Wayanad",
    "Kasaragod",
];

interface LocationDropdownContentProps {
    align?: "start" | "center" | "end";
    isMobile?: boolean;
    loading: boolean;
    pincode: string;
    setPincode: (val: string) => void;
    dropdownLocations: string[];
    setDropdownLocations: (locs: string[]) => void;
    selectedLocation: string;
    setSelectedLocation: (loc: string) => void;
    fetchLocations: (pin: string) => void;
    debounceTimer: NodeJS.Timeout | null;
    setDebounceTimer: (timer: NodeJS.Timeout | null) => void;
}

const LocationDropdownContent = ({
    align = "start",
    isMobile = false,
    loading,
    pincode,
    setPincode,
    dropdownLocations,
    setDropdownLocations,
    selectedLocation,
    setSelectedLocation,
    fetchLocations,
    debounceTimer,
    setDebounceTimer
}: LocationDropdownContentProps) => (
    <DropdownMenuContent
        className={cn(
            "p-0 overflow-hidden bg-white/95 backdrop-blur-md border border-primary/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200",
            isMobile ? "w-[calc(100vw-2rem)] sm:w-80" : "w-80"
        )}
        align={align}
    >
        <div className="p-4 border-b border-primary/5 bg-primary/5">
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                        <Search className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
                <input
                    type="text"
                    placeholder="Enter 6-digit pincode..."
                    value={pincode}
                    maxLength={6}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value && !/^\d*$/.test(value)) return;
                        setPincode(value);
                        if (value === '') {
                            setDropdownLocations(locations);
                        }
                        if (debounceTimer) clearTimeout(debounceTimer);
                        const timer = setTimeout(() => {
                            if (value.length === 6) {
                                fetchLocations(value);
                            }
                        }, 500);
                        setDebounceTimer(timer);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-primary/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all shadow-inner"
                    onKeyDown={(e) => {
                        // Prevent menu from closing on space or enter
                        if (e.key === ' ') e.stopPropagation();
                    }}
                />
                {pincode && (
                    <button
                        onClick={() => { setPincode(""); setDropdownLocations(locations); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-primary/10 rounded-full transition-colors"
                    >
                        <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 px-1 font-medium italic">
                Detecting your city via pincode for local deals
            </p>
        </div>

        <div className="max-h-72 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
            <div className="flex items-center justify-between px-4 py-1 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {pincode.length === 6 ? "Search Results" : "Suggested Locations"}
                </span>
            </div>
            {loading ? (
                <div className="px-4 py-8 text-center animate-pulse">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">Searching for local deals...</p>
                </div>
            ) : dropdownLocations.length === 0 ? (
                <div className="px-4 py-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <MapPin className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No locations found</p>
                </div>
            ) : (
                dropdownLocations.map((location) => (
                    <DropdownMenuItem
                        key={location}
                        onClick={() => setSelectedLocation(location)}
                        className={cn(
                            "mx-2 rounded-xl cursor-pointer py-3 px-3 transition-all duration-200",
                            selectedLocation === location
                                ? "bg-primary/10 text-primary font-semibold"
                                : "hover:bg-primary/5 focus:bg-primary/5"
                        )}
                    >
                        <div className="flex items-center w-full">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors",
                                selectedLocation === location ? "bg-primary/20" : "bg-secondary"
                            )}>
                                <MapPin className={cn("w-4 h-4", selectedLocation === location ? "text-primary" : "text-muted-foreground")} />
                            </div>
                            <span className="text-sm">{location}</span>
                            {selectedLocation === location && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            )}
                        </div>
                    </DropdownMenuItem>
                ))
            )}
        </div>
    </DropdownMenuContent>
);

const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState("Location");
    const [desktopLocationOpen, setDesktopLocationOpen] = useState(false);
    const [mobileLocationOpen, setMobileLocationOpen] = useState(false);
    const islandLocationOpen = desktopLocationOpen || mobileLocationOpen;
    const [islandExpanded, setIslandExpanded] = useState(false);
    const [pincode, setPincode] = useState("");
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
    const [dropdownLocations, setDropdownLocations] = useState(locations);
    const [loading, setLoading] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { data: session, status } = useSession();
    const isRegistered = status === "authenticated";
    type SessionUser = {
        business_name?: string | null;
        full_name?: string | null;
    } & Record<string, unknown>;
    const user = session?.user as SessionUser | undefined;
    const pathname = usePathname();
    const headerRef = useRef<HTMLElement | null>(null);
    const { locale } = useTranslation();
    const localeNames: Record<string, string> = {
        en: "English",
        ml: "മലയാളം",
        hi: "हिन्दी"
    };
    const currentLanguageName = localeNames[locale] || "Language";

    useEffect(() => {
        const handleScroll = () => {
            const nextScrolled = window.scrollY > 20;
            setScrolled(nextScrolled);
            if (!nextScrolled) {
                setDesktopLocationOpen(false);
                setMobileLocationOpen(false);
                setIslandExpanded(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (!scrolled) return;
        setSearchOpen(false);
    }, [scrolled]);

    useEffect(() => {
        if (!scrolled || !islandExpanded) return;

        const handlePointerDown = (e: PointerEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (headerRef.current && headerRef.current.contains(target)) return;
            if (target instanceof Element && target.closest('[data-radix-dropdown-menu-content]')) return;
            if (islandLocationOpen) return;
            setIslandExpanded(false);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (islandLocationOpen) return;
            setIslandExpanded(false);
        };

        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [scrolled, islandExpanded, islandLocationOpen]);

    const fetchLocations = async (pin: string) => {
        setLoading(true);
        try {
            // 1. Try local lookup first (instant, offline-first, no CORS)
            const pinNum = parseInt(pin, 10);
            if (!isNaN(pinNum)) {
                const localPlaces = getPlacesByPin(pinNum);
                if (localPlaces && localPlaces.length > 0) {
                    const formatted = localPlaces.map((p: any) => `${p.place}, ${p.district}`);
                    setDropdownLocations(formatted);
                    setLoading(false);
                    return;
                }
            }

            // 2. Unreliable external API fallback (with CORS fallback protection)
            const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
            const data = await response.json();
            if (data[0].Status === 'Success' && data[0].PostOffice.length > 0) {
                const postOffices = data[0].PostOffice;
                setDropdownLocations(postOffices.map((po: { Name: string; District: string }) => `${po.Name}, ${po.District}`));
            }
        } catch (error) {
            console.error('Error fetching location:', error);
        } finally {
            setLoading(false);
        }
    };

    const islandTitle =
        pathname === "/"
            ? "Home"
            : pathname.startsWith("/offers") || pathname.startsWith("/offer/")
                ? "Offers"
                : pathname.startsWith("/products")
                    ? "Products"
                    : pathname.startsWith("/shop-manager")
                        ? "Shop Manager"
                        : pathname.startsWith("/profile")
                            ? "Profile"
                            : "OfferKart";

    const mobileMenu = (
        <div className={cn(
            "lg:hidden grid transition-all duration-300 ease-in-out origin-top transform-gpu",
            mobileMenuOpen
                ? "grid-rows-[1fr] opacity-100 scale-100 translate-y-0 mt-4 pointer-events-auto"
                : "grid-rows-[0fr] opacity-0 scale-95 -translate-y-4 mt-0 pointer-events-none"
        )}>
            <div className="overflow-hidden min-h-0 w-full">
                <div className="p-3 glass-card rounded-2xl border border-primary/10">
                    <nav className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-primary/5 pb-3">
                            <span className="text-sm font-bold uppercase tracking-wider text-orange-500">{currentLanguageName}</span>
                            <LanguageSwitcher className="[&>button]:py-2.5 [&>button]:px-4 [&>button]:rounded-xl" />
                        </div>

                        <div className={cn(
                            "transition-opacity duration-300 w-full flex flex-col gap-3",
                            status === "loading" ? "opacity-0 pointer-events-none" : "opacity-100"
                        )}>
                            {!isRegistered ? (
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        signIn();
                                    }}
                                    className="px-4 py-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold shadow-sm flex items-center justify-center transition-all duration-300 hover:bg-primary/20 w-full text-center"
                                >
                                    <LogIn className="w-4 h-4 mr-3" />
                                    Log In
                                </button>
                            ) : (
                                <>
                                    <PremiumButton
                                        asChild
                                        size="sm"
                                        className="rounded-2xl px-3 sm:px-4 lg:px-6 w-full justify-center group"
                                    >
                                        <Link
                                            href={user?.business_name ? "/shop-manager" : "/shop-registration"}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center justify-center p-6"
                                        >
                                            {user?.business_name ? (
                                                <>
                                                    <LayoutDashboard className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                                    <span className="font-bold">Manage Shop</span>
                                                </>
                                            ) : (
                                                <>
                                                    <PlusCircle className="w-4 h-4 mr-2" />
                                                    <span className="font-bold">Add your shop</span>
                                                </>
                                            )}
                                        </Link>
                                    </PremiumButton>

                                    <button
                                        onClick={() => {
                                            setIsLoggingOut(true);
                                            signOut({ callbackUrl: "/" });
                                        }}
                                        disabled={isLoggingOut}
                                        className="px-4 py-3.5 rounded-xl hover:bg-destructive/10 text-destructive/80 hover:text-destructive transition-all duration-300 border border-transparent hover:border-destructive/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoggingOut ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                                                <span className="font-medium">Logging out...</span>
                                            </>
                                        ) : (
                                            <>
                                                <LogIn className="w-4 h-4 mr-3" />
                                                <span className="font-medium">Log Out</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}

                            {!isRegistered && (
                                <PremiumButton
                                    asChild
                                    size="sm"
                                    className="rounded-2xl px-3 sm:px-4 lg:px-6 w-full justify-center group"
                                >
                                    <Link
                                        href="/shop-registration"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-center p-6"
                                    >
                                        <PlusCircle className="w-4 h-4 mr-2" />
                                        <span className="font-bold">Add your shop</span>
                                    </Link>
                                </PremiumButton>
                            )}
                        </div>

                        {/* Close Button at bottom right */}
                        <div className="flex justify-end mt-1">
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/10 hover:border-primary/20 bg-secondary/30 text-muted-foreground hover:text-foreground text-xs font-bold transition-all duration-200 transform active:scale-95 shadow-sm"
                            >
                                <X className="w-3.5 h-3.5 text-orange-500" />
                            </button>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    );


    return (
        <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
            {/* Background Blobs (fade out on scroll) */}
            <div className={cn(
                "absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-500",
                scrolled ? "opacity-0" : "opacity-100"
            )}>
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-0 right-1/4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl animate-pulse delay-1000" />
                <div className="absolute -top-10 left-1/2 w-40 h-40 bg-accent/3 rounded-full blur-3xl animate-pulse delay-500" />
            </div>

            {/* Header Outer Wrapper (Always full width, handles mouse events) */}
            <div
                className="pointer-events-auto absolute left-0 right-0 top-0 w-full"
                onMouseEnter={() => scrolled && setIslandExpanded(true)}
                onMouseLeave={() => {
                    if (scrolled && !islandLocationOpen) {
                        setIslandExpanded(false);
                    }
                }}
            >
                {/* Visual Background Layer */}
                <div
                    className={cn(
                        "absolute left-1/2 -translate-x-1/2 transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu origin-top pointer-events-none",
                        scrolled
                            ? (scrolled && !islandExpanded)
                                ? "top-4 w-[min(520px,calc(100vw-1.5rem))] h-12 rounded-full border shadow-xl bg-background/55 backdrop-blur-xl backdrop-saturate-150 border-border/50"
                                : "top-0 w-full h-full rounded-none border-transparent glass-header shadow-md"
                            : "top-0 w-full h-full rounded-none border-transparent bg-transparent shadow-none"
                    )}
                />

                {/* Contents Container */}
                <div className="relative w-full z-10">
                    {/* Full Header Content */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out origin-top py-4",
                        (scrolled && !islandExpanded)
                            ? "opacity-0 pointer-events-none absolute inset-x-0 top-0 scale-[0.95] translate-y-2"
                            : "opacity-100 scale-100 relative translate-y-0"
                    )}>
                        <div className="container mx-auto px-4 relative">
                            <div className="flex items-center justify-between gap-4">
                                {/* Logo */}
                                <Link href="/" className="flex items-center flex-shrink-0 group cursor-pointer border-0 outline-none focus:ring-0">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-500/10 flex items-center justify-center transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-primary/20">
                                                <span className="text-orange-600 font-bold text-lg sm:text-xl">O</span>
                                            </div>
                                            <div className="absolute -inset-1 rounded-full border border-primary/30 animate-pulse" />
                                            <div className="absolute -inset-2 rounded-full border border-primary/10 animate-pulse delay-300" />
                                        </div>
                                        <span className="font-sans text-lg sm:text-xl font-bold block text-orange-500 transition-colors group-hover:text-primary">
                                            OfferKart
                                        </span>
                                    </div>
                                </Link>

                                {/* Middle: Desktop Nav or Mobile Location */}
                                <div className="flex-1 flex justify-center">
                                    {/* Desktop Nav */}
                                    <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
                                        <Link href="/" className={cn(
                                            "relative transition-all font-medium group text-sm xl:text-base",
                                            pathname === "/" ? "text-orange-500 font-bold" : "text-foreground hover:text-orange-500"
                                        )}>
                                            <span className="relative z-10">Home</span>
                                        </Link>
                                        <Link href="/offers" className={cn(
                                            "relative transition-all font-medium group text-sm xl:text-base",
                                            (pathname === "/offers" || pathname.startsWith('/offer/')) ? "text-orange-500 font-bold" : "text-foreground hover:text-orange-500"
                                        )}>
                                            <span className="relative z-10">Offers</span>
                                        </Link>
                                        <Link href="/products" className={cn(
                                            "relative transition-all font-medium group text-sm xl:text-base",
                                            pathname.startsWith("/products") ? "text-orange-500 font-bold" : "text-foreground hover:text-orange-500"
                                        )}>
                                            <span className="relative z-10">Products</span>
                                        </Link>
                                        <DropdownMenu modal={false} open={desktopLocationOpen} onOpenChange={(open) => setDesktopLocationOpen(open)}>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className="relative text-foreground hover:text-primary transition-all font-medium flex items-center gap-2 group border-0 outline-none select-none"
                                                >
                                                    <MapPin className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                                                    <span className="relative z-10">{selectedLocation}</span>
                                                    <ChevronDown className="w-4 h-4 transition-transform group-hover:scale-110" />
                                                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <LocationDropdownContent
                                                align="start"
                                                loading={loading}
                                                pincode={pincode}
                                                setPincode={setPincode}
                                                dropdownLocations={dropdownLocations}
                                                setDropdownLocations={setDropdownLocations}
                                                selectedLocation={selectedLocation}
                                                setSelectedLocation={setSelectedLocation}
                                                fetchLocations={fetchLocations}
                                                debounceTimer={debounceTimer}
                                                setDebounceTimer={setDebounceTimer}
                                            />
                                        </DropdownMenu>
                                    </nav>

                                    {/* Mobile Location */}
                                    <div className="lg:hidden">
                                        <DropdownMenu modal={false} open={mobileLocationOpen} onOpenChange={(open) => setMobileLocationOpen(open)}>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className="relative text-foreground hover:text-primary transition-all font-medium flex items-center gap-2 group border-0 outline-none focus:ring-0 focus:ring-offset-0 focus:outline-none select-none"
                                                >
                                                    <MapPin className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                                                    <span className="relative z-10">{selectedLocation}</span>
                                                    <ChevronDown className="w-4 h-4 transition-transform group-hover:scale-110" />
                                                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <LocationDropdownContent
                                                align="center"
                                                isMobile={true}
                                                loading={loading}
                                                pincode={pincode}
                                                setPincode={setPincode}
                                                dropdownLocations={dropdownLocations}
                                                setDropdownLocations={setDropdownLocations}
                                                selectedLocation={selectedLocation}
                                                setSelectedLocation={setSelectedLocation}
                                                fetchLocations={fetchLocations}
                                                debounceTimer={debounceTimer}
                                                setDebounceTimer={setDebounceTimer}
                                            />
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Right: Desktop Buttons or Mobile Toggle */}
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className={cn(
                                        "hidden lg:flex items-center gap-2 sm:gap-3 transition-opacity duration-300",
                                        status === "loading" ? "opacity-0 pointer-events-none" : "opacity-100"
                                    )}>
                                        {!isRegistered ? (
                                            <PremiumButton
                                                variant="outline"
                                                size="sm"
                                                className="rounded-2xl px-3 sm:px-4 lg:px-6 border-primary/20 hover:bg-primary/5 transition-all duration-300"
                                                onClick={() => signIn()}
                                            >
                                                <div className="flex items-center">
                                                    <LogIn className="w-4 h-4 mr-2" />
                                                    <span className="inline">Login</span>
                                                </div>
                                            </PremiumButton>
                                        ) : (
                                            <PremiumButton
                                                asChild
                                                size="sm"
                                                className={cn(
                                                    "rounded-2xl px-3 sm:px-4 lg:px-6 shadow-lg shadow-primary/20 transition-all duration-300",
                                                    (pathname.startsWith("/shop-manager") || pathname === "/profile") && "ring-2 ring-primary ring-offset-2 scale-95"
                                                )}
                                            >
                                                {user?.business_name ? (
                                                    <Link href="/shop-manager" className="flex items-center">
                                                        <LayoutDashboard className="w-4 h-4 mr-2" />
                                                        <span className="inline">Manage Shop</span>
                                                    </Link>
                                                ) : (
                                                    <Link href="/profile" className="flex items-center">
                                                        <User className="w-4 h-4 mr-2" />
                                                        <span className="inline">
                                                            {user?.full_name || "Profile"}
                                                        </span>
                                                    </Link>
                                                )}
                                            </PremiumButton>
                                        )}

                                        {(!isRegistered || !user?.business_name) && (
                                            <PremiumButton
                                                asChild
                                                size="sm"
                                                className={cn(
                                                    "rounded-2xl px-3 sm:px-4 lg:px-6 shadow-lg shadow-primary/20 transition-all duration-300",
                                                    pathname.startsWith("/shop-registration") && "ring-2 ring-primary ring-offset-2 scale-105"
                                                )}
                                            >
                                                <Link href="/shop-registration" className="flex items-center">
                                                    <PlusCircle className="w-4 h-4 mr-2" />
                                                    <span className="inline">Add your shop</span>
                                                </Link>
                                            </PremiumButton>
                                        )}

                                        <LanguageSwitcher className="[&>button]:h-9 [&>button]:rounded-2xl" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                        className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors ml-1"
                                        aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
                                    >
                                        {mobileMenuOpen ? <X className="w-5 h-5 text-orange-500" /> : <Menu className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end hidden md:flex">
                                <div
                                    className={cn(
                                        "relative h-11 flex items-center transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] w-full",
                                        searchOpen ? "max-w-2xl" : "max-w-[280px]"
                                    )}
                                >
                                    <div
                                        onClick={() => !searchOpen && setSearchOpen(true)}
                                        className={cn(
                                            "absolute inset-0 rounded-2xl border transition-all duration-[600ms] overflow-hidden",
                                            searchOpen
                                                ? "bg-white border-primary shadow-xl shadow-primary/10 cursor-default"
                                                : "bg-white/80 backdrop-blur-sm border-primary/20 shadow-md hover:border-primary/40 hover:bg-white cursor-pointer"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute inset-0 bg-primary/[0.03] opacity-0 transition-opacity duration-[600ms]",
                                            searchOpen && "opacity-100"
                                        )} />
                                    </div>

                                    <Search className={cn(
                                        "absolute left-4 w-4 h-4 z-20 transition-colors duration-300 pointer-events-none",
                                        searchOpen ? "text-primary" : "text-muted-foreground"
                                    )} />

                                    <input
                                        type="text"
                                        placeholder={searchOpen ? "Search for shops, offers, products..." : ""}
                                        onFocus={() => setSearchOpen(true)}
                                        onBlur={(e) => {
                                            if (e.relatedTarget?.getAttribute('data-clear') === 'true') return;
                                            setSearchOpen(false);
                                        }}
                                        className={cn(
                                            "relative z-10 w-full h-full pl-11 pr-11 bg-transparent border-none focus:ring-0 outline-none transition-all duration-[600ms] text-sm font-medium",
                                            !searchOpen && "cursor-pointer"
                                        )}
                                    />

                                    {!searchOpen && (
                                        <span className="absolute left-11 text-sm font-medium text-muted-foreground opacity-70 pointer-events-none transition-opacity duration-300">
                                            Search shops, offers, deals...
                                        </span>
                                    )}

                                    <button
                                        data-clear="true"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSearchOpen(false);
                                        }}
                                        className={cn(
                                            "absolute right-3 z-20 p-1 rounded-full hover:bg-secondary transition-all duration-300",
                                            searchOpen ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
                                        )}
                                    >
                                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Navigation and Search */}
                            <div className="lg:hidden mt-4 flex flex-col gap-3 px-0.5 animate-in slide-in-from-top-3 duration-300">
                                {/* Three Classic Premium Button Links */}
                                <div className="grid grid-cols-3 gap-2.5">
                                    <Link
                                        href="/"
                                        className={cn(
                                            "flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition-all duration-300 transform active:scale-95 shadow-sm",
                                            pathname === "/"
                                                ? "bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30 text-orange-600 shadow-orange-500/5"
                                                : "bg-white/40 dark:bg-black/20 border-primary/5 text-muted-foreground hover:bg-white/70 hover:text-foreground"
                                        )}
                                    >
                                        <Home className="w-3.5 h-3.5 shrink-0" />
                                        <span>Home</span>
                                    </Link>
                                    <Link
                                        href="/offers"
                                        className={cn(
                                            "flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition-all duration-300 transform active:scale-95 shadow-sm",
                                            (pathname === "/offers" || pathname.startsWith('/offer/'))
                                                ? "bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30 text-orange-600 shadow-orange-500/5"
                                                : "bg-white/40 dark:bg-black/20 border-primary/5 text-muted-foreground hover:bg-white/70 hover:text-foreground"
                                        )}
                                    >
                                        <Percent className="w-3.5 h-3.5 shrink-0" />
                                        <span>Offers</span>
                                    </Link>
                                    <Link
                                        href="/products"
                                        className={cn(
                                            "flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition-all duration-300 transform active:scale-95 shadow-sm",
                                            pathname.startsWith("/products")
                                                ? "bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30 text-orange-600 shadow-orange-500/5"
                                                : "bg-white/40 dark:bg-black/20 border-primary/5 text-muted-foreground hover:bg-white/70 hover:text-foreground"
                                        )}
                                    >
                                        <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                                        <span>Products</span>
                                    </Link>
                                </div>

                                {/* Classic Search Bar */}
                                <div className="relative w-full group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                    <div className="relative flex items-center bg-white/50 dark:bg-black/20 border border-primary/10 group-focus-within:border-orange-500/30 group-focus-within:bg-white rounded-2xl shadow-sm transition-all duration-300 overflow-hidden">
                                        <div className="pl-4 pr-2.5 py-3 flex items-center pointer-events-none">
                                            <Search className="w-4 h-4 text-muted-foreground/80 group-focus-within:text-orange-500 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search shops, offers, products..."
                                            className="w-full py-3 pr-4 bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-xs font-medium placeholder:text-muted-foreground/50 text-foreground"
                                        />
                                    </div>
                                </div>
                            </div>

                            {mobileMenu}
                        </div>
                    </div>

                    {/* Compact Dynamic Island Content */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out origin-top max-w-[min(520px,calc(100vw-1.5rem))] mx-auto pt-4",
                        (scrolled && !islandExpanded)
                            ? "opacity-100 scale-100 relative translate-y-0"
                            : "opacity-0 pointer-events-none absolute inset-x-0 top-0 scale-[0.95] -translate-y-2"
                    )}>
                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 text-foreground h-12">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center font-bold text-sm shrink-0 text-orange-600">
                                    O
                                </div>
                                <span className="font-sans text-sm font-semibold truncate">
                                    OfferKart
                                </span>
                            </div>
                            <div
                                className="flex justify-center min-w-0 cursor-pointer"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIslandExpanded(true);
                                    if (window.innerWidth >= 1024) {
                                        setDesktopLocationOpen(true);
                                    } else {
                                        setMobileLocationOpen(true);
                                    }
                                }}
                            >
                                <div className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/40 dark:bg-white/10 border border-white/30 dark:border-white/10 max-w-[240px]">
                                    <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                                    <span className="text-xs font-semibold truncate">
                                        {selectedLocation}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right min-w-0">
                                <span className="text-xs font-semibold opacity-80 truncate block max-w-[160px]">
                                    {islandTitle}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
