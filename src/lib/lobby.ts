import type { Locale } from "@/i18n/locales";
import type { BotDifficulty, LobbySettings } from "@/types/lobby";

type Readiness = { isReady: boolean };

/** Target speed of each bot level; bots will vary around it once they exist. */
export const botTargetWpm: Record<BotDifficulty, number> = {
  rookie: 60,
  master: 120,
  godspeed: 150,
};

export function countReady(players: readonly Readiness[]): number {
  return players.filter((player) => player.isReady).length;
}

/** Number of free seats, never negative. */
export function openSlotCount(playerCount: number, capacity: number): number {
  return Math.max(0, capacity - playerCount);
}

/** A race needs at least two players and everyone ready. */
export function canStartRace(players: readonly Readiness[]): boolean {
  return players.length >= 2 && countReady(players) === players.length;
}

/** Filled and total segments of the ready meter; large lobbies are scaled down to `maxSegments`. */
export function readyMeter(ready: number, total: number, maxSegments: number): { filled: number; segments: number } {
  const segments = Math.min(total, maxSegments);
  if (total === 0) return { filled: 0, segments: 0 };
  return { filled: Math.round((ready / total) * segments), segments };
}

/** The rules every race uses until race settings exist: built-in texts with punctuation, compared exactly. */
export function currentRaceSettings(locale: Locale): LobbySettings {
  return { mode: null, language: locale.toUpperCase(), punctuation: true, numbers: false, caseSensitive: true };
}
