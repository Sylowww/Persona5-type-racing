import type { PlayerProfile, ServerStatus } from "@/types/player";

// Placeholder data until accounts, stats and live rankings exist server-side.

export const mockServerStatus: ServerStatus = {
  name: "METAVERSE-07",
  onlineCount: 2410,
};

export const mockPlayer: PlayerProfile = {
  name: "JOKER_KEY",
  level: 48,
  rank: "S",
  syndicate: "PHANTOM THIEVES",
  dossierId: "048",
  recordWpm: 142,
  topPercent: 1.4,
  accuracy: 98.4,
  winStreak: 5,
  radarSync: 99,
  radar: [
    { axis: "burst", value: 0.89 },
    { axis: "accuracy", value: 0.86 },
    { axis: "stamina", value: 0.7 },
    { axis: "streak", value: 0.83 },
    { axis: "rhythm", value: 0.84 },
    { axis: "recovery", value: 0.72 },
  ],
};

export const mockLobbySlots = { min: 2, max: 8 } as const;
export const mockBlitzBet = 150;
