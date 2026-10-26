import { describe, expect, it } from "vitest";
import { CONFIDANT_MAX_RANK, CONFIDANT_RANK_RACES, confidantRank, rankUpAfterRace } from "../../src/lib/confidants";

describe("confidantRank", () => {
  it("starts at rank 0 and reaches rank 1 after the first race", () => {
    expect(confidantRank(0)).toEqual({ rank: 0, racesToNext: 1 });
    expect(confidantRank(1)).toEqual({ rank: 1, racesToNext: 1 });
    expect(confidantRank(3)).toEqual({ rank: 2, racesToNext: 1 });
    expect(confidantRank(4)).toEqual({ rank: 3, racesToNext: 3 });
  });

  it("stops at the max rank", () => {
    const last = CONFIDANT_RANK_RACES[CONFIDANT_MAX_RANK - 1];
    expect(confidantRank(last)).toEqual({ rank: CONFIDANT_MAX_RANK, racesToNext: null });
    expect(confidantRank(last + 50)).toEqual({ rank: CONFIDANT_MAX_RANK, racesToNext: null });
  });
});

describe("rankUpAfterRace", () => {
  it("returns the new rank only when the race crosses a threshold", () => {
    expect(rankUpAfterRace(0)).toBe(1);
    expect(rankUpAfterRace(1)).toBe(2);
    expect(rankUpAfterRace(2)).toBeNull();
    expect(rankUpAfterRace(3)).toBe(3);
    expect(rankUpAfterRace(CONFIDANT_RANK_RACES[CONFIDANT_MAX_RANK - 1])).toBeNull();
  });
});
