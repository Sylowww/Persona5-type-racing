import "server-only";
import { getPool } from "@/lib/db";
import type { LeaderboardRow } from "@/types/leaderboard";
import { LEADERBOARD_PAGE_SIZE, LEADERBOARD_SIZE } from "./leaderboard";

type Row = { user_id: string; username: string; best_wpm: number; average_wpm: number; accuracy: number; races: number };

/** Number of registered players with at least one saved race (capped at the leaderboard size). */
export async function countLeaderboard(): Promise<number> {
  const { rows } = await getPool().query<{ total: number }>(
    `SELECT count(DISTINCT r.user_id)::int AS total
     FROM race_results r JOIN users u ON u.id = r.user_id
     WHERE u.kind = 'registered'`,
  );
  return Math.min(rows[0]?.total ?? 0, LEADERBOARD_SIZE);
}

/** One page of the leaderboard: registered players ranked by record WPM, then average WPM, then name. */
export async function getLeaderboardPage(page: number): Promise<LeaderboardRow[]> {
  const offset = (page - 1) * LEADERBOARD_PAGE_SIZE;
  if (offset >= LEADERBOARD_SIZE) return [];
  const { rows } = await getPool().query<Row>(
    `SELECT u.id AS user_id, u.username, max(r.wpm) AS best_wpm, avg(r.wpm) AS average_wpm,
            avg(r.accuracy) AS accuracy, count(*)::int AS races
     FROM race_results r JOIN users u ON u.id = r.user_id
     WHERE u.kind = 'registered'
     GROUP BY u.id
     ORDER BY best_wpm DESC, average_wpm DESC, lower(u.username)
     LIMIT $1 OFFSET $2`,
    [Math.min(LEADERBOARD_PAGE_SIZE, LEADERBOARD_SIZE - offset), offset],
  );
  return rows.map((row, index) => ({
    rank: offset + index + 1,
    userId: row.user_id,
    username: row.username,
    bestWpm: row.best_wpm,
    averageWpm: row.average_wpm,
    accuracy: row.accuracy,
    races: row.races,
  }));
}
