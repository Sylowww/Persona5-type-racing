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
  if (records.length === 0) return { races: 0, bestWpm: 0, averageWpm: 0, accuracy: 0 };
  const total = (pick: (record: RaceRecord) => number) => records.reduce((sum, record) => sum + pick(record), 0);
  return {
    races: records.length,
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
