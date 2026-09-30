import { createHash, randomBytes } from "node:crypto";

export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/** Random token sent to the client in a cookie. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only this hash is stored, so a leaked database cannot be used to log in. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + SESSION_DURATION_MS);
}

export const SESSION_COOKIE = "session";

/**
 * HttpOnly so scripts cannot read the token, Secure over HTTPS in production,
 * and SameSite=Lax so the cookie survives normal links (and future OAuth
 * redirects) but is not sent on cross-site form posts.
 */
export function sessionCookieOptions(expires: Date, isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires,
  } as const;
}
