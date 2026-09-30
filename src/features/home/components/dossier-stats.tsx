import type { Dictionary } from "@/i18n/dictionaries/en";
import type { PlayerStats } from "@/types/race";
import { StatTile } from "./stat-tile";

type DossierStatsProps = {
  dictionary: Dictionary["home"]["dossier"]["stats"];
  stats: PlayerStats;
};

export function DossierStats({ dictionary, stats }: DossierStatsProps) {
  const empty = stats.races === 0;
  return (
    <dl className="grid grid-cols-3 gap-1">
      <StatTile
        label={dictionary.record}
        value={empty ? "—" : String(Math.round(stats.bestWpm))}
        note={empty ? dictionary.empty : dictionary.best}
        valueColor="text-primary-container"
        noteColor="text-on-surface-variant"
      />
      <StatTile
        label={dictionary.accuracy}
        value={empty ? "—" : `${Math.round(stats.accuracy * 100)}%`}
        note={empty ? dictionary.empty : dictionary.average}
        valueColor="text-secondary"
        noteColor="text-on-surface-variant"
      />
      <StatTile
        label={dictionary.races}
        value={String(stats.races)}
        note={empty ? dictionary.empty : dictionary.played}
        valueColor="text-secondary-fixed"
        noteColor="text-on-surface-variant"
      />
    </dl>
  );
}
