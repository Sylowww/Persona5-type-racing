import { describe, expect, it } from "vitest";
import { achievementStates, type RaceFeats } from "../../src/lib/achievements";
import { CONFIDANT_RANK_RACES, CONFIDANT_MAX_RANK } from "../../src/lib/confidants";

const none: RaceFeats = { races: 0, perfectRaces: 0, bestFinishedWpm: 0, duelWins: 0, bigWins: 0, fastBotsBeaten: 0 };
const byId = (feats: RaceFeats, races = {}) => Object.fromEntries(achievementStates(feats, races).map((state) => [state.id, state]));

describe("achievementStates", () => {
  it("starts with every card locked", () => {
    expect(achievementStates(none, {}).every((state) => !state.unlocked && state.current === 0)).toBe(true);
  });

  it("unlocks feats once their target is reached and caps the progress", () => {
    const states = byId({ ...none, races: 60, perfectRaces: 2, bestFinishedWpm: 87.6, duelWins: 1 });
    expect(states.perfect).toMatchObject({ unlocked: true, current: 1, target: 1 });
    expect(states.century).toMatchObject({ unlocked: false, current: 87, target: 100 });
    expect(states.duelist.unlocked).toBe(true);
    expect(states.marathon).toMatchObject({ unlocked: true, current: 50 });
    expect(states.lightning.unlocked).toBe(false);
  });

  it("counts thieves raced and max bonds from the races per thief", () => {
    const max = CONFIDANT_RANK_RACES[CONFIDANT_MAX_RANK - 1];
    const states = byId(none, { joker: max, mona: 1 });
    expect(states.allMasks).toMatchObject({ unlocked: false, current: 2, target: 12 });
    expect(states.unbreakable.unlocked).toBe(true);
  });
});
