export type RadarAxis = "burst" | "accuracy" | "stamina" | "streak" | "rhythm" | "recovery";

export type PlayerProfile = {
  name: string;
  level: number;
  rank: string;
  syndicate: string;
  dossierId: string;
  recordWpm: number;
  topPercent: number;
  accuracy: number;
  winStreak: number;
  radarSync: number;
  /** Clockwise from the top; each value is a 0-1 ratio. */
  radar: readonly { axis: RadarAxis; value: number }[];
};

export type LeaderboardEntry = {
  position: number;
  name: string;
  title: string;
  wpm: number;
  isCurrentPlayer: boolean;
};

export type ServerStatus = {
  name: string;
  onlineCount: number;
};
