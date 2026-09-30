import type { RaceView } from "./race";

export type PlayerEmblem = "domino" | "cat" | "skull" | "mask";

/** Lobby lifecycle. `closed` lobbies are simply deleted. */
export type LobbyPhase = "waiting" | "countdown" | "racing" | "finished";

/** A player as every lobby member sees them. */
export type LobbyMember = {
  id: string;
  name: string;
  emblem: PlayerEmblem;
  isHost: boolean;
  isReady: boolean;
  /** False while the player's connection is lost (they keep their seat for a grace period). */
  isConnected: boolean;
  /** Difficulty of a bot; null for human players. */
  bot: BotDifficulty | null;
};

/** Snapshot of a lobby for one viewer, sent by the server on every change. */
export type LobbyView = {
  code: string;
  phase: LobbyPhase;
  capacity: number;
  locale: "fr" | "en";
  youId: string;
  /** Server clock when the snapshot was sent, to align countdowns across clients. */
  serverNow: number;
  players: readonly LobbyMember[];
  race: RaceView | null;
  /** The viewer has results for the last race of this lobby. */
  hasResult: boolean;
};

export type RaceMode = "sprint" | "burst" | "hardcore";

export type BotDifficulty = "rookie" | "master" | "godspeed";

export type KeySound = "clicky" | "tactile" | "silent";

export type LobbySettings = {
  /** Null until race modes exist. */
  mode: RaceMode | null;
  language: string;
  punctuation: boolean;
  numbers: boolean;
  caseSensitive: boolean;
};

export type LobbyMessage = {
  id: string;
  author: string;
  text: string;
};
