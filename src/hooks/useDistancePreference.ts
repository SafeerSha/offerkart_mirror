"use client";

import { useSyncExternalStore } from "react";
import { useLocationContext } from "@/context/LocationContext";
import { hasCoordinates, isSearchRadius, isAllLocation, type SearchRadius, DEFAULT_RADIUS } from "@/lib/distance";

const STORAGE_KEY = "offernearu_search_radius";
const EVENT = "offernearu-radius-change";
// Keep the preference usable in browsers that deny localStorage.
let memoryValue: SearchRadius = DEFAULT_RADIUS;
let hasUnsavedValue = false;
let shouldFocusRadiusOnOpen = false;

export function requestRadiusFocus() {
    shouldFocusRadiusOnOpen = true;
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("offernearu-focus-radius"));
    }
}

export function consumeRadiusFocusRequest(): boolean {
    const val = shouldFocusRadiusOnOpen;
    shouldFocusRadiusOnOpen = false;
    return val;
}

function snapshot(): SearchRadius {
    if (hasUnsavedValue) return memoryValue;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === null) return DEFAULT_RADIUS;
        if (stored === "all" || stored === '"all"') return null;
        const value: unknown = JSON.parse(stored);
        return isSearchRadius(value) ? value : null;
    } catch { return memoryValue; }
}
function subscribe(onChange: () => void) {
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
        window.removeEventListener(EVENT, onChange);
        window.removeEventListener("storage", onChange);
    };
}
function setRadius(value: SearchRadius) {
    if (!isSearchRadius(value)) throw new RangeError("Choose an available distance");
    memoryValue = value;
    try {
        if (value === null) localStorage.setItem(STORAGE_KEY, "all");
        else localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        hasUnsavedValue = false;
    } catch { hasUnsavedValue = true; }
    window.dispatchEvent(new Event(EVENT));
}

export function useDistancePreference() {
    const storedRadius = useSyncExternalStore(subscribe, snapshot, () => DEFAULT_RADIUS);
    const { location, hydrated, setModalOpen } = useLocationContext();
    const isAll = isAllLocation(location.name);
    const locationReady = hydrated && (hasCoordinates(location.latitude, location.longitude) || isAll);
    const radius = isAll ? null : storedRadius;
    const chooseLocation = () => setModalOpen(true);
    const openRadiusPreference = () => {
        requestRadiusFocus();
        setModalOpen(true);
        if (typeof window !== "undefined") {
            setTimeout(() => {
                window.dispatchEvent(new Event("offernearu-focus-radius"));
            }, 100);
            setTimeout(() => {
                window.dispatchEvent(new Event("offernearu-focus-radius"));
            }, 250);
        }
    };
    return { radius, setRadius, locationReady, chooseLocation, openRadiusPreference };
}
