import "server-only";
import type { Locale } from "./locales";

const dictionaries = {
  fr: () => import("./dictionaries/fr").then((module) => module.default),
  en: () => import("./dictionaries/en").then((module) => module.default),
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}
