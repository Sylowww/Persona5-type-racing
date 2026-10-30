import "server-only";
import { avg, count, countDistinct, desc, eq, max, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { raceResults, users } from "@/lib/db-schema";
import type { LeaderboardRow } from "@/types/leaderboard";
import { LEADERBOARD_PAGE_SIZE, LEADERBOARD_SIZE } from "./leaderboard";

/** Number of registered players with at least one saved race (capped at the leaderboard size). */
export async function countLeaderboard(): Promise<number> {
  const [row] = await getDb()
    .select({ total: countDistinct(raceResults.userId) })
    .from(raceResults)
    .innerJoin(users, eq(users.id, raceResults.userId))
    .where(eq(users.kind, "registered"));
  return Math.min(row?.total ?? 0, LEADERBOARD_SIZE);
}

/** One page of the leaderboard: registered players ranked by record WPM, then average WPM, then name. */
export async function getLeaderboardPage(page: number): Promise<LeaderboardRow[]> {
  const offset = (page - 1) * LEADERBOARD_PAGE_SIZE;
  if (offset >= LEADERBOARD_SIZE) return [];
  // Every grouped player has at least one race, so the record is never null.
  const bestWpm = max(raceResults.wpm).mapWith(Number);
  const averageWpm = avg(raceResults.wpm);
  const rows = await getDb()
    .select({
      userId: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bestWpm,
      averageWpm: averageWpm.mapWith(Number),
      accuracy: avg(raceResults.accuracy).mapWith(Number),
      races: count(),
    })
    .from(raceResults)
    .innerJoin(users, eq(users.id, raceResults.userId))
    .where(eq(users.kind, "registered"))
    .groupBy(users.id)
    .orderBy(desc(bestWpm), desc(averageWpm), sql`lower(${users.username})`)
    .limit(Math.min(LEADERBOARD_PAGE_SIZE, LEADERBOARD_SIZE - offset))
    .offset(offset);
  return rows.map((row, index) => ({ rank: offset + index + 1, ...row }));
}
