import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type ResultsBannerProps = {
  dictionary: Dictionary["results"]["banner"];
  locale: Locale;
  place: number;
  finished: boolean;
  wpm: number;
  /** The record this race beat (RES-04); null when it is not a new personal best. */
  beatenRecord: number | null;
};

export function ResultsBanner({ dictionary, locale, place, finished, wpm, beatenRecord }: ResultsBannerProps) {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const headline = !finished
    ? dictionary.unfinished
    : place === 1
      ? dictionary.victory
      : formatMessage(dictionary.placed, { place });

  return (
    <header className="relative overflow-hidden bg-primary-container px-5 py-6 text-on-primary-container shadow-hard-xl md:px-8">
      <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <span className="font-hud text-label-hud font-black uppercase tracking-widest">{dictionary.eyebrow}</span>
          <h1 className="mt-2 font-display text-headline-md uppercase italic tracking-wider md:text-headline-lg">{headline}</h1>
          {beatenRecord !== null && (
            <p className="mt-3 inline-flex flex-wrap items-baseline gap-x-3 bg-secondary-fixed px-3 py-1 text-on-secondary-fixed">
              <span className="font-hud text-headline-sm font-black uppercase italic">{dictionary.personalBest}</span>
              <span className="font-hud text-label-hud font-black uppercase">
                {formatMessage(dictionary.personalBestDetail, { wpm: number.format(beatenRecord) })}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-stretch gap-3">
          <div className="bg-surface-container-lowest px-5 py-3 text-right">
            <span className="block font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">{dictionary.speed}</span>
            <span className="font-display text-headline-md text-secondary tabular-nums">
              {number.format(wpm)} <span className="font-hud text-label-hud font-black uppercase text-primary">{dictionary.wpm}</span>
            </span>
          </div>
          {finished && (
            <div className="bg-surface-container-lowest px-5 py-3 text-center">
              <span className="block font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">{dictionary.place}</span>
              <span className="block font-display text-headline-lg leading-none text-secondary-fixed">{place}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
