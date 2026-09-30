import { describe, expect, it } from "vitest";
import { chartPoints, keyHeat, peakSample, rankRacers, slowestKeys } from "../../src/lib/results";
import type { ResultRacer } from "../../src/types/race";

const racer = (id: string, wpm: number, finishMs: number | null): ResultRacer => ({
  id,
  name: id,
  title: "",
  emblem: "cat",
  wpm,
  accuracy: 1,
  finishMs,
});

describe("rankRacers", () => {
  it("orders finishers by time, then the rest by speed", () => {
    const ranked = rankRacers([racer("a", 90, null), racer("b", 100, 40_000), racer("c", 80, 30_000), racer("d", 120, null)]);
    expect(ranked.map((r) => r.id)).toEqual(["c", "b", "d", "a"]);
  });
});

describe("peakSample", () => {
  it("returns the first fastest sample", () => {
    expect(peakSample([{ atMs: 0, wpm: 10 }, { atMs: 1, wpm: 50 }, { atMs: 2, wpm: 50 }])).toEqual({ atMs: 1, wpm: 50 });
  });

  it("is null without samples", () => {
    expect(peakSample([])).toBeNull();
  });
});

describe("chartPoints", () => {
  it("maps time to x and speed to y from the bottom, clamped", () => {
    const samples = [{ atMs: 0, wpm: 0 }, { atMs: 500, wpm: 50 }, { atMs: 2_000, wpm: 200 }];
    expect(chartPoints(samples, 1_000, 100, 300, 80)).toBe("0,80 150,40 300,0");
  });

  it("is empty for a zero duration", () => {
    expect(chartPoints([{ atMs: 0, wpm: 10 }], 0, 100, 300, 80)).toBe("");
  });
});

describe("keyHeat", () => {
  it("classifies keys by delay and mistakes", () => {
    expect(keyHeat(undefined)).toBe("unused");
    expect(keyHeat({ key: "a", avgDelayMs: 100, mistakes: 0 })).toBe("fast");
    expect(keyHeat({ key: "a", avgDelayMs: 180, mistakes: 0 })).toBe("steady");
    expect(keyHeat({ key: "a", avgDelayMs: 250, mistakes: 0 })).toBe("slow");
    expect(keyHeat({ key: "a", avgDelayMs: 90, mistakes: 1 })).toBe("slow");
  });
});

describe("slowestKeys", () => {
  it("keeps only slow keys, slowest first", () => {
    const stats = [
      { key: "a", avgDelayMs: 90, mistakes: 0 },
      { key: "q", avgDelayMs: 300, mistakes: 0 },
      { key: "z", avgDelayMs: 120, mistakes: 2 },
      { key: ";", avgDelayMs: 340, mistakes: 0 },
    ];
    expect(slowestKeys(stats, 2).map((s) => s.key)).toEqual([";", "q"]);
  });
});
