import { describe, expect, it } from "vitest";
import { appendWords, bonusFor, checkpointsReached, pickBonusReceivers, removeLastWords } from "../../src/lib/bonuses";

describe("catch-up bonuses", () => {
  it("counts the checkpoints passed by the leader", () => {
    expect(checkpointsReached(0.2)).toBe(0);
    expect(checkpointsReached(0.25)).toBe(1);
    expect(checkpointsReached(0.6)).toBe(2);
    expect(checkpointsReached(1)).toBe(3);
  });

  it("gives bonuses to the last racer and anyone over 25 points behind, never to the leader", () => {
    const contenders = [
      { id: "lead", progress: 0.6, bonuses: 0 },
      { id: "close", progress: 0.5, bonuses: 0 },
      { id: "far", progress: 0.3, bonuses: 0 },
      { id: "last", progress: 0.2, bonuses: 0 },
    ];
    expect(pickBonusReceivers(contenders)).toEqual({ leaderId: "lead", receiverIds: ["far", "last"] });
    // At most three per race.
    expect(pickBonusReceivers(contenders.map((racer) => ({ ...racer, bonuses: 3 }))).receiverIds).toEqual([]);
    // Nobody to catch up with alone.
    expect(pickBonusReceivers([{ id: "solo", progress: 0.5, bonuses: 0 }])).toEqual({ leaderId: null, receiverIds: [] });
  });

  it("rotates through the bonus kinds", () => {
    expect([0, 1, 2].map((checkpoint) => bonusFor(checkpoint, 0))).toEqual(["shortcut", "burden", "fog"]);
    expect(bonusFor(0, 1)).toBe("burden");
  });

  it("removes words from the end without touching the word being typed", () => {
    const text = "one two three four five six";
    expect(removeLastWords(text, 0)).toBe("one two three");
    // Typing "fiv": only "six" is after the current word.
    expect(removeLastWords(text, 21)).toBe("one two three four five");
    expect(removeLastWords(text, 25)).toBe(text);
  });

  it("adds words from the race text at the end", () => {
    const added = appendWords("go now", "alpha beta gamma delta", 1);
    expect(added.startsWith("go now ")).toBe(true);
    expect(added.split(" ")).toHaveLength(5);
    expect(appendWords("go", "", 1)).toBe("go");
  });
});
