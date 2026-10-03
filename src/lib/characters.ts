import type { CharacterId } from "@/types/character";
import type { RunnerAnimation } from "./race-runner";

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
  /** Horizontal position of the character's head in every frame, in px; obstacles line up with it. */
  anchorX: number;
  animations: Record<RunnerAnimation, SpriteAnimation>;
};

export const characters = {
  joker: {
    src: "/sprites/joker.webp",
    frameSize: 128,
    columns: 8,
    rows: 4,
    anchorX: 84,
    animations: {
      idle: { row: 0, frames: 8, fps: 8, loop: true },
      run: { row: 1, frames: 8, fps: 12, loop: true },
      jump: { row: 2, frames: 6, fps: 12, loop: false },
      // A single held pose for now.
      victory: { row: 3, frames: 1, fps: 1, loop: false },
    },
  },
  mona: {
    src: "/sprites/mona.webp",
    frameSize: 128,
    columns: 8,
    rows: 4,
    anchorX: 82,
    animations: {
      idle: { row: 0, frames: 8, fps: 8, loop: true },
      run: { row: 1, frames: 8, fps: 12, loop: true },
      jump: { row: 2, frames: 6, fps: 12, loop: false },
      victory: { row: 3, frames: 3, fps: 6, loop: false },
    },
  },
  panther: {
    src: "/sprites/panther.webp",
    frameSize: 128,
    columns: 8,
    rows: 4,
    anchorX: 71,
    animations: {
      idle: { row: 0, frames: 6, fps: 8, loop: true },
      run: { row: 1, frames: 8, fps: 12, loop: true },
      jump: { row: 2, frames: 6, fps: 12, loop: false },
      victory: { row: 3, frames: 3, fps: 6, loop: false },
    },
  },
  skull: {
    src: "/sprites/skull.webp",
    frameSize: 128,
    columns: 8,
    rows: 4,
    anchorX: 81,
    animations: {
      idle: { row: 0, frames: 8, fps: 8, loop: true },
      run: { row: 1, frames: 8, fps: 12, loop: true },
      jump: { row: 2, frames: 7, fps: 12, loop: false },
      victory: { row: 3, frames: 4, fps: 6, loop: false },
    },
  },
  fox: {
    src: "/sprites/fox.webp",
    frameSize: 128,
    columns: 8,
    rows: 4,
    anchorX: 76,
    animations: {
      idle: { row: 0, frames: 8, fps: 8, loop: true },
      run: { row: 1, frames: 8, fps: 12, loop: true },
      jump: { row: 2, frames: 6, fps: 12, loop: false },
      victory: { row: 3, frames: 3, fps: 6, loop: false },
    },
  },
  queen: {
    src: "/sprites/queen.webp",
    frameSize: 128,
    columns: 8,
    rows: 4,
    anchorX: 78,
    animations: {
      idle: { row: 0, frames: 8, fps: 8, loop: true },
      run: { row: 1, frames: 8, fps: 12, loop: true },
      jump: { row: 2, frames: 6, fps: 12, loop: false },
      victory: { row: 3, frames: 2, fps: 4, loop: false },
    },
  },
} satisfies Record<CharacterId, CharacterSprite>;

export const characterIds = Object.keys(characters) as CharacterId[];

/** Every player is Joker until they choose another character. */
export const DEFAULT_CHARACTER: CharacterId = "joker";

export function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === "string" && Object.hasOwn(characters, value);
}

/** Sprite for a character id; an unknown id (e.g. a page older than the server) falls back to the default. */
export function characterSprite(id: string): CharacterSprite {
  return isCharacterId(id) ? characters[id] : characters[DEFAULT_CHARACTER];
}

/** Bots get a random character. */
export function randomCharacter(random: () => number): CharacterId {
  return characterIds[Math.min(Math.floor(random() * characterIds.length), characterIds.length - 1)];
}
