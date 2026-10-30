import { describe, expect, it } from "vitest";
import { chartCeiling, chartPoints, keyHeat, peakSample, raceChart, rankRacers, slowestKeys } from "../../src/lib/results";
import type { ResultRacer } from "../../src/types/race";

const racer = (id: string, status: ResultRacer["status"], { finishMs = null, progress = 0, timeMs = 60_000 }: Partial<ResultRacer> = {}): ResultRacer => ({
  id,
  name: id,
  emblem: "cat",
  character: "joker",
  wpm: 50,
  rawWpm: 55,
  accuracy: 1,
  mistakes: 0,
  progress,
  bonuses: 0,
  finishMs,
  timeMs,
  status,
  samples: [],
});

describe("rankRacers (COURSE-10)", () => {
  it("orders finishers by time, then the rest by progress, then eliminations, then forfeits", () => {
    const ranked = rankRacers([
      racer("quit-far", "forfeited", { progress: 0.8 }),
      racer("slow", "timeout", { progress: 0.4 }),
      racer("out-early", "eliminated", { timeMs: 5_000 }),
      racer("second", "finished", { finishMs: 40_000 }),
      racer("quit-near", "forfeited", { progress: 0.1 }),
      racer("closer", "timeout", { progress: 0.9 }),
      racer("out-late", "eliminated", { timeMs: 20_000 }),
      racer("first", "finished", { finishMs: 30_000 }),
    ]);
    expect(ranked.map((r) => r.id)).toEqual(["first", "second", "closer", "slow", "out-late", "out-early", "quit-far", "quit-near"]);
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

describe("raceChart", () => {
  const withSamples = (id: string, timeMs: number, wpms: number[]) => ({
    ...racer(id, "finished", { timeMs }),
    samples: wpms.map((wpm, index) => ({ atMs: (index + 1) * 1_000, wpm })),
  });

  it("scales to the longest race and the fastest sample", () => {
    const chart = raceChart([withSamples("a", 3_000, [40, 70]), withSamples("b", 5_000, [30, 50, 61])], "b");
    expect(chart.durationMs).toBe(5_000);
    expect(chart.maxWpm).toBe(80);
  });

  it("draws the player and the podium on top of everyone else", () => {
    const racers = ["a", "b", "c", "d", "e"].map((id) => withSamples(id, 1_000, [10]));
    const chart = raceChart(racers, "b");
    expect(chart.lines.map((line) => [line.racer.id, line.tone])).toEqual([
      ["d", "other"],
      ["e", "other"],
      ["c", "third"],
      ["a", "first"],
      ["b", "you"],
    ]);
  });

  it("rounds the ceiling up to the next 20 WPM", () => {
    expect(chartCeiling(0)).toBe(20);
    expect(chartCeiling(59)).toBe(60);
    expect(chartCeiling(60)).toBe(80);
  });
});
