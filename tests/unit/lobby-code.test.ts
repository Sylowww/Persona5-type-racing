import { describe, expect, it } from "vitest";
import { LOBBY_CODE_ALPHABET, generateLobbyCode, generateUniqueLobbyCode, normalizeLobbyCode } from "../../src/lib/lobby-code";
import { pickRaceText, raceTexts } from "../../src/lib/race-texts";

/** Returns the given indexes in order, then repeats the last one. */
function sequence(...values: number[]) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

describe("lobby codes", () => {
  it("builds a 6-character code from the alphabet", () => {
    expect(generateLobbyCode(sequence(0, 1, 2, 3, 4, 30))).toBe("ABCDE9");
    expect(generateLobbyCode(() => 0)).toMatch(/^[A-Z2-9]{6}$/);
  });

  it("never uses ambiguous characters", () => {
    expect(LOBBY_CODE_ALPHABET).not.toMatch(/[0O1IL]/);
  });

  it("skips codes that are already taken", () => {
    const taken = new Set(["AAAAAA"]);
    const code = generateUniqueLobbyCode(sequence(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1), (candidate) => taken.has(candidate));
    expect(code).toBe("AAAAAB");
  });

  it("gives up when every attempt is taken", () => {
    expect(() => generateUniqueLobbyCode(() => 0, () => true, 3)).toThrow();
  });

  it("normalizes typed codes", () => {
    expect(normalizeLobbyCode(" abcdef ")).toBe("ABCDEF");
    expect(normalizeLobbyCode("abc-def")).toBe("ABCDEF");
    expect(normalizeLobbyCode("ABC DEF")).toBe("ABCDEF");
    expect(normalizeLobbyCode("ABCD0F")).toBeNull();
    expect(normalizeLobbyCode("ABCDLF")).toBeNull();
    expect(normalizeLobbyCode("ABCDE")).toBeNull();
    expect(normalizeLobbyCode("ABCDEFG")).toBeNull();
    expect(normalizeLobbyCode("")).toBeNull();
  });
});

describe("race texts", () => {
  it("picks a text in the requested language", () => {
    expect(pickRaceText("fr", () => 1)).toBe(raceTexts.fr[1]);
    expect(pickRaceText("en", () => 0)).toBe(raceTexts.en[0]);
  });
});
