import type { ServerStatus } from "@/types/player";

// Placeholder data until accounts, stats and live rankings exist server-side.

export const mockServerStatus: ServerStatus = {
  name: "METAVERSE-07",
  onlineCount: 2410,
};

export const mockLobbySlots = { min: 2, max: 8 } as const;
export const mockBlitzBet = 150;
