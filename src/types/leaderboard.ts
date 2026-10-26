/** One registered player on the global leaderboard. */
export type LeaderboardRow = {
  /** 1-based rank. */
  rank: number;
  userId: string;
  username: string;
  /** Uploaded or provider picture, or null for the placeholder. */
  avatarUrl: string | null;
  bestWpm: number;
  averageWpm: number;
  /** Average accuracy, from 0 to 1. */
  accuracy: number;
  races: number;
};
