import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";

type RaceHudProps = {
  dictionary: Dictionary["race"]["hud"];
  elapsedMs: number;
  /** Shown as a countdown when set; otherwise the elapsed time is shown. */
  remainingMs: number | null;
  wordCount: number;
  /** Null for spectators: they see the racer count only. */
  place: number | null;
  racerCount: number;
};

/** `mm:ss.cc`, e.g. `00:18.42`. */
function formatRaceTime(ms: number): string {
  const centiseconds = Math.floor(ms / 10);
  const minutes = Math.floor(centiseconds / 6000);
  const seconds = Math.floor(centiseconds / 100) % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds % 100)}`;
}

export function RaceHud({ dictionary, elapsedMs, remainingMs, wordCount, place, racerCount }: RaceHudProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-8">
        <div className="flex items-center gap-3">
          <Icon name="timer" size={28} className="text-primary-container" />
          <div className="flex flex-col">
            <span className="font-hud text-[11px] font-black uppercase leading-none tracking-widest text-on-surface-variant">
              {remainingMs === null ? dictionary.time : dictionary.timeLeft}
            </span>
            <span role="timer" className="font-display text-headline-md leading-tight tracking-wider text-secondary tabular-nums">
              {formatRaceTime(remainingMs ?? elapsedMs)}
            </span>
          </div>
        </div>
        <div className="flex flex-col border-l border-surface-container-high pl-8">
          <span className="font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">{dictionary.objective}</span>
          <span className="font-hud text-label-hud font-black uppercase tracking-wider text-on-surface">
            {formatMessage(dictionary.target, { count: wordCount })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-secondary-container px-5 py-2 text-on-secondary-fixed shadow-hard-md">
        <Icon name="military_tech" size={28} filled />
        <div className="flex flex-col leading-none">
          <span className="font-display text-headline-md uppercase tracking-tight">
            {place === null ? dictionary.spectating : formatMessage(dictionary.place, { place })}
          </span>
          <span className="font-hud text-[11px] font-black uppercase tracking-widest">{formatMessage(dictionary.placeOf, { total: racerCount })}</span>
        </div>
      </div>
    </div>
  );
}
