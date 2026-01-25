"use client";

import { useState, useEffect } from "react";
import { Search, User, LogIn, Menu, X, MapIcon, MapPinCheck, PlusCircle, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const locations = [
    "All",
    "Kochi",
    "Trivandrum",
    "Kozhikode",
    "Thrissur",
    "Kollam",
];

const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState("Location");
    const [pincode, setPincode] = useState("");
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
    const [dropdownLocations, setDropdownLocations] = useState(locations);
    const [loading, setLoading] = useState(false);

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
                                    <span className="text-primary-foreground font-bold text-lg sm:text-xl">O</span>
                                </div>
                                <div className="absolute -inset-1 rounded-2xl border border-primary/30 animate-pulse" />
                                <div className="absolute -inset-2 rounded-2xl border border-primary/10 animate-pulse delay-300" />
                            </div>
                            <span className="font-sans text-lg sm:text-xl font-bold block text-primary">
                                OfferKart
                            </span>
                        </div>
                    </div>

                    {/* Navigation Menu - Desktop */}
                    <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
                        <a href="#" className="relative text-foreground hover:text-primary transition-all font-medium group">
                            <span className="relative z-10">Offers</span>
                            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                        </a>
                        <a href="#" className="relative text-foreground hover:text-primary transition-all font-medium group">
                            <span className="relative z-10">Products</span>
                            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                        </a>
                        <a href="#" className="relative text-foreground hover:text-primary transition-all font-medium group">
                            <span className="relative z-10">Coupon</span>
                            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                        </a>
                        <DropdownMenu>
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="relative text-foreground hover:text-primary transition-all font-medium flex items-center gap-2 group border-0 outline-none">
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
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                        >
                            <User className="w-4 h-4" />
                            <span>Account</span>
                        </Button>
                        <Button
                            size="sm"
                            className="hidden md:flex gradient-futuristic text-primary-foreground border border-primary/30 rounded-2xl px-3 sm:px-4 lg:px-6 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                        >
                            <PlusCircle className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="inline">Add your shop</span>
                        </Button>
                    </div>
                </div>

                {/* Second Row - Search */}
                {!scrolled && (
                    <div className="mt-4 flex justify-end hidden md:flex">
                        <div className={`transition-all duration-300 ease-in-out ${searchOpen ? 'w-full max-w-2xl' : 'w-auto'}`}>
                            {!searchOpen ? (
                                <Button
                                    variant="outline"
                                    onClick={() => setSearchOpen(true)}
                                    className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-primary/20 rounded-2xl shadow-lg hover:border-primary/40 transition-all"
                                >
                                    <Search className="w-5 h-5" />
                                    <span className="hidden sm:inline">Search shops, offers, deals...</span>
                                </Button>
                            ) : (
                                <div className="relative w-full group">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="text"
                                        placeholder="Search shops, offers, deals..."
                                        className="w-full pl-12 pr-12 py-3 h-12 bg-card/80 backdrop-blur-sm border border-primary/20 rounded-2xl shadow-lg focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-card transition-all hover:border-primary/40"
                                        autoFocus
                                        onBlur={() => setSearchOpen(false)}
                                    />
                                    <button
                                        onClick={() => setSearchOpen(false)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="absolute inset-0 rounded-2xl border border-primary/10 pointer-events-none group-focus-within:border-primary/30 transition-colors" />
                                </div>
                            )}
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
                            <Button
                                size="sm"
                                className="gradient-futuristic text-primary-foreground border border-primary/30 rounded-2xl px-3 sm:px-4 lg:px-6 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 w-full justify-center"
                            >
                                <PlusCircle className="w-4 h-4 mr-1 sm:mr-2" />
                                <span className="inline">Add your shop</span>
                            </Button>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
