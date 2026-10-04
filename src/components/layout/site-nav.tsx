"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type NavItem = keyof Dictionary["header"]["nav"];

// Races, training and lobbies start from the home page buttons, so the nav only links pages without one.
const routes: Record<NavItem, string> = { home: "", leaderboards: "/leaderboard" };

const navItems: readonly NavItem[] = ["home", "leaderboards"];

type SiteNavProps = {
  locale: Locale;
  dictionary: Dictionary["header"];
};

export function SiteNav({ locale, dictionary }: SiteNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={dictionary.navLabel} className="hidden items-center gap-1 xl:flex">
      {navItems.map((item) => {
        const href = `/${locale}${routes[item]}`;
        const isActive = href === pathname;

        return (
          <Link
            key={item}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`whitespace-nowrap px-1.5 py-1 font-hud text-base font-black uppercase italic min-[1800px]:px-3 min-[1800px]:text-lg ${
              isActive
                ? "bg-primary-container text-on-primary-container shadow-hard-sm shadow-secondary-fixed"
                : "text-on-surface-variant hover:text-secondary"
            }`}
          >
            {dictionary.nav[item]}
          </Link>
        );
      })}
    </nav>
  );
}
