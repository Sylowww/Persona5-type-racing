"use client";

import { useState } from "react";
import { SpriteFrames } from "@/components/ui/sprite-frames";
import { initialRunnerState, runSpeed, runnerAnimation, updateRunner } from "@/lib/race-runner";
import type { CharacterSprite } from "@/lib/characters";

/** Shown size of one frame, in px; the sheet is drawn at twice this for sharp high-DPI screens. */
export const RUNNER_SIZE = 64;

/** How long a runner stumbles after a mistake. */
const STUMBLE_MS = 350;

type RaceRunnerProps = {
  character: CharacterSprite;
  progress: number;
  wpm: number;
  isFinished: boolean;
  /** Mistakes so far: each new one makes the runner stumble. */
  mistakes: number;
  isYou: boolean;
  /** Race clock, ticking every 100 ms; it also ends jumps and stops runners when no progress arrives. */
  now: number;
};

// Only reads progress to pick an animation; the race track places the runner from the same progress.
export function RaceRunner({ character, progress, wpm, isFinished, mistakes, isYou, now }: RaceRunnerProps) {
  const [runner, setRunner] = useState(() => initialRunnerState(progress));
  const [stumble, setStumble] = useState({ mistakes, until: 0 });
  // Adjusting state while rendering (rather than in an effect) applies new progress in the same render.
  if (progress !== runner.progress) setRunner(updateRunner(runner, progress, now));
  if (mistakes !== stumble.mistakes) setStumble({ mistakes, until: mistakes > stumble.mistakes ? now + STUMBLE_MS : 0 });

  const name = runnerAnimation(runner, isFinished, now);

  return (
    <SpriteFrames
      character={character}
      animation={name}
      size={RUNNER_SIZE}
      speed={name === "run" ? runSpeed(wpm) : 1}
      className={`${isYou ? "drop-shadow-[0_0_3px_var(--color-secondary-fixed)]" : "drop-shadow-[0_0_1px_var(--color-on-surface)]"} ${
        now < stumble.until ? "runner-stumble" : ""
      }`}
    />
  );
}
