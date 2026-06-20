import React from "react";
import { cn } from "@/lib/utils";

interface InstantTooltipProps {
  content: string;
  className?: string;
}

export function InstantTooltip({ content, className }: InstantTooltipProps) {
  return (
    <div className={cn(
      "absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg shadow-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50",
      className
    )}>
      {content}
      {/* Pointing arrow */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-b-slate-900" />
    </div>
  );
}
