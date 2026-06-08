"use client";

import React, { createContext, useEffect, useState } from "react";
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
  locale: initialLocale,
  dictionary: initialDictionary,
}: {
  children: React.ReactNode;
  locale: Locale;
  dictionary: Record<string, any>;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [dictionary, setDictionary] = useState<Record<string, any>>(initialDictionary);

  useEffect(() => {
    // Read locale from cookie on the client side
    const cookieMatch = document.cookie.match(/(^|;)\s*locale\s*=\s*([^;]+)/);
    const cookieLocale = cookieMatch ? cookieMatch[2] : null;
    const activeLocale = (cookieLocale === "en" || cookieLocale === "ml") ? (cookieLocale as Locale) : defaultLocale;
    
    if (activeLocale !== locale) {
      // Dynamically load the dictionary for the active locale
      const loadDictionary = async () => {
        const [common, home, login, shopManager] = await Promise.all([
          import(`@/lib/i18n/locales/${activeLocale}/common.json`).then(m => m.default || m),
          import(`@/lib/i18n/locales/${activeLocale}/home.json`).then(m => m.default || m),
          import(`@/lib/i18n/locales/${activeLocale}/login.json`).then(m => m.default || m),
          import(`@/lib/i18n/locales/${activeLocale}/shop-manager.json`).then(m => m.default || m),
        ]);
        
        setDictionary({
          common,
          home,
          login,
          "shop-manager": shopManager,
        });
        setLocale(activeLocale);
      };
      
      loadDictionary();
    }
  }, [locale]);

  const t = (key: string, namespace: TranslationNamespace = "common") => {
    const namespaceDict = dictionary[namespace];
    if (!namespaceDict) return key;

    const parts = key.split(".");
    let current: any = namespaceDict;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return key;
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
