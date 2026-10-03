// Timelines of the Persona-style cut-ins: Mona shouting to run during the race countdown, and her verdict on
// the results page. All times are in ms from the moment the cut-in appears.

export type CutInTimeline = { typingStartsAt: number; typingEndsAt: number; leavesAt: number; endsAt: number };

/** Countdown: the band slides in, the line is typed out, then the character runs off and the band leaves before "GO". */
export const CUT_IN_TIMELINE = {
  typingStartsAt: 300,
  typingEndsAt: 1300,
  runsOffAt: 1750,
  leavesAt: 1950,
  endsAt: 2300,
} as const satisfies CutInTimeline & { runsOffAt: number };

/** Results: waits for the collapse wedges to open, then stays long enough to be read. */
export const RESULTS_CUT_IN_TIMELINE = {
  /** Delay after the results page appears (the wedges open in 900 ms). */
  delay: 950,
  typingStartsAt: 350,
  typingEndsAt: 1350,
  leavesAt: 4300,
  endsAt: 4650,
} as const satisfies CutInTimeline & { delay: number };

/** Margin kept before the race starts, so the cut-in never hides the start. */
const START_MARGIN_MS = 100;

/** Only played when the countdown has enough time left for the whole cut-in (e.g. not after a late reload). */
export function shouldPlayCutIn(remainingMs: number): boolean {
  return remainingMs >= CUT_IN_TIMELINE.endsAt + START_MARGIN_MS;
}

/** Same line for every racer of a race, changing from race to race. */
export function cutInLineIndex(startsAt: number, lineCount: number): number {
  if (lineCount <= 0) return 0;
  return Math.floor(startsAt / 1000) % lineCount;
}

/** Number of characters of the line shown at `elapsedMs` (typewriter effect). */
export function revealedLength(elapsedMs: number, length: number, timeline: CutInTimeline = CUT_IN_TIMELINE): number {
  const { typingStartsAt, typingEndsAt } = timeline;
  const share = (elapsedMs - typingStartsAt) / (typingEndsAt - typingStartsAt);
  return Math.round(Math.min(1, Math.max(0, share)) * length);
}
