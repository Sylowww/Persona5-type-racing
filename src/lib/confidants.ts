import type { CharacterId } from "@/types/character";

/**
 * Confidant ranks: every saved race raises the player's bond with the thief they raced as, as in Persona 5.
 * Only registered players' saved races count (training is never saved), so ranks are derived from the race history.
 */

/** Tarot arcana of each thief's confidant. Crow and Black Mask are the same person, so they share Justice. */
export type Arcana = "fool" | "magician" | "priestess" | "empress" | "emperor" | "lovers" | "chariot" | "justice" | "hermit" | "faith" | "star";

export const characterArcana: Record<CharacterId, Arcana> = {
  joker: "fool",
  mona: "magician",
  panther: "lovers",
  skull: "chariot",
  fox: "emperor",
  queen: "priestess",
  oracle: "hermit",
  noir: "empress",
  crow: "justice",
  violet: "faith",
  blackMask: "justice",
  sophia: "star",
};

/** Roman numeral printed on each arcana card; Faith has none. */
export const arcanaNumerals: Record<Arcana, string> = {
  fool: "0",
  magician: "I",
  priestess: "II",
  empress: "III",
  emperor: "IV",
  lovers: "VI",
  chariot: "VII",
  justice: "VIII",
  hermit: "IX",
  faith: "",
  star: "XVII",
};

/** Saved races needed to reach each rank: rank 1 after the first race, each next rank takes one more race than the last. */
export const CONFIDANT_RANK_RACES = [1, 2, 4, 7, 11, 16, 22, 29, 37, 46] as const;
export const CONFIDANT_MAX_RANK = CONFIDANT_RANK_RACES.length;

export type ConfidantRank = {
  /** 0 before the first race, up to CONFIDANT_MAX_RANK. */
  rank: number;
  /** Races left before the next rank; null at the max rank. */
  racesToNext: number | null;
};

/** The confidant rank reached after `races` saved races with one thief. */
export function confidantRank(races: number): ConfidantRank {
  const rank = CONFIDANT_RANK_RACES.filter((needed) => races >= needed).length;
  const next = CONFIDANT_RANK_RACES[rank];
  return { rank, racesToNext: next === undefined ? null : next - races };
}

/** The new rank if one more race ranked the bond up, else null. */
export function rankUpAfterRace(racesBefore: number): number | null {
  const before = confidantRank(racesBefore).rank;
  const after = confidantRank(racesBefore + 1).rank;
  return after > before ? after : null;
}

export type CompendiumProgress = {
  /** Thieves with at least rank 1 (their card is face up). */
  unlocked: number;
  /** Thieves at the max rank. */
  maxed: number;
  total: number;
};

/** How much of the compendium the player filled, from their saved races per thief. */
export function compendiumProgress(races: Partial<Record<CharacterId, number>>, ids: readonly CharacterId[]): CompendiumProgress {
  const ranks = ids.map((id) => confidantRank(races[id] ?? 0).rank);
  return {
    unlocked: ranks.filter((rank) => rank > 0).length,
    maxed: ranks.filter((rank) => rank === CONFIDANT_MAX_RANK).length,
    total: ids.length,
  };
}
