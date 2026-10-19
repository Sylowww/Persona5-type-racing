import "server-only";
import { and, avg, count, desc, eq, inArray, max } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { raceResults, users } from "@/lib/db-schema";
import { recordFromResult } from "@/lib/race-history";
import type { PlayerStats, RaceRecord, RaceResult } from "@/types/race";

/**
 * Saves each racer's result. Only registered players are stored: guests are skipped.
 * Saving the same race twice is ignored.
 */
export async function saveRaceResults(lobbyCode: string, results: readonly RaceResult[]): Promise<void> {
  const rows = results.flatMap((result) => {
    const record = recordFromResult(result);
    if (!record) return [];
    return [
      {
        userId: result.youId,
        lobbyCode,
        endedAt: new Date(record.endedAt),
        place: record.place,
        racerCount: record.racerCount,
        wpm: record.wpm,
        accuracy: record.accuracy,
        finishMs: record.finishMs === null ? null : Math.round(record.finishMs),
        durationMs: Math.round(result.durationMs),
        keystrokes: result.keystrokes,
        mistakes: result.mistakes,
      },
    ];
  });
  if (rows.length === 0) return;

  const db = getDb();
  const registered = await db
    .select({ id: users.id })
    .from(users)
    .where(and(inArray(users.id, rows.map((row) => row.userId)), eq(users.kind, "registered")));
  const registeredIds = new Set(registered.map((user) => user.id));
  const toSave = rows.filter((row) => registeredIds.has(row.userId));
  if (toSave.length === 0) return;

  await db.insert(raceResults).values(toSave).onConflictDoNothing();
}

/** The player's stats over every saved race. */
export async function getPlayerStats(userId: string): Promise<PlayerStats> {
  const [row] = await getDb()
    .select({
      races: count(),
      bestWpm: max(raceResults.wpm),
      averageWpm: avg(raceResults.wpm).mapWith(Number),
      accuracy: avg(raceResults.accuracy).mapWith(Number),
    })
    .from(raceResults)
    .where(eq(raceResults.userId, userId));
  return {
    races: row?.races ?? 0,
    bestWpm: row?.bestWpm ?? 0,
    averageWpm: row?.averageWpm ?? 0,
    accuracy: row?.accuracy ?? 0,
  };
}

/** The player's most recent races, newest first. */
export async function getRecentRaces(userId: string, limit: number): Promise<RaceRecord[]> {
  const rows = await getDb()
    .select({
      endedAt: raceResults.endedAt,
      place: raceResults.place,
      racerCount: raceResults.racerCount,
      wpm: raceResults.wpm,
      accuracy: raceResults.accuracy,
      finishMs: raceResults.finishMs,
    })
    .from(raceResults)
    .where(eq(raceResults.userId, userId))
    .orderBy(desc(raceResults.endedAt))
    .limit(limit);
  return rows.map((row) => ({ ...row, endedAt: row.endedAt.getTime() }));
}
