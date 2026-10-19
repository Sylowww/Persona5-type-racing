import { describe, expect, it } from "vitest";
import { defaultRaceSettings } from "../../src/lib/race-settings";
import { buildRaceText, randomWordPool, stripAccents, stripPunctuation, textComplexity, type CorpusText } from "../../src/lib/text-builder";
import type { RaceSettings } from "../../src/types/lobby";

/** Seeded generator, so texts are reproducible. */
function seeded(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 16_807) % 2_147_483_647;
    return (value - 1) / 2_147_483_646;
  };
}

const settings = (change: Partial<RaceSettings> = {}): RaceSettings => ({ ...defaultRaceSettings, language: "en", ...change });

const corpus: CorpusText[] = [
  { language: "en", body: "The cat sat on the mat. It was a good day.", hasNumbers: false },
  { language: "en", body: "Extraordinary circumstances, unprecedented; extravagant consequences!", hasNumbers: false },
  { language: "en", body: "We met at 11:45 on floor 7.", hasNumbers: true },
  { language: "fr", body: "Le café était très bon, à côté de la forêt.", hasNumbers: false },
];

describe("textComplexity (CONF-05)", () => {
  it("rates passages by word length and special characters", () => {
    expect(textComplexity("The cat sat on the mat")).toBe("easy");
    expect(textComplexity("Extraordinary circumstances, unprecedented; extravagant consequences!")).toBe("hard");
    expect(textComplexity("Every calling card starts with a single keystroke today")).toBe("medium");
  });
});

describe("buildRaceText", () => {
  it("builds random texts of the chosen length from the word list", () => {
    const text = buildRaceText(settings({ textType: "random", wordCount: 30 }), corpus, seeded(1));
    expect(text.split(" ")).toHaveLength(30);
    expect(text.endsWith(".")).toBe(true);
    expect(text[0]).toBe(text[0].toUpperCase());
  });

  it("keeps easy random words short and applies the letter filters", () => {
    expect(randomWordPool(settings({ complexity: "easy" })).every((word) => word.length <= 5)).toBe(true);
    const pool = randomWordPool(settings({ complexity: "hard", includeChars: "k", excludeChars: "e" }));
    expect(pool).toContain("know");
    expect(pool.every((word) => word.includes("k") && !word.includes("e"))).toBe(true);
    // Filters that leave nothing are ignored.
    expect(randomWordPool(settings({ excludeChars: "aeiouy" })).length).toBeGreaterThan(0);
  });

  it("joins coherent passages of the right level and language, cut to the word count", () => {
    const text = buildRaceText(settings({ complexity: "easy", wordCount: 15 }), corpus, seeded(2));
    expect(text.split(" ")).toHaveLength(15);
    expect(text).toContain("cat");
    expect(text).not.toMatch(/\d/);
    expect(buildRaceText(settings({ numbers: true, wordCount: 5 }), corpus, seeded(3))).toMatch(/\d/);
  });

  it("removes punctuation, capitals and accents on demand (CONF-06)", () => {
    const french = settings({ language: "fr", punctuation: false, capitals: false, accents: false, wordCount: 10 });
    expect(buildRaceText(french, corpus, seeded(4))).toBe("le cafe etait tres bon a cote de la foret");
  });

  it("never returns an empty text", () => {
    expect(buildRaceText(settings({ language: "fr", numbers: true }), corpus, seeded(5)).length).toBeGreaterThan(0);
  });
});

describe("text cleanup", () => {
  it("strips accents and punctuation but keeps words whole", () => {
    expect(stripAccents("Élève à l'école, cœur")).toBe("Eleve a l'ecole, cœur");
    expect(stripPunctuation("« Bonjour », dit-il. C'est l'heure !")).toBe("Bonjour dit-il C'est l'heure");
  });
});
