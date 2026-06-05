"use client";

import React, { createContext } from "react";
import { translations } from "@/lib/i18n/store";
import { Locale, defaultLocale, TranslationNamespace } from "@/lib/i18n/config";

interface LanguageContextType {
  locale: Locale;
  t: (key: string, namespace?: TranslationNamespace) => string;
}

const globalForI18n = globalThis as unknown as {
  LanguageContext: React.Context<LanguageContextType | null> | undefined;
};

export const LanguageContext =
  globalForI18n.LanguageContext ??
  createContext<LanguageContextType | null>(null);

if (process.env.NODE_ENV !== "production") {
  globalForI18n.LanguageContext = LanguageContext;
}

export function LanguageProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const t = (key: string, namespace: TranslationNamespace = "common") => {
    const dict = (translations[locale] as any)?.[namespace] || (translations[defaultLocale] as any)?.[namespace];
    if (!dict) return key;

    const parts = key.split(".");
    let current: any = dict;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        // Fallback to English dict:
        const enDict = (translations[defaultLocale] as any)?.[namespace];
        let enCurrent: any = enDict;
        for (const enPart of parts) {
          if (enCurrent && typeof enCurrent === "object" && enPart in enCurrent) {
            enCurrent = enCurrent[enPart];
          } else {
            return key;
          }
        }
        return enCurrent;
      }
    }
    return typeof current === "string" ? current : key;
  };

  return (
    <LanguageContext.Provider value={{ locale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
