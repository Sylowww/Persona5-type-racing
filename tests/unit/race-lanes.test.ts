import { describe, expect, it } from "vitest";
import { laneOrder } from "../../src/lib/race-lanes";

const racers = [
  { id: "a", place: 3 },
  { id: "b", place: 1 },
  { id: "you", place: 5 },
  { id: "c", place: 2 },
  { id: "d", place: 4 },
];

describe("laneOrder", () => {
  it("puts the player first, then the others by place", () => {
    expect(laneOrder(racers, "you").map((racer) => racer.id)).toEqual(["you", "b", "c", "a", "d"]);
  });

  it("shows the leading player above the next ones, and spectators everyone by place", () => {
    expect(laneOrder(racers, "b").map((racer) => racer.id)).toEqual(["b", "c", "a", "d", "you"]);
    expect(laneOrder(racers, "spectator").map((racer) => racer.id)).toEqual(["b", "c", "a", "d", "you"]);
  });
});
