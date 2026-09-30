import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { LeaderboardEntry } from "@/types/player";

type RivalLeaderboardProps = {
  dictionary: Dictionary["home"]["dossier"]["leaderboard"];
  entries: readonly LeaderboardEntry[];
};

export function RivalLeaderboard({ dictionary, entries }: RivalLeaderboardProps) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-hud text-label-hud font-black uppercase tracking-widest text-secondary">{dictionary.title}</h3>
        <span className="shrink-0 font-hud text-[11px] font-black uppercase tracking-wider text-secondary-fixed motion-safe:animate-pulse">
          {dictionary.live}
        </span>
      </div>
      <ol className="flex flex-col gap-1.5">
        {entries.map((entry) => (
          <LeaderboardRow key={entry.position} entry={entry} dictionary={dictionary} />
        ))}
      </ol>
    </section>
  );
}

function LeaderboardRow({ entry, dictionary }: { entry: LeaderboardEntry; dictionary: RivalLeaderboardProps["dictionary"] }) {
  const position = String(entry.position).padStart(2, "0");
  const wpm = formatMessage(dictionary.wpm, { wpm: entry.wpm });

  if (entry.isCurrentPlayer) {
    return (
      <li
        value={entry.position}
        className="flex rotate-[-1deg] items-center justify-between bg-primary-container p-2 text-on-primary-container shadow-hard-sm shadow-secondary-fixed"
      >
        <div className="flex items-center gap-2">
          <span className="w-6 text-center font-hud text-headline-sm font-black italic text-secondary-fixed">{position}</span>
          <div className="flex flex-col">
            <span className="flex items-center gap-1 font-black uppercase leading-none text-secondary">
              {formatMessage(dictionary.you, { name: entry.name })}
              <span className="bg-secondary-fixed px-1 text-[9px] font-black text-on-secondary-fixed">{dictionary.target}</span>
            </span>
            <span className="font-hud text-[10px] font-bold uppercase text-on-primary-fixed">{entry.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-hud text-headline-sm font-black italic text-secondary-fixed">{wpm}</span>
          <Icon name="star" filled size={18} className="text-secondary-fixed" />
        </div>
      </li>
    );
  }

  const isFirst = entry.position === 1;
  return (
    <li
      value={entry.position}
      className="flex items-center justify-between bg-surface-container-high p-2 shadow-hard-xs transition-colors hover:bg-surface-container-highest"
    >
      <div className="flex items-center gap-2">
        <span className={`w-6 text-center font-hud text-headline-sm font-black italic ${isFirst ? "text-secondary-fixed" : "text-on-surface-variant"}`}>
          {position}
        </span>
        <div className="flex flex-col">
          <span className="font-bold uppercase leading-none text-secondary">{entry.name}</span>
          <span className="font-hud text-[10px] font-bold uppercase text-on-surface-variant">{entry.title}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-hud text-headline-sm font-black italic ${isFirst ? "text-primary-container" : "text-secondary"}`}>{wpm}</span>
        <Icon name="military_tech" size={16} className={`${isFirst ? "text-secondary-fixed" : "text-on-surface-variant"}`} />
      </div>
    </li>
  );
}
