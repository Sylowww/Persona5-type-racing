import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password";
import { generateSessionToken, hashSessionToken, sessionExpiry, SESSION_DURATION_MS } from "../../src/lib/auth/session-token";
import { guestUsername, normalizeEmail, validateEmail, validatePassword, validateUsername } from "../../src/lib/auth/validation";

describe("password hashing", () => {
  it("verifies the right password and rejects others", async () => {
    const hash = await hashPassword("hunter2hunter2");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("hunter2hunter2", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("salts each hash", async () => {
    expect(await hashPassword("same-password")).not.toBe(await hashPassword("same-password"));
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
  });
});

describe("session tokens", () => {
  it("generates unique tokens with a stable hash", () => {
    const token = generateSessionToken();
    expect(token).not.toBe(generateSessionToken());
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toBe(token);
  });

  it("expires after the session duration", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(sessionExpiry(now).getTime() - now.getTime()).toBe(SESSION_DURATION_MS);
  });
});

describe("account validation", () => {
  it("validates usernames", () => {
    expect(validateUsername("joker_5")).toBeNull();
    expect(validateUsername("ab")).toBe("usernameLength");
    expect(validateUsername("a".repeat(21))).toBe("usernameLength");
    expect(validateUsername("bad name")).toBe("usernameChars");
  });

  it("validates emails and passwords", () => {
    expect(validateEmail(" joker@example.com ")).toBeNull();
    expect(validateEmail("joker@")).toBe("emailInvalid");
    expect(validatePassword("12345678")).toBeNull();
    expect(validatePassword("short")).toBe("passwordLength");
    expect(normalizeEmail(" Joker@Example.COM ")).toBe("joker@example.com");
  });

  it("names guests", () => {
    expect(guestUsername(() => 0)).toBe("Guest-1000");
    expect(guestUsername(() => 0.9999)).toBe("Guest-9999");
  });
});
