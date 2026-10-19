import type { RaceRacer } from "@/types/race";

/**
 * Lane order on the race track: the player first, so their runner never hides below the fold in a full class, then
 * everyone else by live place (the top three, or the next three when the player leads, fill the rest of the view).
 * Spectators, who are not racing, see everyone by place.
 */
export function laneOrder<Racer extends Pick<RaceRacer, "id" | "place">>(racers: readonly Racer[], youId: string): Racer[] {
  const you = racers.filter((racer) => racer.id === youId);
  const others = racers.filter((racer) => racer.id !== youId).sort((a, b) => a.place - b.place);
  return [...you, ...others];
}
