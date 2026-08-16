"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Map, Marker } from "pigeon-maps";
import { MapPin, ExternalLink, Plus, Minus, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BranchMapPreviewProps {
    latitude?: number | string | null;
    longitude?: number | string | null;
    branchName?: string;
    city?: string;
    district?: string;
    state?: string;
    address?: string;
    className?: string;
}

const DEFAULT_CENTER: [number, number] = [10.7867, 76.6548]; // Kerala default
const DEFAULT_ZOOM = 14;

export default function BranchMapPreview({
    latitude,
    longitude,
    branchName,
    city,
    district,
    state,
    address,
    className,
}: BranchMapPreviewProps) {
    const [mounted, setMounted] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
    const [markerCoords, setMarkerCoords] = useState<[number, number] | null>(null);
    const [mapZoom, setMapZoom] = useState<number>(DEFAULT_ZOOM);
    const [isGeocoding, setIsGeocoding] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Resolve coordinates or trigger fallback geocode
    useEffect(() => {
        const latNum = Number(latitude);
        const lngNum = Number(longitude);

        const isValid =
            !isNaN(latNum) &&
            !isNaN(lngNum) &&
            latNum !== 0 &&
            lngNum !== 0 &&
            latNum >= -90 &&
            latNum <= 90 &&
            lngNum >= -180 &&
            lngNum <= 180;

        if (isValid) {
            setMarkerCoords([latNum, lngNum]);
            setMapCenter([latNum, lngNum]);
            setMapZoom(14);
            setIsGeocoding(false);
        } else if (address || city || district || state) {
            // Try geocoding if coordinates are missing
            const queryParts = [address, city, district, state, "India"].filter(Boolean);
            const query = queryParts.join(", ");

            if (query && query !== "India") {
                setIsGeocoding(true);
                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`)
                    .then((res) => res.json())
                    .then((data) => {
                        if (data && data.length > 0) {
                            const foundLat = parseFloat(data[0].lat);
                            const foundLng = parseFloat(data[0].lon);
                            setMarkerCoords([foundLat, foundLng]);
                            setMapCenter([foundLat, foundLng]);
                            setMapZoom(13);
                        } else {
                            setMarkerCoords(null);
                        }
                    })
                    .catch(() => {
                        setMarkerCoords(null);
                    })
                    .finally(() => {
                        setIsGeocoding(false);
                    });
            } else {
                setMarkerCoords(null);
            }
        } else {
            setMarkerCoords(null);
        }
    }, [latitude, longitude, address, city, district, state]);

    const handleZoomIn = useCallback(() => {
        setMapZoom((prev) => Math.min(prev + 1, 18));
    }, []);

    const handleZoomOut = useCallback(() => {
        setMapZoom((prev) => Math.max(prev - 1, 3));
    }, []);

    const handleRecenter = useCallback(() => {
        if (markerCoords) {
            setMapCenter(markerCoords);
            setMapZoom(14);
        }
    }, [markerCoords]);

    const googleMapsUrl = markerCoords
        ? `https://www.google.com/maps/search/?api=1&query=${markerCoords[0]},${markerCoords[1]}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([address, city, district, state].filter(Boolean).join(", "))}`;

    if (!mounted) {
        return (
            <div className={cn("relative h-48 sm:h-52 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shadow-inner animate-pulse", className)}>
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className={cn("relative h-48 sm:h-52 rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-slate-50 group select-none", className)}>
            <Map
                center={mapCenter}
                zoom={mapZoom}
                attribution={false}
                onBoundsChanged={({ center: newCenter, zoom: newZoom }) => {
                    setMapCenter(newCenter);
                    setMapZoom(newZoom);
                }}
            >
                {markerCoords && (
                    <Marker
                        anchor={markerCoords}
                        color="rgb(249, 115, 22)"
                        width={38}
                    />
                )}
            </Map>

            {/* Geocoding loading indicator */}
            {isGeocoding && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-20">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-md border border-gray-100 text-xs font-semibold text-gray-700">
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                        <span>Locating on map...</span>
                    </div>
                </div>
            )}

            {/* Location Pill badge (Bottom Left) */}
            <div className="absolute bottom-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-gray-100 shadow-md max-w-[calc(100%-80px)]">
                <p className="text-[10px] font-bold text-gray-800 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3 text-primary shrink-0" />
                    <span className="truncate">{branchName ? `${branchName}` : (city || district || "Branch Location")}</span>
                </p>
            </div>

            {/* Controls (Bottom / Top Right) */}
            <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5">
                {/* Open in Google Maps */}
                <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white/95 backdrop-blur-md hover:bg-white text-gray-600 hover:text-primary rounded-lg border border-gray-100 shadow-md transition-all flex items-center justify-center"
                    title="Open in Google Maps"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* Recenter Button */}
                <button
                    type="button"
                    onClick={handleRecenter}
                    className="p-1.5 bg-white/95 backdrop-blur-md hover:bg-white text-gray-600 hover:text-primary rounded-lg border border-gray-100 shadow-md transition-all flex items-center justify-center cursor-pointer"
                    title="Recenter Map"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Zoom Controls */}
                <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-lg border border-gray-100 shadow-md overflow-hidden">
                    <button
                        type="button"
                        onClick={handleZoomIn}
                        className="p-1.5 hover:bg-gray-50 text-gray-600 hover:text-primary transition-colors border-b border-gray-100 flex items-center justify-center cursor-pointer"
                        title="Zoom In"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={handleZoomOut}
                        className="p-1.5 hover:bg-gray-50 text-gray-600 hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
                        title="Zoom Out"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
