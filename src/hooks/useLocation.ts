"use client";

import { useState, useCallback, useMemo } from "react";
import { getStates, getDistrictsByState, getPlacesByDistrict } from "indian_places";

interface PlaceInfo {
    name: string;
    pin: number;
}

export interface LocationResult {
    states: string[];
    districts: string[];
    cities: PlaceInfo[];
    selectState: (stateName: string) => void;
    selectDistrict: (districtName: string, stateName?: string) => void;
    lookupPincode: (cityName: string) => string;
}

export function useLocation(): LocationResult {
    const [districts, setDistricts] = useState<string[]>([]);
    const [cities, setCities] = useState<PlaceInfo[]>([]);
    const [selectedState, setSelectedState] = useState<any>(null);

    // Get all Indian states (computed once, offline)
    const states = useMemo(() => {
        const stateList = getStates();
        return stateList
            .map((s) => s.name)
            .sort((a, b) => a.localeCompare(b));
    }, []);

    // When a state is selected, get its districts (offline)
    const selectState = useCallback((stateName: string) => {
        setDistricts([]);
        setCities([]);

        const stateList = getStates();
        const state = stateList.find(
            (s) => s.name.toLowerCase() === stateName.toLowerCase()
        );

        if (state) {
            setSelectedState(state);
            const districtList = getDistrictsByState(state);
            setDistricts(
                districtList
                    .map((d) => d.name)
                    .sort((a, b) => a.localeCompare(b))
            );
        }
    }, []);

    // When a district is selected, get its places/cities (offline)
    const selectDistrict = useCallback(
        (districtName: string, stateName?: string) => {
            setCities([]);

            const stateList = getStates();
            const targetState = stateName
                ? stateList.find((s) => s.name.toLowerCase() === stateName.toLowerCase())
                : selectedState;

            if (targetState) {
                const districtList = getDistrictsByState(targetState);
                const district = districtList.find(
                    (d) => d.name.toLowerCase() === districtName.toLowerCase()
                );

                if (district) {
                    const places = getPlacesByDistrict(district);
                    const uniqueCities = new Map<string, number>();
                    places.forEach((p) => {
                        if (!uniqueCities.has(p.name)) {
                            uniqueCities.set(p.name, p.pin);
                        }
                    });

                    const cityList = Array.from(uniqueCities.entries())
                        .map(([name, pin]) => ({ name, pin }))
                        .sort((a, b) => a.name.localeCompare(b.name));
                    setCities(cityList);
                }
            }
        },
        [selectedState]
    );

    // Pincode lookup from local data only (offline)
    const lookupPincode = useCallback(
        (cityName: string): string => {
            if (!cityName) return "";
            const city = cities.find(
                (c) => c.name.toLowerCase() === cityName.toLowerCase()
            );
            return city?.pin ? String(city.pin) : "";
        },
        [cities]
    );

    return {
        states,
        districts,
        cities,
        selectState,
        selectDistrict,
        lookupPincode,
    };
}
