// Decorative "collapsing palace" effect around the race: intensity, rumbles, falling debris and cracks.
// Pure functions only; the race page draws them on canvases. Nothing here affects the race itself.

export type Random = () => number;

/** Intensity reached when the countdown ends; the race then climbs from here to 1 at the time limit. */
export const COUNTDOWN_PEAK = 0.3;

/** Leader progress (share of the text) at which the palace falls into total chaos. */
export const CHAOS_PROGRESS = 0.5;

/** How much more debris falls once in chaos. */
const CHAOS_SPAWN_FACTOR = 2.5;

/** True once the leading racer reached the middle of the text; it stays true for the rest of the race. */
export function isChaos(leaderProgress: number): boolean {
  return leaderProgress >= CHAOS_PROGRESS;
}

/** Length of the final collapse played before showing the results. */
export const FINAL_COLLAPSE_MS = 2200;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * How hard the palace shakes, from 0 to 1, driven by time only.
 * The countdown builds up to `COUNTDOWN_PEAK`; the race keeps climbing with the elapsed time, faster at first
 * so that typical races (well under the time limit) still feel the escalation.
 */
export function collapseIntensity(now: number, startsAt: number, endsAt: number, countdownMs = 3000): number {
  if (now < startsAt) {
    const built = clamp01(1 - (startsAt - now) / countdownMs);
    return COUNTDOWN_PEAK * built * built;
  }
  const elapsed = clamp01((now - startsAt) / Math.max(1, endsAt - startsAt));
  return COUNTDOWN_PEAK + (1 - COUNTDOWN_PEAK) * Math.sqrt(elapsed);
}

/** Delay until the next rumble: rare and gentle at first, more frequent as the palace gives way, constant in chaos. */
export function nextRumbleDelayMs(intensity: number, random: Random, chaos = false): number {
  const base = chaos ? 1300 : 9000 - 6500 * clamp01(intensity);
  return base * (0.6 + 0.8 * random());
}

/** Shake amplitude in px; small so the text stays easy to read, stronger in chaos. */
export function rumbleAmplitude(intensity: number, chaos = false): number {
  return chaos ? 6 + 2 * clamp01(intensity) : 1 + 4 * clamp01(intensity);
}

export type Rumble = { startedAt: number; durationMs: number; amplitude: number };

/** Screen offset of a rumble at `now`: an uneven shake that fades out. */
export function rumbleOffset(rumble: Rumble | null, now: number): { x: number; y: number } {
  if (!rumble) return { x: 0, y: 0 };
  const t = (now - rumble.startedAt) / rumble.durationMs;
  if (t < 0 || t >= 1) return { x: 0, y: 0 };
  const fade = (1 - t) * (1 - t) * rumble.amplitude;
  const ms = now - rumble.startedAt;
  return {
    x: fade * (Math.sin(ms * 0.071) * 0.7 + Math.sin(ms * 0.173) * 0.3),
    y: fade * (Math.sin(ms * 0.089 + 1.3) * 0.6 + Math.sin(ms * 0.211) * 0.4),
  };
}

export type DebrisKind = "dust" | "chunk" | "shard";

export type Debris = {
  kind: DebrisKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  size: number;
  /** Polygon around the center, as [x, y] pairs scaled by `size`. */
  shape: readonly (readonly [number, number])[];
  /** 0 to 1, used for color and opacity variations. */
  tone: number;
};

/** Px/s² per kind: dust floats, chunks and shards fall. */
const GRAVITY: Record<DebrisKind, number> = { dust: 40, chunk: 1400, shard: 1100 };

function chunkShape(random: Random): [number, number][] {
  const corners = 5 + Math.floor(random() * 3);
  return Array.from({ length: corners }, (_, index) => {
    const angle = (index / corners) * Math.PI * 2 + random() * 0.6;
    const radius = 0.6 + random() * 0.4;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
}

function shardShape(random: Random): [number, number][] {
  return [
    [-0.25, -1],
    [0.3 + random() * 0.2, -0.2],
    [-0.1 + random() * 0.2, 1],
  ];
}

/**
 * One piece of debris just above the top edge, or around `at` (a burst or a dust stream; `spread` is its width).
 * `scale` shrinks or enlarges it, e.g. small chunks falling in front of the panels.
 */
export function createDebris(
  kind: DebrisKind,
  width: number,
  random: Random,
  options: { at?: { x: number; y: number }; spread?: number; scale?: number } = {},
): Debris {
  const { at, spread = 80, scale = 1 } = options;
  const size = scale * (kind === "dust" ? 1 + random() * 2.5 : kind === "chunk" ? 5 + random() * 17 : 8 + random() * 22);
  return {
    kind,
    x: at ? at.x + (random() - 0.5) * spread : random() * width,
    y: at ? at.y + random() * 20 : -size * 2,
    vx: (random() - 0.5) * (kind === "dust" ? 20 : 90),
    vy: kind === "dust" ? 15 + random() * 35 : 40 + random() * 160,
    rotation: random() * Math.PI * 2,
    spin: (random() - 0.5) * (kind === "dust" ? 0 : 8),
    size,
    shape: kind === "chunk" ? chunkShape(random) : kind === "shard" ? shardShape(random) : [],
    tone: random(),
  };
}

/** Moves debris forward by `dtMs` and drops what fell below `floor`. */
export function stepDebris(debris: readonly Debris[], dtMs: number, floor: number): Debris[] {
  const dt = dtMs / 1000;
  const next: Debris[] = [];
  for (const piece of debris) {
    const vy = piece.vy + GRAVITY[piece.kind] * dt;
    const moved = {
      ...piece,
      x: piece.x + piece.vx * dt,
      y: piece.y + vy * dt,
      vy,
      rotation: piece.rotation + piece.spin * dt,
    };
    if (moved.y - moved.size * 2 <= floor) next.push(moved);
  }
  return next;
}

/** Average new pieces per second for each layer at a given intensity (much more in chaos). */
export function spawnRates(
  intensity: number,
  chaos = false,
): {
  dust: number;
  chunk: number;
  grit: number;
  frontChunk: number;
  stream: number;
} {
  const i = chaos ? 1 : clamp01(intensity);
  const factor = chaos ? CHAOS_SPAWN_FACTOR : 1;
  return {
    dust: (12 + 45 * i) * factor,
    chunk: (1 + 6 * i) * factor,
    grit: (3 + 10 * i) * factor,
    /** Small chunks drawn in front of the panels. */
    frontChunk: (0.2 + 1.6 * i) * factor,
    /** Dust pouring from each crack's tip. */
    stream: (4 + 14 * i) * factor,
  };
}

/** How many pieces to spawn this frame for an average `perSecond` rate (random rounding keeps the average). */
export function spawnCount(perSecond: number, dtMs: number, random: Random): number {
  const expected = (perSecond * dtMs) / 1000;
  const whole = Math.floor(expected);
  return whole + (random() < expected - whole ? 1 : 0);
}

export type Crack = readonly (readonly [number, number])[];

/** A crack running down from the top edge as a jagged line, in px. */
export function generateCrack(width: number, height: number, random: Random): Crack {
  const points: [number, number][] = [[random() * width, 0]];
  const length = height * (0.25 + random() * 0.45);
  const segments = 8 + Math.floor(random() * 6);
  let [x, y] = points[0];
  for (let index = 1; index <= segments; index++) {
    x += (random() - 0.5) * 70;
    y += (length / segments) * (0.6 + random() * 0.8);
    points.push([x, y]);
  }
  return points;
}

/** End of the visible part of a crack, where dust pours from; null while the crack is closed. */
export function crackTip(crack: Crack, intensity: number): readonly [number, number] | null {
  return visibleCrack(crack, intensity).at(-1) ?? null;
}

/** Part of a crack visible at an intensity: cracks open as the palace weakens. */
export function visibleCrack(crack: Crack, intensity: number): Crack {
  const count = Math.round(clamp01(intensity) * (crack.length - 1)) + 1;
  return count < 2 ? [] : crack.slice(0, count);
}
