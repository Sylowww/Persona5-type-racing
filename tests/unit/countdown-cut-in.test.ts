import { describe, expect, it } from "vitest";
import { CUT_IN_TIMELINE, cutInLineIndex, revealedLength, shouldPlayCutIn } from "../../src/lib/countdown-cut-in";

describe("countdown cut-in", () => {
  it("plays only when the whole cut-in fits before the start", () => {
    expect(shouldPlayCutIn(3000)).toBe(true);
    expect(shouldPlayCutIn(CUT_IN_TIMELINE.endsAt)).toBe(false);
    expect(shouldPlayCutIn(800)).toBe(false);
  });

  it("picks the same line for a race and stays in range", () => {
    expect(cutInLineIndex(1_700_000_002_500, 3)).toBe(cutInLineIndex(1_700_000_002_900, 3));
    expect(cutInLineIndex(1_700_000_003_000, 3)).not.toBe(cutInLineIndex(1_700_000_002_000, 3));
    expect(cutInLineIndex(123_456, 0)).toBe(0);
  });

  it("types the line out between its start and end", () => {
    expect(revealedLength(0, 40)).toBe(0);
    expect(revealedLength(CUT_IN_TIMELINE.typingStartsAt, 40)).toBe(0);
    const middle = (CUT_IN_TIMELINE.typingStartsAt + CUT_IN_TIMELINE.typingEndsAt) / 2;
    expect(revealedLength(middle, 40)).toBe(20);
    expect(revealedLength(CUT_IN_TIMELINE.typingEndsAt + 500, 40)).toBe(40);
  });
});
