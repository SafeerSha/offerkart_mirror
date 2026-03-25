import React from 'react';
import { cn } from "@/lib/utils";
import { Power } from "lucide-react";

interface StatusToggleButtonProps {
    status: 'active' | 'paused' | string;
    onChange: (newStatus: string) => void;
    activeText?: string;
    pausedText?: string;
    className?: string;
}

export function StatusToggleButton({
    status,
    onChange,
    className
}: StatusToggleButtonProps) {
    const isActive = status === 'active';
    
    return (
        <button
            type="button"
            onClick={() => onChange(isActive ? 'paused' : 'active')}
            className={cn(
                "relative flex items-center w-[46px] h-6 rounded-full cursor-pointer transition-colors duration-300 shadow-inner shrink-0",
                isActive ? "bg-[#1cc080]" : "bg-gray-300",
                className
            )}
        >
            <div 
                className={cn(
                    "absolute left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 flex items-center justify-center",
                    isActive ? "translate-x-[22px]" : "translate-x-0"
                )}
            >
                <Power className={cn(
                    "w-3 h-3 transition-colors duration-300",
                    isActive ? "text-[#1cc080]" : "text-gray-400"
                )} />
            </div>
        </button>
    );
}
