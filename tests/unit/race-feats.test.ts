import { describe, expect, it } from "vitest";
import { initialFeatTracker, ONE_MORE_WORDS, TECHNICAL_WINDOW_MS, trackFeats, type Feat, type FeatTracker } from "../../src/lib/race-feats";
import { deleteChar, initialTypingState, typeChar, type TypingState } from "../../src/lib/typing";

type Step = { char: string; at: number } | { delete: true; at: number };

/** Types the steps and returns every feat earned, with the key index that earned it. */
function run(text: string, steps: readonly Step[], averageWpm = 40): { index: number; feat: Feat }[] {
  let typing: TypingState = initialTypingState;
  let tracker: FeatTracker = initialFeatTracker;
  const earned: { index: number; feat: Feat }[] = [];
  steps.forEach((step, index) => {
    if ("delete" in step) {
      typing = deleteChar(typing);
      return;
    }
    const next = typeChar(typing, text, step.char, step.at);
    const result = trackFeats(tracker, typing, next, text, step.at, averageWpm);
    typing = next;
    tracker = result.tracker;
    for (const feat of result.feats) earned.push({ index, feat });
  });
  return earned;
}

/** Every character of `text`, one key every `gapMs`. */
function typed(text: string, gapMs: number, from = 0): Step[] {
  return [...text].map((char, index) => ({ char, at: from + index * gapMs }));
}

describe("trackFeats", () => {
  it("calls a miss on every wrong key", () => {
    expect(run("cat", [{ char: "x", at: 0 }])).toEqual([{ index: 0, feat: "miss" }]);
  });

  it("calls a technical when a mistake is fixed quickly, not when it takes too long", () => {
    const quick: Step[] = [{ char: "c", at: 0 }, { char: "x", at: 100 }, { delete: true, at: 200 }, { char: "a", at: 300 }];
    expect(run("cat", quick).map(({ feat }) => feat)).toEqual(["miss", "technical"]);

    const slow: Step[] = [{ char: "c", at: 0 }, { char: "x", at: 100 }, { delete: true, at: 200 }, { char: "a", at: 200 + TECHNICAL_WINDOW_MS }];
    expect(run("cat", slow).map(({ feat }) => feat)).toEqual(["miss"]);
  });

  it("calls 1 MORE after enough perfect words in a row", () => {
    const text = Array.from({ length: ONE_MORE_WORDS }, () => "ab").join(" ");
    const feats = run(text, typed(text, 400), 0);
    expect(feats).toEqual([{ index: text.length - 1, feat: "oneMore" }]);
  });

  it("restarts the perfect word count after a mistake", () => {
    const text = Array.from({ length: ONE_MORE_WORDS }, () => "ab").join(" ");
    const steps: Step[] = [{ char: "x", at: 0 }, { delete: true, at: 50 }, ...typed(text, 400, 100)];
    expect(run(text, steps, 0).map(({ feat }) => feat)).toEqual(["miss", "technical"]);
  });

  it("calls a critical on a long perfect word typed well above the average speed", () => {
    // "quick " in 500 ms is about 120 WPM.
    expect(run("quick fox", typed("quick ", 100), 40).map(({ feat }) => feat)).toEqual(["critical"]);
    expect(run("quick fox", typed("quick ", 100), 100).map(({ feat }) => feat)).toEqual([]);
    expect(run("go now", typed("go ", 10), 40).map(({ feat }) => feat)).toEqual([]);
  });
});
