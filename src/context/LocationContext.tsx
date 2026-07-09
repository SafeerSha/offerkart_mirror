"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface LocationData {
    name: string;
    latitude: number | null;
    longitude: number | null;
}

interface LocationContextType {
    location: LocationData;
    isLocationSet: boolean;
    isModalOpen: boolean;
    hydrated: boolean;
    setLocation: (name: string, lat: number | null, lon: number | null) => void;
    setModalOpen: (open: boolean) => void;
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
    "kochi": { lat: 9.9312, lng: 76.2673 },
    "thiruvananthapuram": { lat: 8.5241, lng: 76.9366 },
    "kozhikode": { lat: 11.2588, lng: 75.7804 },
    "thrissur": { lat: 10.5276, lng: 76.2144 },
    "palakkad": { lat: 10.7867, lng: 76.6548 },
    "kollam": { lat: 8.8932, lng: 76.6141 },
    "kannur": { lat: 11.8745, lng: 75.3704 },
    "alappuzha": { lat: 9.4981, lng: 76.3388 },
    "kottayam": { lat: 9.5916, lng: 76.5221 },
    "malappuram": { lat: 11.0735, lng: 76.0740 },
    "pathanamthitta": { lat: 9.2648, lng: 76.7870 },
    "idukki": { lat: 9.8500, lng: 76.9700 },
    "wayanad": { lat: 11.6854, lng: 76.1320 },
    "kasaragod": { lat: 12.4996, lng: 74.9869 },
};

export const getCoordinatesForCity = (cityName: string): { lat: number | null; lng: number | null } => {
    const cleanName = cityName.split(",")[0].trim().toLowerCase();
    const match = CITY_COORDINATES[cleanName];
    if (match) return match;
    return { lat: null, lng: null };
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [location, setLocationState] = useState<LocationData>({
        name: "Location",
        latitude: null,
        longitude: null,
    });
    const [isLocationSet, setIsLocationSet] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedName = localStorage.getItem("offerKart_location");
            const savedLat = localStorage.getItem("offerKart_latitude");
            const savedLng = localStorage.getItem("offerKart_longitude");

            if (savedName && savedName !== "Location") {
                setLocationState({
                    name: savedName,
                    latitude: savedLat ? parseFloat(savedLat) : null,
                    longitude: savedLng ? parseFloat(savedLng) : null,
                });
                setIsLocationSet(true);
            }
            setHydrated(true);
        }
    }, []);

    const setLocation = (name: string, lat: number | null, lon: number | null) => {
        let finalLat = lat;
        let finalLon = lon;

        if (finalLat === null || finalLon === null) {
            const coords = getCoordinatesForCity(name);
            finalLat = coords.lat;
            finalLon = coords.lng;
        }

        const newLoc = { name, latitude: finalLat, longitude: finalLon };
        setLocationState(newLoc);
        setIsLocationSet(name !== "Location" && name !== "All");

        if (typeof window !== "undefined") {
            localStorage.setItem("offerKart_location", name);
            if (finalLat !== null) {
                localStorage.setItem("offerKart_latitude", String(finalLat));
            } else {
                localStorage.removeItem("offerKart_latitude");
            }
            if (finalLon !== null) {
                localStorage.setItem("offerKart_longitude", String(finalLon));
            } else {
                localStorage.removeItem("offerKart_longitude");
            }
        }
    };

    return (
        <LocationContext.Provider
            value={{
                location,
                isLocationSet,
                isModalOpen,
                hydrated,
                setLocation,
                setModalOpen,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
};

export const useLocationContext = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error("useLocationContext must be used within a LocationProvider");
    }
    return context;
};
