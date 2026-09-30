import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import { chartPoints, peakSample, slowestKeys } from "@/lib/results";
import { accuracy } from "@/lib/typing";
import type { RaceResult } from "@/types/race";
import { SectionTag } from "./section-tag";

type CombatDossierProps = {
  dictionary: Dictionary["results"]["dossier"];
  locale: Locale;
  result: RaceResult;
  wpm: number;
};

const chartWidth = 300;
const chartHeight = 80;

export function CombatDossier({ dictionary, locale, result, wpm }: CombatDossierProps) {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const seconds = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const peak = peakSample(result.speedSamples);
  // Round the chart ceiling up to the next 20 WPM so the peak never touches the top.
  const maxWpm = Math.ceil(((peak?.wpm ?? 0) + 1) / 20) * 20;
  const points = chartPoints(result.speedSamples, result.durationMs, maxWpm, chartWidth, chartHeight);
  const peakPoint = peak ? chartPoints([peak], result.durationMs, maxWpm, chartWidth, chartHeight).split(",") : null;
  const slowKeys = slowestKeys(result.keyStats, 3);

  return (
    <section aria-labelledby="results-dossier" className="flex flex-col gap-4">
      <SectionTag
        id="results-dossier"
        icon="analytics"
        title={dictionary.title}
        badge={formatMessage(dictionary.duration, { seconds: number.format(result.durationMs / 1000) })}
        tilt="right"
      />

      <div className="bg-surface-container p-4 shadow-hard-lg">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <span className="block font-hud text-label-hud font-black uppercase text-outline">{dictionary.average}</span>
            <span className="font-display text-headline-lg leading-none text-secondary tabular-nums">
              {number.format(wpm)} <span className="font-hud text-headline-sm font-black text-primary">{dictionary.wpm}</span>
            </span>
          </div>
          {peak && (
            <div className="text-right">
              <span className="inline-block bg-surface-container-highest px-2 py-0.5 font-hud text-label-hud font-black uppercase text-secondary-fixed">
                {formatMessage(dictionary.peak, { wpm: number.format(peak.wpm) })}
              </span>
              <span className="mt-1 block text-body-md text-on-surface-variant">
                {formatMessage(dictionary.peakAt, { time: `${seconds.format(peak.atMs / 1000)} s` })}
              </span>
            </div>
          )}
        </div>

        <div className="bg-surface-container-lowest p-2">
          <svg
            role="img"
            aria-label={formatMessage(dictionary.chartLabel, { wpm: number.format(peak?.wpm ?? 0) })}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            className="h-24 w-full overflow-visible"
          >
            <line x1="0" x2={chartWidth} y1={chartHeight / 2} y2={chartHeight / 2} strokeDasharray="2 4" className="stroke-surface-container-highest" />
            {points && (
              <>
                <polygon points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`} className="fill-primary-container/20" />
                <polyline points={points} fill="none" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" className="stroke-primary-container" />
              </>
            )}
            {peakPoint && (
              <circle cx={peakPoint[0]} cy={peakPoint[1]} r="4" strokeWidth="2" className="fill-secondary-fixed stroke-surface-container-lowest" />
            )}
          </svg>
          <div aria-hidden="true" className="flex justify-between pt-1 font-hud text-label-hud font-black uppercase text-outline">
            <span>{dictionary.start}</span>
            <span>{dictionary.finish}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container p-4 shadow-hard-lg">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-hud text-headline-sm font-black uppercase text-secondary">{dictionary.precision}</h3>
          <span className="bg-surface-container-high px-2 py-0.5 font-hud text-label-hud font-black uppercase text-secondary-fixed">
            {formatMessage(dictionary.keystrokes, { count: number.format(result.keystrokes) })}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-surface-container-lowest p-2">
            <dt className="font-hud text-label-hud font-black uppercase text-on-surface-variant">{dictionary.accuracy}</dt>
            <dd className="font-display text-headline-md text-secondary">{percent.format(accuracy(result.keystrokes, result.mistakes))}</dd>
          </div>
          <div className="bg-surface-container-lowest p-2">
            <dt className="font-hud text-label-hud font-black uppercase text-on-surface-variant">{dictionary.mistakes}</dt>
            <dd className="font-display text-headline-md text-error">{number.format(result.mistakes)}</dd>
          </div>
        </dl>
      </div>

      <div className="-rotate-[0.5deg] bg-surface-container p-4 shadow-hard-lg">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1 font-hud text-label-hud font-black uppercase text-error">
            <Icon name="warning" size={16} />
            {dictionary.slowKeys}
          </h3>
          <span className="font-hud text-label-hud font-black uppercase text-outline">{dictionary.bottlenecks}</span>
        </div>
        {slowKeys.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">{dictionary.noSlowKeys}</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2">
            {slowKeys.map((stat) => (
              <li key={stat.key} className="flex flex-col items-center bg-surface-container-lowest p-2">
                <span className="font-display text-headline-lg uppercase leading-tight text-error">{stat.key}</span>
                <span className="font-hud text-label-hud font-black text-secondary-fixed">
                  {formatMessage(dictionary.delay, { ms: number.format(stat.avgDelayMs) })}
                </span>
                {stat.mistakes > 0 && (
                  <span className="text-[11px] text-outline">{formatMessage(dictionary.missed, { count: stat.mistakes })}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
