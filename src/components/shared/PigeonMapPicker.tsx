"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Map, Marker } from "pigeon-maps";
import { Search, Loader2, X, MapPin, Target, AlertTriangle, Plus, Minus } from "lucide-react";
import debounce from "lodash.debounce";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SearchResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

interface PigeonMapPickerProps {
    value?: { lat: number; lng: number };
    onChange: (coords: { lat: number; lng: number }) => void;
    center?: [number, number];
    zoom?: number;
}

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

export default function PigeonMapPicker({
    value,
    onChange,
    center = [20.5937, 78.9629], // India default
    zoom = 13
}: PigeonMapPickerProps) {
    const [mapCenter, setMapCenter] = useState<[number, number]>(
        value ? [value.lat, value.lng] : center
    );
    const [mapZoom, setMapZoom] = useState(zoom);
    const [isLocating, setIsLocating] = useState(false);

    // Search States
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Sync map center if value changes externally
    useEffect(() => {
        if (value && value.lat && value.lng) {
            setMapCenter([value.lat, value.lng]);
        }
    }, [value]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                if (isInsideIndia(latitude, longitude)) {
                    setMapCenter([latitude, longitude]);
                    onChange({ lat: latitude, lng: longitude });
                    setIsLocating(false);
                    toast.success("Location updated to your current position");
                } else {
                    toast.error("Your current location is outside India. Defaulting to Kerala.");
                    setMapCenter(KERALA_DEFAULT);
                    onChange({ lat: KERALA_DEFAULT[0], lng: KERALA_DEFAULT[1] });
                    setIsLocating(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                setIsLocating(false);
                toast.error("Unable to retrieve your location.");
            }
        );
    };

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

    const selectResult = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        if (!isInsideIndia(lat, lng)) {
            toast.error("Please select a location within India");
            return;
        }
        setMapCenter([lat, lng]);
        onChange({ lat, lng });
        setSearchQuery(result.display_name);
        setSearchResults([]);
        setShowResults(false);
    };

    const handleZoomIn = () => {
        setMapZoom((prev) => Math.min(prev + 1, 18));
    };

    const handleZoomOut = () => {
        setMapZoom((prev) => Math.max(prev - 1, 1));
    };

    return (
        <div className="flex flex-col gap-2 h-full w-full">
            <div className="flex-1 relative rounded-xl overflow-hidden border border-gray-200 group min-h-[320px]">
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
                            autoComplete="new-password"
                            name="mapQueryInput"
                            id="pigeonMapSearchVal"
                            autoCorrect="off"
                            spellCheck="false"
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearchQuery(val);

                                // Check if user pasted coordinates (e.g. "10.8988, 76.4533" or "10.8988 76.4533")
                                const coordRegex = /^\s*(-?\d+(?:\.\d+)?)\s*[\s,]\s*(-?\d+(?:\.\d+)?)\s*$/;
                                const match = val.match(coordRegex);
                                if (match) {
                                    const lat = parseFloat(match[1]);
                                    const lng = parseFloat(match[2]);
                                    if (!isNaN(lat) && !isNaN(lng) && isInsideIndia(lat, lng)) {
                                        setMapCenter([lat, lng]);
                                        onChange({ lat, lng });
                                        setShowResults(false);
                                        return;
                                    }
                                }

                                if (val.length >= 3) {
                                    setShowResults(true);
                                    debouncedSearch(val);
                                } else {
                                    setShowResults(false);
                                    debouncedSearch.cancel();
                                    setSearchResults([]);
                                }
                            }}
                            onFocus={() => searchQuery && searchQuery.length >= 3 && setShowResults(true)}
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

                <Map
                    center={mapCenter}
                    zoom={mapZoom}
                    attribution={false}
                    onBoundsChanged={({ center: newCenter, zoom: newZoom }) => {
                        setMapCenter(newCenter);
                        setMapZoom(newZoom);
                    }}
                    onClick={({ latLng }) => {
                        if (isInsideIndia(latLng[0], latLng[1])) {
                            onChange({ lat: latLng[0], lng: latLng[1] });
                        } else {
                            toast.warning("Please select a location within India");
                        }
                    }}
                >
                    {value && value.lat && value.lng && (
                        <Marker
                            anchor={[value.lat, value.lng]}
                            color="rgb(249, 115, 22)"
                            width={40}
                        />
                    )}
                </Map>

                {/* Controls Overlay */}
                <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
                    {/* Zoom Controls */}
                    <div className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                        <button
                            type="button"
                            onClick={handleZoomIn}
                            className="p-2 hover:bg-gray-50 text-gray-600 transition-colors
 border-b border-gray-100 flex items-center justify-center bg-white"
                            title="Zoom In"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={handleZoomOut}
                            className="p-2 hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center bg-white"
                            title="Zoom Out"
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Geolocation Button */}
                    <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={isLocating}
                        className={cn(
                            "p-2 bg-white border border-gray-200 rounded-lg shadow-lg hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center",
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

                {/* Info Overlay */}
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-150 text-[10px] text-gray-600 shadow-sm pointer-events-none">
                    Click map to select location
                </div>
            </div>
        </div>
    );
}
