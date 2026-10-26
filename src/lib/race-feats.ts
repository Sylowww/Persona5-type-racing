// Typing feats of the local player, shown as Persona 5 style popups ("MISS", "TECHNICAL!", "CRITICAL", "1 MORE!").
// Presentation only: the race page feeds them each keystroke it already applied; the server never reads them.
import { correctPrefixLength, type TypingState } from "./typing";

/**
 * `miss`: a wrong key. `technical`: a mistake fixed quickly. `critical`: a perfect word typed well above the racer's
 * average speed. `oneMore`: every `ONE_MORE_WORDS` perfect words in a row.
 */
export type Feat = "miss" | "technical" | "critical" | "oneMore";

/** A mistake fixed within this time is a technical. */
export const TECHNICAL_WINDOW_MS = 1_500;
/** Perfect words in a row for a "1 MORE!". */
export const ONE_MORE_WORDS = 5;
/** A perfect word this many times faster than the racer's average speed is a critical. */
export const CRITICAL_SPEEDUP = 1.4;
/** Short words are too quick to measure: they are never critical. */
const CRITICAL_MIN_LENGTH = 4;

export type FeatTracker = {
  /** When the word being typed started (the previous word's end, or the first key). */
  wordStartAt: number | null;
  /** Mistakes made before the word being typed. */
  mistakesBeforeWord: number;
  perfectWords: number;
  /** A mistake still waiting to be fixed, and when it was made. */
  pendingMistakeAt: number | null;
};

export const initialFeatTracker: FeatTracker = { wordStartAt: null, mistakesBeforeWord: 0, perfectWords: 0, pendingMistakeAt: null };

/**
 * Feats earned by one typed character, from the typing state before and after it. `averageWpm` is the racer's speed so
 * far, the reference for a critical.
 */
export function trackFeats(
  tracker: FeatTracker,
  before: TypingState,
  after: TypingState,
  text: string,
  now: number,
  averageWpm: number,
): { tracker: FeatTracker; feats: Feat[] } {
  if (after.keystrokes === before.keystrokes) return { tracker, feats: [] };
  const wordStartAt = tracker.wordStartAt ?? now;

  if (after.mistakes > before.mistakes) {
    return { tracker: { ...tracker, wordStartAt, perfectWords: 0, pendingMistakeAt: tracker.pendingMistakeAt ?? now }, feats: ["miss"] };
  }

  const feats: Feat[] = [];
  let pendingMistakeAt = tracker.pendingMistakeAt;
  const isClean = correctPrefixLength(text, after.typed) === after.typed.length;
  if (pendingMistakeAt !== null && isClean) {
    if (now - pendingMistakeAt <= TECHNICAL_WINDOW_MS) feats.push("technical");
    pendingMistakeAt = null;
  }

  // A word ends on its trailing space, or on the last character of the text.
  const index = after.typed.length - 1;
  const endsWord = isClean && (text[index] === " " || after.typed.length === text.length);
  if (!endsWord) return { tracker: { ...tracker, wordStartAt, pendingMistakeAt }, feats };

  const isPerfect = after.mistakes === tracker.mistakesBeforeWord;
  const perfectWords = isPerfect ? tracker.perfectWords + 1 : 0;
  if (isPerfect) {
    const word = text.slice(text.lastIndexOf(" ", index - 1) + 1, index + 1).trim();
    const wordWpm = word.length / 5 / (Math.max(1, now - wordStartAt) / 60_000);
    if (word.length >= CRITICAL_MIN_LENGTH && averageWpm > 0 && wordWpm >= averageWpm * CRITICAL_SPEEDUP) feats.push("critical");
    if (perfectWords % ONE_MORE_WORDS === 0) feats.push("oneMore");
  }
  return { tracker: { wordStartAt: now, mistakesBeforeWord: after.mistakes, perfectWords, pendingMistakeAt }, feats };
}
