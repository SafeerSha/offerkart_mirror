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
                "relative flex items-center w-[38px] h-5 rounded-full cursor-pointer transition-all duration-300 shadow-inner shrink-0 outline-none hover:ring-2 hover:ring-primary/20",
                isActive ? "bg-[#1cc080]" : "bg-gray-200",
                className
            )}
        >
            <div 
                className={cn(
                    "absolute left-0.5 w-[16px] h-[16px] bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.2)] transform transition-transform duration-300 flex items-center justify-center",
                    isActive ? "translate-x-[18px]" : "translate-x-0"
                )}
            >
                <Power className={cn(
                    "w-[10px] h-[10px] transition-colors duration-300",
                    isActive ? "text-[#1cc080]" : "text-gray-400"
                )} />
            </div>
        </button>
    );
}
