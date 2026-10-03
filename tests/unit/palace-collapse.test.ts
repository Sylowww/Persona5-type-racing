import { describe, expect, it } from "vitest";
import {
  COUNTDOWN_PEAK,
  collapseIntensity,
  crackTip,
  createDebris,
  generateCrack,
  nextRumbleDelayMs,
  rumbleOffset,
  spawnCount,
  spawnRates,
  stepDebris,
  visibleCrack,
} from "../../src/lib/palace-collapse";

const startsAt = 10_000;
const endsAt = startsAt + 180_000;

describe("collapseIntensity", () => {
  it("builds up during the countdown", () => {
    expect(collapseIntensity(startsAt - 3000, startsAt, endsAt)).toBe(0);
    const middle = collapseIntensity(startsAt - 1500, startsAt, endsAt);
    expect(middle).toBeGreaterThan(0);
    expect(middle).toBeLessThan(COUNTDOWN_PEAK);
    expect(collapseIntensity(startsAt, startsAt, endsAt)).toBeCloseTo(COUNTDOWN_PEAK);
  });

  it("keeps climbing with the elapsed race time up to 1", () => {
    const early = collapseIntensity(startsAt + 30_000, startsAt, endsAt);
    const late = collapseIntensity(startsAt + 120_000, startsAt, endsAt);
    expect(early).toBeGreaterThan(COUNTDOWN_PEAK);
    expect(late).toBeGreaterThan(early);
    expect(collapseIntensity(endsAt, startsAt, endsAt)).toBe(1);
    expect(collapseIntensity(endsAt + 5000, startsAt, endsAt)).toBe(1);
  });
});

describe("rumbles", () => {
  it("come more often as intensity rises", () => {
    expect(nextRumbleDelayMs(1, () => 0.5)).toBeLessThan(nextRumbleDelayMs(0, () => 0.5));
  });

  it("shake within the amplitude and stop when over", () => {
    const rumble = { startedAt: 0, durationMs: 400, amplitude: 4 };
    const offset = rumbleOffset(rumble, 50);
    expect(Math.abs(offset.x)).toBeLessThanOrEqual(4);
    expect(Math.abs(offset.y)).toBeLessThanOrEqual(4);
    expect(rumbleOffset(rumble, 400)).toEqual({ x: 0, y: 0 });
    expect(rumbleOffset(null, 50)).toEqual({ x: 0, y: 0 });
  });
});

describe("debris", () => {
  it("falls and is dropped below the floor", () => {
    const chunk = createDebris("chunk", 800, () => 0.5);
    const [moved] = stepDebris([chunk], 100, 600);
    expect(moved.y).toBeGreaterThan(chunk.y);
    expect(moved.vy).toBeGreaterThan(chunk.vy);
    expect(stepDebris([{ ...chunk, y: 1000 }], 16, 600)).toEqual([]);
  });

  it("starts around a burst point, scaled", () => {
    const piece = createDebris("chunk", 800, () => 0.5, { at: { x: 100, y: 50 }, scale: 0.5 });
    expect(piece.x).toBe(100);
    expect(piece.y).toBeGreaterThanOrEqual(50);
    expect(piece.size).toBeLessThan(createDebris("chunk", 800, () => 0.5).size);
  });

  it("spawns more as intensity rises, keeping the average rate", () => {
    expect(spawnRates(1).chunk).toBeGreaterThan(spawnRates(0).chunk);
    expect(spawnCount(10, 1000, () => 0.9)).toBe(10);
    expect(spawnCount(0.5, 1000, () => 0.2)).toBe(1);
    expect(spawnCount(0.5, 1000, () => 0.8)).toBe(0);
  });
});

describe("cracks", () => {
  it("open from the top edge as intensity rises", () => {
    let seed = 0;
    const random = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const crack = generateCrack(1000, 800, random);
    expect(crack[0][1]).toBe(0);
    expect(visibleCrack(crack, 0)).toEqual([]);
    expect(visibleCrack(crack, 0.5).length).toBeLessThan(crack.length);
    expect(visibleCrack(crack, 1)).toEqual(crack);
    expect(crackTip(crack, 0)).toBeNull();
    expect(crackTip(crack, 1)).toEqual(crack.at(-1));
  });
});
