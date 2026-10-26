import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { readyMeter } from "@/lib/lobby";
import { CopyCodeButton } from "./copy-code-button";

/** Beyond this many players the meter shows proportions instead of one segment per player. */
const MAX_SEGMENTS = 12;

type LobbyHeaderProps = {
  dictionary: Dictionary["lobby"]["header"];
  code: string;
  playerCount: number;
  capacity: number;
  readyCount: number;
};

export function LobbyHeader({ dictionary, code, playerCount, capacity, readyCount }: LobbyHeaderProps) {
  const meter = readyMeter(readyCount, playerCount, MAX_SEGMENTS);

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
      <div className="flex flex-col gap-3">
        <span className="eyebrow">{dictionary.tape}</span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <h1 className="font-display text-headline-md uppercase italic leading-none tracking-wider text-secondary md:text-headline-lg">
            {dictionary.code} <span className="text-secondary-fixed">{code}</span>
          </h1>
          <CopyCodeButton code={code} label={dictionary.copy} copiedLabel={dictionary.copied} />
        </div>
        <span className="font-hud text-label-hud font-bold uppercase tracking-widest text-on-surface-variant">
          {formatMessage(dictionary.seats, { count: playerCount, capacity })}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col xl:text-right">
          <span className="font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">{dictionary.squad}</span>
          <span className="font-hud text-headline-sm font-black uppercase leading-none text-secondary">
            {formatMessage(dictionary.lockedIn, { ready: readyCount, total: playerCount })}
          </span>
        </div>
        <div aria-hidden="true" className="flex items-center gap-1">
          {Array.from({ length: meter.segments }, (_, index) => (
            <span key={index} className={`h-6 w-2.5 -skew-x-12 ${index < meter.filled ? "bg-secondary-fixed" : "bg-surface-container-highest"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
