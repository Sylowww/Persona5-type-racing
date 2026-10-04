import type { BotDifficulty, RaceSettings } from "@/types/lobby";
import { botTargetWpm } from "./lobby";
import { defaultRaceSettings } from "./race-settings";

/** A searching player races a bot once nobody else showed up for this long. */
export const QUICK_MATCH_BOT_DELAY_MS = 15_000;
/** A searching page checks in at least this often; a player who stopped checking in (page closed) leaves the queue. */
export const QUICK_MATCH_STALE_MS = 5_000;

/** Quick 1v1 races: 30 seconds, normal rules. */
export const quickMatchSettings: RaceSettings = { ...defaultRaceSettings, timeLimitSec: 30 };

/** The bot level closest to the player's average speed; rookie for players without races. */
export function botForSpeed(averageWpm: number | null): BotDifficulty {
  if (averageWpm === null || averageWpm <= 0) return "rookie";
  const levels = Object.entries(botTargetWpm) as [BotDifficulty, number][];
  return levels.reduce((best, level) => (Math.abs(level[1] - averageWpm) < Math.abs(best[1] - averageWpm) ? level : best))[0];
}
