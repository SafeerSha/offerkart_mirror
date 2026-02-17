"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;
    allowCustom?: boolean;
    className?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select...",
    isLoading = false,
    disabled = false,
    allowCustom = true,
    className,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
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
        opt.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (opt: string) => {
        onChange(opt);
        setIsOpen(false);
        setSearch("");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        if (allowCustom) {
            onChange(e.target.value);
        }
        if (!isOpen) setIsOpen(true);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
        setSearch("");
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className={cn("relative", className)}>
            <div
                className={cn(
                    "flex items-center w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl transition-all cursor-pointer",
                    isOpen && "border-orange-500 ring-2 ring-orange-100",
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
                {isOpen ? (
                    <div className="flex items-center gap-2 flex-1">
                        <Search className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={handleInputChange}
                            placeholder={value || placeholder}
                            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                ) : (
                    <span className={cn("flex-1 text-sm truncate", value ? "text-gray-900" : "text-gray-400")}>
                        {value || placeholder}
                    </span>
                )}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {value && !isOpen && (
                        <button onClick={handleClear} className="p-0.5 hover:bg-gray-200 rounded transition-colors">
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
                        filteredOptions.map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                className={cn(
                                    "w-full px-4 py-2.5 text-left text-sm hover:bg-orange-50 transition-colors flex items-center justify-between",
                                    "first:rounded-t-xl last:rounded-b-xl",
                                    value === opt && "bg-orange-50 text-orange-700 font-medium"
                                )}
                                onClick={() => handleSelect(opt)}
                            >
                                <span>{opt}</span>
                                {value === opt && <Check className="w-4 h-4 text-orange-600" />}
                            </button>
                        ))
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
