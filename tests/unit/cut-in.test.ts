import { describe, expect, it } from "vitest";
import {
  CUT_IN_TIMELINE,
  RESULTS_CUT_IN_TIMELINE,
  resultsVerdict,
  revealedLength,
  countdownIntro,
} from "../../src/lib/cut-in";

describe("cut-ins", () => {
  it("fits the countdown intro into the time left", () => {
    expect(countdownIntro(3000)).toEqual({ card: true, mona: true });
    expect(countdownIntro(2000)).toEqual({ card: false, mona: true });
    expect(countdownIntro(CUT_IN_TIMELINE.endsAt)).toEqual({ card: false, mona: false });
  });

  it("types the line out between its start and end", () => {
    expect(revealedLength(0, 40)).toBe(0);
    expect(revealedLength(CUT_IN_TIMELINE.typingStartsAt, 40)).toBe(0);
    const middle = (CUT_IN_TIMELINE.typingStartsAt + CUT_IN_TIMELINE.typingEndsAt) / 2;
    expect(revealedLength(middle, 40)).toBe(20);
    expect(revealedLength(CUT_IN_TIMELINE.typingEndsAt + 500, 40)).toBe(40);
  });

  it("judges the results: escaped, last or needs training", () => {
    expect(resultsVerdict(true, 1, 3)).toBe("escaped");
    expect(resultsVerdict(true, 2, 3)).toBe("escaped");
    expect(resultsVerdict(true, 3, 3)).toBe("last");
    expect(resultsVerdict(true, 1, 1)).toBe("escaped");
    expect(resultsVerdict(false, 3, 3)).toBe("training");
  });

  it("follows the given timeline", () => {
    expect(revealedLength(RESULTS_CUT_IN_TIMELINE.typingStartsAt, 20, RESULTS_CUT_IN_TIMELINE)).toBe(0);
    expect(revealedLength(RESULTS_CUT_IN_TIMELINE.typingEndsAt, 20, RESULTS_CUT_IN_TIMELINE)).toBe(20);
  });
});
