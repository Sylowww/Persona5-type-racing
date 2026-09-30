import { describe, expect, it } from "vitest";
import { radarLabelAnchor, radarPoint, radarPolygon, toSvgPoints } from "../../src/lib/radar";

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
