import { cookies } from "next/headers";
import { translations } from "./store";
import { defaultLocale, Locale, TranslationNamespace } from "./config";

export async function getTranslations(namespace: TranslationNamespace = "common") {
  let locale: Locale = defaultLocale;
  
  try {
    const cookieStore = await cookies();
    const localeValue = cookieStore.get("locale")?.value;
    if (localeValue === "en" || localeValue === "ml") {
      locale = localeValue as Locale;
    }
  } catch (e) {
    // cookies() can throw if called during static generation or build phase
  }

  const t = (key: string) => {
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

  return { t, locale };
}
