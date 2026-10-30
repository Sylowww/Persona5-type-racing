import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import { chartPoints, peakSample, raceChart, type ChartTone } from "@/lib/results";
import type { ResultRacer } from "@/types/race";
import { SectionTag } from "./section-tag";

type WpmRaceChartProps = {
  dictionary: Dictionary["results"]["raceChart"];
  locale: Locale;
  /** Already ranked, first place first. */
  racers: readonly ResultRacer[];
  youId: string;
};

const width = 600;
const height = 200;

const lineClass: Record<ChartTone, string> = {
  you: "stroke-primary-container [stroke-width:3]",
  first: "stroke-secondary-fixed [stroke-width:2]",
  second: "stroke-secondary [stroke-width:2]",
  third: "stroke-tertiary [stroke-width:2]",
  other: "stroke-outline [stroke-width:1.5] opacity-70",
};

const swatchClass: Record<ChartTone, string> = {
  you: "bg-primary-container",
  first: "bg-secondary-fixed",
  second: "bg-secondary",
  third: "bg-tertiary",
  other: "bg-outline",
};

/** Every racer's WPM over the race on one chart (RES-03). */
export function WpmRaceChart({ dictionary, locale, racers, youId }: WpmRaceChartProps) {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const { durationMs, maxWpm, lines } = raceChart(racers, youId);
  const fastest = racers
    .map((racer) => ({ racer, peak: peakSample(racer.samples) }))
    .reduce<{ name: string; wpm: number } | null>(
      (best, { racer, peak }) => (peak && (!best || peak.wpm > best.wpm) ? { name: racer.name, wpm: peak.wpm } : best),
      null,
    );
  // Legend in final order, the player's line named as "you".
  const legend = [...lines].sort((a, b) => racers.indexOf(a.racer) - racers.indexOf(b.racer));

  return (
    <section aria-labelledby="results-race-chart" className="flex flex-col gap-4">
      <SectionTag
        id="results-race-chart"
        icon="analytics"
        title={dictionary.title}
        badge={formatMessage(dictionary.racers, { count: racers.length })}
      />
      <div className="panel p-5">
        {!fastest || durationMs <= 0 ? (
          <p className="text-body-md text-on-surface-variant">{dictionary.empty}</p>
        ) : (
          <>
            <div className="flex gap-2">
              <div aria-hidden="true" className="flex flex-col justify-between py-0.5 text-right font-hud text-label-hud font-black text-outline tabular-nums">
                <span>{number.format(maxWpm)}</span>
                <span>{number.format(maxWpm / 2)}</span>
                <span>0</span>
              </div>
              <div className="min-w-0 flex-1 bg-surface-container-lowest p-2">
                <svg
                  role="img"
                  aria-label={formatMessage(dictionary.label, { name: fastest.name, wpm: number.format(fastest.wpm) })}
                  viewBox={`0 0 ${width} ${height}`}
                  preserveAspectRatio="none"
                  className="h-48 w-full overflow-visible md:h-56"
                >
                  {[0.25, 0.5, 0.75].map((share) => (
                    <line
                      key={share}
                      x1="0"
                      x2={width}
                      y1={height * share}
                      y2={height * share}
                      strokeDasharray="2 6"
                      vectorEffect="non-scaling-stroke"
                      className="stroke-surface-container-highest"
                    />
                  ))}
                  {lines.map(({ racer, tone }) => {
                    const points = chartPoints(racer.samples, durationMs, maxWpm, width, height);
                    return (
                      points && (
                        <polyline
                          key={racer.id}
                          points={points}
                          fill="none"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                          className={lineClass[tone]}
                        />
                      )
                    );
                  })}
                </svg>
              </div>
            </div>
            <div aria-hidden="true" className="flex justify-between pt-1 pl-8 font-hud text-label-hud font-black uppercase text-outline">
              <span>{formatMessage(dictionary.seconds, { value: 0 })}</span>
              <span>{formatMessage(dictionary.seconds, { value: number.format(durationMs / 1000) })}</span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {legend.map(({ racer, tone }) => (
                <li key={racer.id} className="flex items-center gap-2 text-body-md text-on-surface-variant">
                  <span aria-hidden="true" className={`inline-block h-1 w-5 ${swatchClass[tone]}`} />
                  <span className={tone === "you" ? "font-hud font-black uppercase text-secondary" : ""}>
                    {tone === "you" ? `${racer.name} (${dictionary.you})` : racer.name}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
