"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSearchableSelectProps {
    options: { label: string; value: string }[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

export function MultiSearchableSelect({
    options,
    selectedValues,
    onChange,
    placeholder = "Select...",
    isLoading = false,
    disabled = false,
    className,
}: MultiSearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const toggleOption = (value: string) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter((v) => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    const removeChip = (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectedValues.filter((v) => v !== value));
    };

    const hasSelection = selectedValues.length > 0;

    return (
        <div ref={wrapperRef} className={cn("relative", className)}>
            <div
                className={cn(
                    "flex items-center w-full min-h-[48px] px-3.5 py-2 bg-gray-50/50 border border-gray-200/80 rounded-2xl transition-all cursor-pointer flex-wrap gap-2 group",
                    isOpen && "border-orange-500 ring-4 ring-orange-500/10 bg-white shadow-lg shadow-orange-500/5",
                    !isOpen && "hover:border-orange-300 hover:bg-gray-50",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(!isOpen);
                        if (!isOpen) {
                            setTimeout(() => inputRef.current?.focus(), 50);
                        }
                    }
                }}
            >
                {/* Selected chips */}
                {selectedValues.map((val) => {
                    const option = options.find(o => o.value === val);
                    if (!option) return null;
                    return (
                        <span
                            key={val}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-orange-500/10 to-orange-600/10 text-orange-700 border border-orange-200/50 rounded-lg text-xs font-bold shadow-sm animate-in zoom-in-95 duration-200"
                        >
                            <span className="truncate max-w-[120px]">{option.label}</span>
                            <button
                                type="button"
                                onClick={(e) => removeChip(val, e)}
                                className="shrink-0 hover:bg-orange-500 hover:text-white rounded-md p-0.5 transition-all"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    );
                })}

                {/* Search input when open, placeholder when closed */}
                {isOpen ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-[80px]">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); if (!isOpen) setIsOpen(true); }}
                            placeholder="Search..."
                            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400 min-w-0"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                ) : !hasSelection ? (
                    <span className="flex-1 text-sm text-gray-400 truncate">{placeholder}</span>
                ) : null}

                <div className="flex items-center gap-1 shrink-0 ml-auto">
                    {selectedValues.length > 0 && !isOpen && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChange([]); }}
                            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    )}
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                    ) : (
                        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {isLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">Loading...</div>
                    ) : filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => {
                            const isSelected = selectedValues.includes(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={cn(
                                        "w-full px-4 py-2.5 text-left text-sm hover:bg-orange-50 transition-colors flex items-center justify-between",
                                        "first:rounded-t-xl last:rounded-b-xl",
                                        isSelected && "bg-orange-50 text-orange-700 font-medium"
                                    )}
                                    onClick={(e) => { e.stopPropagation(); toggleOption(opt.value); }}
                                >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check className="w-4 h-4 text-orange-600" />}
                                </button>
                            );
                        })
                    ) : (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">
                            {options.length === 0 ? "No options available" : "No matches found"}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
