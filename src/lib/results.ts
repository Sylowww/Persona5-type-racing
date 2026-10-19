import type { KeyStat, RacerStatus, ResultRacer, SpeedSample } from "@/types/race";

const statusOrder: Record<RacerStatus, number> = { finished: 0, timeout: 1, eliminated: 2, forfeited: 3 };

/**
 * Final ranking (COURSE-10): finishers by time, then racers still typing at the end by progress, then sudden-death
 * eliminations (the last one knocked out first), then forfeits by progress when they gave up. Ties keep input order.
 */
export function rankRacers(racers: readonly ResultRacer[]): ResultRacer[] {
  return [...racers].sort((a, b) => {
    if (a.status !== b.status) return statusOrder[a.status] - statusOrder[b.status];
    if (a.status === "finished") return (a.finishMs ?? 0) - (b.finishMs ?? 0);
    if (a.status === "eliminated") return b.timeMs - a.timeMs;
    return b.progress - a.progress;
  });
}

export function peakSample(samples: readonly SpeedSample[]): SpeedSample | null {
  return samples.reduce<SpeedSample | null>((peak, sample) => (peak && peak.wpm >= sample.wpm ? peak : sample), null);
}

/** SVG polyline points for the samples in a `width` x `height` box; 0 WPM is at the bottom. */
export function chartPoints(
  samples: readonly SpeedSample[],
  durationMs: number,
  maxWpm: number,
  width: number,
  height: number,
): string {
  if (durationMs <= 0 || maxWpm <= 0) return "";
  return samples
    .map((sample) => {
      const x = (Math.min(sample.atMs, durationMs) / durationMs) * width;
      const y = height - (Math.min(sample.wpm, maxWpm) / maxWpm) * height;
      return `${round(x)},${round(y)}`;
    })
    .join(" ");
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export type KeyHeat = "fast" | "steady" | "slow" | "unused";

/** A key is slow when it was missed or took at least this long. */
export const slowKeyDelayMs = 250;
/** 100 ms per key is about 120 WPM (5 keys per word). */
export const fastKeyDelayMs = 100;

export function keyHeat(stat: KeyStat | undefined): KeyHeat {
  if (!stat) return "unused";
  if (stat.mistakes > 0 || stat.avgDelayMs >= slowKeyDelayMs) return "slow";
  return stat.avgDelayMs <= fastKeyDelayMs ? "fast" : "steady";
}

/** Slowest keys first; only keys that count as slow. */
export function slowestKeys(stats: readonly KeyStat[], limit: number): KeyStat[] {
  return stats
    .filter((stat) => keyHeat(stat) === "slow")
    .sort((a, b) => b.avgDelayMs - a.avgDelayMs)
    .slice(0, limit);
}
