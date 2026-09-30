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
