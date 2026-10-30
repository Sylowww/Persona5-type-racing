import { describe, expect, it } from "vitest";
import { appendWords, checkpointsReached, pickBonusReceivers, removeLastWords } from "../../src/lib/bonuses";
import { bigSpellChance, characterPersonas, drawSpell, isSelfSpell, spellPool } from "../../src/lib/spells";

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
    expect(pickBonusReceivers(contenders)).toEqual({ leaderId: "lead", receiverIds: ["last", "far"] });
    // A full class: only the three furthest behind get a spell.
    const crowd = [{ id: "lead", progress: 0.9, bonuses: 0 }, ...Array.from({ length: 10 }, (_, index) => ({ id: `r${index}`, progress: index / 20, bonuses: 0 }))];
    expect(pickBonusReceivers(crowd).receiverIds).toEqual(["r0", "r1", "r2"]);
    // At most three per race.
    expect(pickBonusReceivers(contenders.map((racer) => ({ ...racer, bonuses: 3 }))).receiverIds).toEqual([]);
    // Nobody to catch up with alone.
    expect(pickBonusReceivers([{ id: "solo", progress: 0.5, bonuses: 0 }])).toEqual({ leaderId: null, receiverIds: [] });
  });

  it("draws from one pool for everyone, with better odds of a big spell further behind (Mario Kart style)", () => {
    expect(bigSpellChance(0)).toBe(0.2);
    expect(bigSpellChance(0.25)).toBeCloseTo(0.525);
    expect(bigSpellChance(0.9)).toBe(0.85);
    expect(drawSpell(0.1, () => 0.99).tier).toBe("small");
    expect(drawSpell(0.1, () => 0.1).tier).toBe("big");
    // Every character casts with their own Persona, but none has a spell of their own.
    expect(characterPersonas.panther).toBe("Carmen");
    // At least one spell helps the caster and at least one slows the leader (BONUS-02), in both tiers.
    for (const tier of ["small", "big"] as const) {
      const pool = spellPool.filter((spell) => spell.tier === tier);
      expect(pool.some(isSelfSpell)).toBe(true);
      expect(pool.some((spell) => !isSelfSpell(spell))).toBe(true);
    }
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
