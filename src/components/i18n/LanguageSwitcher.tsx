"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type LanguageSwitcherProps = {
  className?: string;
};

export const LanguageSwitcher = ({ className }: LanguageSwitcherProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { locale, changeLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = async (newLocale: string) => {
    setIsOpen(false);
    if (newLocale === locale) return;

    setIsLoading(true);
    try {
      await changeLocale(newLocale as any);
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languageMeta: Record<Locale, { label: string; nativeLabel: string }> = {
    en: { label: "EN", nativeLabel: "English" },
    ml: { label: "ML", nativeLabel: "മലയാളം" },
    hi: { label: "HI", nativeLabel: "हिन्दी" },
  };

  const languages = locales.map((code) => ({
    code,
    ...languageMeta[code],
  }));

  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block text-left", className)}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 outline-none select-none",
          "bg-orange-50/80 dark:bg-orange-950/20 border-orange-200/60 dark:border-orange-900/40 text-orange-800 dark:text-orange-300",
          "hover:bg-orange-100/80 dark:hover:bg-orange-950/45 hover:border-orange-300/80 dark:hover:border-orange-800/60",
          "shadow-[0_1px_2px_rgba(249,115,22,0.05)] active:scale-[0.98]",
          isLoading && "opacity-70 pointer-events-none",
          isOpen && "border-orange-500 dark:border-orange-400 ring-2 ring-orange-500/20"
        )}
      >
        {/* <Globe className="w-3.5 h-3.5 text-orange-500/70 dark:text-orange-400/70" /> */}
        <span className="min-w-[1.25rem] text-center">{currentLanguage.label}</span>
        <ChevronDown className={cn("w-3 h-3 text-orange-500/60 dark:text-orange-400/60 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 origin-top-right rounded-2xl border border-orange-100 dark:border-orange-950 bg-white/95 dark:bg-slate-950/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-150 z-50">
          {languages.map((lang) => {
            const isSelected = lang.code === locale;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-left rounded-xl text-xs font-medium transition-colors outline-none",
                  isSelected
                    ? "bg-orange-100/70 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-semibold"
                    : "text-orange-900/80 dark:text-orange-200/80 hover:bg-orange-50/70 dark:hover:bg-orange-950/20"
                )}
              >
                <span>{lang.nativeLabel}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                  isSelected
                    ? "bg-orange-200/50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300"
                    : "bg-orange-50 dark:bg-orange-950/40 text-orange-600/70 dark:text-orange-400/70"
                )}>
                  {lang.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
