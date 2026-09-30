import { describe, expect, it } from "vitest";
import { generateLobbyCode, generateUniqueLobbyCode, normalizeLobbyCode } from "../../src/lib/lobby-code";
import { pickRaceText, raceTexts } from "../../src/lib/race-texts";

/** Returns the given indexes in order, then repeats the last one. */
function sequence(...values: number[]) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

describe("lobby codes", () => {
  it("builds a P5- code from the alphabet", () => {
    expect(generateLobbyCode(sequence(0, 1, 2, 31))).toBe("P5-ABC9");
    expect(generateLobbyCode(() => 0)).toMatch(/^P5-[A-Z2-9]{4}$/);
  });

  it("skips codes that are already taken", () => {
    const taken = new Set(["P5-AAAA"]);
    const code = generateUniqueLobbyCode(sequence(0, 0, 0, 0, 0, 0, 0, 1), (candidate) => taken.has(candidate));
    expect(code).toBe("P5-AAAB");
  });

  it("gives up when every attempt is taken", () => {
    expect(() => generateUniqueLobbyCode(() => 0, () => true, 3)).toThrow();
  });

  it("normalizes typed codes", () => {
    expect(normalizeLobbyCode(" p5-abcd ")).toBe("P5-ABCD");
    expect(normalizeLobbyCode("wxyz")).toBe("P5-WXYZ");
    expect(normalizeLobbyCode("P5-AB0D")).toBeNull();
    expect(normalizeLobbyCode("P5-ABCDE")).toBeNull();
    expect(normalizeLobbyCode("")).toBeNull();
  });
});

describe("race texts", () => {
  it("picks a text in the requested language", () => {
    expect(pickRaceText("fr", () => 1)).toBe(raceTexts.fr[1]);
    expect(pickRaceText("en", () => 0)).toBe(raceTexts.en[0]);
  });
});
