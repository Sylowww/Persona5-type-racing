import { describe, expect, it } from "vitest";
import { hasReplay, progressAt, replayDuration, replayFrame } from "../../src/lib/race-replay";
import type { RaceResult, ResultRacer } from "../../src/types/race";

const racer = (id: string, overrides: Partial<ResultRacer> = {}): ResultRacer => ({
  id,
  name: id,
  emblem: "cat",
  character: "joker",
  wpm: 50,
  rawWpm: 55,
  accuracy: 1,
  mistakes: 0,
  progress: 1,
  bonuses: 0,
  finishMs: 10_000,
  timeMs: 10_000,
  status: "finished",
  samples: [
    { atMs: 2_000, wpm: 40, progress: 0.2 },
    { atMs: 6_000, wpm: 50, progress: 0.6 },
  ],
  ...overrides,
});

const result = (racers: ResultRacer[], events: RaceResult["events"] = []): RaceResult => ({
  youId: racers[0].id,
  endedAt: 0,
  durationMs: 10_000,
  keystrokes: 0,
  mistakes: 0,
  racers,
  speedSamples: [],
  keyStats: [],
  events,
});

describe("race replay", () => {
  it("needs saved progress samples and events", () => {
    expect(hasReplay(result([racer("ann")]))).toBe(true);
    expect(hasReplay({ ...result([racer("ann")]), events: undefined })).toBe(false);
    expect(hasReplay(result([racer("ann", { samples: [{ atMs: 2_000, wpm: 40 }] })]))).toBe(false);
  });

  it("moves each racer between their samples and stops them where they ended", () => {
    const ann = racer("ann");
    expect(progressAt(ann, 0)).toBe(0);
    expect(progressAt(ann, 1_000)).toBeCloseTo(0.1);
    expect(progressAt(ann, 4_000)).toBeCloseTo(0.4);
    expect(progressAt(ann, 8_000)).toBeCloseTo(0.8);
    expect(progressAt(ann, 12_000)).toBe(1);

    const slow = racer("bob", { finishMs: null, status: "timeout", progress: 0.7, timeMs: 12_000 });
    expect(progressAt(slow, 20_000)).toBe(0.7);
    expect(replayDuration(result([ann, slow]))).toBe(12_000);
  });

  it("ranks finishers by time, then the others by progress", () => {
    const frame = replayFrame(
      result([
        racer("ann", { finishMs: 9_000, timeMs: 9_000 }),
        racer("bob", { finishMs: null, status: "timeout", progress: 0.9, timeMs: 12_000 }),
        racer("cat", { finishMs: 8_000, timeMs: 8_000 }),
      ]),
      9_500,
    );
    expect(frame.map(({ id, place, isFinished }) => [id, place, isFinished])).toEqual([
      ["ann", 2, true],
      ["bob", 3, false],
      ["cat", 1, true],
    ]);
  });

  it("marks the target's lane while a malus lasts and counts the caster's spells", () => {
    const race = result([racer("ann"), racer("bob")], [{ type: "spell", atMs: 3_000, spell: "bufu", casterId: "bob", targetId: "ann" }]);
    const during = replayFrame(race, 4_000);
    expect(during[0].mark).toEqual({ element: "ice", until: 5_500 });
    expect(during[1].bonuses).toBe(1);
    expect(replayFrame(race, 6_000)[0].mark).toBeNull();
    expect(replayFrame(race, 2_000)[1].bonuses).toBe(0);
  });
});
