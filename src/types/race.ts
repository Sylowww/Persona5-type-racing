import type { CharacterId } from "./character";
import type { PlayerEmblem } from "./lobby";

export type RaceRacer = {
  id: string;
  name: string;
  emblem: PlayerEmblem;
  character: CharacterId;
  /** Share of the text completed, from 0 to 1. */
  progress: number;
  wpm: number;
  isFinished: boolean;
  isBot: boolean;
  isConnected: boolean;
};

/** The local player's own race progress, as the server last validated it. */
export type RaceYou = {
  typed: string;
  keystrokes: number;
  mistakes: number;
  streak: number;
  /** Page (input client) whose keystrokes the server applies; a reloaded page takes over with a new id. */
  inputClient: string | null;
  /** Last batch applied from that client. */
  inputSeq: number;
  /** 1-based live place. */
  place: number;
  finishedAt: number | null;
};

/** Race part of a lobby snapshot. Times are server epoch milliseconds. */
export type RaceView = {
  text: string;
  /** When the countdown ends and typing opens; the race clock starts here. */
  startsAt: number;
  /** Time limit: the race ends at this moment even if racers are still typing. */
  endsAt: number;
  /** In the order players joined, so lanes do not jump around. */
  racers: readonly RaceRacer[];
  /** Null when the viewer is not racing (e.g. joined after the start). */
  you: RaceYou | null;
};

/** One typing action sent by the client; the server replays it with the shared typing logic. */
export type InputEvent =
  | {
      type: "char";
      char: string;
      /** Client-measured delay since the previous key, in ms. Only used for the heatmap. */
      delayMs: number;
    }
  | { type: "delete" };

export type InputBatch = {
  /** Random id of the page sending input. */
  clientId: string;
  /** Starts at 1 on each page and increases by one per batch; lets the server ignore a batch it already applied. */
  seq: number;
  events: readonly InputEvent[];
};

export type ResultRacer = {
  id: string;
  name: string;
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
