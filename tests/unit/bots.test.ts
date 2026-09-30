import { describe, expect, it } from "vitest";
import { isBotDifficulty, planBotRun, wrongKeyFor } from "../../src/lib/bots";
import { botTargetWpm } from "../../src/lib/lobby";
import { raceTexts } from "../../src/lib/race-texts";
import { correctPrefixLength, deleteChar, initialTypingState, typeChar, wordsPerMinute } from "../../src/lib/typing";
import type { BotDifficulty } from "../../src/types/lobby";

/** Small seeded generator so plans are reproducible. */
function seeded(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const TEXT = raceTexts.en[0];

/** Replays a plan with the shared typing rules. */
function replay(text: string, difficulty: BotDifficulty, seed: number) {
  const steps = planBotRun(text, difficulty, seeded(seed));
  let typing = initialTypingState;
  for (const { atMs, event } of steps) {
    typing = event.type === "delete" ? deleteChar(typing) : typeChar(typing, text, event.char, atMs);
  }
  return { steps, typing };
}

describe("planBotRun", () => {
  it("always ends with the whole text typed correctly", () => {
    for (const difficulty of ["rookie", "master", "godspeed"] as const) {
      for (let seed = 1; seed <= 20; seed++) {
        const { typing } = replay(TEXT, difficulty, seed);
        expect(typing.typed).toBe(TEXT);
        expect(typing.finishedAt).not.toBeNull();
      }
    }
  });

  it("finishes close to the difficulty's target speed", () => {
    for (const difficulty of ["rookie", "master", "godspeed"] as const) {
      for (let seed = 1; seed <= 20; seed++) {
        const { typing } = replay(TEXT, difficulty, seed);
        const wpm = wordsPerMinute(correctPrefixLength(TEXT, typing.typed), typing.finishedAt ?? 0);
        expect(wpm).toBeGreaterThan(botTargetWpm[difficulty] * 0.85);
        expect(wpm).toBeLessThan(botTargetWpm[difficulty] * 1.1);
      }
    }
  });

  it("makes mistakes and fixes them, more often on easier levels", () => {
    const mistakes = (difficulty: BotDifficulty) =>
      Array.from({ length: 30 }, (_, seed) => replay(TEXT, difficulty, seed + 1).typing.mistakes).reduce((sum, count) => sum + count, 0);
    const rookie = mistakes("rookie");
    const godspeed = mistakes("godspeed");
    expect(godspeed).toBeGreaterThan(0);
    expect(rookie).toBeGreaterThan(godspeed);
  });

  it("types with an uneven rhythm and keystrokes in time order", () => {
    const { steps } = replay(TEXT, "master", 3);
    const gaps = steps.slice(1).map((step, index) => step.atMs - steps[index].atMs);
    expect(gaps.every((gap) => gap >= 0)).toBe(true);
    expect(new Set(gaps).size).toBeGreaterThan(10);
    expect(steps[0].atMs).toBeGreaterThan(0);
  });

  it("returns the same plan for the same random sequence", () => {
    expect(planBotRun(TEXT, "rookie", seeded(7))).toEqual(planBotRun(TEXT, "rookie", seeded(7)));
    expect(planBotRun("", "rookie", seeded(7))).toEqual([]);
  });
});

describe("wrongKeyFor", () => {
  it("hits a neighboring key and keeps the case", () => {
    const random = seeded(1);
    for (let index = 0; index < 20; index++) {
      expect(["s", "q", "w", "z"]).toContain(wrongKeyFor("a", random));
      expect(["S", "Q", "W", "Z"]).toContain(wrongKeyFor("A", random));
    }
  });

  it("never returns the expected character", () => {
    const random = seeded(2);
    for (const char of [..." .,é'kp"]) expect(wrongKeyFor(char, random)).not.toBe(char);
  });
});

describe("isBotDifficulty", () => {
  it("accepts only known levels", () => {
    expect(isBotDifficulty("master")).toBe(true);
    expect(isBotDifficulty("expert")).toBe(false);
    expect(isBotDifficulty(3)).toBe(false);
  });
});
