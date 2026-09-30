import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type RaceStatsProps = {
  dictionary: Dictionary["race"]["stats"];
  locale: Locale;
  wpm: number;
  streak: number;
  mistakes: number;
  accuracy: number;
};

export function RaceStats({ dictionary, locale, wpm, streak, mistakes, accuracy }: RaceStatsProps) {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="relative overflow-hidden bg-surface-container-low p-4 shadow-hard-xl">
        <div
          aria-hidden="true"
          className="absolute -right-6 -bottom-6 size-28 bg-[radial-gradient(var(--color-primary-container)_1.5px,transparent_1.5px)] [background-size:6px_6px] opacity-20"
        />
        <div className="flex items-center gap-1">
          <span aria-hidden="true" className="size-3 rotate-45 bg-primary-container" />
          <h2 className="font-hud text-headline-sm font-black uppercase italic tracking-wider text-secondary">{dictionary.speed}</h2>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-[88px] leading-none tracking-tighter text-secondary tabular-nums">
            {number.format(wpm)}
          </span>
          <div className="flex flex-col">
            <span className="font-hud text-headline-sm font-black uppercase italic leading-none text-primary-container">
              {dictionary.wpm}
            </span>
            <span className="mt-1 font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">
              {dictionary.realTime}
            </span>
          </div>
        </div>
      </section>

      <section className="relative flex flex-col justify-between gap-2 overflow-hidden bg-surface-container-low p-4 shadow-hard-xl shadow-primary-container">
        <div className="flex items-center justify-between">
          <h2 className="font-hud text-headline-sm font-black uppercase italic tracking-wider text-secondary">{dictionary.streak}</h2>
          {mistakes === 0 && (
            <span className="bg-secondary-fixed px-1 py-0.5 font-hud text-label-hud font-black uppercase text-on-secondary-fixed">
              {dictionary.perfect}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-[80px] leading-none tracking-tighter text-secondary-fixed tabular-nums">
            {number.format(streak)}
          </span>
          <div className="flex flex-col">
            <span className="font-hud text-[26px] font-black uppercase leading-none text-secondary">{dictionary.hits}</span>
            <span className="font-hud text-[11px] uppercase tracking-widest text-tertiary-fixed">{dictionary.unbroken}</span>
          </div>
        </div>
        <div className="flex items-center justify-between bg-surface-container-high p-1 shadow-hard-xs">
          <span className="font-hud text-label-hud font-black uppercase text-on-surface-variant">{dictionary.accuracy}</span>
          <span className="font-hud text-[20px] font-black tracking-wider text-secondary">
            {percent.format(accuracy)}
          </span>
        </div>
      </section>
    </div>
  );
}
