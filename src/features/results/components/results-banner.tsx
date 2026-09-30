import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type ResultsBannerProps = {
  dictionary: Dictionary["results"]["banner"];
  locale: Locale;
  place: number;
  finished: boolean;
  wpm: number;
};

export function ResultsBanner({ dictionary, locale, place, finished, wpm }: ResultsBannerProps) {
  const headline = !finished
    ? dictionary.unfinished
    : place === 1
      ? dictionary.victory
      : formatMessage(dictionary.placed, { place });

  return (
    <header className="relative -rotate-1">
      <div className="relative overflow-hidden bg-primary-container p-4 shadow-hard-xl md:p-6">
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 h-full w-96 bg-[radial-gradient(var(--color-on-secondary-fixed)_2px,transparent_2px)] [background-size:12px_12px] opacity-25"
        />
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <span className="inline-block rotate-2 bg-secondary-fixed px-3 py-1 font-hud text-label-hud font-black uppercase text-on-secondary-fixed shadow-hard-xs">
              {dictionary.eyebrow}
            </span>
            <h1 className="mt-2 font-display text-headline-md uppercase italic tracking-wider text-on-primary-container drop-shadow-[3px_3px_0_var(--color-surface-container-lowest)] md:text-headline-lg">
              {headline}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="rotate-2 bg-surface-container-lowest px-4 py-2 text-right shadow-hard-md">
              <span className="block font-hud text-label-hud font-black uppercase text-secondary-fixed">{dictionary.speed}</span>
              <span className="font-display text-headline-md text-secondary tabular-nums">
                {new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(wpm)}{" "}
                <span className="font-body text-body-md text-tertiary">{dictionary.wpm}</span>
              </span>
            </div>
            {finished && (
              <div className="-rotate-3 bg-surface-container-lowest p-2 text-center shadow-hard-lg">
                <span className="block bg-secondary-fixed px-3 py-1 font-hud text-label-hud font-black uppercase text-on-secondary-fixed">
                  {dictionary.place}
                </span>
                <span className="block px-2 font-display text-[64px] leading-none text-primary-fixed-dim">{place}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
