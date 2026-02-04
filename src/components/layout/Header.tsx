"use client";

import { useState, useEffect } from "react";
import { Search, User, LogIn, Menu, X, MapIcon, MapPinCheck, PlusCircle, MapPin, ChevronDown, ChevronUp, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRegistration } from "@/hooks/useRegistration";
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
    const { isRegistered, setRegistrationStatus } = useRegistration();

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
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-0 right-1/4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl animate-pulse delay-1000" />
                <div className="absolute -top-10 left-1/2 w-40 h-40 bg-accent/3 rounded-full blur-3xl animate-pulse delay-500" />
            </div>

            <div className="container mx-auto px-4 relative">
                {/* First Row */}
                <div className="flex items-center justify-between gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    {/* Logo */}
                    <div className="flex items-center justify-center flex-shrink-0 group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl gradient-futuristic flex items-center justify-center transform transition-transform group-hover:scale-110 group-hover:rotate-3">
                                    <span className="text-primary font-bold text-lg sm:text-xl">O</span>
                                </div>
                                <div className="absolute -inset-1 rounded-2xl border border-primary/30 animate-pulse" />
                                <div className="absolute -inset-2 rounded-2xl border border-primary/10 animate-pulse delay-300" />
                            </div>
                            <span className="font-sans text-lg sm:text-xl font-bold block text-orange-500">
                                OfferKart
                            </span>
                        </div>
                    </div>

                    {/* Navigation Menu - Desktop */}
                    <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
                        <Link href="/offers" className="relative text-foreground hover:text-primary transition-all font-medium group">
                            <span className="relative z-10">Offers</span>
                            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                        </Link>
                        <a href="#" className="relative text-foreground hover:text-primary transition-all font-medium group">
                            <span className="relative z-10">Products</span>
                            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                        </a>
                        <a href="#" className="relative text-foreground hover:text-primary transition-all font-medium group">
                            <span className="relative z-10">Coupon</span>
                            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                        </a>
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <button className="relative text-foreground hover:text-primary transition-all font-medium flex items-center gap-2 group border-0 outline-none">
                                    <MapPin className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                                    <span className="relative z-10">{selectedLocation}</span>
                                    <ChevronDown className="w-4 h-4 transition-transform group-hover:scale-110" />
                                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 p-2 max-h-64 overflow-y-auto scrollbar-hide bg-white" align="start">
                                <div className="mb-2 sticky top-0 bg-popover z-10">
                                    <input
                                        type="text"
                                        placeholder="Enter pincode"
                                        value={pincode}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setPincode(value);
                                            if (value === '') {
                                                setDropdownLocations(locations);
                                            }
                                            if (debounceTimer) clearTimeout(debounceTimer);
                                            const timer = setTimeout(() => {
                                                if (value.length === 6 && /^\d+$/.test(value)) {
                                                    fetchLocations(value);
                                                }
                                            }, 500);
                                            setDebounceTimer(timer);
                                        }}
                                        className="w-full pl-3 pr-3 py-2 text-sm border border-orange-500 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-600 focus:outline-none"
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground mb-2 px-2 sticky top-10 bg-popover z-10">Select Location</div>
                                {loading ? (
                                    <div className="text-sm text-muted-foreground px-2 py-1">Loading...</div>
                                ) : (
                                    dropdownLocations.map((location) => (
                                        <DropdownMenuItem
                                            key={location}
                                            onClick={() => setSelectedLocation(location)}
                                            className={`cursor-pointer ${selectedLocation === location ? "bg-primary/10 text-primary" : ""}`}
                                        >
                                            <MapPin className="w-4 h-4 mr-2" />
                                            {location}
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 sm:gap-3">
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
                                <DropdownMenuContent className="w-80 p-2 max-h-64 overflow-y-auto scrollbar-hide bg-white" align="start">
                                    <div className="mb-2 sticky top-0 bg-popover z-10">
                                        <input
                                            type="text"
                                            placeholder="Enter pincode"
                                            value={pincode}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setPincode(value);
                                                if (value === '') {
                                                    setDropdownLocations(locations);
                                                }
                                                if (debounceTimer) clearTimeout(debounceTimer);
                                                const timer = setTimeout(() => {
                                                    if (value.length === 6 && /^\d+$/.test(value)) {
                                                        fetchLocations(value);
                                                    }
                                                }, 500);
                                                setDebounceTimer(timer);
                                            }}
                                            className="w-full pl-3 pr-3 py-2 text-sm border border-orange-500 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-600 focus:outline-none"
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-2 px-2 sticky top-10 bg-popover z-10">Select Location</div>
                                    {loading ? (
                                        <div className="text-sm text-muted-foreground px-2 py-1">Loading...</div>
                                    ) : (
                                        dropdownLocations.map((location) => (
                                            <DropdownMenuItem
                                                key={location}
                                                onClick={() => setSelectedLocation(location)}
                                                className={`cursor-pointer ${selectedLocation === location ? "bg-primary/10 text-primary" : ""}`}
                                            >
                                                <MapPin className="w-4 h-4 mr-2" />
                                                {location}
                                            </DropdownMenuItem>
                                        ))
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* <DropdownMenu onOpenChange={setAccountOpen} modal={false}>
                            <DropdownMenuTrigger asChild>
                                <PremiumButton
                                    variant="ghost"
                                    size="sm"
                                    leftIcon={User}
                                    rightIcon={accountOpen ? ChevronUp : ChevronDown}
                                    className="hidden md:flex text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all group focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none focus:outline-none"
                                >
                                    <span>Account</span>
                                </PremiumButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 bg-white/95 backdrop-blur-md border-primary/10 rounded-2xl shadow-xl">
                                <div className="px-2 py-2 mb-1 border-b border-primary/5">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User Account</p>
                                </div>
                                {isRegistered ? (
                                    <>
                                        <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/5 cursor-pointer py-2.5">
                                            <Link href="/shop-manager" className="flex items-center w-full">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                                                    <LayoutDashboard className="w-4 h-4 text-primary" />
                                                </div>
                                                <span className="font-medium">Shop Dashboard</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/5 cursor-pointer py-2.5">
                                            <Link href="/shop-manager/create-offer" className="flex items-center w-full">
                                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center mr-3">
                                                    <PlusCircle className="w-4 h-4 text-orange-500" />
                                                </div>
                                                <span className="font-medium">Create New Offer</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </>
                                ) : (
                                    <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/5 cursor-pointer py-2.5">
                                        <Link href="/shop-registration" className="flex items-center w-full">
                                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center mr-3">
                                                <MapPinCheck className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <span className="font-medium">Join as Partner</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="rounded-xl focus:bg-primary/5 cursor-pointer py-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mr-3">
                                        <User className="w-4 h-4 text-secondary" />
                                    </div>
                                    <span className="font-medium">Profile Settings</span>
                                </DropdownMenuItem>
                                <div className="my-1 border-t border-primary/5" />
                                <DropdownMenuItem
                                    className="rounded-xl focus:bg-destructive/5 text-destructive cursor-pointer py-2.5"
                                    onClick={() => {
                                        setRegistrationStatus(false);
                                        window.location.href = "/";
                                    }}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center mr-3">
                                        <LogIn className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">Log Out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu> */}

                        {!isRegistered && (
                            <PremiumButton
                                variant="outline"
                                size="sm"
                                className="hidden md:flex rounded-2xl px-3 sm:px-4 lg:px-6 border-primary/20 hover:bg-primary/5 transition-all duration-300"
                                asChild
                            >
                                <Link href="/login" className="flex items-center">
                                    <LogIn className="w-4 h-4 mr-2" />
                                    <span className="inline">Login</span>
                                </Link>
                            </PremiumButton>
                        )}

                        <PremiumButton
                            asChild
                            size="sm"
                            className="hidden md:flex rounded-2xl px-3 sm:px-4 lg:px-6 shadow-lg shadow-primary/20"
                        >
                            <Link href={isRegistered ? "/shop-manager" : "/shop-registration"} className="flex items-center">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                <span className="inline">{isRegistered ? "Manage your shop" : "Add your shop"}</span>
                            </Link>
                        </PremiumButton>
                    </div>
                </div>

                {/* Second Row - Search Field */}
                {!scrolled && (
                    <div className="mt-4 flex justify-end hidden md:flex">
                        <div
                            className={cn(
                                "relative h-11 flex items-center transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] w-full",
                                searchOpen ? "max-w-2xl" : "max-w-[280px]"
                            )}
                        >
                            {/* Persistent Glass Container */}
                            <div
                                onClick={() => !searchOpen && setSearchOpen(true)}
                                className={cn(
                                    "absolute inset-0 rounded-2xl border transition-all duration-500 overflow-hidden",
                                    searchOpen
                                        ? "bg-white border-primary shadow-xl shadow-primary/10 cursor-default"
                                        : "bg-white/80 backdrop-blur-sm border-primary/20 shadow-md hover:border-primary/40 hover:bg-white cursor-pointer"
                                )}
                            >
                                {/* Subtle inner glow on focus */}
                                <div className={cn(
                                    "absolute inset-0 bg-primary/[0.03] opacity-0 transition-opacity duration-500",
                                    searchOpen && "opacity-100"
                                )} />
                            </div>

                            {/* Icons Layer */}
                            <Search className={cn(
                                "absolute left-4 w-4 h-4 z-20 transition-colors duration-300 pointer-events-none",
                                searchOpen ? "text-primary" : "text-muted-foreground"
                            )} />

                            {/* Clean Transitioning Input */}
                            <input
                                type="text"
                                placeholder={searchOpen ? "Search for shops, offers, deals..." : ""}
                                onFocus={() => setSearchOpen(true)}
                                onBlur={(e) => {
                                    // Don't close if we clicked the clear button
                                    if (e.relatedTarget?.getAttribute('data-clear') === 'true') return;
                                    setSearchOpen(false);
                                }}
                                className={cn(
                                    "relative z-10 w-full h-full pl-11 pr-11 bg-transparent border-none focus:ring-0 outline-none transition-all duration-500 text-sm font-medium",
                                    !searchOpen && "cursor-pointer"
                                )}
                            />

                            {/* Placeholder that mimics the input's text when closed */}
                            {!searchOpen && (
                                <span className="absolute left-11 text-sm font-medium text-muted-foreground opacity-70 pointer-events-none transition-opacity duration-300">
                                    Search shops, offers, deals...
                                </span>
                            )}

                            {/* Clear Button */}
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

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden mt-4 p-6 glass-card rounded-2xl animate-fade-in border border-primary/10">
                        <nav className="flex flex-col gap-3">
                            <a href="#" className="px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 border border-transparent hover:border-primary/20">
                                Offers
                            </a>
                            <a href="#" className="px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 border border-transparent hover:border-primary/20">
                                Products
                            </a>
                            <a href="#" className="px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 border border-transparent hover:border-primary/20">
                                Coupon
                            </a>
                            <a href="#" className="px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 border border-transparent hover:border-primary/20 flex items-center">
                                <User className="w-4 h-4 mr-3 text-muted-foreground" />
                                Profile
                            </a>
                            {isRegistered && (
                                <Link
                                    href="/shop-manager"
                                    className="px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 border border-transparent hover:border-primary/20 flex items-center"
                                >
                                    <LayoutDashboard className="w-4 h-4 mr-3 text-primary" />
                                    Shop Dashboard
                                </Link>
                            )}
                            <PremiumButton
                                asChild
                                size="sm"
                                className="rounded-2xl px-3 sm:px-4 lg:px-6 w-full justify-center mt-2"
                            >
                                <Link href={isRegistered ? "/shop-manager" : "/shop-registration"} className="flex items-center justify-center">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    <span className="inline">{isRegistered ? "Manage your shop" : "Add your shop"}</span>
                                </Link>
                            </PremiumButton>

                            <button
                                onClick={() => {
                                    setRegistrationStatus(false);
                                    window.location.href = "/";
                                }}
                                className="px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive transition-all duration-300 border border-transparent hover:border-destructive/20 flex items-center mt-1 w-full text-left"
                            >
                                <LogIn className="w-4 h-4 mr-3" />
                                <span className="font-medium">Log Out</span>
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
