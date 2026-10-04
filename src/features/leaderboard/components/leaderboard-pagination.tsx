import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type LeaderboardPaginationProps = {
  dictionary: Dictionary["leaderboard"];
  locale: Locale;
  page: number;
  pageCount: number;
};

/** Arrows to the previous and next pages; each page is loaded on its own. */
export function LeaderboardPagination({ dictionary, locale, page, pageCount }: LeaderboardPaginationProps) {
  const href = (target: number) => `/${locale}/leaderboard?page=${target}`;
  return (
    <nav aria-label={dictionary.pagination} className="flex items-center justify-center gap-4">
      <ArrowLink icon="chevron_left" label={dictionary.previous} href={page > 1 ? href(page - 1) : null} />
      <span className="font-hud text-label-hud font-black uppercase tracking-widest text-secondary">
        {formatMessage(dictionary.page, { page, total: pageCount })}
      </span>
      <ArrowLink icon="chevron_right" label={dictionary.next} href={page < pageCount ? href(page + 1) : null} />
    </nav>
  );
}

function ArrowLink({ icon, label, href }: { icon: IconName; label: string; href: string | null }) {
  const className = "flex size-10 -skew-x-6 items-center justify-center shadow-hard-sm";
  if (!href) {
    return (
      <span aria-disabled="true" aria-label={label} className={`${className} bg-surface-container text-outline opacity-50`}>
        <Icon name={icon} size={24} />
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={`${className} bg-primary-container text-on-primary-container transition-transform hover:-translate-y-0.5`}
    >
      <Icon name={icon} size={24} />
    </Link>
  );
}
