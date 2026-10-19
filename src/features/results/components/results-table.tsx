import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { ResultRacer } from "@/types/race";
import { SectionTag } from "./section-tag";

type ResultsTableProps = {
  dictionary: Dictionary["results"]["table"];
  locale: Locale;
  /** Already ranked, first place first. */
  racers: readonly ResultRacer[];
  youId: string;
};

/** Every racer's full line (RES-02), as a real table for screen readers. */
export function ResultsTable({ dictionary, locale, racers, youId }: ResultsTableProps) {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const seconds = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const { columns } = dictionary;

  return (
    <section aria-labelledby="results-table" className="flex flex-col gap-4">
      <SectionTag id="results-table" icon="analytics" title={dictionary.title} badge={formatMessage(dictionary.racers, { count: racers.length })} tilt="right" />
      <div className="overflow-x-auto bg-surface-container shadow-hard-lg">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="font-hud text-label-hud font-black uppercase tracking-wider text-on-surface-variant">
              <th scope="col" className="px-3 py-2">{columns.rank}</th>
              <th scope="col" className="px-3 py-2">{columns.racer}</th>
              <th scope="col" className="px-3 py-2 text-right">{columns.wpm}</th>
              <th scope="col" className="px-3 py-2 text-right">{columns.rawWpm}</th>
              <th scope="col" className="px-3 py-2 text-right">{columns.accuracy}</th>
              <th scope="col" className="px-3 py-2 text-right">{columns.mistakes}</th>
              <th scope="col" className="px-3 py-2 text-right">{columns.time}</th>
              <th scope="col" className="px-3 py-2 text-right">{columns.bonuses}</th>
              <th scope="col" className="px-3 py-2">{columns.status}</th>
            </tr>
          </thead>
          <tbody>
            {racers.map((racer, index) => {
              const isYou = racer.id === youId;
              return (
                <tr key={racer.id} className={`border-t border-surface-container-highest ${isYou ? "bg-primary-container/25" : ""}`}>
                  <td className="px-3 py-2 font-display text-headline-sm italic text-secondary-fixed tabular-nums">{index + 1}</td>
                  <th scope="row" className="px-3 py-2 font-body font-bold text-secondary">
                    {racer.name}
                    {isYou && <span className="ml-2 bg-secondary-fixed px-1 font-hud text-[11px] font-black uppercase text-on-secondary-fixed">{dictionary.you}</span>}
                  </th>
                  <td className="px-3 py-2 text-right font-bold text-secondary tabular-nums">{number.format(racer.wpm)}</td>
                  <td className="px-3 py-2 text-right text-on-surface-variant tabular-nums">{number.format(racer.rawWpm)}</td>
                  <td className="px-3 py-2 text-right text-on-surface-variant tabular-nums">{percent.format(racer.accuracy)}</td>
                  <td className="px-3 py-2 text-right text-on-surface-variant tabular-nums">{number.format(racer.mistakes)}</td>
                  <td className="px-3 py-2 text-right text-on-surface-variant tabular-nums">
                    {formatMessage(dictionary.seconds, { value: seconds.format(racer.timeMs / 1000) })}
                  </td>
                  <td className="px-3 py-2 text-right text-on-surface-variant tabular-nums">{number.format(racer.bonuses)}</td>
                  <td className={`px-3 py-2 font-hud text-label-hud font-black uppercase ${racer.status === "finished" ? "text-secondary-fixed" : "text-error"}`}>
                    {dictionary.statuses[racer.status]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
