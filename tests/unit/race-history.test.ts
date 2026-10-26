import { describe, expect, it } from "vitest";
import { addRaceRecord, isPersonalBest, parseRaceRecords, progressPoints, recordFromResult, summarizeRaces } from "../../src/lib/race-history";
import type { RaceRecord, RaceResult } from "../../src/types/race";

const emblem = "domino";

function result(youId: string): RaceResult {
  return {
    youId,
    endedAt: 5_000,
    durationMs: 30_000,
    keystrokes: 100,
    mistakes: 5,
    speedSamples: [],
    keyStats: [],
    racers: [
      { id: "slow", name: "slow", emblem, character: "joker", wpm: 40, rawWpm: 44, accuracy: 0.9, mistakes: 5, progress: 0.6, bonuses: 0, finishMs: null, timeMs: 30_000, status: "timeout", samples: [] },
      { id: "fast", name: "fast", emblem, character: "joker", wpm: 80, rawWpm: 84, accuracy: 0.95, mistakes: 2, progress: 1, bonuses: 0, finishMs: 20_000, timeMs: 20_000, status: "finished", samples: [] },
    ],
  };
}

function record(endedAt: number, wpm: number, accuracy = 1): RaceRecord {
  return { endedAt, place: 1, racerCount: 2, wpm, accuracy, finishMs: 10_000 };
}

describe("race history", () => {
  it("builds the racer's own record from ranked results", () => {
    expect(recordFromResult(result("slow"))).toEqual({
      endedAt: 5_000,
      place: 2,
      racerCount: 2,
      wpm: 40,
      accuracy: 0.9,
      finishMs: null,
    });
    expect(recordFromResult(result("fast"))?.place).toBe(1);
    expect(recordFromResult(result("nobody"))).toBeNull();
  });

  it("summarizes wins, best, average and accuracy", () => {
    expect(summarizeRaces([])).toEqual({ races: 0, wins: 0, bestWpm: 0, averageWpm: 0, accuracy: 0 });
    expect(summarizeRaces([record(1, 60, 0.9), { ...record(2, 80, 1), place: 2 }])).toEqual({
      races: 2,
      wins: 1,
      bestWpm: 80,
      averageWpm: 70,
      accuracy: 0.95,
    });
  });

  it("adds records newest first, ignores the same race twice and caps the list", () => {
    const list = addRaceRecord([record(1, 50)], record(2, 60));
    expect(list.map((entry) => entry.endedAt)).toEqual([2, 1]);
    expect(addRaceRecord(list, record(2, 99))).toEqual(list);
    expect(addRaceRecord(list, record(3, 70), 2).map((entry) => entry.endedAt)).toEqual([3, 2]);
  });

  it("parses stored records and drops malformed ones", () => {
    expect(parseRaceRecords(null)).toEqual([]);
    expect(parseRaceRecords("not json")).toEqual([]);
    expect(parseRaceRecords('{"a":1}')).toEqual([]);
    const good = record(1, 50);
    expect(parseRaceRecords(JSON.stringify([good, { ...good, wpm: "fast" }, null]))).toEqual([good]);
  });
});

describe("progressPoints", () => {
  it("spreads races evenly, 0 WPM at the bottom", () => {
    expect(progressPoints([0, 50, 100], 100, 400, 100)).toBe("0,100 200,50 400,0");
  });

  it("draws a single race as a flat line and nothing without races", () => {
    expect(progressPoints([50], 100, 400, 100)).toBe("0,50 400,50");
    expect(progressPoints([], 100, 400, 100)).toBe("");
  });
});

describe("isPersonalBest", () => {
  it("needs an earlier race to beat (RES-04)", () => {
    expect(isPersonalBest(80, null)).toBe(false);
    expect(isPersonalBest(80, 80)).toBe(false);
    expect(isPersonalBest(80.5, 80)).toBe(true);
  });
});
