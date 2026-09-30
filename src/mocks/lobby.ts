import type { Lobby } from "@/types/lobby";

// Placeholder lobby until lobbies are created and synced by the server.
export const mockLobby: Lobby = {
  code: "P5-JOK3",
  server: { name: "TOKYO", pingMs: 12 },
  capacity: 6,
  players: [
    { id: "p1", name: "JOKER_KEY", level: 48, title: "APEX TYPIST", bestWpm: 142, isHost: true, isReady: true, emblem: "domino" },
    { id: "p2", name: "MONA_CAT", level: 39, title: "STEALTH KEY", bestWpm: 118, isHost: false, isReady: true, emblem: "cat" },
    { id: "p3", name: "SKULL_CRUSH", level: 42, title: "BRAWLER SWITCH", bestWpm: 125, isHost: false, isReady: false, emblem: "skull" },
    { id: "p4", name: "PANTHER_VIP", level: 45, title: "WHIP CLICKS", bestWpm: 131, isHost: false, isReady: true, emblem: "mask" },
  ],
  spectators: ["SHADOW_EYE", "PROTO_99"],
  settings: { mode: "burst", language: "English 1K", punctuation: true, numbers: true, caseSensitive: false },
  messages: [
    { id: "m1", author: "MONA_CAT", text: "Ready whenever, don't miss the first comma!" },
    { id: "m2", author: "JOKER_KEY", text: "Locking in 140+ pace. Stay sharp." },
  ],
};
