export type PlayerEmblem = "domino" | "cat" | "skull" | "mask";

export type LobbyPlayer = {
  id: string;
  name: string;
  level: number;
  title: string;
  bestWpm: number;
  isHost: boolean;
  isReady: boolean;
  emblem: PlayerEmblem;
};

export type RaceMode = "sprint" | "burst" | "hardcore";

export type BotDifficulty = "rookie" | "master" | "godspeed";

export type KeySound = "clicky" | "tactile" | "silent";

export type LobbySettings = {
  mode: RaceMode;
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

export type Lobby = {
  code: string;
  server: { name: string; pingMs: number };
  capacity: number;
  players: readonly LobbyPlayer[];
  spectators: readonly string[];
  settings: LobbySettings;
  messages: readonly LobbyMessage[];
};
