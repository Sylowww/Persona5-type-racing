/** Local typing progress for one player. The server will re-validate everything competitive. */
export type TypingState = {
  typed: string;
  keystrokes: number;
  mistakes: number;
  /** Correct keystrokes in a row since the last mistake. */
  streak: number;
  startedAt: number | null;
  finishedAt: number | null;
};

export type CharStatus = "correct" | "incorrect" | "pending";

export const initialTypingState: TypingState = {
  typed: "",
  keystrokes: 0,
  mistakes: 0,
  streak: 0,
  startedAt: null,
  finishedAt: null,
};

export function isFinished(state: TypingState): boolean {
  return state.finishedAt !== null;
}

/** Adds one typed character. The race ends once the whole text is typed without errors. */
export function typeChar(state: TypingState, text: string, char: string, now: number): TypingState {
  if (isFinished(state) || state.typed.length >= text.length) return state;

  const isCorrect = text[state.typed.length] === char;
  const typed = state.typed + char;
  return {
    typed,
    keystrokes: state.keystrokes + 1,
    mistakes: state.mistakes + (isCorrect ? 0 : 1),
    streak: isCorrect ? state.streak + 1 : 0,
    startedAt: state.startedAt ?? now,
    finishedAt: typed === text ? now : null,
  };
}

/**
 * The character to record for a keystroke. When case does not matter, a letter typed in the wrong case
 * is stored as the expected one, so every later comparison treats it as correct.
 */
export function normalizeTypedChar(expected: string | undefined, char: string, caseSensitive: boolean): string {
  if (caseSensitive || expected === undefined) return char;
  return char.toLowerCase() === expected.toLowerCase() ? expected : char;
}

/** Removes the last typed character; mistakes already made still count. */
export function deleteChar(state: TypingState): TypingState {
  if (isFinished(state) || state.typed.length === 0) return state;
  return { ...state, typed: state.typed.slice(0, -1) };
}

export function charStatus(text: string, typed: string, index: number): CharStatus {
  if (index >= typed.length) return "pending";
  return typed[index] === text[index] ? "correct" : "incorrect";
}

/** Characters matching the text, counted from the start up to the first error. */
export function correctPrefixLength(text: string, typed: string): number {
  let index = 0;
  while (index < typed.length && typed[index] === text[index]) index++;
  return index;
}

export function progress(text: string, typed: string): number {
  return text.length === 0 ? 0 : correctPrefixLength(text, typed) / text.length;
}

/** Standard WPM: five characters per word, correct characters only. */
export function wordsPerMinute(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return correctChars / 5 / (elapsedMs / 60_000);
}

/** Share of keystrokes that were correct, from 0 to 1; 1 before any keystroke. */
export function accuracy(keystrokes: number, mistakes: number): number {
  return keystrokes === 0 ? 1 : (keystrokes - mistakes) / keystrokes;
}

/** 1-based place of a racer, ordered by progress. On a tie, the racer listed first ranks higher. */
export function placeOf(racers: readonly { id: string; progress: number }[], id: string): number {
  const index = racers.findIndex((racer) => racer.id === id);
  if (index === -1) return racers.length + 1;

  const own = racers[index].progress;
  const ahead = racers.filter(
    (racer, otherIndex) => racer.progress > own || (racer.progress === own && otherIndex < index),
  );
  return ahead.length + 1;
}

/** Splits the text into words that keep their trailing space, with each word's start index. */
export function splitWords(text: string): { start: number; chars: string }[] {
  return (text.match(/\S+\s*|\s+/g) ?? []).map((chars, index, words) => ({
    start: words.slice(0, index).reduce((length, word) => length + word.length, 0),
    chars,
  }));
}
