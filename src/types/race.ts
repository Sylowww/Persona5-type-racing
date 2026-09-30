import type { PlayerEmblem } from "./lobby";

export type RaceRacer = {
  id: string;
  name: string;
  title: string;
  emblem: PlayerEmblem;
  /** Share of the text completed, from 0 to 1. */
  progress: number;
  wpm: number;
};

export type Race = {
  text: string;
  /** Id of the racer controlled by this client. */
  youId: string;
  racers: readonly RaceRacer[];
};

export type ResultRacer = {
  id: string;
  name: string;
  title: string;
  emblem: PlayerEmblem;
  wpm: number;
  /** From 0 to 1. */
  accuracy: number;
  /** Race time in ms; null if the racer did not finish. */
  finishMs: number | null;
};

/** Speed of the local player at one moment of the race. */
export type SpeedSample = {
  atMs: number;
  wpm: number;
};

/** Typing stats for one key over the race. */
export type KeyStat = {
  key: string;
  /** Average delay before pressing this key, in ms. */
  avgDelayMs: number;
  mistakes: number;
};

export type RaceResult = {
  youId: string;
  durationMs: number;
  keystrokes: number;
  mistakes: number;
  racers: readonly ResultRacer[];
  speedSamples: readonly SpeedSample[];
  keyStats: readonly KeyStat[];
};
