"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type NavItem = keyof Dictionary["header"]["nav"];

/** Pages that exist; the other entries become links once their pages are built. */
const routes: Partial<Record<NavItem, string>> = { home: "", quickRace: "/race", lobby: "/lobby" };

const navItems: readonly NavItem[] = ["home", "quickRace", "lobby", "training", "leaderboards"];

type SiteNavProps = {
  locale: Locale;
  dictionary: Dictionary["header"];
};

export function SiteNav({ locale, dictionary }: SiteNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={dictionary.navLabel} className="hidden items-center gap-1 xl:flex">
      {navItems.map((item) => {
        const route = routes[item];
        const href = route === undefined ? undefined : `/${locale}${route}`;
        const isActive = href === pathname;
        const className = `whitespace-nowrap px-3 py-1 font-hud text-lg font-black uppercase italic ${
          isActive
            ? "bg-primary-container text-on-primary-container shadow-hard-sm shadow-secondary-fixed"
            : "text-on-surface-variant"
        }`;

        return href ? (
          <Link key={item} href={href} aria-current={isActive ? "page" : undefined} className={`${className} hover:text-secondary`}>
            {dictionary.nav[item]}
          </Link>
        ) : (
          <span key={item} className={className}>
            {dictionary.nav[item]}
          </span>
        );
      })}
    </nav>
  );
}
