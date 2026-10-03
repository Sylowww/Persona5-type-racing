"use client";

import { useState, type CSSProperties } from "react";
import { initialRunnerState, runSpeed, runnerAnimation, updateRunner } from "@/lib/race-runner";
import type { CharacterSprite } from "@/lib/characters";

/** Shown size of one frame, in px; the sheet is drawn at twice this for sharp high-DPI screens. */
export const RUNNER_SIZE = 64;

type RaceRunnerProps = {
  character: CharacterSprite;
  progress: number;
  wpm: number;
  isFinished: boolean;
  isYou: boolean;
  /** Race clock, ticking every 100 ms; it also ends jumps and stops runners when no progress arrives. */
  now: number;
};

// Only reads progress to pick an animation; the race track places the runner from the same progress.
export function RaceRunner({ character, progress, wpm, isFinished, isYou, now }: RaceRunnerProps) {
  const [runner, setRunner] = useState(() => initialRunnerState(progress));
  // Adjusting state while rendering (rather than in an effect) applies new progress in the same render.
  if (progress !== runner.progress) setRunner(updateRunner(runner, progress, now));

  const name = runnerAnimation(runner, isFinished, now);
  const animation = character.animations[name];
  const speed = name === "run" ? runSpeed(wpm) : 1;
  const style = {
    width: character.columns * RUNNER_SIZE,
    height: character.rows * RUNNER_SIZE,
    backgroundImage: `url(${character.src})`,
    backgroundSize: "100% 100%",
    "--runner-row": `${-animation.row * RUNNER_SIZE}px`,
    "--runner-end": `${-(animation.loop ? animation.frames : animation.frames - 1) * RUNNER_SIZE}px`,
    "--runner-duration": `${animation.frames / animation.fps / speed}s`,
    "--runner-timing": animation.loop ? `steps(${animation.frames})` : `steps(${Math.max(animation.frames, 2)}, jump-none)`,
    "--runner-iterations": animation.loop ? "infinite" : "1",
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden ${
        isYou
          ? "drop-shadow-[0_0_3px_var(--color-secondary-fixed)]"
          : "drop-shadow-[0_0_1px_var(--color-on-surface)]"
      }`}
      style={{ width: RUNNER_SIZE, height: RUNNER_SIZE }}
    >
      {/* Keyed by animation so each one starts from its first frame. */}
      <div key={name} className={`runner-frames bg-no-repeat ${animation.frames > 1 ? "" : "runner-frames-still"}`} style={style} />
    </div>
  );
}
