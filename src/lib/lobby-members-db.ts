import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { lobbyMembers } from "@/lib/db-schema";

/**
 * Takes a seat in `code` for this person (SALLE-06). Returns the code of another lobby they are already in, in which
 * case nothing changes, or null once the seat is theirs. The primary key on `user_id` makes the check atomic.
 */
export async function claimLobbySeat(userId: string, code: string): Promise<string | null> {
  const db = getDb();
  const inserted = await db.insert(lobbyMembers).values({ userId, lobbyCode: code }).onConflictDoNothing().returning({ code: lobbyMembers.lobbyCode });
  if (inserted.length > 0) return null;
  const [current] = await db.select({ code: lobbyMembers.lobbyCode }).from(lobbyMembers).where(eq(lobbyMembers.userId, userId));
  return current && current.code !== code ? current.code : null;
}

/** Records the lobby the store put this person in (kept in sync with every join, including the store's own moves). */
export async function recordLobbySeat(userId: string, code: string): Promise<void> {
  await getDb()
    .insert(lobbyMembers)
    .values({ userId, lobbyCode: code })
    .onConflictDoUpdate({ target: lobbyMembers.userId, set: { lobbyCode: code, joinedAt: new Date() } });
}

/** Frees the seat in `code` only, so a late release never removes a newer seat elsewhere. */
export async function releaseLobbySeat(userId: string, code: string): Promise<void> {
  await getDb().delete(lobbyMembers).where(and(eq(lobbyMembers.userId, userId), eq(lobbyMembers.lobbyCode, code)));
}

/** Lobbies do not survive a restart, so neither do their seats. */
export async function clearLobbySeats(): Promise<void> {
  await getDb().delete(lobbyMembers);
}
