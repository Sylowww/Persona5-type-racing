import { describe, expect, it } from "vitest";
import { parseSignInForm, parseSignUpForm } from "../../src/lib/auth/forms";
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
