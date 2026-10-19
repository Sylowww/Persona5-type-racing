import { describe, expect, it } from "vitest";
import { parseGuestForm, parseSignInForm, parseSignUpForm, safeNextPath } from "../../src/lib/auth/forms";
import { sessionCookieOptions } from "../../src/lib/auth/session-token";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("parseSignUpForm", () => {
  it("accepts valid input and trims text fields", () => {
    expect(parseSignUpForm(form({ username: " joker ", email: " a@b.co ", password: "  password  " }))).toEqual({
      ok: true,
      values: { username: "joker", email: "a@b.co", password: "  password  " },
    });
  });

  it("reports missing fields as required", () => {
    expect(parseSignUpForm(form({}))).toEqual({
      ok: false,
      errors: { username: "required", email: "required", password: "required" },
    });
  });

  it("reports each invalid field", () => {
    expect(parseSignUpForm(form({ username: "bad name", email: "nope", password: "short" }))).toEqual({
      ok: false,
      errors: { username: "usernameChars", email: "emailInvalid", password: "passwordLength" },
    });
  });

  it("ignores file values", () => {
    const data = form({ email: "a@b.co", password: "password" });
    data.set("username", new Blob(["joker"]));
    expect(parseSignUpForm(data)).toEqual({ ok: false, errors: { username: "required" } });
  });
});

describe("parseSignInForm", () => {
  it("accepts an email and password", () => {
    expect(parseSignInForm(form({ email: "a@b.co", password: "x" }))).toEqual({
      ok: true,
      values: { email: "a@b.co", password: "x" },
    });
  });

  it("requires both fields", () => {
    expect(parseSignInForm(form({ email: " " }))).toEqual({
      ok: false,
      errors: { email: "required", password: "required" },
    });
  });

  it("rejects oversized passwords without hashing them", () => {
    expect(parseSignInForm(form({ email: "a@b.co", password: "x".repeat(129) }))).toEqual({
      ok: false,
      errors: { password: "invalidCredentials" },
    });
  });
});

describe("sessionCookieOptions", () => {
  const expires = new Date("2026-01-01T00:00:00Z");

  it("is HttpOnly and SameSite=Lax", () => {
    expect(sessionCookieOptions(expires, false)).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires,
    });
  });

  it("is Secure in production", () => {
    expect(sessionCookieOptions(expires, true).secure).toBe(true);
  });
});

describe("parseGuestForm", () => {
  it("accepts a nickname with the username rules", () => {
    expect(parseGuestForm(form({ username: "  Kitty_99 " }))).toEqual({ ok: true, values: { username: "Kitty_99" } });
  });

  it("rejects a missing, too short, too long or invalid nickname", () => {
    expect(parseGuestForm(form({}))).toEqual({ ok: false, errors: { username: "required" } });
    expect(parseGuestForm(form({ username: "ab" }))).toEqual({ ok: false, errors: { username: "usernameLength" } });
    expect(parseGuestForm(form({ username: "a".repeat(21) }))).toEqual({ ok: false, errors: { username: "usernameLength" } });
    expect(parseGuestForm(form({ username: "no spaces" }))).toEqual({ ok: false, errors: { username: "usernameChars" } });
  });
});

describe("safeNextPath", () => {
  it("keeps paths inside the app in the same language", () => {
    expect(safeNextPath("fr", "/fr/lobby/ABC234")).toBe("/fr/lobby/ABC234");
    expect(safeNextPath("en", "/en")).toBe("/en");
  });

  it("falls back to the home page for anything else", () => {
    expect(safeNextPath("fr", undefined)).toBe("/fr");
    expect(safeNextPath("fr", "https://evil.example")).toBe("/fr");
    expect(safeNextPath("fr", "//evil.example/fr")).toBe("/fr");
    expect(safeNextPath("fr", "/fr//evil.example")).toBe("/fr");
    expect(safeNextPath("fr", "/en/lobbies")).toBe("/fr");
    expect(safeNextPath("fr", "/french")).toBe("/fr");
    expect(safeNextPath("fr", "/fr/lobby?x=1")).toBe("/fr");
  });
});
