import { describe, expect, it } from "vitest";
import { addRaceRecord, parseRaceRecords, recordFromResult, summarizeRaces } from "../../src/lib/race-history";
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
      { id: "slow", name: "slow", emblem, character: "joker", wpm: 40, accuracy: 0.9, finishMs: null },
      { id: "fast", name: "fast", emblem, character: "joker", wpm: 80, accuracy: 0.95, finishMs: 20_000 },
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

  it("summarizes best, average and accuracy", () => {
    expect(summarizeRaces([])).toEqual({ races: 0, bestWpm: 0, averageWpm: 0, accuracy: 0 });
    expect(summarizeRaces([record(1, 60, 0.9), record(2, 80, 1)])).toEqual({
      races: 2,
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
