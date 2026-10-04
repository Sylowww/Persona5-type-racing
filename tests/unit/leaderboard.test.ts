import { describe, expect, it } from "vitest";
import { leaderboardPageCount, parseLeaderboardPage } from "../../src/lib/leaderboard";

describe("leaderboard pages", () => {
  it("splits the top 100 into pages of 10", () => {
    expect(leaderboardPageCount(0)).toBe(1);
    expect(leaderboardPageCount(10)).toBe(1);
    expect(leaderboardPageCount(11)).toBe(2);
    expect(leaderboardPageCount(5_000)).toBe(10);
  });

  it("reads the page from the URL and keeps it in range", () => {
    expect(parseLeaderboardPage(undefined, 10)).toBe(1);
    expect(parseLeaderboardPage("3", 10)).toBe(3);
    expect(parseLeaderboardPage(["4", "5"], 10)).toBe(4);
    expect(parseLeaderboardPage("99", 10)).toBe(10);
    expect(parseLeaderboardPage("0", 10)).toBe(1);
    expect(parseLeaderboardPage("-2", 10)).toBe(1);
    expect(parseLeaderboardPage("abc", 10)).toBe(1);
    expect(parseLeaderboardPage("2.5", 10)).toBe(1);
  });
});
