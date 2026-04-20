"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search, User, LogIn, Menu, X, MapPinCheck, PlusCircle, MapPin, ChevronDown, ChevronUp, LayoutDashboard, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const locations = [
    "All",
    "City Alpha",
    "City Beta",
    "City Gamma",
    "City Delta",
    "City Epsilon",
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
    const [accountOpen, setAccountOpen] = useState(false);
    const [pincode, setPincode] = useState("");
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
    const [dropdownLocations, setDropdownLocations] = useState(locations);
    const [loading, setLoading] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { data: session, status } = useSession();
    const isRegistered = status === "authenticated";
    const user = session?.user as any;
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const fetchLocations = async (pin: string) => {
        setLoading(true);
        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
            const data = await response.json();
            if (data[0].Status === 'Success' && data[0].PostOffice.length > 0) {
                const postOffices = data[0].PostOffice;
                setDropdownLocations(postOffices.map((po: { Name: string }) => po.Name));
            }
        } catch (error) {
            console.error('Error fetching location:', error);
        } finally {
            setLoading(false);
        }
    };


    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "glass-header py-3" : "bg-transparent py-4"
                }`}
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-0 right-1/4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl animate-pulse delay-1000" />
                <div className="absolute -top-10 left-1/2 w-40 h-40 bg-accent/3 rounded-full blur-3xl animate-pulse delay-500" />
            </div>

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
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <button className="relative text-foreground hover:text-primary transition-all font-medium flex items-center gap-2 group border-0 outline-none">
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
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <button className="relative text-foreground hover:text-primary transition-all font-medium flex items-center gap-2 group border-0 outline-none focus:ring-0 focus:ring-offset-0 focus:outline-none">
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
                        <div className="hidden lg:flex items-center gap-2 sm:gap-3">
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
                                        (pathname.startsWith("/shop-manager") || pathname === "/profile") && "ring-2 ring-primary ring-offset-2 scale-105"
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
                        </div>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors ml-1"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5 text-orange-500" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {!scrolled && (
                    <div className="mt-4 flex justify-end hidden md:flex">
                        <div
                            className={cn(
                                "relative h-11 flex items-center transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] w-full",
                                searchOpen ? "max-w-2xl" : "max-w-[280px]"
                            )}
                        >
                            <div
                                onClick={() => !searchOpen && setSearchOpen(true)}
                                className={cn(
                                    "absolute inset-0 rounded-2xl border transition-all duration-500 overflow-hidden",
                                    searchOpen
                                        ? "bg-white border-primary shadow-xl shadow-primary/10 cursor-default"
                                        : "bg-white/80 backdrop-blur-sm border-primary/20 shadow-md hover:border-primary/40 hover:bg-white cursor-pointer"
                                )}
                            >
                                <div className={cn(
                                    "absolute inset-0 bg-primary/[0.03] opacity-0 transition-opacity duration-500",
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
                                    "relative z-10 w-full h-full pl-11 pr-11 bg-transparent border-none focus:ring-0 outline-none transition-all duration-500 text-sm font-medium",
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
                )}

                {mobileMenuOpen && (
                    <div className="lg:hidden mt-4 p-6 glass-card rounded-2xl animate-in slide-in-from-top-5 duration-300 border border-primary/10 overflow-hidden">
                        {/* Mobile Search Bar Integration */}
                        <div className="relative mb-6">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-orange-500/10 rounded-lg">
                                <Search className="w-4 h-4 text-orange-600" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search shops, offers..."
                                className="w-full pl-12 pr-4 py-3 bg-secondary/30 border border-primary/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>

                        <nav className="flex flex-col gap-0">
                            <Link
                                href="/"
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "px-4 py-3 rounded-xl transition-all duration-300 border flex items-center justify-between",
                                    pathname === "/"
                                        ? "bg-orange-500/10 border-orange-500/20 text-orange-500 font-bold shadow-sm"
                                        : "hover:bg-orange-500/5 hover:text-orange-500 border-transparent hover:border-orange-500/20"
                                )}
                            >
                                <span>Home</span>
                                {pathname === "/" && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                            </Link>
                            <Link
                                href="/offers"
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "px-4 py-3 rounded-xl transition-all duration-300 border flex items-center justify-between",
                                    (pathname === "/offers" || pathname.startsWith('/offer/'))
                                        ? "bg-orange-500/10 border-orange-500/20 text-orange-500 font-bold shadow-sm"
                                        : "hover:bg-orange-500/5 hover:text-orange-500 border-transparent hover:border-orange-500/20"
                                )}
                            >
                                <span>Offers</span>
                                {(pathname === "/offers" || pathname.startsWith('/offer/')) && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                            </Link>
                            <Link
                                href="/products"
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "px-4 py-3 rounded-xl transition-all duration-300 border flex items-center justify-between",
                                    pathname.startsWith("/products")
                                        ? "bg-orange-500/10 border-orange-500/20 text-orange-500 font-bold shadow-sm"
                                        : "hover:bg-orange-500/5 hover:text-orange-500 border-transparent hover:border-orange-500/20"
                                )}
                            >
                                <span>Products</span>
                                {pathname.startsWith("/products") && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                            </Link>
                            
                            <div className="h-px bg-primary/10 my-1 opacity-50" />

                            {!isRegistered ? (
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        signIn();
                                    }}
                                    className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold shadow-sm flex items-center transition-all duration-300 hover:bg-primary/20"
                                >
                                    <LogIn className="w-4 h-4 mr-3" />
                                    Log In
                                </button>
                            ) : (
                                <>
                                    <Link 
                                        href="/profile" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "px-4 py-3 rounded-xl transition-all duration-300 border flex items-center justify-between",
                                            pathname === "/profile"
                                                ? "bg-orange-500/10 border-orange-500/20 text-orange-500 font-bold shadow-sm"
                                                : "hover:bg-orange-500/5 hover:text-orange-500 border-transparent hover:border-orange-500/20"
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <User className={cn("w-4 h-4 mr-3", pathname === "/profile" ? "text-orange-500" : "text-muted-foreground")} />
                                            Profile
                                        </div>
                                    </Link>

                                    <PremiumButton
                                        asChild
                                        size="sm"
                                        className="rounded-2xl px-3 sm:px-4 lg:px-6 w-full justify-center mt-2 group"
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
                                                    <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
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
                                        className="px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive/80 hover:text-destructive transition-all duration-300 border border-transparent hover:border-destructive/20 flex items-center mt-2 w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    className="rounded-2xl px-3 sm:px-4 lg:px-6 w-full justify-center mt-2 group"
                                >
                                    <Link
                                        href="/shop-registration"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-center p-6"
                                    >
                                        <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                        <span className="font-bold">Add your shop</span>
                                    </Link>
                                </PremiumButton>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
