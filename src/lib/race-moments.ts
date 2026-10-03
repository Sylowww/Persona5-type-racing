// Notable moments of a race for the local player, used only for presentation (Mona's comments, effects).
// Pure functions: the race page feeds them snapshots of values the server already sent.

export type RaceMoment = "finished" | "chaos" | "finalStretch" | "overtaken" | "overtook" | "fumble" | "streak";

/** Highest priority first: when several moments happen together, Mona comments on the first. */
export const MOMENT_PRIORITY: readonly RaceMoment[] = [
  "finished",
  "chaos",
  "finalStretch",
  "overtaken",
  "overtook",
  "fumble",
  "streak",
];

/** Moments important enough to interrupt the cooldown between two comments. */
const URGENT: ReadonlySet<RaceMoment> = new Set(["finished", "chaos"]);

/** Minimum time between two of Mona's comments, so she does not talk over herself. */
export const COMMENT_COOLDOWN_MS = 3500;

/** A streak comment every this many correct keys in a row. */
export const STREAK_STEP = 40;

/** Share of the text where the final stretch starts. */
export const FINAL_STRETCH = 0.9;

/** Mistakes within `FUMBLE_WINDOW_MS` that count as a fumble. */
const FUMBLE_MISTAKES = 3;
const FUMBLE_WINDOW_MS = 2000;

export type MomentSnapshot = {
  /** 1-based live place, from the server. */
  place: number;
  streak: number;
  progress: number;
  finished: boolean;
  chaos: boolean;
  /** Mistakes made in the last `FUMBLE_WINDOW_MS` (see `recentMistakes`). */
  recentMistakes: number;
};

/** Moments between two snapshots of the local player. */
export function detectMoments(previous: MomentSnapshot, next: MomentSnapshot): RaceMoment[] {
  const moments: RaceMoment[] = [];
  if (next.finished && !previous.finished) moments.push("finished");
  if (next.finished) return moments;
  if (next.chaos && !previous.chaos) moments.push("chaos");
  if (next.progress >= FINAL_STRETCH && previous.progress < FINAL_STRETCH) moments.push("finalStretch");
  if (next.place > previous.place) moments.push("overtaken");
  if (next.place < previous.place) moments.push("overtook");
  if (next.recentMistakes >= FUMBLE_MISTAKES && previous.recentMistakes < FUMBLE_MISTAKES) moments.push("fumble");
  if (Math.floor(next.streak / STREAK_STEP) > Math.floor(previous.streak / STREAK_STEP)) moments.push("streak");
  return moments;
}

/** The moment Mona should comment on now, or null (nothing new, or still in the cooldown). */
export function pickComment(moments: readonly RaceMoment[], lastCommentAt: number | null, now: number): RaceMoment | null {
  const [first] = [...moments].sort((a, b) => MOMENT_PRIORITY.indexOf(a) - MOMENT_PRIORITY.indexOf(b));
  if (!first) return null;
  const cooling = lastCommentAt !== null && now - lastCommentAt < COMMENT_COOLDOWN_MS;
  return cooling && !URGENT.has(first) ? null : first;
}

/** Mistake times still inside the fumble window, after a mistake at `now` when `addMistake` is true. */
export function recentMistakes(times: readonly number[], now: number, addMistake = false): number[] {
  const kept = times.filter((time) => now - time < FUMBLE_WINDOW_MS);
  return addMistake ? [...kept, now] : kept;
}

/** Ids of the racers who just passed the local player (were behind or level, are now strictly ahead). */
export function overtakers(
  previous: ReadonlyMap<string, number>,
  racers: readonly { id: string; progress: number }[],
  youId: string,
): string[] {
  const you = racers.find((racer) => racer.id === youId);
  const youBefore = previous.get(youId);
  if (!you || youBefore === undefined) return [];
  return racers
    .filter((racer) => {
      const before = previous.get(racer.id);
      return racer.id !== youId && before !== undefined && before <= youBefore && racer.progress > you.progress;
    })
    .map((racer) => racer.id);
}

/** How strongly the exit glows at the end of the track, from 0 to 1, as the leader nears the finish. */
export function exitGlow(leaderProgress: number): number {
  const progress = Math.min(1, Math.max(0, leaderProgress));
  return progress * progress;
}
