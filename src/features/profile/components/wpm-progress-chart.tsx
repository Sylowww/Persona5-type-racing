import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import { progressPoints } from "@/lib/race-history";
import { chartCeiling } from "@/lib/results";

type WpmProgressChartProps = {
  dictionary: Dictionary["profile"]["stats"];
  locale: Locale;
  /** Oldest first. */
  races: readonly { endedAt: number; wpm: number }[];
};

const width = 400;
const height = 100;

/** WPM of the player's recent races, oldest to newest (AUTH-06). */
export function WpmProgressChart({ dictionary, locale, races }: WpmProgressChartProps) {
  const first = races[0];
  const last = races.at(-1);
  if (!first || !last) return null;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const wpms = races.map((race) => race.wpm);
  const maxWpm = chartCeiling(Math.max(...wpms));
  const points = progressPoints(wpms, maxWpm, width, height);

  return (
    <div className="flex flex-col gap-2 bg-surface-container-lowest p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-hud text-label-hud font-black uppercase tracking-widest text-secondary">{dictionary.progress}</h3>
        <span className="bg-primary-container px-2 py-0.5 font-hud text-[11px] font-black uppercase text-on-primary-container">
          {formatMessage(dictionary.progressRange, { count: races.length })}
        </span>
      </div>
      <div className="flex gap-2">
        <div aria-hidden="true" className="flex flex-col justify-between text-right font-hud text-[11px] font-black text-outline tabular-nums">
          <span>{number.format(maxWpm)}</span>
          <span>0</span>
        </div>
        <svg
          role="img"
          aria-label={formatMessage(dictionary.progressLabel, {
            count: races.length,
            first: number.format(first.wpm),
            last: number.format(last.wpm),
          })}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-28 min-w-0 flex-1 overflow-visible"
        >
          <line x1="0" x2={width} y1={height / 2} y2={height / 2} strokeDasharray="2 6" vectorEffect="non-scaling-stroke" className="stroke-surface-container-highest" />
          <polygon points={`0,${height} ${points} ${width},${height}`} className="fill-primary-container/20" />
          <polyline
            points={points}
            fill="none"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="stroke-primary-container"
          />
        </svg>
      </div>
      <div aria-hidden="true" className="flex justify-between pl-6 font-hud text-[11px] font-black uppercase text-outline">
        <span>{date.format(first.endedAt)}</span>
        <span>{date.format(last.endedAt)}</span>
      </div>
    </div>
  );
}
