"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  collapseIntensity,
  createDebris,
  generateCrack,
  nextRumbleDelayMs,
  rumbleAmplitude,
  rumbleOffset,
  spawnCount,
  spawnRates,
  stepDebris,
  visibleCrack,
  type Crack,
  type Debris,
  type Rumble,
} from "@/lib/palace-collapse";

type PalaceCollapseProps = {
  /** Server-aligned race clock. */
  now: number;
  startsAt: number;
  endsAt: number;
  /** True once the race is over: plays the final collapse (the page navigates afterwards). */
  collapsing: boolean;
  children: ReactNode;
};

const CRACK_COUNT = 7;
const MAX_BACK = 160;
const MAX_FRONT = 220;

type Palette = { dust: string; stone: string; stoneLight: string; red: string; black: string };

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const color = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    dust: color("--color-on-surface", "#e5e1e4"),
    stone: color("--color-surface-container-high", "#2a2a2c"),
    stoneLight: color("--color-surface-bright", "#39393b"),
    red: color("--color-primary-container", "#e60026"),
    black: color("--color-surface-container-lowest", "#0e0e10"),
  };
}

function drawDebris(context: CanvasRenderingContext2D, piece: Debris, palette: Palette) {
  if (piece.kind === "dust") {
    context.globalAlpha = 0.12 + 0.28 * piece.tone;
    context.fillStyle = palette.dust;
    context.fillRect(piece.x, piece.y, piece.size, piece.size);
    return;
  }
  context.save();
  context.translate(piece.x, piece.y);
  context.rotate(piece.rotation);
  context.beginPath();
  piece.shape.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x * piece.size, y * piece.size);
    else context.lineTo(x * piece.size, y * piece.size);
  });
  context.closePath();
  context.globalAlpha = 0.9;
  if (piece.kind === "chunk") {
    context.fillStyle = piece.tone > 0.5 ? palette.stoneLight : palette.stone;
    context.fill();
    context.globalAlpha = 0.5;
    context.strokeStyle = palette.red;
    context.lineWidth = 1;
    context.stroke();
  } else {
    context.fillStyle = piece.tone > 0.55 ? palette.red : palette.black;
    context.fill();
    context.strokeStyle = palette.red;
    context.lineWidth = 1.5;
    context.stroke();
  }
  context.restore();
}

function drawCrack(context: CanvasRenderingContext2D, crack: Crack, intensity: number, palette: Palette) {
  const points = visibleCrack(crack, intensity);
  if (points.length < 2) return;
  context.beginPath();
  points.forEach(([x, y], index) => (index === 0 ? context.moveTo(x, y) : context.lineTo(x, y)));
  context.lineJoin = "miter";
  context.globalAlpha = 0.85;
  context.strokeStyle = palette.black;
  context.lineWidth = 4;
  context.stroke();
  context.globalAlpha = 0.2 + 0.5 * intensity;
  context.strokeStyle = palette.red;
  context.lineWidth = 1.2;
  context.stroke();
}

/**
 * Decorative collapsing-palace atmosphere around the race: cracks and debris behind the panels, light grit in
 * front, an alarm vignette and short rumbles that grow with the elapsed time, then a final collapse.
 * Everything is aria-hidden and ignores pointer events; reduced motion keeps only the static cracks and vignette.
 */
export function PalaceCollapse({ now, startsAt, endsAt, collapsing, children }: PalaceCollapseProps) {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const intensity = collapsing ? 1 : collapseIntensity(now, startsAt, endsAt);
  const intensityRef = useRef(intensity);
  const collapsingRef = useRef(collapsing);
  const pendingRumbleRef = useRef<number | null>(null);

  useEffect(() => {
    intensityRef.current = intensity;
    collapsingRef.current = collapsing;
  }, [intensity, collapsing]);

  // A rumble on each countdown second (3, 2, 1) and a stronger one at the start.
  const secondsLeft = now < startsAt ? Math.ceil((startsAt - now) / 1000) : 0;
  const previousSecondsRef = useRef(secondsLeft);
  useEffect(() => {
    const previous = previousSecondsRef.current;
    previousSecondsRef.current = secondsLeft;
    if (secondsLeft === previous) return;
    pendingRumbleRef.current = secondsLeft > 0 ? 1.5 + (3 - secondsLeft) : 5;
  }, [secondsLeft]);

  useEffect(() => {
    const back = backRef.current;
    const front = frontRef.current;
    const backContext = back?.getContext("2d");
    const frontContext = front?.getContext("2d");
    if (!back || !front || !backContext || !frontContext) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const palette = readPalette();
    const random = Math.random;
    let width = 0;
    let height = 0;
    let cracks: Crack[] = [];
    let backDebris: Debris[] = [];
    let frontDebris: Debris[] = [];
    let rumble: Rumble | null = null;
    let nextRumbleAt = performance.now() + nextRumbleDelayMs(intensityRef.current, random);
    let collapseStartedAt: number | null = null;
    let last = performance.now();
    let frame = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      for (const [canvas, context] of [
        [back, backContext],
        [front, frontContext],
      ] as const) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      cracks = Array.from({ length: CRACK_COUNT }, () => generateCrack(width, height, random));
    };

    const burst = (count: number) => {
      const at = { x: random() * width, y: -10 };
      for (let index = 0; index < count; index++) backDebris.push(createDebris("chunk", width, random, at));
      for (let index = 0; index < count * 4; index++) backDebris.push(createDebris("dust", width, random, at));
    };

    const spawn = (list: Debris[], kind: Debris["kind"], perSecond: number, dt: number, max: number) => {
      const count = spawnCount(perSecond, dt, random);
      for (let index = 0; index < count && list.length < max; index++) list.push(createDebris(kind, width, random));
    };

    const render = (time: number) => {
      const dt = Math.min(50, time - last);
      last = time;
      const level = intensityRef.current;
      const isCollapsing = collapsingRef.current;
      if (isCollapsing && collapseStartedAt === null) collapseStartedAt = time;

      let offset = { x: 0, y: 0 };
      if (!reducedMotion) {
        const rates = spawnRates(level);
        spawn(backDebris, "dust", rates.dust, dt, MAX_BACK);
        spawn(backDebris, "chunk", rates.chunk, dt, MAX_BACK);
        spawn(frontDebris, "dust", rates.grit, dt, MAX_FRONT);
        if (isCollapsing) {
          spawn(backDebris, "chunk", 14, dt, MAX_BACK);
          spawn(frontDebris, "chunk", 26, dt, MAX_FRONT);
          spawn(frontDebris, "shard", 16, dt, MAX_FRONT);
        }

        const pending = pendingRumbleRef.current;
        if (isCollapsing && (!rumble || time - rumble.startedAt > 260)) {
          rumble = { startedAt: time, durationMs: 420, amplitude: 11 };
        } else if (pending !== null || time >= nextRumbleAt) {
          rumble = {
            startedAt: time,
            durationMs: 350 + 300 * level,
            amplitude: pending ?? rumbleAmplitude(level),
          };
          burst(pending !== null && pending >= 5 ? 8 : 2 + Math.round(level * 4));
          nextRumbleAt = time + nextRumbleDelayMs(level, random);
        }
        pendingRumbleRef.current = null;

        offset = rumbleOffset(rumble, time);
        backDebris = stepDebris(backDebris, dt, height);
        frontDebris = stepDebris(frontDebris, dt, height);
      }
      if (shakeRef.current) shakeRef.current.style.translate = `${offset.x}px ${offset.y}px`;

      backContext.clearRect(0, 0, width, height);
      backContext.save();
      backContext.translate(offset.x * 0.5, offset.y * 0.5);
      for (const crack of cracks) drawCrack(backContext!, crack, level, palette);
      for (const piece of backDebris) drawDebris(backContext!, piece, palette);
      backContext.restore();

      frontContext.clearRect(0, 0, width, height);
      for (const piece of frontDebris) drawDebris(frontContext!, piece, palette);
      if (collapseStartedAt !== null) {
        frontContext.globalAlpha = Math.min(0.55, (time - collapseStartedAt) / 2000);
        frontContext.fillStyle = palette.black;
        frontContext.fillRect(0, 0, width, height);
      }
      frontContext.globalAlpha = 1;

      frame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative">
      <canvas ref={backRef} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 size-full" />
      <div ref={shakeRef}>{children}</div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 transition-opacity duration-1000"
        style={{ opacity: 0.15 + 0.6 * intensity }}
      >
        <div className="palace-alarm size-full" />
      </div>
      <canvas ref={frontRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 size-full" />
      {collapsing && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
          <div className="palace-wedge-top absolute inset-0 bg-surface-container-lowest" />
          <div className="palace-wedge-bottom absolute inset-0 bg-surface-container-lowest" />
          <div className="palace-seam absolute inset-x-[-10%] top-1/2 h-3 -rotate-[5deg] bg-primary-container" />
        </div>
      )}
    </div>
  );
}
