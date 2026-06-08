import { getDictionary } from "./store";
import { defaultLocale, Locale, TranslationNamespace } from "./config";

export async function getTranslations(namespace: TranslationNamespace = "common") {
  // To allow for static generation, we default to the defaultLocale.
  // We no longer read cookies() here because it would force dynamic rendering.
  // The client LanguageProvider will handle updating the locale if the user's cookie prefers another language.
  const locale: Locale = defaultLocale;
  const dict = await getDictionary(locale);

  const t = (key: string) => {
    const namespaceDict = (dict as any)?.[namespace];
    if (!namespaceDict) return key;

    const parts = key.split(".");
    let current: any = namespaceDict;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return key; // No fallback needed since we're using the defaultLocale anyway
      }
    }
    return typeof current === "string" ? current : key;
  };

  return { t, locale, dict };
}
