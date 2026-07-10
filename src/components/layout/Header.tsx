"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Search, User, LogIn, Menu, X, PlusCircle, MapPin, ChevronDown, LayoutDashboard, Plus, Loader2, Home, Percent, ShoppingBag, Locate, Package, Tag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { cn } from "@/lib/utils";
import { config } from "@/lib/config";
import { getPlacesByPin, getStates } from "indian_places";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import { SearchResultData } from "@/lib/types/search";
import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import { getGlobalSearch } from "@/lib/api/userOffersService";
import { useLocationContext } from "@/context/LocationContext";
import { Arrow } from "@radix-ui/react-popover";

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

// Flat place search cache for fast, non-blocking local search
let placesCache: { name: string; district: string; state: string }[] | null = null;
let isCachingInProgress = false;


interface LocationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loading: boolean;
    locationSearch: string;
    setLocationSearch: (val: string) => void;
    dropdownLocations: string[];
    locationCoordsMap: Record<string, { lat: number; lon: number }>;
    handleSearch: (val: string) => void;
}

const LocationModal = ({
    open,
    onOpenChange,
    loading,
    locationSearch,
    setLocationSearch,
    dropdownLocations,
    locationCoordsMap,
    handleSearch
}: LocationModalProps) => {
    const { location: globalLocation, isLocationSet, setLocation } = useLocationContext();
    const selectedLocation = globalLocation.name;
    const [detectingLocation, setDetectingLocation] = useState(false);

    const handleDetectLocation = () => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        setDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        const address = data.address || {};
                        const locationName = data.display_name || address.city || address.town || address.village || address.suburb;
                        if (locationName) {
                            setLocation(locationName, latitude, longitude);
                            onOpenChange(false);
                        } else {
                            alert("Could not determine location name from coordinates.");
                        }
                    } else {
                        alert("Failed to retrieve location details.");
                    }
                } catch (error) {
                    console.error("Error auto-detecting location:", error);
                    alert("Error retrieving location details.");
                } finally {
                    setDetectingLocation(false);
                }
            },
            (error) => {
                console.warn("Geolocation query failed:", error);
                let msg = "Failed to detect location.";
                if (error.code === error.PERMISSION_DENIED) {
                    msg = "Location access denied. Please enable location permissions in your browser settings.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    msg = "Location information is unavailable.";
                } else if (error.code === error.TIMEOUT) {
                    msg = "Location request timed out.";
                }
                alert(msg);
                setDetectingLocation(false);
            },
            { timeout: 8000, enableHighAccuracy: true }
        );
    };

    return (
        <Dialog open={open} modal={false} onOpenChange={(val) => {
            // Only allow closing if a location has already been selected
            if (isLocationSet) {
                onOpenChange(val);
            }
        }}>
            <DialogContent
                onPointerDownOutside={(e) => {
                    if (!isLocationSet) e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    if (!isLocationSet) e.preventDefault();
                }}
                className={cn(
                    "p-0 overflow-hidden bg-white/95 backdrop-blur-md border border-primary/10 rounded-2xl sm:rounded-2xl shadow-2xl max-w-md w-[calc(100vw-2rem)] gap-0",
                    !isLocationSet && "[&>button:last-child]:hidden"
                )}
            >
                <DialogHeader className="px-4 py-2 border-b border-primary/5 bg-primary/5 text-left shrink-0">
                    <DialogTitle className="font-sans font-bold text-lg text-slate-800">
                        Select Location
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-1 w-full">
                        <div className="relative flex-1 group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="Search location, city, or district..."
                                value={locationSearch}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setLocationSearch(value);
                                    handleSearch(value);
                                }}
                                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-primary/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all shadow-inner"
                            />
                            {locationSearch && (
                                <button
                                    onClick={() => { setLocationSearch(""); handleSearch(""); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-primary/10 rounded-full transition-colors"
                                >
                                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground mt-1 px-1 font-medium italic">
                        {!isLocationSet ? "Please select a location to see deals near you" : "Search for your city or town to see local deals"}
                    </p>
                </DialogHeader>

                <div className="max-h-72 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                    <button
                        onClick={handleDetectLocation}
                        disabled={detectingLocation}
                        className="mx-2 rounded-xl cursor-pointer py-2 px-2 flex items-center w-[calc(100%-1rem)] text-left border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 transition-all duration-200 outline-none mb-3 shrink-0"
                    >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-3 bg-orange-500/20 shrink-0">
                            {detectingLocation ? (
                                <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                            ) : (
                                <Locate className="w-4 h-4 text-orange-600" />
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-orange-600">
                                {detectingLocation ? "Detecting location..." : "Use current location"}
                            </span>
                        </div>
                    </button>

                    <div className="flex items-center justify-between px-4 py-1 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {locationSearch ? "Search Results" : "Suggested Locations"}
                        </span>
                    </div>
                    {loading ? (
                        <div className="px-4 py-8 text-center animate-pulse">
                            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground font-medium">Searching...</p>
                        </div>
                    ) : dropdownLocations.length === 0 ? (
                        <div className="px-4 py-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <MapPin className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No locations found</p>
                        </div>
                    ) : (
                        dropdownLocations.map((loc) => {
                            const parts = loc.split(',');
                            const mainName = parts[0].trim();
                            const subtitle = parts.length > 1
                                ? parts.slice(1).map(p => p.trim()).filter(p => p !== "India" && !/^\d+$/.test(p)).slice(0, 2).join(", ")
                                : "Kerala";

                            return (
                                <button
                                    key={loc}
                                    onClick={() => {
                                        const coords = locationCoordsMap[loc] || { lat: null, lon: null };
                                        setLocation(loc, coords.lat, coords.lon);
                                        onOpenChange(false);
                                    }}
                                    className={cn(
                                        "rounded-xl cursor-pointer py-2.5 px-3 transition-all duration-200 flex items-center justify-between w-[calc(100%-1rem)] text-left border-0 outline-none bg-transparent",
                                        selectedLocation === loc
                                            ? "bg-primary/10 text-primary font-semibold"
                                            : "hover:bg-primary/5 focus:bg-primary/5"
                                    )}
                                >
                                    <div className="flex items-center w-full min-w-0">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
                                            selectedLocation === loc ? "bg-primary/20" : "bg-secondary"
                                        )}>
                                            <MapPin className={cn("w-4 h-4", selectedLocation === loc ? "text-primary" : "text-muted-foreground")} />
                                        </div>
                                        <div className="flex items-baseline min-w-0 text-left gap-1.5 flex-1">
                                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[65%]" title={loc}>
                                                {mainName}
                                            </span>
                                            {subtitle && (
                                                <span className="text-xs text-slate-400 dark:text-slate-500 truncate flex-1">
                                                    {subtitle}
                                                </span>
                                            )}
                                        </div>
                                        {selectedLocation === loc && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0 ml-2" />
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const { location: globalLocation, isLocationSet, isModalOpen: locationOpen, setLocation, setModalOpen: setLocationOpen, hydrated } = useLocationContext();
    const selectedLocation = globalLocation.name;
    const islandLocationOpen = locationOpen;
    const [islandExpanded, setIslandExpanded] = useState(false);
    const [locationSearch, setLocationSearch] = useState("");
    const [locationSearchTimer, setLocationSearchTimer] = useState<NodeJS.Timeout | null>(null);
    const [locationCoordsMap, setLocationCoordsMap] = useState<Record<string, { lat: number; lon: number }>>({});

    useEffect(() => {
        // Wait until the location context has hydrated from localStorage.
        if (!hydrated) return;

        // If location is already set, do nothing.
        if (selectedLocation !== "Location") return;

        // Helper to perform the background detection using browser Geolocation and Nominatim reverse-geocoding
        const detectBackgroundLocation = () => {
            if (typeof navigator === "undefined" || !navigator.geolocation) return;

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                        );
                        if (response.ok) {
                            const data = await response.json();
                            const address = data.address || {};
                            const locationName = data.display_name || address.city || address.town || address.village || address.suburb;
                            if (locationName) {
                                setLocation(locationName, latitude, longitude);
                            }
                        }
                    } catch (error) {
                        console.error("Error silently auto-detecting location:", error);
                    }
                },
                (error) => {
                    console.warn("Silent background geolocation query failed:", error);
                },
                { timeout: 8000 }
            );
        };

        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions
                .query({ name: "geolocation" as any })
                .then((permissionStatus) => {
                    if (permissionStatus.state === "granted") {
                        // Silent background detect since permission is already granted
                        detectBackgroundLocation();
                    } else {
                        // Prompt or Denied: open location modal to let user choose manually
                        setLocationOpen(true);
                    }
                })
                .catch(() => {
                    // Fallback to opening modal if query fails
                    setLocationOpen(true);
                });
        } else {
            // Browser doesn't support permissions query (like Safari): open location modal
            setLocationOpen(true);
        }
    }, [hydrated, selectedLocation, setLocation, setLocationOpen]);

    useEffect(() => {
        return () => {
            if (locationSearchTimer) clearTimeout(locationSearchTimer);
        };
    }, [locationSearchTimer]);
    const [dropdownLocations, setDropdownLocations] = useState(locations);
    const [loading, setLoading] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResultData | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const { resolveHierarchyById } = useCategoryHierarchy(searchOpen || searchQuery.trim().length > 0);
    const getProductHref = (p: any) => {
        const resolvedCategory = resolveHierarchyById(p.category);
        const categoryParam = resolvedCategory.main ? resolvedCategory.main : (p.category || "All");
        const subcategoryParam = resolvedCategory.sub ? `&subcategory=${encodeURIComponent(resolvedCategory.sub)}` : "";
        return `/products?search=${encodeURIComponent(p.name)}&category=${encodeURIComponent(categoryParam)}${subcategoryParam}`;
    };

    useEffect(() => {
        const trimmed = searchQuery.trim();
        if (trimmed.length < 3) {
            setSearchResults(null);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const delayDebounceFn = setTimeout(async () => {
            try {
                const result = await getGlobalSearch(trimmed);
                if (result.success && result.data) {
                    setSearchResults(result.data);
                } else {
                    setSearchResults({ products: [], offers: [] });
                }
            } catch (error) {
                console.error("Search fetch failed:", error);
                setSearchResults({ products: [], offers: [] });
            } finally {
                setIsSearching(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

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
            if (nextScrolled) {
                setIslandExpanded(false);
            } else {
                setLocationOpen(false);
                setIslandExpanded(false);
            }
        };
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
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

    const handleLocationSearch = (query: string) => {
        const cleanQuery = query.trim();
        if (locationSearchTimer) clearTimeout(locationSearchTimer);

        if (!cleanQuery) {
            setDropdownLocations(locations);
            setLoading(false);
            return;
        }

        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const lowerQuery = cleanQuery.toLowerCase();
                const results: string[] = [];

                // 1. Search in suggested locations first
                const matchedSuggestions = locations.filter(loc =>
                    loc !== "All" && loc.toLowerCase().includes(lowerQuery)
                );
                results.push(...matchedSuggestions);

                if (cleanQuery.length >= 3) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 4000);

                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&countrycodes=in&limit=15`,
                            { signal: controller.signal }
                        );
                        clearTimeout(timeoutId);

                        if (response.ok) {
                            const data = await response.json();
                            if (Array.isArray(data) && data.length > 0) {
                                data.forEach((item: any) => {
                                    if (item.display_name && !results.includes(item.display_name)) {
                                        results.push(item.display_name);
                                        setLocationCoordsMap(prev => ({
                                            ...prev,
                                            [item.display_name]: {
                                                lat: parseFloat(item.lat),
                                                lon: parseFloat(item.lon)
                                            }
                                        }));
                                    }
                                });
                            }
                        }
                    } catch (apiError) {
                        console.warn("Nominatim API lookup failed, falling back to local database:", apiError);
                    }

                }
                setDropdownLocations(results);
            } catch (error) {
                console.error("Error searching locations:", error);
            } finally {
                setLoading(false);
            }
        }, 300);

        setLocationSearchTimer(timer);
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
                    <nav className="flex flex-col gap-3">
                        <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-primary/5 pb-2.5">
                            <span className="text-sm font-bold uppercase tracking-wider text-orange-500">{currentLanguageName}</span>
                            <LanguageSwitcher className="[&>button]:py-1.5 [&>button]:px-3.5 [&>button]:rounded-xl" />
                        </div>

                        <div className="w-full flex flex-col gap-2.5">
                            {!isRegistered ? (
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        signIn();
                                    }}
                                    className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold shadow-sm flex items-center justify-center transition-all duration-300 hover:bg-primary/20 w-full text-center"
                                >
                                    <LogIn className="w-4 h-4 mr-3" />
                                    Log In
                                </button>
                            ) : (
                                <>
                                    <PremiumButton
                                        asChild
                                        size="sm"
                                        className="rounded-2xl px-3 sm:px-4 lg:px-6 w-full justify-center group h-auto"
                                    >
                                        <Link
                                            href={user?.business_name ? "/shop-manager" : "/shop-registration"}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center justify-center py-3.5 px-4 w-full"
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
                                        className="px-4 py-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-destructive/80 hover:text-destructive transition-all duration-300 border border-destructive/20 hover:border-destructive/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    className="rounded-2xl px-3 sm:px-4 lg:px-6 w-full justify-center group h-auto"
                                >
                                    <Link
                                        href="/shop-registration"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-center py-3.5 px-4 w-full"
                                    >
                                        <PlusCircle className="w-4 h-4 mr-2" />
                                        <span className="font-bold">Add your shop</span>
                                    </Link>
                                </PremiumButton>
                            )}
                        </div>

                        {/* Close Button at bottom right */}
                        <div className="flex justify-end mt-0.5">
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-center p-1.5 rounded-lg border border-primary/10 hover:border-primary/20 bg-secondary/30 text-muted-foreground hover:text-foreground transition-all duration-200 transform active:scale-95 shadow-sm"
                                aria-label="Close menu"
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
                        "absolute left-1/2 -translate-x-1/2 transition-all duration-300 ease-out transform-gpu origin-top pointer-events-none",
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
                        "transition-all duration-150 ease-out origin-top py-2.5 lg:py-4",
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
                                        <button
                                            onClick={() => setLocationOpen(true)}
                                            className="relative text-foreground hover:text-primary transition-all font-medium flex items-center gap-2 group border-0 outline-none select-none"
                                        >
                                            <MapPin className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                                            <span className="relative z-10">{selectedLocation.split(',')[0]}</span>
                                            <ChevronDown className="w-4 h-4 transition-transform group-hover:scale-110" />
                                            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                                        </button>
                                    </nav>

                                    {/* Mobile Location */}
                                    <div className="lg:hidden">
                                        <button
                                            onClick={() => setLocationOpen(true)}
                                            className="relative text-foreground hover:text-primary transition-all font-medium flex items-center gap-2 group border-0 outline-none focus:ring-0 focus:ring-offset-0 focus:outline-none select-none"
                                        >
                                            <MapPin className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                                            <span className="relative z-10">{selectedLocation.split(',')[0]}</span>
                                            <ChevronDown className="w-4 h-4 transition-transform group-hover:scale-110" />
                                            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                                        </button>
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

                            <div className="mt-4 flex justify-end hidden lg:flex">
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
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setSearchOpen(true)}
                                        onBlur={(e) => {
                                            if (e.relatedTarget?.getAttribute('data-clear') === 'true') return;
                                            setTimeout(() => {
                                                setSearchOpen(false);
                                            }, 200);
                                        }}
                                        className={cn(
                                            "relative z-10 w-full h-full pl-11 pr-11 bg-transparent border-none focus:ring-0 outline-none transition-all duration-[600ms] text-sm font-medium",
                                            !searchOpen && "cursor-pointer"
                                        )}
                                    />

                                    {!searchOpen && !searchQuery && (
                                        <span className="absolute left-11 text-sm font-medium text-muted-foreground opacity-70 pointer-events-none transition-opacity duration-300">
                                            Search shops, offers, deals...
                                        </span>
                                    )}

                                    <button
                                        data-clear="true"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSearchQuery("");
                                            setSearchResults(null);
                                            setSearchOpen(false);
                                        }}
                                        className={cn(
                                            "absolute right-3 z-20 p-1 rounded-full hover:bg-secondary transition-all duration-300",
                                            searchOpen ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
                                        )}
                                    >
                                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>

                                    {/* Desktop Search Results Dropdown */}
                                    {searchOpen && searchQuery && (
                                        <div
                                            onMouseDown={(e) => e.preventDefault()}
                                            className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.5)] z-50 overflow-hidden max-h-[420px] overflow-y-auto animate-in fade-in slide-in-from-top-3 duration-300"
                                        >
                                            {isSearching ? (
                                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                                    <div className="relative">
                                                        <div className="w-8 h-8 rounded-full border-2 border-orange-200 dark:border-orange-900/40" />
                                                        <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-transparent border-t-orange-500 animate-spin" />
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-medium">Finding results...</span>
                                                </div>
                                            ) : (!searchResults || !searchResults.products || !searchResults.offers || (searchResults.products.length === 0 && searchResults.offers.length === 0)) ? (
                                                <div className="flex flex-col items-center justify-center py-12 gap-2">
                                                    <Search className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                                    <span className="text-sm text-slate-400 dark:text-slate-500">No results found</span>
                                                </div>
                                            ) : (
                                                <div className="pb-2">
                                                    {/* Products Section */}
                                                    {searchResults.products && searchResults.products.length > 0 && (
                                                        <div className="mb-3 last:mb-0">
                                                            <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-500 dark:text-orange-400 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800/40 mb-2">
                                                                Products
                                                            </div>
                                                            <div className="max-h-[240px] overflow-y-auto pr-1 px-2">
                                                                {searchResults.products.map((p, idx) => (
                                                                    <Link
                                                                        key={idx}
                                                                        href={getProductHref(p)}
                                                                        onClick={() => {
                                                                            setSearchOpen(false);
                                                                            setSearchQuery("");
                                                                        }}
                                                                        className="group/item flex items-center justify-between mx-1 px-3 py-1.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 text-left gap-4"
                                                                    >
                                                                        <div className="flex flex-col min-w-0 flex-1">
                                                                            <div className="text-[10px] text-slate-400 font-normal tracking-wide mb-0.5">
                                                                                in <span className="text-orange-500 dark:text-orange-400 font-medium">{p.category || "General"}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                {/* <ArrowRight className="w-3.5 h-3.5 text-orange-500 shrink-0" /> */}
                                                                                <span className="font-semibold text-[11.5px] text-slate-800 dark:text-slate-200 truncate leading-tight tracking-wide pl-1" title={p.name}>
                                                                                    {p.name}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2.5 shrink-0">
                                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-400 tracking-wide bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg select-none">
                                                                                <span>{p.totalOfferProducts} {p.totalOfferProducts === 1 ? 'Product' : 'Products'}</span>
                                                                                <span className="text-slate-300 dark:text-slate-600 font-normal">•</span>
                                                                                <span>{p.shopCount} {p.shopCount === 1 ? 'Shop' : 'Shops'}</span>
                                                                            </div>
                                                                            <ChevronDown className="w-4 h-4 -rotate-90 text-slate-300 dark:text-slate-600 group-hover/item:text-slate-400 transition-colors shrink-0" />
                                                                        </div>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Offers Section */}
                                                    {searchResults.offers && searchResults.offers.length > 0 && (
                                                        <div className="mb-1 last:mb-0">
                                                            <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-500 dark:text-orange-400 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800/40 mb-2">
                                                                Offers
                                                            </div>
                                                            <div className="max-h-[240px] overflow-y-auto pr-1 px-2 space-y-0.5">
                                                                {searchResults.offers.map((o) => (
                                                                    <Link
                                                                        key={o.offerId}
                                                                        href={`/offer/${o.offerId}`}
                                                                        onClick={() => {
                                                                            setSearchOpen(false);
                                                                            setSearchQuery("");
                                                                        }}
                                                                        className="group/item flex items-center justify-between mx-1 px-3 py-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 text-left"
                                                                    >
                                                                        <div className="flex flex-col min-w-0 w-full py-0.5">
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                <Tag className="w-3 h-3 text-orange-500 shrink-0" />
                                                                                <span className="font-semibold text-[13px] text-slate-800 dark:text-slate-200 truncate leading-tight tracking-wide" title={o.offerName}>
                                                                                    {o.offerName}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <ChevronDown className="w-4 h-4 -rotate-90 text-slate-300 dark:text-slate-600 group-hover/item:text-slate-400 transition-colors shrink-0" />
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Navigation and Search */}
                            <div className="lg:hidden mt-2.5 flex flex-col gap-2 px-0.5 animate-in slide-in-from-top-3 duration-300">
                                {/* Three Classic Premium Button Links */}
                                <div className="grid grid-cols-3 gap-2">
                                    <Link
                                        href="/"
                                        className={cn(
                                            "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all duration-300 transform active:scale-95 shadow-sm",
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
                                            "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all duration-300 transform active:scale-95 shadow-sm",
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
                                            "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all duration-300 transform active:scale-95 shadow-sm",
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
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                    <div className="relative flex items-center bg-white/50 dark:bg-black/20 border border-primary/10 group-focus-within:border-orange-500/30 group-focus-within:bg-white rounded-xl shadow-sm transition-all duration-300 overflow-hidden">
                                        <div className="pl-3 pr-2 py-2.5 flex items-center pointer-events-none">
                                            <Search className="w-4 h-4 text-muted-foreground/80 group-focus-within:text-orange-500 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search shops, offers, products..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full py-2.5 pr-8 bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-xs font-medium placeholder:text-muted-foreground/50 text-foreground"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => {
                                                    setSearchQuery("");
                                                    setSearchResults(null);
                                                }}
                                                className="absolute right-3 p-1 rounded-full hover:bg-secondary transition-all duration-300"
                                            >
                                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Mobile Search Results Dropdown */}
                                    {searchQuery && (
                                        <div
                                            onMouseDown={(e) => e.preventDefault()}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-[0_12px_36px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_36px_-8px_rgba(0,0,0,0.5)] z-50 overflow-hidden max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-3 duration-300"
                                        >
                                            {isSearching ? (
                                                <div className="flex flex-col items-center justify-center py-10 gap-2.5">
                                                    <div className="relative">
                                                        <div className="w-7 h-7 rounded-full border-2 border-orange-200 dark:border-orange-900/40" />
                                                        <div className="absolute inset-0 w-7 h-7 rounded-full border-2 border-transparent border-t-orange-500 animate-spin" />
                                                    </div>
                                                    <span className="text-[11px] text-slate-400 font-medium">Finding results...</span>
                                                </div>
                                            ) : (!searchResults || !searchResults.products || !searchResults.offers || (searchResults.products.length === 0 && searchResults.offers.length === 0)) ? (
                                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                                    <Search className="w-4.5 h-4.5 text-slate-300 dark:text-slate-600" />
                                                    <span className="text-xs text-slate-400 dark:text-slate-500">No results found</span>
                                                </div>
                                            ) : (
                                                <div className="pb-1.5">
                                                    {/* Products */}
                                                    {searchResults.products && searchResults.products.length > 0 && (
                                                        <div className="mb-1 last:mb-0">
                                                            <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-orange-500 dark:text-orange-400 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800/40 mb-1">
                                                                Products
                                                            </div>
                                                            <div className="max-h-[200px] overflow-y-auto pr-1 px-1.5">
                                                                {searchResults.products.map((p, idx) => (
                                                                    <Link
                                                                        key={idx}
                                                                        href={getProductHref(p)}
                                                                        onClick={() => {
                                                                            setSearchQuery("");
                                                                        }}
                                                                        className="group/item flex items-center justify-between mx-0.5 px-2 py-1 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 text-left"
                                                                    >
                                                                        <div className="flex flex-col min-w-0 flex-1">
                                                                            <div className="text-[9.5px] text-slate-400 font-normal tracking-wide mb-0.5">
                                                                                in <span className="text-orange-500 dark:text-orange-400 font-medium">{p.category || "General"}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                <Package className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                                                                <span className="font-semibold text-[12.5px] text-slate-800 dark:text-slate-200 truncate leading-tight tracking-wide" title={p.name}>
                                                                                    {p.name}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wide bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md select-none">
                                                                                <span>{p.totalOfferProducts} {p.totalOfferProducts === 1 ? 'Product' : 'Products'}</span>
                                                                                <span className="text-slate-300 dark:text-slate-600 font-normal">•</span>
                                                                                <span>{p.shopCount} {p.shopCount === 1 ? 'Shop' : 'Shops'}</span>
                                                                            </div>
                                                                            <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-slate-300 dark:text-slate-600 group-hover/item:text-slate-400 transition-colors shrink-0" />
                                                                        </div>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Offers */}
                                                    {searchResults.offers && searchResults.offers.length > 0 && (
                                                        <div className="mb-1 last:mb-0">
                                                            <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-orange-500 dark:text-orange-400 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800/40 mb-1.5">
                                                                Offers
                                                            </div>
                                                            <div className="max-h-[200px] overflow-y-auto pr-1 px-1.5 space-y-0.5">
                                                                {searchResults.offers.map((o) => (
                                                                    <Link
                                                                        key={o.offerId}
                                                                        href={`/offer/${o.offerId}`}
                                                                        onClick={() => {
                                                                            setSearchQuery("");
                                                                        }}
                                                                        className="group/item flex items-center justify-between mx-0.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 text-left"
                                                                    >
                                                                        <div className="flex flex-col min-w-0 w-full py-0.5">
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                <Tag className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                                                                <span className="font-semibold text-[13px] text-slate-800 dark:text-slate-200 truncate leading-tight tracking-wide" title={o.offerName}>
                                                                                    {o.offerName}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-slate-300 dark:text-slate-600 group-hover/item:text-slate-400 transition-colors shrink-0" />
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {mobileMenu}
                        </div>
                    </div>

                    {/* Compact Dynamic Island Content */}
                    <div className={cn(
                        "transition-all duration-150 ease-out origin-top max-w-[min(520px,calc(100vw-1.5rem))] mx-auto pt-4",
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
                                    setLocationOpen(true);
                                }}
                            >
                                <div className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/40 dark:bg-white/10 border border-white/30 dark:border-white/10 max-w-[240px]">
                                    <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                                    <span className="text-xs font-semibold truncate">
                                        {selectedLocation.split(',')[0]}
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

            <LocationModal
                open={locationOpen}
                onOpenChange={setLocationOpen}
                loading={loading}
                locationSearch={locationSearch}
                setLocationSearch={setLocationSearch}
                dropdownLocations={dropdownLocations}
                locationCoordsMap={locationCoordsMap}
                handleSearch={handleLocationSearch}
            />
        </header>
    );
};

export default Header;
