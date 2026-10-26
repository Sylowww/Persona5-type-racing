import { characterIds } from "./characters";
import { CONFIDANT_MAX_RANK, confidantRank } from "./confidants";
import type { CharacterId } from "@/types/character";

/**
 * Achievement cards in the compendium, earned by feats in saved races. They are derived from the race history (never
 * stored), so they also count races run before they existed. Which feats exist and their thresholds are first guesses.
 */

/** A bot this fast or faster, outpaced in a race, earns the Lightning card. Matches the Lightning bot (150 WPM ± form). */
export const LIGHTNING_BOT_WPM = 120;
/** Racers needed in a won race for the Big heist card. */
export const BIG_HEIST_RACERS = 4;

/** What the saved races say, as counted in the database (see `getRaceFeats`). */
export type RaceFeats = {
  races: number;
  /** Finished races with 100% accuracy. */
  perfectRaces: number;
  /** Best WPM over finished races, 0 when none. */
  bestFinishedWpm: number;
  /** Races won against exactly one other player and no bot. */
  duelWins: number;
  /** Races won with at least BIG_HEIST_RACERS racers. */
  bigWins: number;
  /** Races where the player was faster than a bot at LIGHTNING_BOT_WPM or more. */
  fastBotsBeaten: number;
};

export const achievementIds = ["perfect", "century", "duelist", "bigHeist", "lightning", "marathon", "allMasks", "unbreakable"] as const;
export type AchievementId = (typeof achievementIds)[number];

type Facts = RaceFeats & { thievesRaced: number; maxBonds: number };

const rules: Record<AchievementId, { target: number; progress: (facts: Facts) => number }> = {
  perfect: { target: 1, progress: (facts) => facts.perfectRaces },
  century: { target: 100, progress: (facts) => facts.bestFinishedWpm },
  duelist: { target: 1, progress: (facts) => facts.duelWins },
  bigHeist: { target: 1, progress: (facts) => facts.bigWins },
  lightning: { target: 1, progress: (facts) => facts.fastBotsBeaten },
  marathon: { target: 50, progress: (facts) => facts.races },
  allMasks: { target: characterIds.length, progress: (facts) => facts.thievesRaced },
  unbreakable: { target: 1, progress: (facts) => facts.maxBonds },
};

export type AchievementState = {
  id: AchievementId;
  unlocked: boolean;
  /** Progress toward `target`, rounded down and capped at it. */
  current: number;
  target: number;
};

/** Every achievement card's state, from the race feats and the saved races per thief (confidant bonds). */
export function achievementStates(feats: RaceFeats, racesByThief: Partial<Record<CharacterId, number>>): AchievementState[] {
  const ranks = characterIds.map((id) => confidantRank(racesByThief[id] ?? 0).rank);
  const facts: Facts = {
    ...feats,
    thievesRaced: ranks.filter((rank) => rank > 0).length,
    maxBonds: ranks.filter((rank) => rank === CONFIDANT_MAX_RANK).length,
  };
  return achievementIds.map((id) => {
    const { target, progress } = rules[id];
    const current = Math.min(Math.floor(progress(facts)), target);
    return { id, unlocked: current >= target, current, target };
  });
}
