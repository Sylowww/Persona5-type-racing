"use client";

import { useState } from "react";
import { overtakers } from "@/lib/race-moments";
import type { RaceRacer } from "@/types/race";

// Presentation-only highlights of the live race. Each hook compares the new values with the ones it saw last
// while rendering (like the race runner), so a highlight starts in the same render as the change.

/** How long a lane flashes after its racer passes the local player. */
const OVERTAKE_FLASH_MS = 900;
/** How long the "All-Out Attack" finish frame stays on screen. */
const FINISH_FRAME_MS = 1500;

/** Ids of the racers whose lane flashes because they just passed the local player. */
export function useOvertakeFlash(racers: readonly RaceRacer[], youId: string, now: number): ReadonlySet<string> {
  const signature = racers.map((racer) => `${racer.id}:${racer.progress}`).join("|");
  const [seen, setSeen] = useState(() => ({
    signature,
    progress: new Map(racers.map((racer) => [racer.id, racer.progress])),
    flashes: new Map<string, number>(),
  }));

  if (signature !== seen.signature) {
    const flashes = new Map([...seen.flashes].filter(([, until]) => until > now));
    for (const id of overtakers(seen.progress, racers, youId)) flashes.set(id, now + OVERTAKE_FLASH_MS);
    setSeen({ signature, progress: new Map(racers.map((racer) => [racer.id, racer.progress])), flashes });
  }

  return new Set([...seen.flashes].filter(([, until]) => until > now).map(([id]) => id));
}

/** True for a moment after the local player finishes on this page (not when a reload finds them finished). */
export function useFinishFrame(finished: boolean, now: number): boolean {
  const [seen, setSeen] = useState({ finished, at: null as number | null });
  if (finished !== seen.finished) setSeen({ finished, at: finished ? now : null });
  return seen.at !== null && now - seen.at < FINISH_FRAME_MS;
}

/**
 * The first racer to reach the exit while this page watched, unless it is the local player
 * (who gets the finish frame instead). Null before, or when someone had already finished on arrival.
 */
export function useFirstFinisher(racers: readonly RaceRacer[], youId: string): RaceRacer | null {
  const [seen, setSeen] = useState(() => ({ done: racers.some((racer) => racer.isFinished), winner: null as RaceRacer | null }));
  const first = racers.find((racer) => racer.isFinished);
  if (!seen.done && first) setSeen({ done: true, winner: first.id === youId ? null : first });
  return seen.winner;
}
