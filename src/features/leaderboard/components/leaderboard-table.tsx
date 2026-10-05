import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { LeaderboardRow } from "@/types/leaderboard";

type LeaderboardTableProps = {
  dictionary: Dictionary["leaderboard"];
  rows: readonly LeaderboardRow[];
  /** Signed-in user, highlighted in the list. */
  youId: string | null;
};

const podiumColor = ["text-secondary-fixed", "text-secondary", "text-primary"];

export function LeaderboardTable({ dictionary, rows, youId }: LeaderboardTableProps) {
  const { columns } = dictionary;

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 bg-surface-container-lowest px-4 py-10 text-center">
        <Icon name="military_tech" size={40} className="text-primary-container" />
        <p className="text-on-surface-variant">{dictionary.empty}</p>
      </div>
    );
  }

  return (
    <table className="w-full border-separate border-spacing-y-1.5 text-left">
      <thead className="font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">
        <tr>
          <th scope="col" className="px-3 py-1">{columns.rank}</th>
          <th scope="col" className="px-3 py-1">{columns.player}</th>
          <th scope="col" className="px-3 py-1 text-right">{columns.record}</th>
          <th scope="col" className="hidden px-3 py-1 text-right sm:table-cell">{columns.average}</th>
          <th scope="col" className="hidden px-3 py-1 text-right md:table-cell">{columns.accuracy}</th>
          <th scope="col" className="hidden px-3 py-1 text-right md:table-cell">{columns.races}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isYou = row.userId === youId;
          return (
            <tr key={row.userId} aria-current={isYou ? "true" : undefined} className={isYou ? "bg-primary-container text-on-primary-container" : "bg-surface-container-lowest"}>
              <td className={`px-3 py-2 font-display text-headline-sm italic leading-none ${isYou ? "" : (podiumColor[row.rank - 1] ?? "text-on-surface-variant")}`}>
                #{row.rank}
              </td>
              <td className="max-w-0 px-3 py-2 sm:max-w-none">
                <span className="flex items-center gap-2">
                  <span className="truncate font-hud text-[15px] font-black uppercase">{row.username}</span>
                  {isYou && (
                    <span className="shrink-0 bg-secondary-fixed px-1.5 font-hud text-[10px] font-black uppercase text-on-secondary-fixed">
                      {dictionary.you}
                    </span>
                  )}
                </span>
              </td>
              <td className={`px-3 py-2 text-right font-hud text-[15px] font-black uppercase ${isYou ? "" : "text-secondary-fixed"}`}>
                {formatMessage(dictionary.wpm, { wpm: Math.round(row.bestWpm) })}
              </td>
              <td className="hidden px-3 py-2 text-right font-hud text-[13px] font-bold uppercase sm:table-cell">
                {formatMessage(dictionary.wpm, { wpm: Math.round(row.averageWpm) })}
              </td>
              <td className="hidden px-3 py-2 text-right font-hud text-[13px] font-bold uppercase md:table-cell">
                {formatMessage(dictionary.percent, { percent: Math.round(row.accuracy * 100) })}
              </td>
              <td className="hidden px-3 py-2 text-right font-hud text-[13px] font-bold md:table-cell">{row.races}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
