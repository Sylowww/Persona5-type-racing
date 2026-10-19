import type { BotDifficulty, LobbyVisibility } from "@/types/lobby";

export const lobbyVisibilities: readonly LobbyVisibility[] = ["public", "code", "private"];

/** Players per lobby (SALLE-05). Spectators do not count. */
export const MIN_LOBBY_CAPACITY = 2;
export const MAX_LOBBY_CAPACITY = 30;

type Readiness = { isReady: boolean };

/**
 * Target speed of each bot level (BOT-01), inside the assignment's ranges: Noob 10-20, Beginner 20-35, Intermediate
 * 35-60, Expert 70-100 and Impossible 140+ WPM. A bot varies by up to 8% around it from race to race.
 */
export const botTargetWpm: Record<BotDifficulty, number> = {
  noob: 15,
  novice: 28,
  rookie: 48,
  master: 85,
  godspeed: 150,
};

export function countReady(players: readonly Readiness[]): number {
  return players.filter((player) => player.isReady).length;
}

/** Number of free seats, never negative. */
export function openSlotCount(playerCount: number, capacity: number): number {
  return Math.max(0, capacity - playerCount);
}

/**
 * A race needs at least two racers, one of them human (COURSE-02), and every racer ready. Bots count as racers and are
 * always ready; pass racers only, not spectators.
 */
export function canStartRace(racers: readonly (Readiness & { bot: BotDifficulty | null })[]): boolean {
  return racers.length >= 2 && racers.some((racer) => racer.bot === null) && countReady(racers) === racers.length;
}

/** Filled and total segments of the ready meter; large lobbies are scaled down to `maxSegments`. */
export function readyMeter(ready: number, total: number, maxSegments: number): { filled: number; segments: number } {
  const segments = Math.min(total, maxSegments);
  if (total === 0) return { filled: 0, segments: 0 };
  return { filled: Math.round((ready / total) * segments), segments };
}
