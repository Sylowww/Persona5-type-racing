import "server-only";
import { and, avg, count, desc, eq, inArray, lt, max, sql } from "drizzle-orm";
import { isCharacterId } from "@/lib/characters";
import { getDb } from "@/lib/db";
import { raceResults, users } from "@/lib/db-schema";
import { recordFromResult } from "@/lib/race-history";
import type { CharacterId } from "@/types/character";
import type { PlayerStats, RaceRecord, RaceResult, SavedRaceRecord } from "@/types/race";

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
        result,
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
      wins: sql<number>`count(*) filter (where ${raceResults.place} = 1)`.mapWith(Number),
      bestWpm: max(raceResults.wpm),
      averageWpm: avg(raceResults.wpm).mapWith(Number),
      accuracy: avg(raceResults.accuracy).mapWith(Number),
    })
    .from(raceResults)
    .where(eq(raceResults.userId, userId));
  return {
    races: row?.races ?? 0,
    wins: row?.wins ?? 0,
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

/** One page of the player's history, newest first (HIST-01), with the total number of saved races. */
export async function getRacePage(userId: string, page: number, pageSize: number): Promise<{ races: SavedRaceRecord[]; total: number }> {
  const db = getDb();
  const [rows, [totals]] = await Promise.all([
    db
      .select({
        id: raceResults.id,
        hasResult: sql<boolean>`${raceResults.result} is not null`,
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
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(raceResults).where(eq(raceResults.userId, userId)),
  ]);
  return {
    races: rows.map(({ id, hasResult, endedAt, ...row }) => ({ ...row, id: hasResult ? id : null, endedAt: endedAt.getTime() })),
    total: totals?.total ?? 0,
  };
}

/** WPM of the player's last `limit` races, oldest first, for the progress chart (AUTH-06). */
export async function getWpmProgress(userId: string, limit: number): Promise<{ endedAt: number; wpm: number }[]> {
  const rows = await getDb()
    .select({ endedAt: raceResults.endedAt, wpm: raceResults.wpm })
    .from(raceResults)
    .where(eq(raceResults.userId, userId))
    .orderBy(desc(raceResults.endedAt))
    .limit(limit);
  return rows.map((row) => ({ endedAt: row.endedAt.getTime(), wpm: row.wpm })).reverse();
}

/** The full results of one of the player's saved races; null if it is not theirs or has no saved details. */
export async function getSavedResult(userId: string, raceId: string): Promise<RaceResult | null> {
  const [row] = await getDb()
    .select({ result: raceResults.result })
    .from(raceResults)
    .where(and(eq(raceResults.id, raceId), eq(raceResults.userId, userId)));
  return row?.result ?? null;
}

/** The player's best WPM over the races that ended before `endedAt`; null if they had none (RES-04). */
export async function getBestWpmBefore(userId: string, endedAt: number): Promise<number | null> {
  const [row] = await getDb()
    .select({ best: max(raceResults.wpm) })
    .from(raceResults)
    .where(and(eq(raceResults.userId, userId), lt(raceResults.endedAt, new Date(endedAt))));
  return row?.best ?? null;
}

/**
 * How many saved races the player ran as each thief (their confidant bonds, see lib/confidants.ts), counting only the
 * races that ended before `before` when given. The thief is read from the saved results, so races saved before
 * results were stored do not count.
 */
export async function getRacesByCharacter(userId: string, before?: number): Promise<Partial<Record<CharacterId, number>>> {
  const character = sql<string | null>`jsonb_path_query_first(${raceResults.result}, '$.racers[*] ? (@.id == $id).character', jsonb_build_object('id', ${raceResults.userId}::text)) #>> '{}'`;
  const rows = await getDb()
    .select({ character, races: count() })
    .from(raceResults)
    .where(and(eq(raceResults.userId, userId), before === undefined ? undefined : lt(raceResults.endedAt, new Date(before))))
    .groupBy(character);
  const races: Partial<Record<CharacterId, number>> = {};
  for (const row of rows) if (isCharacterId(row.character)) races[row.character] = row.races;
  return races;
}
