import type { RunnerAnimation } from "@/lib/race-runner";

/** One row of a sprite sheet. */
export type SpriteAnimation = {
  row: number;
  frames: number;
  fps: number;
  /** A non-looping animation holds its last frame. */
  loop: boolean;
};

/**
 * Sprite sheet contract: square frames with no gap, one row per animation, the character facing right,
 * feet on the same baseline and body centered in every frame. Unused cells are transparent.
 */
export type CharacterSprite = {
  src: string;
  /** Width and height of one frame, in px. */
  frameSize: number;
  columns: number;
  rows: number;
  animations: Record<RunnerAnimation, SpriteAnimation>;
};

export type CharacterId = "joker";

export const characters = {
  joker: {
    src: "/sprites/joker.webp",
    frameSize: 128,
    columns: 8,
    rows: 4,
    animations: {
      idle: { row: 0, frames: 8, fps: 8, loop: true },
      run: { row: 1, frames: 8, fps: 12, loop: true },
      jump: { row: 2, frames: 6, fps: 12, loop: false },
      // A single held pose for now.
      victory: { row: 3, frames: 1, fps: 1, loop: false },
    },
  },
} satisfies Record<CharacterId, CharacterSprite>;
