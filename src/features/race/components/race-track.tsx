import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { RaceRacer } from "@/types/race";

type RaceTrackProps = {
  dictionary: Dictionary["race"]["track"];
  locale: Locale;
  racers: readonly RaceRacer[];
  youId: string;
};

const quarterMarks = [0, 0.25, 0.5, 0.75] as const;

export function RaceTrack({ dictionary, locale, racers, youId }: RaceTrackProps) {
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  return (
    <section aria-label={dictionary.label} className="relative w-full overflow-hidden bg-surface-container-low p-2 shadow-hard-xl">
      <div className="mb-1 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="font-hud text-label-hud font-black uppercase tracking-widest text-primary">{dictionary.label}</h2>
          <span className="font-hud text-[10px] uppercase text-on-surface-variant">
            {"// "}
            {formatMessage(dictionary.racers, { count: racers.length })}
          </span>
        </div>
        <div aria-hidden="true" className="hidden items-center gap-4 font-hud text-label-hud text-on-surface-variant sm:flex">
          {quarterMarks.map((mark) => (
            <span key={mark}>{percent.format(mark)}</span>
          ))}
          <span className="font-black uppercase text-secondary-fixed">{dictionary.finish}</span>
        </div>
      </div>

      <ol className="flex flex-col gap-1.5">
        {racers.map((racer, index) => {
          const isYou = racer.id === youId;
          const width = `${racer.progress * 100}%`;
          const label = formatMessage(dictionary.progress, {
            name: racer.name,
            percent: percent.format(racer.progress),
            wpm: number.format(racer.wpm),
          });

          return (
            <li
              key={racer.id}
              aria-label={label}
              className={`relative flex h-11 items-center overflow-hidden bg-surface-container-highest px-2 ${racer.isConnected ? "" : "opacity-50"}`}
            >
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex justify-between opacity-20">
                {quarterMarks.map((mark) => (
                  <div key={mark} className="h-full w-px bg-on-surface" />
                ))}
              </div>
              <div
                aria-hidden="true"
                className={`absolute inset-y-0 left-0 transition-[width] duration-300 ${
                  isYou
                    ? "bg-gradient-to-r from-primary-container/20 via-primary-container/60 to-primary-container"
                    : "bg-surface-bright/60"
                }`}
                style={{ width }}
              />
              <div
                aria-hidden="true"
                className="absolute flex items-center gap-1 transition-[left,translate] duration-300"
                style={{ left: width, translate: `-${width}` }}
              >
                <div
                  className={`flex -skew-x-12 items-center gap-1 px-2 py-0.5 ${
                    isYou ? "bg-primary-container shadow-hard-sm shadow-secondary-fixed" : "bg-surface-container-lowest shadow-hard-xs"
                  }`}
                >
                  <span className="skew-x-12 font-hud text-[16px] font-black uppercase tracking-widest text-secondary">
                    {racer.name}
                  </span>
                  {isYou && (
                    <span className="skew-x-12 bg-secondary-fixed px-1 font-hud text-[10px] font-black uppercase text-on-secondary-fixed">
                      {dictionary.you}
                    </span>
                  )}
                </div>
                {isYou && <div className="h-6 w-2.5 skew-x-12 bg-secondary-fixed motion-safe:animate-pulse" />}
              </div>

              <div aria-hidden="true" className="pointer-events-none relative z-10 flex w-full items-center justify-end gap-4 pr-1">
                <span className="font-hud text-[17px] font-black tracking-widest text-secondary">
                  {formatMessage(dictionary.wpmValue, { wpm: number.format(racer.wpm) })}
                </span>
                <span className="w-10 text-right font-hud text-label-hud font-black text-secondary-fixed">
                  {percent.format(racer.progress)}
                </span>
                <span className="font-display text-[14px] tracking-wider text-secondary-fixed">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
