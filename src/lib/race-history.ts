import type { PlayerStats, RaceRecord, RaceResult } from "@/types/race";
import { rankRacers } from "./results";

/** How many races a guest keeps in their browser tab. */
export const guestHistoryLimit = 50;

/** The racer's own history entry for a finished race; null if they were not in it. */
export function recordFromResult(result: RaceResult): RaceRecord | null {
  const ranked = rankRacers(result.racers);
  const index = ranked.findIndex((racer) => racer.id === result.youId);
  const you = ranked[index];
  if (!you) return null;
  return {
    endedAt: result.endedAt,
    place: index + 1,
    racerCount: ranked.length,
    wpm: you.wpm,
    accuracy: you.accuracy,
    finishMs: you.finishMs,
  };
}

export function summarizeRaces(records: readonly RaceRecord[]): PlayerStats {
  if (records.length === 0) return { races: 0, wins: 0, bestWpm: 0, averageWpm: 0, accuracy: 0 };
  const total = (pick: (record: RaceRecord) => number) => records.reduce((sum, record) => sum + pick(record), 0);
  return {
    races: records.length,
    wins: records.filter((record) => record.place === 1).length,
    bestWpm: Math.max(...records.map((record) => record.wpm)),
    averageWpm: total((record) => record.wpm) / records.length,
    accuracy: total((record) => record.accuracy) / records.length,
  };
}

/** Newest first, without duplicates of the same race, capped at `limit`. */
export function addRaceRecord(records: readonly RaceRecord[], record: RaceRecord, limit = guestHistoryLimit): RaceRecord[] {
  if (records.some((existing) => existing.endedAt === record.endedAt)) return [...records];
  return [record, ...records].sort((a, b) => b.endedAt - a.endedAt).slice(0, limit);
}

/** Reads a stored guest history; anything malformed is dropped. */
export function parseRaceRecords(raw: string | null): RaceRecord[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  return Array.isArray(value) ? value.filter(isRaceRecord) : [];
}

function isRaceRecord(value: unknown): value is RaceRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const isNumber = (key: string) => typeof record[key] === "number" && Number.isFinite(record[key]);
  return (
    ["endedAt", "place", "racerCount", "wpm", "accuracy"].every(isNumber) &&
    (record.finishMs === null || isNumber("finishMs"))
  );
}

/**
 * SVG polyline points for the WPM of successive races (AUTH-06), spread evenly across `width`; 0 WPM is at the bottom.
 * A single race is drawn as a flat line.
 */
export function progressPoints(wpms: readonly number[], maxWpm: number, width: number, height: number): string {
  if (wpms.length === 0 || maxWpm <= 0) return "";
  const values = wpms.length === 1 ? [wpms[0] ?? 0, wpms[0] ?? 0] : wpms;
  return values
    .map((wpm, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (Math.min(wpm, maxWpm) / maxWpm) * height;
      return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
    })
    .join(" ");
}

/** A new personal best (RES-04): faster than every earlier saved race. The first race sets no record to beat. */
export function isPersonalBest(wpm: number, previousBest: number | null): boolean {
  return previousBest !== null && wpm > previousBest;
}
