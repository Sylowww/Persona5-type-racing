import type { CharacterId } from "./character";
import type { RaceView } from "./race";

export type PlayerEmblem = "domino" | "cat" | "skull" | "mask";

/**
 * `custom`: created from the home button and joined with its code. `quick`: a 1v1 made by matchmaking.
 * `training`: a solo practice race, never saved. Quick and training lobbies cannot be joined with their code.
 */
export type LobbyKind = "custom" | "quick" | "training";

/**
 * Who can join a custom lobby (SALLE-03). `public`: listed in the lobby browser and joined directly or with the code.
 * `code`: not listed, joined with the code or an invite link. `private`: invite link only.
 */
export type LobbyVisibility = "public" | "code" | "private";

/** A public lobby as the lobby browser lists it. */
export type PublicLobby = {
  code: string;
  hostName: string;
  playerCount: number;
  capacity: number;
  phase: LobbyPhase;
  settings: RaceSettings;
};

/** Lobby lifecycle. `closed` lobbies are simply deleted. */
export type LobbyPhase = "waiting" | "countdown" | "racing" | "finished";

/** A player as every lobby member sees them. */
export type LobbyMember = {
  id: string;
  name: string;
  emblem: PlayerEmblem;
  /** Character the player races as; their card shows its portrait. */
  character: CharacterId;
  isHost: boolean;
  isReady: boolean;
  /** False while the player's connection is lost (they keep their seat for a grace period). */
  isConnected: boolean;
  /** Difficulty of a bot; null for human players. */
  bot: BotDifficulty | null;
  /** Follows the race without typing and takes no seat. */
  isSpectator: boolean;
};

/** An invite link as its lobby's host sees it (SALLE-04). */
export type LobbyInvite = {
  token: string;
  /** Who used the link first; null while unused. */
  usedBy: string | null;
  /** Revoked when its player was kicked. */
  isRevoked: boolean;
};

/** Snapshot of a lobby for one viewer, sent by the server on every change. */
export type LobbyView = {
  code: string;
  kind: LobbyKind;
  visibility: LobbyVisibility;
  phase: LobbyPhase;
  capacity: number;
  youId: string;
  /** Server clock when the snapshot was sent, to align countdowns across clients. */
  serverNow: number;
  players: readonly LobbyMember[];
  race: RaceView | null;
  /** The viewer has results for the last race of this lobby. */
  hasResult: boolean;
  /** Rules of the next race; only the host changes them, while the lobby is waiting. */
  settings: RaceSettings;
  /** Latest chat messages, oldest first. */
  messages: readonly LobbyMessage[];
  /** Invite links of a custom lobby, for its host only; null for everyone else. */
  invites: readonly LobbyInvite[] | null;
};

/**
 * How mistakes work (CONF-08). `normal`: a wrong character stays and must be erased before finishing. `blocking`
 * (correction obligatoire): a wrong key is counted but the cursor does not move until the right one is typed.
 * `free` (libre): a wrong character is counted and the racer just keeps going. `suddenDeath`: the first mistake
 * eliminates the racer.
 */
export type RaceMode = "normal" | "blocking" | "free" | "suddenDeath";

/** Five bot levels (BOT-01), slowest first. */
export type BotDifficulty = "noob" | "novice" | "rookie" | "master" | "godspeed";

export type KeySound = "clicky" | "tactile" | "silent";

/** `coherent`: real passages from the corpus. `random`: words drawn from a word list (CONF-03). */
export type TextType = "coherent" | "random";

/** Measurable difficulty of a text (CONF-05); criteria in `lib/text-builder.ts`. */
export type TextComplexity = "easy" | "medium" | "hard";

export type RaceSettings = {
  mode: RaceMode;
  /** Catch-up bonuses on (CONF-09). */
  powers: boolean;
  /** Race time limit in seconds; null for no limit. */
  timeLimitSec: number | null;
  /** Digits in the text. */
  numbers: boolean;
  /** When false, a letter typed in the wrong case counts as correct. */
  caseSensitive: boolean;
  /** Language of the race text, independent of the interface language. */
  language: "fr" | "en";
  textType: TextType;
  /** Length of the text in words (CONF-04). */
  wordCount: number;
  complexity: TextComplexity;
  /** Punctuation, capitals and (French) accents kept in the text (CONF-06). */
  punctuation: boolean;
  capitals: boolean;
  accents: boolean;
  /** Random texts only (CONF-07): words must contain one of these letters / none of those. Empty when unused. */
  includeChars: string;
  excludeChars: string;
};

export type LobbyMessage = {
  id: string;
  authorId: string;
  author: string;
  text: string;
};
