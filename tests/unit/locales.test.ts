import { describe, expect, it } from "vitest";
import { isLocale, locales } from "../../src/i18n/locales";

describe("locales", () => {
  it("supports French and English only", () => {
    expect(locales).toEqual(["fr", "en"]);
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });
});
