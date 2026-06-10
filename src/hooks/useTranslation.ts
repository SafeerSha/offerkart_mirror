"use client";

import { useContext } from "react";
import { LanguageContext } from "@/components/i18n/LanguageProvider";
import { TranslationNamespace } from "@/lib/i18n/config";

export function useTranslation(namespace: TranslationNamespace = "common") {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return {
    locale: context.locale,
    t: (key: string) => context.t(key, namespace),
    changeLocale: context.changeLocale,
  };
}
