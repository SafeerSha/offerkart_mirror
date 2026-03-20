"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import debounce from "lodash.debounce";
import { Search, Loader2, X, MapPin, Target, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Fix Leaflet marker icon issue in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const INDIA_BOUNDS = {
    north: 35.5,
    south: 6.5,
    west: 68.0,
    east: 97.5,
};

const KERALA_DEFAULT: [number, number] = [10.7867, 76.6548];

function isInsideIndia(lat: number, lng: number): boolean {
    return (
        lat >= INDIA_BOUNDS.south &&
        lat <= INDIA_BOUNDS.north &&
        lng >= INDIA_BOUNDS.west &&
        lng <= INDIA_BOUNDS.east
    );
}

interface SearchResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

interface MapPickerProps {
    value?: { lat: number; lng: number };
    onChange: (coords: { lat: number; lng: number }) => void;
    center?: [number, number];
    zoom?: number;
}

function MapEvents({ onChange, onWarning }: { onChange: (coords: { lat: number; lng: number }) => void; onWarning: (msg: string) => void }) {
    useMapEvents({
        click(e) {
            if (isInsideIndia(e.latlng.lat, e.latlng.lng)) {
                onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
            } else {
                onWarning("Please select a location within India");
            }
        },
    });
    return null;
}

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

export default function MapPicker({
    value,
    onChange,
    center = [20.5937, 78.9629], // Default to India center
    zoom = 13
}: MapPickerProps) {
    const [mounted, setMounted] = useState(false);
    const [position, setPosition] = useState<[number, number] | null>(
        value ? [value.lat, value.lng] : null
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>(
        value ? [value.lat, value.lng] : center
    );
    const [warningMessage, setWarningMessage] = useState<string | null>(null);
    const warningTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    const showWarning = useCallback((msg: string) => {
        setWarningMessage(msg);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        warningTimerRef.current = setTimeout(() => setWarningMessage(null), 4000);
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (value && value.lat && value.lng) {
            const newPos: [number, number] = [value.lat, value.lng];
            setPosition(newPos);
            setMapCenter(newPos);
        }
    }, [value]);

    // Geolocation Function
    const handleGetCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);

        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                if (isInsideIndia(latitude, longitude)) {
                    const newPos: [number, number] = [latitude, longitude];
                    setPosition(newPos);
                    setMapCenter(newPos);
                    onChange({ lat: latitude, lng: longitude });
                    setIsLocating(false);
                    toast.success("Location updated to your current position");
                } else {
                    // Outside India — default to Kerala
                    showWarning("Your current location is outside India. Defaulting to Kerala.");
                    setPosition(KERALA_DEFAULT);
                    setMapCenter(KERALA_DEFAULT);
                    onChange({ lat: KERALA_DEFAULT[0], lng: KERALA_DEFAULT[1] });
                    setIsLocating(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                setIsLocating(false);
                let errorMessage = "Unable to retrieve your location.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location permission denied. Please enable it in browser settings.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "The request to get user location timed out.";
                        break;
                }
                toast.error(errorMessage);
            },
            options
        );
    }, [onChange, showWarning]);

    // Nominatim Search Function
    const handleSearch = async (query: string) => {
        if (query.length < 3) return;
        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`
            );
            const data = await response.json();
            setSearchResults(data);
            setShowResults(true);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const debouncedSearch = useMemo(
        () => debounce(handleSearch, 800),
        []
    );

    useEffect(() => {
        if (searchQuery) debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);

    const selectResult = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const newPos: [number, number] = [lat, lng];
        setPosition(newPos);
        setMapCenter(newPos);
        onChange({ lat, lng });
        setShowResults(false);
        setSearchQuery(result.display_name);
    };

    const debouncedOnChange = useMemo(
        () => debounce(onChange, 300),
        [onChange]
    );

    const handleMarkerDrag = useCallback((e: L.LeafletEvent) => {
        const marker = e.target;
        const { lat, lng } = marker.getLatLng();
        if (isInsideIndia(lat, lng)) {
            const newPos: [number, number] = [lat, lng];
            setPosition(newPos);
            debouncedOnChange({ lat, lng });
        } else {
            showWarning("Please select a location within India");
            const fallback = position || KERALA_DEFAULT;
            marker.setLatLng(fallback);
            setPosition(fallback);
        }
    }, [debouncedOnChange, position, showWarning]);

    if (!mounted) return <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl" />;

    return (
        <div className="h-full w-full relative rounded-xl overflow-hidden border border-gray-200 group">
            {/* Search Bar Overlay */}
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-[1000] max-w-md mx-auto">
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </div>
                    <input
                        type="text"
                        placeholder="Search city, area, or landmark..."
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-gray-900 placeholder-gray-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery && setShowResults(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                debouncedSearch.cancel();
                                handleSearch(searchQuery);
                            }
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setShowResults(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            type="button"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* Search Results Dropdown */}
                    {showResults && searchResults.length > 0 && (
                        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="max-h-60 overflow-y-auto py-1">
                                {searchResults.map((result) => (
                                    <button
                                        key={result.place_id}
                                        onClick={() => selectResult(result)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0"
                                        type="button"
                                    >
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{result.display_name.split(',')[0]}</p>
                                            <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{result.display_name}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <MapContainer
                center={mapCenter}
                zoom={zoom}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
                attributionControl={false}
                zoomControl={false}
                maxBounds={[[INDIA_BOUNDS.south - 2, INDIA_BOUNDS.west - 2], [INDIA_BOUNDS.north + 2, INDIA_BOUNDS.east + 2]]}
                maxBoundsViscosity={0.8}
                minZoom={4}
            >
                <TileLayer
                    attribution=''
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <ZoomControl position="bottomleft" />

                <ChangeView center={mapCenter} />

                <MapEvents onChange={(coords) => {
                    setPosition([coords.lat, coords.lng]);
                    debouncedOnChange(coords);
                }} onWarning={showWarning} />

                {position && (
                    <Marker
                        position={position}
                        icon={icon}
                        draggable={true}
                        eventHandlers={{
                            dragend: handleMarkerDrag
                        }}
                    />
                )}

                {/* Geolocation Button */}
                <div className="absolute bottom-24 right-2 z-[1000]">
                    <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={isLocating}
                        className={cn(
                            "p-2 bg-white border border-gray-200 rounded-lg shadow-lg hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50",
                            isLocating && "text-blue-600"
                        )}
                        title="Use my current location"
                    >
                        {isLocating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Target className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Recenter Button (Back to Pin) */}
                {position && (
                    <div className="absolute bottom-12 right-2 z-[1000]">
                        <button
                            type="button"
                            onClick={() => setMapCenter(position)}
                            className="p-2 bg-white border border-gray-200 rounded-lg shadow-lg hover:bg-gray-50 text-gray-600 transition-colors"
                            title="Center on marker"
                        >
                            <MapPin className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </MapContainer>

            {/* Warning Banner */}
            {warningMessage && (
                <div className="absolute top-14 sm:top-16 left-2 sm:left-4 right-2 sm:right-4 z-[1001] max-w-md mx-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl shadow-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <p className="text-xs font-medium text-amber-800 flex-1">{warningMessage}</p>
                        <button
                            type="button"
                            onClick={() => setWarningMessage(null)}
                            className="p-0.5 hover:bg-amber-100 rounded-full text-amber-500 hover:text-amber-700 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Instruction Overlay */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[10] bg-white/95 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[9px] sm:text-[11px] font-medium text-gray-600 border border-gray-200 shadow-xl pointer-events-none whitespace-nowrap">
                {typeof window !== 'undefined' && window.innerWidth < 640 ? 'Tap' : 'Click'} or drag pin to set location
            </div>
        </div>
    );
}
