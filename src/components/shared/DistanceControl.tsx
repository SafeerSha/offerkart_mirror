"use client";

import { useId, useState, useRef, useEffect, useMemo } from "react";
import { MapPin, ChevronDown, Check, SlidersHorizontal } from "lucide-react";
import { useDistancePreference, consumeRadiusFocusRequest } from "@/hooks/useDistancePreference";
import { DISTANCE_OPTIONS, isSearchRadius, formatDistanceKm, DEFAULT_RADIUS, type SearchRadius } from "@/lib/distance";

export function DistanceControl({ loading = false, inLocationModal = false }: { loading?: boolean; inLocationModal?: boolean }) {
    const id = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { radius, setRadius, locationReady, chooseLocation } = useDistancePreference();

    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState<string>(() => radius !== null ? String(radius) : "All");

    // Keep input in sync with external radius updates when dropdown is closed
    useEffect(() => {
        if (!isOpen) {
            setInputValue(radius !== null ? String(radius) : "All");
        }
    }, [radius, isOpen]);

    // Handle auto-focus and opening when requested (e.g. from Expand the range)
    useEffect(() => {
        if (inLocationModal && consumeRadiusFocusRequest() && inputRef.current) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
                setIsOpen(true);
                inputRef.current?.select();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [inLocationModal]);

    useEffect(() => {
        const handleFocusRadius = () => {
            if (inLocationModal && inputRef.current) {
                setTimeout(() => {
                    inputRef.current?.focus();
                    setIsOpen(true);
                    inputRef.current?.select();
                }, 50);
            }
        };
        window.addEventListener("offernearu-focus-radius", handleFocusRadius);
        return () => window.removeEventListener("offernearu-focus-radius", handleFocusRadius);
    }, [inLocationModal]);

    const isNoLimitText = (val: string) => {
        const trimmed = val.trim().toLowerCase();
        return (
            trimmed === "all" ||
            trimmed === "" ||
            trimmed === "any" ||
            trimmed === "no" ||
            trimmed === "none" ||
            trimmed === "no limit" ||
            trimmed === "no range" ||
            trimmed === "no range limit" ||
            trimmed === "all offers"
        );
    };

    // Handle clicking outside to commit value and close dropdown
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                commitValue(inputValue);
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, inputValue, radius]);

    const commitValue = (val: string) => {
        if (isNoLimitText(val)) {
            setRadius(null);
            setInputValue("All");
        } else {
            const num = parseFloat(val.trim());
            if (Number.isFinite(num) && num > 0) {
                setRadius(num);
                setInputValue(String(num));
            } else {
                setInputValue(radius !== null ? String(radius) : "All");
            }
        }
    };

    const handleSelect = (val: SearchRadius) => {
        setRadius(val);
        setInputValue(val !== null ? String(val) : "All");
        setIsOpen(false);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const val = event.target.value;
        setInputValue(val);
        if (!isOpen) setIsOpen(true);

        if (isNoLimitText(val)) {
            setRadius(null);
        } else {
            const num = parseFloat(val.trim());
            if (Number.isFinite(num) && num > 0) {
                setRadius(num);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            commitValue(inputValue);
            setIsOpen(false);
        } else if (e.key === "Escape") {
            setInputValue(radius !== null ? String(radius) : "All");
            setIsOpen(false);
        } else if (e.key === "ArrowDown" && !isOpen) {
            setIsOpen(true);
        }
    };

    // Filter preset options based on search input
    const filteredOptions = useMemo(() => {
        const query = inputValue.trim().toLowerCase();
        if (!query || isNoLimitText(query) || query === String(radius)) {
            return DISTANCE_OPTIONS;
        }
        return DISTANCE_OPTIONS.filter(km => String(km).includes(query));
    }, [inputValue, radius]);

    // Check if typed value is a custom number not in standard presets
    const customNum = useMemo(() => {
        const num = parseFloat(inputValue.trim());
        if (Number.isFinite(num) && num > 0 && !DISTANCE_OPTIONS.some(km => km === num)) {
            return num;
        }
        return null;
    }, [inputValue]);

    const isAllSelected = radius === null;

    if (inLocationModal) {
        return (
            <div ref={containerRef} className="relative shrink-0">
                <div className={`relative flex items-center h-[42px] w-32 sm:w-40 rounded-xl border border-primary/10 bg-white shadow-inner transition-all ${isOpen ? "ring-2 ring-primary/20 border-primary" : "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"} ${!locationReady ? "opacity-50 cursor-not-allowed bg-slate-50" : ""} dark:border-slate-700 dark:bg-slate-900`}>
                    <label htmlFor={id} className="sr-only">Search radius</label>
                    <div className="flex items-center pl-2.5 text-orange-500 shrink-0 pointer-events-none" title="Search radius">
                        <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                    </div>
                    <input
                        ref={inputRef}
                        id={id}
                        role="combobox"
                        aria-label="Search radius"
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        type="text"
                        inputMode="decimal"
                        disabled={!locationReady}
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onClick={() => {
                            if (locationReady) {
                                setIsOpen(true);
                                inputRef.current?.select();
                            }
                        }}
                        onFocus={() => {
                            if (locationReady) {
                                setIsOpen(true);
                                inputRef.current?.select();
                            }
                        }}
                        placeholder="Radius"
                        title="Enter radius in km or pick from dropdown"
                        className="w-full min-w-0 bg-transparent pl-1.5 pr-0.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed dark:text-slate-200"
                    />
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 pr-0.5 select-none shrink-0 pointer-events-none">
                        {isNoLimitText(inputValue) ? "" : "km"}
                    </span>
                    <button
                        type="button"
                        tabIndex={-1}
                        disabled={!locationReady}
                        onClick={() => {
                            if (!locationReady) return;
                            setIsOpen(prev => !prev);
                            if (!isOpen) inputRef.current?.focus();
                        }}
                        aria-label="Toggle radius dropdown"
                        className="p-1 pr-2 text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:pointer-events-none transition-transform shrink-0"
                    >
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180 text-orange-500" : ""}`} />
                    </button>
                    {loading && (
                        <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5" title="Updating nearby results">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                        </div>
                    )}
                </div>

                {/* Searchable Dropdown Menu */}
                {isOpen && locationReady && (
                    <div
                        role="listbox"
                        aria-label="Radius options"
                        className="absolute right-0 top-full mt-1.5 w-48 sm:w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                            <span>Select Distance</span>
                            <span className="text-[9px] font-normal lowercase text-slate-400">or type custom</span>
                        </div>

                        {/* Custom range button if typed */}
                        {customNum !== null && (
                            <button
                                type="button"
                                role="option"
                                aria-selected={radius === customNum}
                                onClick={() => handleSelect(customNum)}
                                className="w-full flex items-center justify-between px-2.5 py-2 my-0.5 text-xs font-semibold rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors"
                            >
                                <span className="flex items-center gap-1.5 truncate">
                                    <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                                    <span>Apply custom: <strong>{customNum} km</strong></span>
                                </span>
                                <Check className="w-3.5 h-3.5 shrink-0 ml-1" />
                            </button>
                        )}

                        <div className="max-h-56 overflow-y-auto scrollbar-thin py-0.5 space-y-0.5">
                            {/* No range limit option */}
                            <button
                                type="button"
                                role="option"
                                aria-selected={isAllSelected}
                                onClick={() => handleSelect(null)}
                                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl transition-colors text-left ${isAllSelected ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"}`}
                            >
                                <div className="flex flex-col min-w-0 pr-2">
                                    <span className="font-semibold text-xs flex items-center gap-1.5">
                                        <span>No range limit</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-normal">
                                            All
                                        </span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                                        Show all offers in selected location
                                    </span>
                                </div>
                                {isAllSelected && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0 ml-1" />}
                            </button>

                            {/* Preset Options */}
                            {filteredOptions.map(km => {
                                const isSelected = radius === km;
                                const isDefault = km === DEFAULT_RADIUS;
                                return (
                                    <button
                                        key={km}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(km)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl transition-colors text-left ${isSelected ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"}`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>{km} km</span>
                                            {isDefault && (
                                                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 rounded-md">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                                    </button>
                                );
                            })}

                            {filteredOptions.length === 0 && customNum === null && (
                                <div className="px-3 py-2 text-xs text-slate-400 text-center italic">
                                    Type a number to set custom km
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="my-3 flex flex-wrap items-center gap-3 rounded-2xl border border-orange-100 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
            <label htmlFor={id} className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <MapPin aria-hidden="true" className="h-4 w-4 text-orange-500" /> Search radius
            </label>
            <div className="relative">
                <div className={`relative flex items-center h-10 w-36 rounded-xl border border-slate-200 bg-white px-2 shadow-inner transition-colors ${isOpen ? "border-orange-500 ring-2 ring-orange-500" : "focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500"} dark:border-slate-700 dark:bg-slate-900`}>
                    <input
                        ref={inputRef}
                        id={id}
                        role="combobox"
                        aria-label="Search radius"
                        aria-expanded={isOpen}
                        type="text"
                        inputMode="decimal"
                        disabled={!locationReady}
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onClick={() => {
                            if (locationReady) {
                                setIsOpen(true);
                                inputRef.current?.select();
                            }
                        }}
                        onFocus={() => {
                            if (locationReady) {
                                setIsOpen(true);
                                inputRef.current?.select();
                            }
                        }}
                        title="Enter radius in km or pick from dropdown"
                        className="w-full bg-transparent text-sm text-slate-800 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200"
                    />
                    <span className="text-xs font-semibold text-slate-400 select-none shrink-0 pointer-events-none">
                        {isNoLimitText(inputValue) ? "" : "km"}
                    </span>
                    <button
                        type="button"
                        tabIndex={-1}
                        disabled={!locationReady}
                        onClick={() => {
                            if (!locationReady) return;
                            setIsOpen(prev => !prev);
                            if (!isOpen) inputRef.current?.focus();
                        }}
                        aria-label="Toggle radius dropdown"
                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:pointer-events-none transition-transform shrink-0"
                    >
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180 text-orange-500" : ""}`} />
                    </button>
                </div>

                {isOpen && locationReady && (
                    <div
                        role="listbox"
                        aria-label="Radius options"
                        className="absolute left-0 top-full mt-1.5 w-48 sm:w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                            <span>Select Distance</span>
                            <span className="text-[9px] font-normal lowercase text-slate-400">or type custom</span>
                        </div>

                        {customNum !== null && (
                            <button
                                type="button"
                                role="option"
                                aria-selected={radius === customNum}
                                onClick={() => handleSelect(customNum)}
                                className="w-full flex items-center justify-between px-2.5 py-2 my-0.5 text-xs font-semibold rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors"
                            >
                                <span className="flex items-center gap-1.5 truncate">
                                    <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                                    <span>Apply custom: <strong>{customNum} km</strong></span>
                                </span>
                                <Check className="w-3.5 h-3.5 shrink-0 ml-1" />
                            </button>
                        )}

                        <div className="max-h-56 overflow-y-auto scrollbar-thin py-0.5 space-y-0.5">
                            {/* No range limit option */}
                            <button
                                type="button"
                                role="option"
                                aria-selected={isAllSelected}
                                onClick={() => handleSelect(null)}
                                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl transition-colors text-left ${isAllSelected ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"}`}
                            >
                                <div className="flex flex-col min-w-0 pr-2">
                                    <span className="font-semibold text-xs flex items-center gap-1.5">
                                        <span>No range limit</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-normal">
                                            All
                                        </span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                                        Show all offers in selected location
                                    </span>
                                </div>
                                {isAllSelected && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0 ml-1" />}
                            </button>

                            {filteredOptions.map(km => {
                                const isSelected = radius === km;
                                const isDefault = km === DEFAULT_RADIUS;
                                return (
                                    <button
                                        key={km}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(km)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl transition-colors text-left ${isSelected ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"}`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>{km} km</span>
                                            {isDefault && (
                                                 <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 rounded-md">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            {!locationReady && !inLocationModal && (
                <button type="button" onClick={chooseLocation} className="rounded-lg text-orange-600 underline focus-visible:ring-2 focus-visible:ring-orange-500">
                    Choose location
                </button>
            )}
            <span id={`${id}-hint`} className="text-xs text-slate-500">
                {!locationReady ? "Choose a location to filter by distance." : radius === null ? "Showing all offers in selected location (no range limit)." : `Less than ${radius} km from your selected location.`}
            </span>
            {loading && <span role="status" className="text-xs text-orange-600">Updating nearby results…</span>}
        </div>
    );
}

export function DistanceEmptyState({ subject = "shops", compact = false }: { subject?: string; compact?: boolean }) {
    const { radius, openRadiusPreference } = useDistancePreference();
    if (radius === null) return null;
    return (
        <div className={`rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 text-center dark:border-slate-700 dark:bg-slate-900 ${compact ? "m-2 p-3" : "my-4 p-8"}`}>
            <p role="status" className="text-sm font-semibold text-slate-700 dark:text-slate-200">No {subject} found within {radius} km.</p>
            <p className="mt-1 text-xs text-slate-500">Try a wider distance. Shops with unknown distances are excluded.</p>
            <button type="button" onClick={openRadiusPreference} className="mt-3 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2">
                Expand the range
            </button>
        </div>
    );
}

export function DistanceBadge({ distance }: { distance: number | null | undefined }) {
    const text = formatDistanceKm(distance);
    return text ? <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{text}</span> : null;
}

export function DistanceListingFeedback({ error, onRetry, subject }: { error?: boolean; onRetry: () => void; subject: string }) {
    const { radius, locationReady, chooseLocation } = useDistancePreference();
    if (radius !== null && !locationReady) {
        return <div className="rounded-2xl border border-orange-100 bg-white p-6 text-center">
            <p role="status" className="text-sm text-slate-600">Choose a location to search within {radius} km.</p>
            <button type="button" onClick={chooseLocation} className="mt-3 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-orange-500">Choose location</button>
        </div>;
    }
    if (error) {
        return <div role="alert" className="rounded-2xl border border-orange-100 bg-white p-6 text-center">
            <p className="text-sm text-slate-600">Could not load {subject}. Please try again.</p>
            <button type="button" onClick={onRetry} className="mt-3 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-orange-500">Retry</button>
        </div>;
    }
    return <DistanceEmptyState subject={`shops with matching ${subject}`} />;
}
