"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { LOCALE_COOKIE, localizedPath, locales, type Locale } from "@/i18n/locales";

type LanguageSwitcherProps = {
  locale: Locale;
  dictionary: Dictionary["header"]["language"];
};

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function saveLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}

export function LanguageSwitcher({ locale, dictionary }: LanguageSwitcherProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={dictionary.label} className="flex items-center bg-surface-container p-0.5">
      {locales.map((option) => {
        const isCurrent = option === locale;

        return (
          <Link
            key={option}
            href={localizedPath(pathname, option)}
            hrefLang={option}
            lang={option}
            aria-current={isCurrent ? "true" : undefined}
            aria-label={dictionary.names[option]}
            onClick={() => saveLocale(option)}
            // On narrow screens only the other language shows, to keep the header on one line.
            className={`px-2 py-1.5 font-hud text-label-hud font-black uppercase transition-colors ${
              isCurrent
                ? "hidden bg-primary-container text-on-primary-container sm:block"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {option}
          </Link>
        );
      })}
    </nav>
  );
}
