export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export const defaultLocale: Locale = "fr";

/** Cookie that keeps the language picked with the language switcher. */
export const LOCALE_COOKIE = "locale";

/** The saved choice first, then the browser's preferred languages (`Accept-Language`), then French. */
export function preferredLocale(saved: string | undefined, acceptLanguage: string | null): Locale {
  if (saved && isLocale(saved)) return saved;

  const languages = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const quality = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
      return { language: tag.split("-")[0].toLowerCase(), quality: quality ? Number(quality.slice(2)) : 1 };
    })
    .filter(({ language, quality }) => language && quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { language } of languages) if (isLocale(language)) return language;
  return defaultLocale;
}

/** The same page in another language: swaps the leading `/fr` or `/en` segment. */
export function localizedPath(pathname: string, locale: Locale): string {
  const match = /^\/([^/]+)(\/.*)?$/.exec(pathname);
  if (!match || !isLocale(match[1])) return `/${locale}`;
  return `/${locale}${match[2] ?? ""}`;
}
