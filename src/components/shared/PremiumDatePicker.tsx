"use client";

import * as React from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/shared/Typography";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PremiumDatePickerProps {
  label?: string;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  error?: string;
  containerClassName?: string;
  placeholder?: string;
  minDate?: Date;
}

export function PremiumDatePicker({
  label,
  date,
  setDate,
  error,
  containerClassName,
  placeholder = "Pick a date",
  minDate,
}: PremiumDatePickerProps) {
  const [viewDate, setViewDate] = React.useState(date ?? new Date());

  const handlePrevMonth = () => setViewDate((v) => subMonths(v, 1));
  const handleNextMonth = () => setViewDate((v) => addMonths(v, 1));

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const dayHeaders = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && <Label className="ml-1">{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center gap-3 px-4 h-11 rounded-xl border border-primary/10 bg-background/40 text-left transition-all hover:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
              !date && "text-muted-foreground",
              error && "border-destructive focus:ring-destructive/20"
            )}
          >
            <CalendarDays className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium">
              {date ? format(date, "MMMM d, yyyy") : placeholder}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-0 border-0 shadow-2xl rounded-2xl overflow-hidden"
          align="start"
          style={{ backgroundColor: "#ffffff" }}
        >
          <div style={{ backgroundColor: "#ffffff", minWidth: "320px" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-base font-semibold text-gray-900">
                {format(viewDate, "MMMM yyyy")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 px-4 pt-3 pb-1">
              {dayHeaders.map((d) => (
                <div
                  key={d}
                  className="h-8 flex items-center justify-center text-xs font-medium text-gray-400 select-none"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="px-4 pb-4 space-y-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7">
                  {week.map((d, di) => {
                    const isCurrentMonth = isSameMonth(d, viewDate);
                    const isSelected = date && isSameDay(d, date);
                    const isTodayDate = isToday(d);
                    const isDisabled = minDate && format(d, 'yyyy-MM-dd') < format(minDate, 'yyyy-MM-dd');

                    return (
                      <button
                        key={di}
                        disabled={isDisabled}
                        onClick={() => {
                          if (isDisabled) return;
                          setDate(d);
                          setViewDate(d);
                        }}
                        className={cn(
                          "h-9 w-full flex items-center justify-center text-sm rounded-full font-medium transition-all",
                          !isCurrentMonth && "text-gray-300",
                          isDisabled && "opacity-20 cursor-not-allowed",
                          isCurrentMonth && !isDisabled && !isSelected && !isTodayDate && "text-gray-800 hover:bg-orange-50 hover:text-orange-600",
                          isTodayDate && !isDisabled && !isSelected && "text-orange-500 font-bold",
                          isSelected && "bg-orange-500 text-white shadow-md shadow-orange-500/30 hover:bg-orange-600"
                        )}
                      >
                        {format(d, "d")}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => {
                  const today = new Date();
                  const isDisabled = minDate && format(today, 'yyyy-MM-dd') < format(minDate, 'yyyy-MM-dd');
                  if (isDisabled) return;
                  setDate(today);
                  setViewDate(today);
                }}
                disabled={minDate && format(new Date(), 'yyyy-MM-dd') < format(minDate, 'yyyy-MM-dd')}
                className={cn(
                  "text-sm font-medium transition-colors",
                  minDate && format(new Date(), 'yyyy-MM-dd') < format(minDate, 'yyyy-MM-dd') 
                    ? "text-gray-300 cursor-not-allowed" 
                    : "text-orange-500 hover:text-orange-600"
                )}
              >
                Today
              </button>
              {date && (
                <button
                  onClick={() => setDate(undefined)}
                  className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {error && (
        <p className="text-xs font-medium text-destructive ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
