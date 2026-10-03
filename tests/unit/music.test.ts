import { describe, expect, it } from "vitest";
import { isHomeTheme, musicSourceFor } from "../../src/lib/music";

describe("musicSourceFor", () => {
  it("plays the race theme from 25 s on the race page", () => {
    expect(musicSourceFor("/fr/lobby/P5-ABCD/race", "home-2")).toBe("/music/race.mp3#t=25");
    expect(musicSourceFor("/en/lobby/P5-ABCD/race/", "home-1")).toBe("/music/race.mp3#t=25");
  });

  it("plays the chosen home theme everywhere else", () => {
    expect(musicSourceFor("/fr", "home-1")).toBe("/music/home-1.mp3");
    expect(musicSourceFor("/en/lobby/P5-ABCD", "home-2")).toBe("/music/home-2.mp3");
    expect(musicSourceFor("/en/lobby/P5-ABCD/results", "home-2")).toBe("/music/home-2.mp3");
  });
});

describe("isHomeTheme", () => {
  it("accepts only known themes", () => {
    expect(isHomeTheme("home-1")).toBe(true);
    expect(isHomeTheme("home-2")).toBe(true);
    expect(isHomeTheme("race")).toBe(false);
    expect(isHomeTheme(null)).toBe(false);
  });
});
