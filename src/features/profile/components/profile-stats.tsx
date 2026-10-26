import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { PlayerStats } from "@/types/race";
import { WpmProgressChart } from "./wpm-progress-chart";

type ProfileStatsProps = {
  dictionary: Dictionary["profile"]["stats"];
  locale: Locale;
  stats: PlayerStats;
  /** Recent races, oldest first, for the progress chart. */
  progress: readonly { endedAt: number; wpm: number }[];
};

export function ProfileStats({ dictionary, locale, stats, progress }: ProfileStatsProps) {
  const empty = stats.races === 0;
  const tiles = [
    { label: dictionary.races, value: String(stats.races) },
    { label: dictionary.wins, value: String(stats.wins) },
    { label: dictionary.record, value: empty ? "—" : String(Math.round(stats.bestWpm)) },
    { label: dictionary.average, value: empty ? "—" : String(Math.round(stats.averageWpm)) },
    { label: dictionary.accuracy, value: empty ? "—" : `${Math.round(stats.accuracy * 100)}%` },
  ];

  return (
    <section className="flex flex-col gap-4 bg-surface-container p-5 shadow-hard-md shadow-secondary">
      <h2 className="font-hud text-headline-sm font-black uppercase italic tracking-wider text-secondary">{dictionary.title}</h2>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col items-center bg-surface-container-high p-3 text-center shadow-hard-sm">
            <dt className="font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">{tile.label}</dt>
            <dd className="mt-1 font-display text-headline-md italic leading-none text-secondary">{tile.value}</dd>
          </div>
        ))}
      </dl>
      <WpmProgressChart dictionary={dictionary} locale={locale} races={progress} />
      {empty && (
        <p className="flex items-center gap-2 text-on-surface-variant">
          <Icon name="analytics" size={22} className="text-primary-container" />
          {dictionary.empty}
        </p>
      )}
    </section>
  );
}
