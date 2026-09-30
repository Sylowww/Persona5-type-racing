import { describe, expect, it } from "vitest";
import { canStartRace, countReady, currentRaceSettings, openSlotCount, readyMeter } from "../../src/lib/lobby";

function player(id: string, isReady: boolean) {
  return { id, isReady };
}

describe("lobby", () => {
  it("counts ready players", () => {
    expect(countReady([player("a", true), player("b", false), player("c", true)])).toBe(2);
  });

  it("never returns a negative number of open slots", () => {
    expect(openSlotCount(4, 6)).toBe(2);
    expect(openSlotCount(7, 6)).toBe(0);
  });

  it("starts only when at least two players are all ready", () => {
    expect(canStartRace([player("a", true)])).toBe(false);
    expect(canStartRace([player("a", true), player("b", false)])).toBe(false);
    expect(canStartRace([player("a", true), player("b", true)])).toBe(true);
  });

  it("scales the ready meter down for large lobbies", () => {
    expect(readyMeter(1, 3, 12)).toEqual({ filled: 1, segments: 3 });
    expect(readyMeter(15, 30, 12)).toEqual({ filled: 6, segments: 12 });
    expect(readyMeter(0, 0, 12)).toEqual({ filled: 0, segments: 0 });
  });

  it("describes the rules races use today", () => {
    expect(currentRaceSettings("fr")).toMatchObject({ mode: null, language: "FR", caseSensitive: true });
  });
});
