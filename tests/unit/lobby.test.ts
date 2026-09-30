import { describe, expect, it } from "vitest";
import { canStartRace, countReady, openSlotCount } from "../../src/lib/lobby";
import type { LobbyPlayer } from "../../src/types/lobby";

function player(id: string, isReady: boolean): LobbyPlayer {
  return { id, name: id, level: 1, title: "", bestWpm: 0, isHost: false, isReady, emblem: "mask" };
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
});
