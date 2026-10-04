import { describe, expect, it } from "vitest";
import { radarLabelAnchor, radarPoint, radarPolygon, radarSync, skillRadar, toSvgPoints } from "../../src/lib/radar";
import type { RaceRecord } from "../../src/types/race";

const geometry = { center: { x: 100, y: 80 }, radius: 70 };

describe("radar", () => {
  it("places the first axis straight up", () => {
    expect(radarPoint(geometry, 6, 0, 1)).toEqual({ x: 100, y: 10 });
  });

  it("places the opposite axis straight down", () => {
    expect(radarPoint(geometry, 6, 3, 1)).toEqual({ x: 100, y: 150 });
  });

  it("scales by the value and clamps it between 0 and 1", () => {
    expect(radarPoint(geometry, 4, 1, 0.5)).toEqual({ x: 135, y: 80 });
    expect(radarPoint(geometry, 4, 1, 2)).toEqual({ x: 170, y: 80 });
    expect(radarPoint(geometry, 4, 1, -1)).toEqual({ x: 100, y: 80 });
  });

  it("builds one vertex per value", () => {
    const polygon = radarPolygon(geometry, [1, 1, 1, 1]);
    expect(toSvgPoints(polygon)).toBe("100,10 170,80 100,150 30,80");
  });

  it("anchors labels away from the center", () => {
    expect(radarLabelAnchor(geometry, { x: 100, y: 10 })).toBe("middle");
    expect(radarLabelAnchor(geometry, { x: 170, y: 80 })).toBe("start");
    expect(radarLabelAnchor(geometry, { x: 30, y: 80 })).toBe("end");
  });
});

function race(overrides: Partial<RaceRecord>): RaceRecord {
  return { endedAt: 0, place: 1, racerCount: 2, wpm: 75, accuracy: 0.9, finishMs: 30_000, ...overrides };
}

const valuesOf = (records: RaceRecord[]) => Object.fromEntries((skillRadar(records) ?? []).map(({ axis, value }) => [axis, value]));

describe("skill radar", () => {
  it("is empty without races", () => {
    expect(skillRadar([])).toBeNull();
  });

  it("scores each axis from the races", () => {
    const values = valuesOf([
      race({ wpm: 120, accuracy: 1, place: 1, racerCount: 3 }),
      race({ wpm: 60, accuracy: 0.9, place: 3, racerCount: 3, finishMs: null }),
    ]);
    expect(values.burst).toBeCloseTo(120 / 150);
    expect(values.rhythm).toBeCloseTo(90 / 150);
    expect(values.accuracy).toBeCloseTo(0.75);
    expect(values.stamina).toBeCloseTo(0.5);
    expect(values.placement).toBeCloseTo(0.5);
    expect(values.consistency).toBeCloseTo(1 - (2 * 30) / 90);
  });

  it("keeps values between 0 and 1 and stays neutral on consistency after one race", () => {
    const values = valuesOf([race({ wpm: 400, accuracy: 0.5 })]);
    expect(values.burst).toBe(1);
    expect(values.accuracy).toBe(0);
    expect(values.consistency).toBe(0.5);
  });

  it("uses only the most recent races", () => {
    const records = [race({ wpm: 30 }), ...Array.from({ length: 30 }, () => race({ wpm: 150 }))];
    expect(valuesOf(records).rhythm).toBeCloseTo((30 + 19 * 150) / 20 / 150);
  });

  it("sums the radar up as a percentage", () => {
    expect(radarSync([{ axis: "burst", value: 0.5 }, { axis: "accuracy", value: 1 }])).toBe(75);
  });
});
