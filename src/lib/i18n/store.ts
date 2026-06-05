import enCommon from "./locales/en/common.json";
import enHome from "./locales/en/home.json";
import enLogin from "./locales/en/login.json";
import enShopManager from "./locales/en/shop-manager.json";

import mlCommon from "./locales/ml/common.json";
import mlHome from "./locales/ml/home.json";
import mlLogin from "./locales/ml/login.json";
import mlShopManager from "./locales/ml/shop-manager.json";

import { Locale, TranslationNamespace } from "./config";

export const translations = {
  en: {
    common: enCommon,
    home: enHome,
    login: enLogin,
    "shop-manager": enShopManager,
  },
  ml: {
    common: mlCommon,
    home: mlHome,
    login: mlLogin,
    "shop-manager": mlShopManager,
  },
} as const;

export function getTranslationsForLocale(locale: Locale, namespace: TranslationNamespace) {
  const dict = (translations[locale] || translations["en"])[namespace];
  return dict;
}
