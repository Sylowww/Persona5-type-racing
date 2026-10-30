import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { SavedRaceRecord } from "@/types/race";

type RaceHistoryProps = {
  locale: Locale;
  dictionary: Dictionary["profile"]["history"];
  /** One page of races, most recent first (HIST-01). */
  races: readonly SavedRaceRecord[];
  page: number;
  pageCount: number;
};

const rowClass =
  "grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 bg-surface-container-lowest px-3 py-2 sm:grid-cols-[auto_1fr_auto_auto]";

export function RaceHistory({ locale, dictionary, races, page, pageCount }: RaceHistoryProps) {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const pageHref = (target: number) => `/${locale}/profile?page=${target}#history`;

  return (
    <section id="history" aria-labelledby="history-title" className="panel flex scroll-mt-24 flex-col gap-4 p-6">
      <h2 id="history-title" className="eyebrow text-secondary">
        {dictionary.title}
      </h2>
      {races.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border border-dashed border-surface-container-highest px-4 py-10 text-center">
          <Icon name="timer" size={40} className="text-primary-container" />
          <p className="text-on-surface-variant">{dictionary.empty}</p>
          <Link
            href={`/${locale}/race`}
            className="btn-primary"
          >
            {dictionary.cta}
          </Link>
        </div>
      ) : (
        <ol className="flex flex-col divide-y divide-surface-container-high border-y border-surface-container-high">
          {races.map((race) => {
            const content = (
              <>
                <span
                  className={`font-display text-headline-sm italic leading-none ${race.place === 1 ? "text-primary-container" : "text-secondary"}`}
                >
                  {formatMessage(dictionary.place, { place: race.place, total: race.racerCount })}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[13px] text-on-surface-variant">{date.format(race.endedAt)}</span>
                  {race.finishMs === null && (
                    <span className="font-hud text-[11px] font-black uppercase tracking-widest text-primary">
                      {dictionary.notFinished}
                    </span>
                  )}
                </span>
                <span className="font-hud text-label-hud font-black uppercase text-secondary-fixed">
                  {formatMessage(dictionary.wpm, { wpm: Math.round(race.wpm) })}
                </span>
                <span className="col-span-3 font-hud text-label-hud font-bold uppercase text-on-surface-variant sm:col-span-1">
                  {formatMessage(dictionary.accuracy, { percent: Math.round(race.accuracy * 100) })}
                </span>
              </>
            );
            return (
              <li key={race.endedAt}>
                {race.id === null ? (
                  <div className={rowClass}>{content}</div>
                ) : (
                  // Opens the race's full results (HIST-02).
                  <Link
                    href={`/${locale}/profile/races/${race.id}`}
                    className={`${rowClass} transition-colors hover:bg-surface-container`}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {pageCount > 1 && (
        <nav aria-label={dictionary.pages} className="flex items-center justify-between gap-2 pt-1">
          <PageLink href={page > 1 ? pageHref(page - 1) : null} label={dictionary.previous} icon="chevron_left" />
          <span className="font-hud text-label-hud font-black uppercase text-on-surface-variant">
            {formatMessage(dictionary.page, { page, total: pageCount })}
          </span>
          <PageLink href={page < pageCount ? pageHref(page + 1) : null} label={dictionary.next} icon="chevron_right" />
        </nav>
      )}
    </section>
  );
}

function PageLink({ href, label, icon }: { href: string | null; label: string; icon: "chevron_left" | "chevron_right" }) {
  const body = (
    <>
      {icon === "chevron_left" && <Icon name={icon} size={18} />}
      {label}
      {icon === "chevron_right" && <Icon name={icon} size={18} />}
    </>
  );
  const className = "inline-flex items-center gap-1 border px-3 py-1.5 font-hud text-label-hud font-black uppercase tracking-wider";
  if (href === null) {
    return (
      <span aria-disabled="true" className={`${className} border-surface-container-high text-on-surface-variant opacity-60`}>
        {body}
      </span>
    );
  }
  return (
    <Link href={href} className={`${className} border-surface-container-highest text-secondary transition-colors hover:border-primary-container`}>
      {body}
    </Link>
  );
}
