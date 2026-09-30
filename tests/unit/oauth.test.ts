import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildAuthorizeUrl, codeChallenge, isOAuthProvider, parseProfile, randomToken, toUsername } from "../../src/lib/auth/oauth";
import { validateUsername } from "../../src/lib/auth/validation";

describe("PKCE and state", () => {
  it("derives an S256 base64url challenge", () => {
    const verifier = randomToken();
    expect(codeChallenge(verifier)).toBe(createHash("sha256").update(verifier).digest("base64url"));
    expect(codeChallenge(verifier)).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("generates unguessable tokens", () => {
    expect(randomToken()).not.toBe(randomToken());
    expect(randomToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});

describe("buildAuthorizeUrl", () => {
  it("includes client, redirect, scope, state and PKCE", () => {
    const url = new URL(
      buildAuthorizeUrl("discord", { clientId: "abc", redirectUri: "http://x/cb", state: "s1", verifier: "v1" }),
    );
    expect(url.origin + url.pathname).toBe("https://discord.com/oauth2/authorize");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: "abc",
      redirect_uri: "http://x/cb",
      response_type: "code",
      scope: "identify",
      state: "s1",
      code_challenge: codeChallenge("v1"),
      code_challenge_method: "S256",
    });
  });
});

describe("isOAuthProvider", () => {
  it("accepts only supported providers", () => {
    expect(isOAuthProvider("google")).toBe(true);
    expect(isOAuthProvider("github")).toBe(true);
    expect(isOAuthProvider("discord")).toBe(true);
    expect(isOAuthProvider("twitter")).toBe(false);
  });
});

describe("toUsername", () => {
  it("produces valid usernames from display names", () => {
    for (const raw of ["Jean-René Tremblay", "  élève 42 ", "a", "", "😀😀😀", "x".repeat(40)]) {
      expect(validateUsername(toUsername(raw))).toBeNull();
    }
    expect(toUsername("Jean-René Tremblay")).toBe("Jean-Rene_Tremblay");
    expect(toUsername("")).toBe("Phantom");
  });
});

describe("parseProfile", () => {
  it("maps Google, GitHub and Discord payloads", () => {
    expect(parseProfile("google", { sub: "123", given_name: "Zoé", picture: "https://p/x.png" })).toEqual({
      id: "123",
      username: "Zoe",
      avatarUrl: "https://p/x.png",
    });
    expect(parseProfile("github", { id: 42, login: "octo-cat", avatar_url: null })).toEqual({
      id: "42",
      username: "octo-cat",
      avatarUrl: null,
    });
    expect(parseProfile("discord", { id: "99", username: "kb_hero", avatar: "abc" })).toEqual({
      id: "99",
      username: "kb_hero",
      avatarUrl: "https://cdn.discordapp.com/avatars/99/abc.png",
    });
  });

  it("rejects payloads without an id", () => {
    expect(parseProfile("github", { login: "x" })).toBeNull();
    expect(parseProfile("google", null)).toBeNull();
  });
});
