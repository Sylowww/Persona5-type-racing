import type { RaceRecord } from "@/types/race";
import type { RadarValue } from "@/types/player";

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

/** The skill radar uses the player's most recent races. */
export const RADAR_RACE_COUNT = 20;
/** Speed that fills the speed axes (about the fastest bot). */
export const RADAR_FULL_WPM = 150;
/** Accuracy at the center of the accuracy axis; 100% fills it. */
export const RADAR_MIN_ACCURACY = 0.8;

export const radarAxes: readonly RadarValue["axis"][] = ["burst", "accuracy", "stamina", "placement", "rhythm", "consistency"];

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/**
 * Skill radar from saved races (newest first), or null without races:
 * burst = best WPM, rhythm = average WPM, accuracy, stamina = share of races finished,
 * placement = average standing among the racers, consistency = how little WPM varies between races.
 */
export function skillRadar(records: readonly RaceRecord[]): RadarValue[] | null {
  const races = records.slice(0, RADAR_RACE_COUNT);
  if (races.length === 0) return null;
  const average = (pick: (record: RaceRecord) => number) => races.reduce((sum, record) => sum + pick(record), 0) / races.length;

  const wpms = races.map((record) => record.wpm);
  const meanWpm = average((record) => record.wpm);
  const spread = Math.sqrt(average((record) => (record.wpm - meanWpm) ** 2));
  // Spread as a share of the mean speed: 0 is perfectly steady, 50% or more counts as no consistency. Needs two races.
  const consistency = races.length < 2 ? 0.5 : meanWpm === 0 ? 0 : clamp01(1 - (2 * spread) / meanWpm);

  const values: Record<RadarValue["axis"], number> = {
    burst: Math.max(...wpms) / RADAR_FULL_WPM,
    accuracy: (average((record) => record.accuracy) - RADAR_MIN_ACCURACY) / (1 - RADAR_MIN_ACCURACY),
    stamina: average((record) => (record.finishMs === null ? 0 : 1)),
    placement: average((record) => (record.racerCount <= 1 ? 1 : (record.racerCount - record.place) / (record.racerCount - 1))),
    rhythm: meanWpm / RADAR_FULL_WPM,
    consistency,
  };
  return radarAxes.map((axis) => ({ axis, value: clamp01(values[axis]) }));
}

/** Overall score shown next to the radar, in percent. */
export function radarSync(radar: readonly RadarValue[]): number {
  return radar.length === 0 ? 0 : Math.round((radar.reduce((sum, { value }) => sum + value, 0) / radar.length) * 100);
}
