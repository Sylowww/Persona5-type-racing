import type { Race } from "@/types/race";

// Placeholder race until races are created and synced by the server.
export const mockRace: Race = {
  text: "The world is full of corrupt adults with distorted desires who claim they own our future. We steal their twisted hearts, shatter their false reality, and rewrite destiny with absolute precision. Show no mercy!",
  youId: "p1",
  racers: [
    { id: "p1", name: "JOKER_KEY", title: "APEX TYPIST", emblem: "domino", progress: 0, wpm: 0 },
    { id: "p2", name: "SKULL_CRUSH", title: "BRAWLER SWITCH", emblem: "skull", progress: 0.46, wpm: 128 },
    { id: "p3", name: "PANTHER_VIP", title: "WHIP CLICKS", emblem: "mask", progress: 0.41, wpm: 122 },
    { id: "p4", name: "MONA_CAT", title: "STEALTH KEY", emblem: "cat", progress: 0.32, wpm: 105 },
  ],
};
