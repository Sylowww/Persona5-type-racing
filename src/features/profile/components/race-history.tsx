import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { RaceRecord } from "@/types/race";

type RaceHistoryProps = {
  locale: Locale;
  dictionary: Dictionary["profile"]["history"];
  /** Most recent first. */
  races: readonly RaceRecord[];
};

export function RaceHistory({ locale, dictionary, races }: RaceHistoryProps) {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <section className="flex flex-col gap-3 bg-surface-container p-5 shadow-hard-md shadow-secondary">
      <h2 className="font-hud text-headline-sm font-black uppercase italic tracking-wider text-secondary">{dictionary.title}</h2>
      {races.length === 0 ? (
        <div className="flex flex-col items-center gap-3 bg-surface-container-lowest px-4 py-8 text-center">
          <Icon name="timer" size={40} className="text-primary-container" />
          <p className="text-on-surface-variant">{dictionary.empty}</p>
          <Link
            href={`/${locale}/race`}
            className="-skew-x-6 bg-primary-container px-4 py-2 font-hud text-label-hud font-black uppercase italic text-on-primary-container shadow-hard-sm shadow-secondary hover:bg-secondary-container hover:text-on-secondary-fixed"
          >
            {dictionary.cta}
          </Link>
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {races.map((race) => (
            <li
              key={race.endedAt}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 bg-surface-container-lowest px-3 py-2 sm:grid-cols-[auto_1fr_auto_auto]"
            >
              <span
                className={`font-display text-headline-sm italic leading-none ${race.place === 1 ? "text-primary-container" : "text-secondary"}`}
              >
                {formatMessage(dictionary.place, { place: race.place, total: race.racerCount })}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13px] text-on-surface-variant">{date.format(race.endedAt)}</span>
                {race.finishMs === null && (
                  <span className="font-hud text-[11px] font-black uppercase tracking-widest text-primary-container">
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
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
