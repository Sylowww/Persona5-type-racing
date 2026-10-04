import { describe, expect, it } from "vitest";
import { cleanMessage, MAX_MESSAGE_LENGTH } from "../../src/lib/chat";
import { botForSpeed } from "../../src/lib/matchmaking";
import { defaultRaceSettings, parseRaceSettings, raceDurationMs, UNTIMED_RACE_CAP_MS } from "../../src/lib/race-settings";
import { numberRaceTexts, pickRaceText, raceTexts } from "../../src/lib/race-texts";
import { normalizeTypedChar } from "../../src/lib/typing";

describe("race settings", () => {
  it("applies a valid partial change", () => {
    expect(parseRaceSettings(defaultRaceSettings, { mode: "suddenDeath", timeLimitSec: null, numbers: true })).toEqual({
      ...defaultRaceSettings,
      mode: "suddenDeath",
      timeLimitSec: null,
      numbers: true,
    });
  });

  it("rejects unknown fields and values", () => {
    expect(parseRaceSettings(defaultRaceSettings, { mode: "hardcore" })).toBeNull();
    expect(parseRaceSettings(defaultRaceSettings, { timeLimitSec: 45 })).toBeNull();
    expect(parseRaceSettings(defaultRaceSettings, { powers: "yes" })).toBeNull();
    expect(parseRaceSettings(defaultRaceSettings, { isAdmin: true })).toBeNull();
    expect(parseRaceSettings(defaultRaceSettings, null)).toBeNull();
    expect(parseRaceSettings(defaultRaceSettings, [])).toBeNull();
  });

  it("turns the time limit into a race length, capped when there is none", () => {
    expect(raceDurationMs({ ...defaultRaceSettings, timeLimitSec: 30 })).toBe(30_000);
    expect(raceDurationMs({ ...defaultRaceSettings, timeLimitSec: null })).toBe(UNTIMED_RACE_CAP_MS);
  });

  it("picks texts with digits only when numbers are on", () => {
    expect(pickRaceText("fr", () => 0, true)).toBe(numberRaceTexts.fr[0]);
    expect(Object.values(numberRaceTexts).flat().every((text) => /\d/.test(text))).toBe(true);
    expect(Object.values(raceTexts).flat().some((text) => /\d/.test(text))).toBe(false);
  });
});

describe("case rule", () => {
  it("records a letter typed in the wrong case as the expected one when case does not matter", () => {
    expect(normalizeTypedChar("A", "a", false)).toBe("A");
    expect(normalizeTypedChar("a", "A", false)).toBe("a");
    expect(normalizeTypedChar("a", "b", false)).toBe("b");
    expect(normalizeTypedChar("A", "a", true)).toBe("a");
  });
});

describe("chat messages", () => {
  it("trims and collapses whitespace", () => {
    expect(cleanMessage("  too   slow\n!  ")).toBe("too slow !");
  });

  it("rejects empty, too long and non-text messages", () => {
    expect(cleanMessage("   ")).toBeNull();
    expect(cleanMessage("x".repeat(MAX_MESSAGE_LENGTH + 1))).toBeNull();
    expect(cleanMessage("x".repeat(MAX_MESSAGE_LENGTH))).not.toBeNull();
    expect(cleanMessage(42)).toBeNull();
  });
});

describe("matchmaking bot level", () => {
  it("picks the bot closest to the player's average speed", () => {
    expect(botForSpeed(null)).toBe("rookie");
    expect(botForSpeed(25)).toBe("novice");
    expect(botForSpeed(70)).toBe("rookie");
    expect(botForSpeed(110)).toBe("master");
    expect(botForSpeed(200)).toBe("godspeed");
  });
});
