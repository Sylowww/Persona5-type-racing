import "server-only";
import { achievementStates, type AchievementState } from "@/lib/achievements";
import { getRaceFeats, getStatsByCharacter } from "@/lib/race-history-db";
import type { CharacterId } from "@/types/character";
import type { PlayerStats } from "@/types/race";

/** A registered player's compendium: their stats with each thief and their achievement cards. */
export async function loadCompendium(userId: string): Promise<{ stats: Partial<Record<CharacterId, PlayerStats>>; achievements: AchievementState[] }> {
  const [stats, feats] = await Promise.all([getStatsByCharacter(userId), getRaceFeats(userId)]);
  const racesByThief = Object.fromEntries(Object.entries(stats).map(([id, thief]) => [id, thief.races]));
  return { stats, achievements: achievementStates(feats, racesByThief) };
}
