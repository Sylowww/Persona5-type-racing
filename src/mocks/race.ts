import type { Race } from "@/types/race";

// Placeholder race until races are created and synced by the server.
export const mockRace: Race = {
  text: "The world is full of corrupt adults with distorted desires who claim they own our future. We steal their twisted hearts, shatter their false reality, and rewrite destiny with absolute precision. Show no mercy!",
  youId: "p1",
  racers: [
    { id: "p1", name: "JOKER_KEY", emblem: "domino", progress: 0, wpm: 0, isFinished: false, isConnected: true },
    { id: "p2", name: "SKULL_CRUSH", emblem: "skull", progress: 0.46, wpm: 128, isFinished: false, isConnected: true },
    { id: "p3", name: "PANTHER_VIP", emblem: "mask", progress: 0.41, wpm: 122, isFinished: false, isConnected: true },
    { id: "p4", name: "MONA_CAT", emblem: "cat", progress: 0.32, wpm: 105, isFinished: false, isConnected: true },
  ],
};
