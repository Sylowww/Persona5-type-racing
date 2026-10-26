"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type NavItem = keyof Dictionary["header"]["nav"];

// Races, training and lobbies start from the home page buttons, so the nav only links pages without one.
const routes: Record<NavItem, string> = { home: "", characters: "/characters", compendium: "/compendium", leaderboards: "/leaderboard" };

const navItems: readonly NavItem[] = ["home", "characters", "compendium", "leaderboards"];

type SiteNavProps = {
  locale: Locale;
  dictionary: Dictionary["header"];
};

export function SiteNav({ locale, dictionary }: SiteNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={dictionary.navLabel} className="hidden items-center gap-6 lg:flex">
      {navItems.map((item) => {
        const href = `/${locale}${routes[item]}`;
        const isActive = item === "home" ? href === pathname : pathname.startsWith(href);

        return (
          <Link
            key={item}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`relative whitespace-nowrap py-1 font-hud text-label-hud font-black uppercase tracking-widest transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-[3px] after:-skew-x-[30deg] after:bg-primary-container after:transition-transform ${
              isActive ? "text-secondary after:scale-x-100" : "text-on-surface-variant after:scale-x-0 hover:text-secondary hover:after:scale-x-100"
            }`}
          >
            {dictionary.nav[item]}
          </Link>
        );
      })}
    </nav>
  );
}
