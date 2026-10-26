// Race replays: rebuilds the track at any moment of a finished race from its saved results (each racer's progress
// samples and the spells, calling cards and Ambush of the race). Pure, so the replay player stays a thin view.
import { isSelfSpell, spellById, spellMarkMs } from "./spells";
import type { RaceRacer, RaceResult, ResultRacer, SpellMark } from "@/types/race";

/** Whether the race was saved with what a replay needs (races saved before replays existed were not). */
export function hasReplay(result: RaceResult): boolean {
  return result.events !== undefined && result.racers.some((racer) => racer.samples.some((sample) => sample.progress !== undefined));
}

/** How long the replay runs: until the last racer stopped. */
export function replayDuration(result: RaceResult): number {
  return Math.max(0, ...result.racers.map((racer) => racer.timeMs));
}

/** The racer's progress at `atMs`, between their samples; their final progress once they stopped. */
export function progressAt(racer: ResultRacer, atMs: number): number {
  if (atMs >= racer.timeMs) return racer.finishMs !== null ? 1 : racer.progress;
  let before = { atMs: 0, progress: 0 };
  let after = { atMs: racer.timeMs, progress: racer.finishMs !== null ? 1 : racer.progress };
  for (const sample of racer.samples) {
    if (sample.progress === undefined) continue;
    if (sample.atMs <= atMs) before = { atMs: sample.atMs, progress: sample.progress };
    else {
      after = { atMs: sample.atMs, progress: sample.progress };
      break;
    }
  }
  const span = after.atMs - before.atMs;
  return span <= 0 ? after.progress : before.progress + ((after.progress - before.progress) * (atMs - before.atMs)) / span;
}

function wpmAt(racer: ResultRacer, atMs: number): number {
  if (atMs >= racer.timeMs) return racer.wpm;
  return racer.samples.filter((sample) => sample.atMs <= atMs).at(-1)?.wpm ?? 0;
}

/** The malus on the racer's lane at `atMs`, timed on the replay clock; null when none. */
function markAt(result: RaceResult, racerId: string, atMs: number): SpellMark | null {
  for (const event of [...(result.events ?? [])].reverse()) {
    if (event.type !== "spell" || event.targetId !== racerId || event.atMs > atMs) continue;
    const cast = spellById(event.spell);
    if (!cast || isSelfSpell(cast)) continue;
    const until = event.atMs + spellMarkMs(cast);
    return atMs < until ? { element: cast.element, until } : null;
  }
  return null;
}

/** Every racer on the track at `atMs` after the start, ranked like the live race: finishers first, then by progress. */
export function replayFrame(result: RaceResult, atMs: number): RaceRacer[] {
  const racers = result.racers.map((racer) => {
    const stopped = atMs >= racer.timeMs;
    return {
      id: racer.id,
      name: racer.name,
      emblem: racer.emblem,
      character: racer.character,
      progress: progressAt(racer, atMs),
      wpm: wpmAt(racer, atMs),
      mistakes: 0,
      isFinished: racer.finishMs !== null && atMs >= racer.finishMs,
      isEliminated: stopped && racer.status === "eliminated",
      isForfeited: stopped && racer.status === "forfeited",
      bonuses: (result.events ?? []).filter((event) => event.type === "spell" && event.casterId === racer.id && event.atMs <= atMs).length,
      place: 0,
      mark: markAt(result, racer.id, atMs),
      isBot: false,
      isConnected: true,
    } satisfies RaceRacer;
  });
  const finishMs = (id: string) => result.racers.find((racer) => racer.id === id)?.finishMs ?? 0;
  const ranked = [...racers].sort((a, b) =>
    a.isFinished && b.isFinished ? finishMs(a.id) - finishMs(b.id) : a.isFinished !== b.isFinished ? (a.isFinished ? -1 : 1) : b.progress - a.progress,
  );
  return racers.map((racer) => ({ ...racer, place: ranked.indexOf(racer) + 1 }));
}
