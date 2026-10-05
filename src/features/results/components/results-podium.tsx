import Image from "next/image";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import { characterAllOutPortrait } from "@/lib/characters";
import type { ResultRacer } from "@/types/race";
import { SectionTag } from "./section-tag";

type ResultsPodiumProps = {
  dictionary: Dictionary["results"]["podium"];
  locale: Locale;
  /** Already ranked, first place first. */
  racers: readonly ResultRacer[];
  youId: string;
};

export function ResultsPodium({ dictionary, locale, racers, youId }: ResultsPodiumProps) {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const seconds = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const [winner, ...others] = racers;

  const label = (racer: ResultRacer, place: number) =>
    formatMessage(dictionary.entry, { place, name: racer.name, wpm: number.format(racer.wpm) });
  const time = (racer: ResultRacer) =>
    racer.finishMs === null
      ? dictionary.unfinished
      : formatMessage(dictionary.time, { value: `${seconds.format(racer.finishMs / 1000)} s` });

  return (
    <section aria-labelledby="results-podium" className="flex flex-col gap-4">
      <SectionTag
        id="results-podium"
        icon="military_tech"
        title={dictionary.title}
        badge={formatMessage(dictionary.racers, { count: racers.length })}
      />

      <ol className="flex flex-col gap-4">
        {winner && (
          <li aria-label={label(winner, 1)} className="relative rotate-[1.5deg] bg-surface-container p-5 shadow-hard-lg">
            <div className="flex items-start gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden bg-surface-container-lowest shadow-hard-sm">
                <Image src={characterAllOutPortrait(winner.character)} alt="" fill sizes="96px" className="object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-primary-container/90 py-0.5 text-center font-hud text-label-hud font-black uppercase text-on-primary-container">
                  {dictionary.winner}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <RacerName name={winner.name} isYou={winner.id === youId} you={dictionary.you} />
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-headline-lg leading-none text-secondary-fixed tabular-nums">
                    {number.format(winner.wpm)}
                  </span>
                  <span className="font-hud text-headline-sm font-black uppercase text-tertiary-fixed">{dictionary.wpm}</span>
                </div>
                <div className="mt-1 flex flex-wrap justify-between gap-x-3 font-hud text-label-hud font-black uppercase text-on-surface-variant">
                  <span>{formatMessage(dictionary.accuracy, { value: percent.format(winner.accuracy) })}</span>
                  <span>{time(winner)}</span>
                </div>
              </div>
            </div>
          </li>
        )}

        {others.map((racer, index) => (
          <li
            key={racer.id}
            aria-label={label(racer, index + 2)}
            className={`flex items-center justify-between gap-3 bg-surface-container-low p-4 shadow-hard-md ${
              index % 2 === 0 ? "-rotate-1" : "rotate-1"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center bg-surface-container-high font-hud text-headline-sm font-black text-outline">
                {index + 2}
              </span>
              <div className="relative size-10 shrink-0 overflow-hidden shadow-hard-xs">
                <Image src={characterAllOutPortrait(racer.character)} alt="" fill sizes="40px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <RacerName name={racer.name} isYou={racer.id === youId} you={dictionary.you} />
                <div className="truncate font-hud text-label-hud font-black uppercase text-outline">{time(racer)}</div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-display text-headline-md leading-none text-on-surface tabular-nums">
                {number.format(racer.wpm)}{" "}
                <span className="font-hud text-label-hud font-black uppercase text-tertiary">{dictionary.wpm}</span>
              </div>
              <div className="font-hud text-label-hud font-black uppercase text-on-surface-variant">
                {formatMessage(dictionary.accuracy, { value: percent.format(racer.accuracy) })}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RacerName({ name, isYou, you }: { name: string; isYou: boolean; you: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="truncate font-hud text-headline-sm font-black uppercase text-secondary">{name}</span>
      {isYou && (
        <span className="shrink-0 -rotate-3 bg-primary-container px-1.5 font-hud text-label-hud font-black uppercase text-on-primary-container">
          {you}
        </span>
      )}
    </div>
  );
}
