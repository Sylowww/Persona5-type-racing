import type { BotDifficulty, LobbyPlayer } from "@/types/lobby";

/** Target speed of each bot level; bots will vary around it once they exist. */
export const botTargetWpm: Record<BotDifficulty, number> = {
  rookie: 60,
  master: 120,
  godspeed: 150,
};

export function countReady(players: readonly LobbyPlayer[]): number {
  return players.filter((player) => player.isReady).length;
}

/** Number of free seats, never negative. */
export function openSlotCount(playerCount: number, capacity: number): number {
  return Math.max(0, capacity - playerCount);
}

/** A race needs at least two players and everyone ready. */
export function canStartRace(players: readonly LobbyPlayer[]): boolean {
  return players.length >= 2 && countReady(players) === players.length;
}
