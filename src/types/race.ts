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
