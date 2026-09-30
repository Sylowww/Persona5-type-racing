import { describe, expect, it } from "vitest";
import {
  accuracy,
  charStatus,
  deleteChar,
  initialTypingState,
  placeOf,
  progress,
  splitWords,
  typeChar,
  wordsPerMinute,
  type TypingState,
} from "../../src/lib/typing";

function typeAll(text: string, input: string): TypingState {
  return [...input].reduce((state, char, index) => typeChar(state, text, char, index * 100), initialTypingState);
}

describe("typing", () => {
  it("counts mistakes and resets the streak", () => {
    const state = typeAll("abc", "axc");
    expect(state).toMatchObject({ typed: "axc", keystrokes: 3, mistakes: 1, streak: 1, startedAt: 0, finishedAt: null });
  });

  it("keeps mistakes after a correction and finishes on the exact text", () => {
    const corrected = typeChar(deleteChar(typeAll("ab", "ax")), "ab", "b", 500);
    expect(corrected).toMatchObject({ typed: "ab", mistakes: 1, finishedAt: 500 });
    expect(typeChar(corrected, "ab", "c", 600)).toBe(corrected);
    expect(deleteChar(corrected)).toBe(corrected);
  });

  it("does not type past the end of the text", () => {
    const state = typeAll("ab", "xy");
    expect(typeChar(state, "ab", "z", 1000)).toBe(state);
  });

  it("reports character status and progress up to the first error", () => {
    expect(["a", "b", "c"].map((_, index) => charStatus("abc", "ax", index))).toEqual(["correct", "incorrect", "pending"]);
    expect(progress("abcd", "abxd")).toBe(0.5);
    expect(progress("", "")).toBe(0);
  });

  it("computes WPM and accuracy", () => {
    expect(wordsPerMinute(50, 60_000)).toBe(10);
    expect(wordsPerMinute(50, 0)).toBe(0);
    expect(accuracy(0, 0)).toBe(1);
    expect(accuracy(10, 1)).toBe(0.9);
  });

  it("ranks by progress, earlier racer first on a tie", () => {
    const racers = [
      { id: "a", progress: 0.5 },
      { id: "b", progress: 0.8 },
      { id: "c", progress: 0.5 },
    ];
    expect(placeOf(racers, "b")).toBe(1);
    expect(placeOf(racers, "a")).toBe(2);
    expect(placeOf(racers, "c")).toBe(3);
  });

  it("splits words with their trailing space and start index", () => {
    expect(splitWords("ab cd  e")).toEqual([
      { start: 0, chars: "ab " },
      { start: 3, chars: "cd  " },
      { start: 7, chars: "e" },
    ]);
  });
});
