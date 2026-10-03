import type { CSSProperties } from "react";
import type { CharacterSprite } from "@/lib/characters";
import type { RunnerAnimation } from "@/lib/race-runner";

type SpriteFramesProps = {
  character: CharacterSprite;
  animation: RunnerAnimation;
  /** Shown size of one frame, in px. */
  size: number;
  /** Playback speed multiplier. */
  speed?: number;
  className?: string;
  /** Classes for the moving strip, e.g. to pause the animation until hover. */
  stripClassName?: string;
};

/** One animation of a character's sprite sheet, played with CSS (see `.runner-frames` in globals.css). */
export function SpriteFrames({ character, animation: name, size, speed = 1, className = "", stripClassName = "" }: SpriteFramesProps) {
  const animation = character.animations[name];
  const style = {
    width: character.columns * size,
    height: character.rows * size,
    backgroundImage: `url(${character.src})`,
    backgroundSize: "100% 100%",
    "--runner-row": `${-animation.row * size}px`,
    "--runner-end": `${-(animation.loop ? animation.frames : animation.frames - 1) * size}px`,
    "--runner-duration": `${animation.frames / animation.fps / speed}s`,
    "--runner-timing": animation.loop ? `steps(${animation.frames})` : `steps(${Math.max(animation.frames, 2)}, jump-none)`,
    "--runner-iterations": animation.loop ? "infinite" : "1",
  } as CSSProperties;

  return (
    <div aria-hidden="true" className={`relative overflow-hidden ${className}`} style={{ width: size, height: size }}>
      {/* Keyed by animation so each one starts from its first frame. */}
      <div
        key={name}
        className={`runner-frames bg-no-repeat ${animation.frames > 1 ? "" : "runner-frames-still"} ${stripClassName}`}
        style={style}
      />
    </div>
  );
}
