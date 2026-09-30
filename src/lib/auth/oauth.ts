// Pure OAuth 2.0 helpers (authorization code + PKCE) for Google, GitHub and Discord.
// Network calls live in oauth-client.ts.
import { createHash, randomBytes } from "node:crypto";
import { oauthProviders, type OAuthProvider } from "../../types/user";
import { USERNAME_MAX, USERNAME_MIN } from "./validation";

/** Short-lived cookie holding state + PKCE verifier during the redirect. */
export const OAUTH_COOKIE = "oauth";

export type ProviderConfig = {
  authorizeUrl: string;
  tokenUrl: string;
  profileUrl: string;
  scope: string;
};

export const providerConfigs: Record<OAuthProvider, ProviderConfig> = {
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    profileUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid profile",
  },
  github: {
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    profileUrl: "https://api.github.com/user",
    scope: "read:user",
  },
  discord: {
    authorizeUrl: "https://discord.com/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    profileUrl: "https://discord.com/api/users/@me",
    scope: "identify",
  },
};

export function isOAuthProvider(value: string): value is OAuthProvider {
  return oauthProviders.some((provider) => provider === value);
}

export type OAuthProfile = { id: string; username: string; avatarUrl: string | null };

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

/** PKCE S256 challenge for a code verifier. */
export function codeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildAuthorizeUrl(
  provider: OAuthProvider,
  params: { clientId: string; redirectUri: string; state: string; verifier: string },
): string {
  const url = new URL(providerConfigs[provider].authorizeUrl);
  url.search = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: "code",
    scope: providerConfigs[provider].scope,
    state: params.state,
    code_challenge: codeChallenge(params.verifier),
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}

/** Turns a provider display name into a valid username (see validateUsername). */
export function toUsername(raw: string): string {
  const cleaned = raw
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, USERNAME_MAX);
  return cleaned.length >= USERNAME_MIN ? cleaned : "Phantom";
}

function field(data: unknown, key: string): unknown {
  return typeof data === "object" && data !== null ? (data as Record<string, unknown>)[key] : undefined;
}

function str(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (typeof value === "number") return String(value);
  return null;
}

/** Maps a provider's user payload to our profile shape, or null if it is unusable. */
export function parseProfile(provider: OAuthProvider, data: unknown): OAuthProfile | null {
  if (provider === "google") {
    const id = str(field(data, "sub"));
    if (!id) return null;
    return {
      id,
      username: toUsername(str(field(data, "given_name")) ?? str(field(data, "name")) ?? ""),
      avatarUrl: str(field(data, "picture")),
    };
  }
  if (provider === "github") {
    const id = str(field(data, "id"));
    if (!id) return null;
    return { id, username: toUsername(str(field(data, "login")) ?? ""), avatarUrl: str(field(data, "avatar_url")) };
  }
  const id = str(field(data, "id"));
  if (!id) return null;
  const avatar = str(field(data, "avatar"));
  return {
    id,
    username: toUsername(str(field(data, "username")) ?? str(field(data, "global_name")) ?? ""),
    avatarUrl: avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png` : null,
  };
}
