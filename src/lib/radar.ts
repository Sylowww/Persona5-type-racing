export type Point = { x: number; y: number };

export type RadarGeometry = {
  center: Point;
  radius: number;
};

/** Position of the axis at `index` out of `axisCount`, `ratio` (0-1) of the radius away from the center; the first axis points up. */
export function radarPoint(geometry: RadarGeometry, axisCount: number, index: number, ratio: number): Point {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / axisCount;
  const distance = geometry.radius * Math.min(Math.max(ratio, 0), 1);
  return {
    x: round(geometry.center.x + distance * Math.cos(angle)),
    y: round(geometry.center.y + distance * Math.sin(angle)),
  };
}

/** Points of a polygon with one vertex per value, each value being a 0-1 ratio of the radius. */
export function radarPolygon(geometry: RadarGeometry, values: readonly number[]): Point[] {
  return values.map((value, index) => radarPoint(geometry, values.length, index, value));
}

export function toSvgPoints(points: readonly Point[]): string {
  return points.map(({ x, y }) => `${x},${y}`).join(" ");
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export type TextAnchor = "start" | "middle" | "end";

/** Anchors a label so it grows away from the center of the radar. */
export function radarLabelAnchor(geometry: RadarGeometry, point: Point): TextAnchor {
  const offset = point.x - geometry.center.x;
  if (Math.abs(offset) < 1) return "middle";
  return offset > 0 ? "start" : "end";
}
