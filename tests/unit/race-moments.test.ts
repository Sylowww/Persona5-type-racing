import { describe, expect, it } from "vitest";
import {
  COMMENT_COOLDOWN_MS,
  STREAK_STEP,
  countdownIntro,
  detectMoments,
  exitGlow,
  overtakers,
  pickComment,
  recentMistakes,
  type MomentSnapshot,
} from "../../src/lib/race-moments";

const base: MomentSnapshot = { place: 2, streak: 0, progress: 0.3, finished: false, chaos: false, recentMistakes: 0 };

describe("detectMoments", () => {
  it("spots places won and lost", () => {
    expect(detectMoments(base, { ...base, place: 1 })).toEqual(["overtook"]);
    expect(detectMoments(base, { ...base, place: 3 })).toEqual(["overtaken"]);
  });

  it("spots the chaos, the final stretch, fumbles and streaks", () => {
    expect(detectMoments(base, { ...base, chaos: true })).toEqual(["chaos"]);
    expect(detectMoments({ ...base, progress: 0.89 }, { ...base, progress: 0.91 })).toEqual(["finalStretch"]);
    expect(detectMoments({ ...base, recentMistakes: 2 }, { ...base, recentMistakes: 3 })).toEqual(["fumble"]);
    expect(detectMoments({ ...base, streak: STREAK_STEP - 1 }, { ...base, streak: STREAK_STEP })).toEqual(["streak"]);
    expect(detectMoments({ ...base, streak: STREAK_STEP }, { ...base, streak: STREAK_STEP + 1 })).toEqual([]);
  });

  it("only reports the finish once the player is done", () => {
    expect(detectMoments(base, { ...base, finished: true, place: 1, chaos: true })).toEqual(["finished"]);
    expect(detectMoments({ ...base, finished: true }, { ...base, finished: true, place: 3 })).toEqual([]);
  });
});

describe("pickComment", () => {
  it("picks the most important moment", () => {
    expect(pickComment(["streak", "overtaken", "overtook"], null, 0)).toBe("overtaken");
    expect(pickComment([], null, 0)).toBeNull();
  });

  it("waits for the cooldown, except for urgent moments", () => {
    expect(pickComment(["overtook"], 1000, 1000 + COMMENT_COOLDOWN_MS - 1)).toBeNull();
    expect(pickComment(["overtook"], 1000, 1000 + COMMENT_COOLDOWN_MS)).toBe("overtook");
    expect(pickComment(["chaos"], 1000, 1100)).toBe("chaos");
  });
});

describe("recentMistakes", () => {
  it("keeps the mistakes of the last two seconds", () => {
    expect(recentMistakes([0, 1500], 2500, true)).toEqual([1500, 2500]);
    expect(recentMistakes([0, 1500], 2500)).toEqual([1500]);
  });
});

describe("overtakers", () => {
  it("lists racers who just passed the player", () => {
    const previous = new Map([
      ["you", 0.5],
      ["a", 0.45],
      ["b", 0.7],
      ["c", 0.5],
    ]);
    const racers = [
      { id: "you", progress: 0.52 },
      { id: "a", progress: 0.6 },
      { id: "b", progress: 0.8 },
      { id: "c", progress: 0.51 },
    ];
    expect(overtakers(previous, racers, "you")).toEqual(["a"]);
    expect(overtakers(new Map(), racers, "you")).toEqual([]);
  });
});

describe("presentation helpers", () => {
  it("makes the exit glow grow toward the finish", () => {
    expect(exitGlow(0)).toBe(0);
    expect(exitGlow(0.5)).toBeLessThan(0.5);
    expect(exitGlow(2)).toBe(1);
  });

  it("fits the countdown intro into the time left", () => {
    expect(countdownIntro(3000)).toEqual({ card: true, mona: true });
    expect(countdownIntro(2000)).toEqual({ card: false, mona: true });
    expect(countdownIntro(1000)).toEqual({ card: false, mona: false });
  });
});
