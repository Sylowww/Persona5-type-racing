import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";

type RaceHudProps = {
  dictionary: Dictionary["race"]["hud"];
  elapsedMs: number;
  wordCount: number;
  place: number;
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

export function RaceHud({ dictionary, elapsedMs, wordCount, place, racerCount }: RaceHudProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="-skew-x-6 bg-surface-container-high px-4 py-1 shadow-hard-md">
          <div className="flex skew-x-6 items-center gap-2">
            <Icon name="timer" className="text-primary-container" />
            <div className="flex flex-col">
              <span className="font-hud text-label-hud font-black uppercase leading-none tracking-widest text-on-surface-variant">
                {dictionary.time}
              </span>
              <span role="timer" className="font-display text-headline-md leading-tight tracking-wider text-secondary tabular-nums">
                {formatRaceTime(elapsedMs)}
              </span>
            </div>
          </div>
        </div>
        <div className="-skew-x-6 bg-surface-container px-2 py-1 shadow-hard-sm">
          <div className="flex skew-x-6 flex-col">
            <span className="font-hud text-label-hud font-black uppercase tracking-wider text-secondary-fixed">
              {dictionary.objective}
            </span>
            <span className="font-display text-[14px] uppercase tracking-wider text-on-surface">
              {formatMessage(dictionary.target, { count: wordCount })}
            </span>
          </div>
        </div>
      </div>

      <div className="relative rotate-2">
        <div aria-hidden="true" className="absolute -inset-1 -rotate-3 bg-surface-container-lowest" />
        <div className="relative flex items-center gap-2 bg-secondary-container px-7 py-1 text-on-secondary-fixed shadow-hard-lg shadow-primary-container">
          <Icon name="military_tech" size={32} filled />
          <div className="flex flex-col leading-none">
            <span className="font-display text-headline-md uppercase tracking-tighter">
              {formatMessage(dictionary.place, { place })}
            </span>
            <span className="font-hud text-[11px] font-black uppercase tracking-widest">
              {formatMessage(dictionary.placeOf, { total: racerCount })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
