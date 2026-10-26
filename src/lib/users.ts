import "server-only";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { oauthAccounts, sessions, userAvatars, users } from "@/lib/db-schema";
import { avatarPath, type AvatarType } from "@/lib/avatar";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateSessionToken, hashSessionToken, sessionExpiry } from "@/lib/auth/session-token";
import { guestUsername, normalizeEmail } from "@/lib/auth/validation";
import { DEFAULT_CHARACTER, isCharacterId } from "@/lib/characters";
import type { CharacterId } from "@/types/character";
import type { OAuthProvider, User } from "@/types/user";

const userColumns = {
  id: users.id,
  kind: users.kind,
  username: users.username,
  email: users.email,
  avatarUrl: users.avatarUrl,
  locale: users.locale,
  characterId: users.characterId,
  createdAt: users.createdAt,
};

type UserRow = { [K in keyof typeof userColumns]: (typeof users.$inferSelect)[K] };

function toUser({ characterId, ...row }: UserRow): User {
  // A character removed from the game falls back to the default.
  return { ...row, character: isCharacterId(characterId) ? characterId : DEFAULT_CHARACTER };
}

/** Name of the violated unique index, or null for any other error. Drizzle wraps driver errors in `cause`. */
function uniqueViolation(error: unknown): string | null {
  const cause = error instanceof Error && error.cause ? error.cause : error;
  if (typeof cause !== "object" || cause === null || !("code" in cause) || cause.code !== "23505") return null;
  return "constraint" in cause && typeof cause.constraint === "string" ? cause.constraint : "";
}

export type CreateAccountResult =
  | { ok: true; user: User }
  | { ok: false; error: "usernameTaken" | "emailTaken" };

/** A guest with the nickname they picked (validated by the caller), or a generated one. Guest names may repeat. */
export async function createGuest(username: string = guestUsername()): Promise<User> {
  const [row] = await getDb().insert(users).values({ kind: "guest", username }).returning(userColumns);
  return toUser(row);
}

/**
 * Registers an account with email + password. Input must already be validated.
 * When guestId is given, that guest is upgraded in place so its history is kept.
 */
export async function createAccount(input: {
  username: string;
  email: string;
  password: string;
  guestId?: string;
}): Promise<CreateAccountResult> {
  const account = {
    kind: "registered" as const,
    username: input.username.trim(),
    email: normalizeEmail(input.email),
    passwordHash: await hashPassword(input.password),
  };
  const db = getDb();
  try {
    if (input.guestId) {
      const [upgraded] = await db
        .update(users)
        .set({ ...account, updatedAt: sql`now()` })
        .where(and(eq(users.id, input.guestId), eq(users.kind, "guest")))
        .returning(userColumns);
      if (upgraded) return { ok: true, user: toUser(upgraded) };
    }

    const [inserted] = await db.insert(users).values(account).returning(userColumns);
    return { ok: true, user: toUser(inserted) };
  } catch (error) {
    const constraint = uniqueViolation(error);
    if (constraint === null) throw error;
    return { ok: false, error: constraint === "users_email_key" ? "emailTaken" : "usernameTaken" };
  }
}

/** Returns the user when email and password match, otherwise null. */
export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const [row] = await getDb()
    .select({ user: userColumns, passwordHash: users.passwordHash })
    .from(users)
    .where(sql`lower(${users.email}) = ${normalizeEmail(email)}`);
  if (!row?.passwordHash || !(await verifyPassword(password, row.passwordHash))) return null;
  return toUser(row.user);
}

/** Finds the user linked to an OAuth identity, creating the account on first sign-in. */
export async function findOrCreateOAuthUser(input: {
  provider: OAuthProvider;
  providerAccountId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
}): Promise<User> {
  return getDb().transaction(async (tx) => {
    const [existing] = await tx
      .select(userColumns)
      .from(oauthAccounts)
      .innerJoin(users, eq(users.id, oauthAccounts.userId))
      .where(and(eq(oauthAccounts.provider, input.provider), eq(oauthAccounts.providerAccountId, input.providerAccountId)));
    if (existing) return toUser(existing);

    // Usernames must be unique: add a numeric suffix on collision.
    let username = input.username;
    for (let attempt = 1; ; attempt++) {
      const taken = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.kind, "registered"), sql`lower(${users.username}) = lower(${username})`))
        .limit(1);
      if (taken.length === 0) break;
      username = `${input.username.slice(0, 16)}${attempt}`;
    }

    // Emails from providers are not trusted for linking to existing accounts.
    const [row] = await tx
      .insert(users)
      .values({ kind: "registered", username, avatarUrl: input.avatarUrl })
      .returning(userColumns);
    await tx
      .insert(oauthAccounts)
      .values({ provider: input.provider, providerAccountId: input.providerAccountId, userId: row.id });
    return toUser(row);
  });
}

/** Creates a session and returns the raw token to store in a cookie. */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = sessionExpiry();
  await getDb().insert(sessions).values({ tokenHash: hashSessionToken(token), userId, expiresAt });
  return { token, expiresAt };
}

/** Resolves a session token to its user, or null if missing or expired. */
export async function getUserBySessionToken(token: string): Promise<User | null> {
  const [row] = await getDb()
    .update(users)
    .set({ lastSeenAt: sql`now()` })
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, hashSessionToken(token)),
        gt(sessions.expiresAt, sql`now()`),
        eq(users.id, sessions.userId),
      ),
    )
    .returning(userColumns);
  return row ? toUser(row) : null;
}

export async function deleteSession(token: string): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)));
}

/** OAuth providers linked to a user, in a stable order. */
export async function getLinkedProviders(userId: string): Promise<OAuthProvider[]> {
  const rows = await getDb()
    .select({ provider: oauthAccounts.provider })
    .from(oauthAccounts)
    .where(eq(oauthAccounts.userId, userId))
    .orderBy(asc(oauthAccounts.provider));
  return rows.map((row) => row.provider);
}

/** A registered player's public name and thief (their compendium), or null for guests and unknown ids. */
export async function getRegisteredPlayer(userId: string): Promise<{ username: string; character: CharacterId } | null> {
  const [row] = await getDb()
    .select({ username: users.username, characterId: users.characterId })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.kind, "registered")));
  return row ? { username: row.username, character: isCharacterId(row.characterId) ? row.characterId : DEFAULT_CHARACTER } : null;
}

export async function setUserCharacter(userId: string, character: CharacterId): Promise<void> {
  await getDb().update(users).set({ characterId: character, updatedAt: sql`now()` }).where(eq(users.id, userId));
}

/** Renames a registered user; usernames stay unique case-insensitively. */
export async function renameUser(userId: string, username: string): Promise<{ ok: true } | { ok: false; error: "usernameTaken" }> {
  try {
    await getDb()
      .update(users)
      .set({ username, updatedAt: sql`now()` })
      .where(and(eq(users.id, userId), eq(users.kind, "registered")));
    return { ok: true };
  } catch (error) {
    if (uniqueViolation(error) === null) throw error;
    return { ok: false, error: "usernameTaken" };
  }
}

/** Stores a validated profile picture and points the user's avatar to it. */
export async function saveUserAvatar(userId: string, type: AvatarType, data: Uint8Array): Promise<void> {
  const avatar = { contentType: type, data: Buffer.from(data) };
  await getDb().transaction(async (tx) => {
    const [saved] = await tx
      .insert(userAvatars)
      .values({ userId, ...avatar })
      .onConflictDoUpdate({ target: userAvatars.userId, set: { ...avatar, updatedAt: sql`now()` } })
      .returning({ updatedAt: userAvatars.updatedAt });
    await tx
      .update(users)
      .set({ avatarUrl: avatarPath(userId, saved.updatedAt.getTime()), updatedAt: sql`now()` })
      .where(eq(users.id, userId));
  });
}

export async function getUserAvatar(userId: string): Promise<{ contentType: AvatarType; data: Buffer } | null> {
  const [row] = await getDb()
    .select({ contentType: userAvatars.contentType, data: userAvatars.data })
    .from(userAvatars)
    .where(eq(userAvatars.userId, userId));
  return row ?? null;
}
