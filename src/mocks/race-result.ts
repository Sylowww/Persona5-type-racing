import type { RaceResult } from "@/types/race";

// Placeholder results until the server computes and stores them.
export const mockRaceResult: RaceResult = {
  youId: "p1",
  durationMs: 30_000,
  keystrokes: 482,
  mistakes: 3,
  racers: [
    { id: "p2", name: "SKULL_CRUSH", emblem: "skull", wpm: 129, accuracy: 0.978, finishMs: 33_400 },
    { id: "p1", name: "JOKER_KEY", emblem: "domino", wpm: 144, accuracy: 0.994, finishMs: 30_000 },
    { id: "p4", name: "MONA_CAT", emblem: "cat", wpm: 105, accuracy: 0.961, finishMs: null },
    { id: "p3", name: "PANTHER_VIP", emblem: "mask", wpm: 124, accuracy: 0.981, finishMs: 34_700 },
  ],
  speedSamples: [
    { atMs: 0, wpm: 8 },
    { atMs: 2_000, wpm: 40 },
    { atMs: 5_000, wpm: 50 },
    { atMs: 8_000, wpm: 64 },
    { atMs: 11_000, wpm: 80 },
    { atMs: 14_000, wpm: 76 },
    { atMs: 17_000, wpm: 120 },
    { atMs: 19_400, wpm: 156 },
    { atMs: 23_000, wpm: 116 },
    { atMs: 26_000, wpm: 124 },
    { atMs: 29_000, wpm: 136 },
    { atMs: 30_000, wpm: 144 },
  ],
  keyStats: [
    ..."wertyuioasdfghjklxcvbnm".split("").map((key) => ({ key, avgDelayMs: 90, mistakes: 0 })),
    { key: "p", avgDelayMs: 140, mistakes: 0 },
    { key: "q", avgDelayMs: 320, mistakes: 1 },
    { key: "z", avgDelayMs: 290, mistakes: 1 },
    { key: ",", avgDelayMs: 150, mistakes: 0 },
    { key: ".", avgDelayMs: 95, mistakes: 0 },
    { key: "!", avgDelayMs: 340, mistakes: 1 },
    { key: " ", avgDelayMs: 80, mistakes: 0 },
  ],
};
