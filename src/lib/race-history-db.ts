import "server-only";
import { getPool } from "@/lib/db";
import { recordFromResult } from "@/lib/race-history";
import type { PlayerStats, RaceRecord, RaceResult } from "@/types/race";

/**
 * Saves each racer's result. Only registered players are stored: guests are skipped
 * by the query. Saving the same race twice is ignored.
 */
export async function saveRaceResults(lobbyCode: string, results: readonly RaceResult[]): Promise<void> {
  await Promise.all(
    results.map((result) => {
      const record = recordFromResult(result);
      if (!record) return null;
      return getPool().query(
        `INSERT INTO race_results
           (user_id, lobby_code, ended_at, place, racer_count, wpm, accuracy, finish_ms, duration_ms, keystrokes, mistakes)
         SELECT id, $2, to_timestamp($3 / 1000.0), $4, $5, $6, $7, $8, $9, $10, $11
         FROM users WHERE id = $1 AND kind = 'registered'
         ON CONFLICT (user_id, lobby_code, ended_at) DO NOTHING`,
        [
          result.youId,
          lobbyCode,
          record.endedAt,
          record.place,
          record.racerCount,
          record.wpm,
          record.accuracy,
          record.finishMs === null ? null : Math.round(record.finishMs),
          Math.round(result.durationMs),
          result.keystrokes,
          result.mistakes,
        ],
      );
    }),
  );
}

type RecordRow = {
  ended_at: Date;
  place: number;
  racer_count: number;
  wpm: number;
  accuracy: number;
  finish_ms: number | null;
};

type StatsRow = { races: number; best_wpm: number | null; average_wpm: number | null; accuracy: number | null };

/** The player's stats over every saved race. */
export async function getPlayerStats(userId: string): Promise<PlayerStats> {
  const { rows } = await getPool().query<StatsRow>(
    `SELECT count(*)::int AS races, max(wpm) AS best_wpm, avg(wpm) AS average_wpm, avg(accuracy) AS accuracy
     FROM race_results WHERE user_id = $1`,
    [userId],
  );
  const row = rows[0];
  return {
    races: row?.races ?? 0,
    bestWpm: row?.best_wpm ?? 0,
    averageWpm: row?.average_wpm ?? 0,
    accuracy: row?.accuracy ?? 0,
  };
}

/** The player's most recent races, newest first. */
export async function getRecentRaces(userId: string, limit: number): Promise<RaceRecord[]> {
  const { rows } = await getPool().query<RecordRow>(
    `SELECT ended_at, place, racer_count, wpm, accuracy, finish_ms
     FROM race_results WHERE user_id = $1 ORDER BY ended_at DESC LIMIT $2`,
    [userId, limit],
  );
  return rows.map((row) => ({
    endedAt: row.ended_at.getTime(),
    place: row.place,
    racerCount: row.racer_count,
    wpm: row.wpm,
    accuracy: row.accuracy,
    finishMs: row.finish_ms,
  }));
}
