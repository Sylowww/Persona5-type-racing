import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session-token";
import { createSession, deleteSession, getUserBySessionToken } from "@/lib/users";
import type { User } from "@/types/user";

/** The signed-in user (guest or registered) for this request, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserBySessionToken(token);
});

/** Creates a session row and sets the cookie. Server Functions / Route Handlers only. */
export async function startSession(userId: string): Promise<void> {
  const { token, expiresAt } = await createSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt, process.env.NODE_ENV === "production"));
}

/** Deletes the current session row (if any) and clears the cookie. */
export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  cookieStore.delete(SESSION_COOKIE);
}
