// Timeline of the short cut-in played during the race countdown (a Phantom Thief shouting to run).
// All times are in ms from the moment the cut-in appears.

/** The band slides in, the line is typed out, then the character runs off and the band leaves before "GO". */
export const CUT_IN_TIMELINE = {
  typingStartsAt: 300,
  typingEndsAt: 1300,
  runsOffAt: 1750,
  leavesAt: 1950,
  endsAt: 2300,
} as const;

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
export function revealedLength(elapsedMs: number, length: number): number {
  const { typingStartsAt, typingEndsAt } = CUT_IN_TIMELINE;
  const share = (elapsedMs - typingStartsAt) / (typingEndsAt - typingStartsAt);
  return Math.round(Math.min(1, Math.max(0, share)) * length);
}
