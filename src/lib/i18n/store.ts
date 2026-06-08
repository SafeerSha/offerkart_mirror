import { Locale, TranslationNamespace } from "./config";

const translationModules = {
  en: {
    common: () => import("./locales/en/common.json").then(m => m.default || m),
    home: () => import("./locales/en/home.json").then(m => m.default || m),
    login: () => import("./locales/en/login.json").then(m => m.default || m),
    "shop-manager": () => import("./locales/en/shop-manager.json").then(m => m.default || m),
  },
  ml: {
    common: () => import("./locales/ml/common.json").then(m => m.default || m),
    home: () => import("./locales/ml/home.json").then(m => m.default || m),
    login: () => import("./locales/ml/login.json").then(m => m.default || m),
    "shop-manager": () => import("./locales/ml/shop-manager.json").then(m => m.default || m),
  },
};

export async function getTranslationsForLocale(locale: Locale, namespace: TranslationNamespace) {
  const localeModules = translationModules[locale] || translationModules["en"];
  const module = await localeModules[namespace]();
  return module;
}

export async function getDictionary(locale: Locale) {
  const [common, home, login, shopManager] = await Promise.all([
    getTranslationsForLocale(locale, "common"),
    getTranslationsForLocale(locale, "home"),
    getTranslationsForLocale(locale, "login"),
    getTranslationsForLocale(locale, "shop-manager"),
  ]);
  
  return {
    common,
    home,
    login,
    "shop-manager": shopManager,
  };
}
