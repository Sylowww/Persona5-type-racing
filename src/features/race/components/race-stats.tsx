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
    <dl className="panel grid grid-cols-2 divide-surface-container-high lg:grid-cols-4 lg:divide-x">
      <div className="flex flex-col gap-1 p-5">
        <dt className="font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">{dictionary.speed}</dt>
        <dd className="flex items-baseline gap-2">
          <span className="font-display text-[64px] leading-none tracking-tight text-secondary tabular-nums">{number.format(wpm)}</span>
          <span className="flex flex-col">
            <span className="font-hud text-label-hud font-black uppercase leading-none text-primary">{dictionary.wpm}</span>
            <span className="mt-1 font-hud text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{dictionary.realTime}</span>
          </span>
        </dd>
      </div>
      <div className="flex flex-col gap-1 p-5">
        <dt className="flex items-center gap-2 font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">
          {dictionary.streak}
          {mistakes === 0 && <span className="bg-secondary-fixed px-1 text-on-secondary-fixed">{dictionary.perfect}</span>}
        </dt>
        <dd className="flex items-baseline gap-2">
          <span className="font-display text-[64px] leading-none tracking-tight text-secondary-fixed tabular-nums">{number.format(streak)}</span>
          <span className="flex flex-col">
            <span className="font-hud text-label-hud font-black uppercase leading-none text-secondary">{dictionary.hits}</span>
            <span className="mt-1 font-hud text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{dictionary.unbroken}</span>
          </span>
        </dd>
      </div>
      <div className="flex flex-col gap-1 p-5 lg:col-span-2">
        <dt className="font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">{dictionary.accuracy}</dt>
        <dd className="font-display text-[64px] leading-none tracking-tight text-secondary tabular-nums">{percent.format(accuracy)}</dd>
      </div>
    </dl>
  );
}
