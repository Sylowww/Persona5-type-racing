import type { CharacterId } from "./character";
import type { PlayerEmblem, RaceMode } from "./lobby";

export type RaceRacer = {
  id: string;
  name: string;
  emblem: PlayerEmblem;
  character: CharacterId;
  /** Share of the text completed, from 0 to 1. */
  progress: number;
  wpm: number;
  /** Mistakes made so far; only used to animate the runner. */
  mistakes: number;
  isFinished: boolean;
  /** Out of the race after a mistake in sudden death. */
  isEliminated: boolean;
  /** Gave up the race (COURSE-07). */
  isForfeited: boolean;
  /** Catch-up bonuses received so far. */
  bonuses: number;
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
  eliminatedAt: number | null;
  forfeitedAt: number | null;
  /** A hex blurring the next words (fire, psy, light, curse); null otherwise. */
  hex: SpellMark | null;
  /** A stun (shock or ice): keys do nothing until it ends; null otherwise. */
  stun: SpellMark | null;
};

/** Persona skills cast as catch-up bonuses (`lib/spells.ts`). Names come from Persona 5 and are not translated. */
export type SpellId = "garu" | "zio" | "agi" | "bufu" | "frei" | "navi" | "psi" | "kouga" | "swordDance" | "eiga" | "mediarama";

/** Visual family of a spell: its color, icon and effect on the target. */
export type SpellElement = "wind" | "elec" | "fire" | "ice" | "nuclear" | "support" | "psy" | "bless" | "phys" | "curse" | "heal";

/** A spell effect still running on a racer, shown on their screen. */
export type SpellMark = { element: SpellElement; until: number };

/** A catch-up spell just cast, announced on the track and in a cut-in (BONUS-03). */
export type RaceBonusEvent = {
  id: number;
  spell: SpellId;
  element: SpellElement;
  /** The Persona that cast it (Arsène when Joker's Wild Card picked another character's spell). */
  persona: string;
  wildCard: boolean;
  receiverId: string;
  receiver: string;
  receiverCharacter: CharacterId;
  /** The receiver for a support spell, the leader otherwise. */
  targetId: string;
  target: string;
};

/** Race part of a lobby snapshot. Times are server epoch milliseconds. */
export type RaceView = {
  text: string;
  /** When the countdown ends and typing opens; the race clock starts here. */
  startsAt: number;
  /** Time limit: the race ends at this moment even if racers are still typing. */
  endsAt: number;
  /** False when the lobby chose no time limit (`endsAt` is then only a safety cap). */
  isTimed: boolean;
  mode: RaceMode;
  caseSensitive: boolean;
  /** Catch-up bonuses are on for this race (CONF-09). */
  bonusesOn: boolean;
  /** Bonuses handed out in the last few seconds. */
  bonusEvents: readonly RaceBonusEvent[];
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

/**
 * How a racer's race ended (RES-02). `timeout`: still typing when the race ended. `forfeited`: gave up, left, or stayed
 * disconnected past the grace period (COURSE-07, COURSE-08). `eliminated`: knocked out in sudden death.
 */
export type RacerStatus = "finished" | "timeout" | "eliminated" | "forfeited";

export type ResultRacer = {
  id: string;
  name: string;
  emblem: PlayerEmblem;
  /** Character the racer raced as; the podium shows its portrait. */
  character: CharacterId;
  /** Net WPM: correct characters only (annex A). */
  wpm: number;
  /** Raw WPM: every typed character (annex A). */
  rawWpm: number;
  /** From 0 to 1. */
  accuracy: number;
  mistakes: number;
  /** Share of the text validated when the racer stopped, from 0 to 1. */
  progress: number;
  /** Catch-up bonuses received. */
  bonuses: number;
  /** Race time in ms; null if the racer did not finish. */
  finishMs: number | null;
  /** Time the racer spent in the race, in ms (until they finished, stopped or the race ended). */
  timeMs: number;
  status: RacerStatus;
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
  /** When the race ended, server epoch milliseconds. */
  endedAt: number;
  durationMs: number;
  keystrokes: number;
  mistakes: number;
  racers: readonly ResultRacer[];
  speedSamples: readonly SpeedSample[];
  keyStats: readonly KeyStat[];
};

/** One finished race in a player's history. */
export type RaceRecord = {
  /** When the race ended, epoch milliseconds. */
  endedAt: number;
  /** 1-based final place. */
  place: number;
  racerCount: number;
  wpm: number;
  /** From 0 to 1. */
  accuracy: number;
  /** Race time in ms; null if the player did not finish. */
  finishMs: number | null;
};

export type PlayerStats = {
  races: number;
  bestWpm: number;
  averageWpm: number;
  /** Average accuracy over the races, from 0 to 1. */
  accuracy: number;
};
