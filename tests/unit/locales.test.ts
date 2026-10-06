import { describe, expect, it } from "vitest";
import { isLocale, localizedPath, locales, preferredLocale } from "../../src/i18n/locales";

describe("locales", () => {
  it("supports French and English only", () => {
    expect(locales).toEqual(["fr", "en"]);
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });
});

describe("preferredLocale", () => {
  it("keeps the saved choice over the browser language", () => {
    expect(preferredLocale("en", "fr-CA,fr;q=0.9")).toBe("en");
  });

  it("ignores an invalid saved choice", () => {
    expect(preferredLocale("de", "en-US,en;q=0.9")).toBe("en");
  });

  it("picks the first supported browser language by quality", () => {
    expect(preferredLocale(undefined, "de-DE,de;q=0.9,en;q=0.8,fr;q=0.7")).toBe("en");
    expect(preferredLocale(undefined, "en;q=0.5, fr-CA")).toBe("fr");
  });

  it("skips languages refused with q=0", () => {
    expect(preferredLocale(undefined, "en;q=0, fr;q=0.1")).toBe("fr");
  });

  it("falls back to French", () => {
    expect(preferredLocale(undefined, null)).toBe("fr");
    expect(preferredLocale(undefined, "de, es")).toBe("fr");
  });
});

describe("localizedPath", () => {
  it("swaps the locale segment and keeps the rest of the path", () => {
    expect(localizedPath("/fr", "en")).toBe("/en");
    expect(localizedPath("/fr/lobby/ABCDEF", "en")).toBe("/en/lobby/ABCDEF");
    expect(localizedPath("/en/profile", "fr")).toBe("/fr/profile");
  });

  it("goes to the home page when the path has no locale", () => {
    expect(localizedPath("/", "en")).toBe("/en");
    expect(localizedPath("/lobby/ABCDEF", "fr")).toBe("/fr");
  });
});
