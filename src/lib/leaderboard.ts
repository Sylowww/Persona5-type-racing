/** The leaderboard shows this many players at most. */
export const LEADERBOARD_SIZE = 100;
/** Players per leaderboard page. */
export const LEADERBOARD_PAGE_SIZE = 10;

/** Number of pages for `total` ranked players; at least 1 so an empty board still has a page. */
export function leaderboardPageCount(total: number): number {
  return Math.max(1, Math.ceil(Math.min(total, LEADERBOARD_SIZE) / LEADERBOARD_PAGE_SIZE));
}

/** The 1-based page asked for in the URL (`?page=`); anything invalid gives page 1, too high gives the last page. */
export function parseLeaderboardPage(value: string | string[] | undefined, pageCount: number): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = raw !== undefined && /^\d+$/.test(raw) ? Number(raw) : 1;
  return Math.min(Math.max(page, 1), pageCount);
}
