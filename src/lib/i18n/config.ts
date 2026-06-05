/**
 * Configuration for internationalization (i18n)
 */

export const locales = ["en", "ml"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export type TranslationNamespace = "common" | "home" | "login" | "shop-manager";
