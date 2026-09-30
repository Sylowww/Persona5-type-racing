import "server-only";
import type { PoolClient } from "pg";
import { getPool } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateSessionToken, hashSessionToken, sessionExpiry } from "@/lib/auth/session-token";
import { guestUsername, normalizeEmail } from "@/lib/auth/validation";
import type { OAuthProvider, User } from "@/types/user";

type UserRow = {
  id: string;
  kind: User["kind"];
  username: string;
  email: string | null;
  avatar_url: string | null;
  locale: User["locale"];
  created_at: Date;
};

const USER_COLUMNS = "id, kind, username, email, avatar_url, locale, created_at";

function toUser(row: UserRow): User {
  return {
    id: row.id,
    kind: row.kind,
    username: row.username,
    email: row.email,
    avatarUrl: row.avatar_url,
    locale: row.locale,
    createdAt: row.created_at,
  };
}

/** Name of the violated unique index, or null for any other error. */
function uniqueViolation(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "23505") return null;
  return "constraint" in error && typeof error.constraint === "string" ? error.constraint : "";
}

export type CreateAccountResult =
  | { ok: true; user: User }
  | { ok: false; error: "usernameTaken" | "emailTaken" };

export async function createGuest(): Promise<User> {
  const { rows } = await getPool().query<UserRow>(
    `INSERT INTO users (kind, username) VALUES ('guest', $1) RETURNING ${USER_COLUMNS}`,
    [guestUsername()],
  );
  return toUser(rows[0]);
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
  const passwordHash = await hashPassword(input.password);
  const values = [input.username.trim(), normalizeEmail(input.email), passwordHash];
  try {
    const { rows } = input.guestId
      ? await getPool().query<UserRow>(
          `UPDATE users SET kind = 'registered', username = $1, email = $2, password_hash = $3, updated_at = now()
           WHERE id = $4 AND kind = 'guest' RETURNING ${USER_COLUMNS}`,
          [...values, input.guestId],
        )
      : { rows: [] };
    if (rows[0]) return { ok: true, user: toUser(rows[0]) };

    const inserted = await getPool().query<UserRow>(
      `INSERT INTO users (kind, username, email, password_hash) VALUES ('registered', $1, $2, $3)
       RETURNING ${USER_COLUMNS}`,
      values,
    );
    return { ok: true, user: toUser(inserted.rows[0]) };
  } catch (error) {
    const constraint = uniqueViolation(error);
    if (constraint === null) throw error;
    return { ok: false, error: constraint === "users_email_key" ? "emailTaken" : "usernameTaken" };
  }
}

/** Returns the user when email and password match, otherwise null. */
export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const { rows } = await getPool().query<UserRow & { password_hash: string | null }>(
    `SELECT ${USER_COLUMNS}, password_hash FROM users WHERE lower(email) = $1`,
    [normalizeEmail(email)],
  );
  const row = rows[0];
  if (!row?.password_hash || !(await verifyPassword(password, row.password_hash))) return null;
  return toUser(row);
}

/** Finds the user linked to an OAuth identity, creating the account on first sign-in. */
export async function findOrCreateOAuthUser(input: {
  provider: OAuthProvider;
  providerAccountId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
}): Promise<User> {
  const client: PoolClient = await getPool().connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<UserRow>(
      `SELECT ${USER_COLUMNS.replace(/(\w+)/g, "u.$1")} FROM oauth_accounts a JOIN users u ON u.id = a.user_id
       WHERE a.provider = $1 AND a.provider_account_id = $2`,
      [input.provider, input.providerAccountId],
    );
    if (existing.rows[0]) {
      await client.query("COMMIT");
      return toUser(existing.rows[0]);
    }

    // Usernames must be unique: add a numeric suffix on collision.
    let username = input.username;
    for (let attempt = 1; ; attempt++) {
      const taken = await client.query(
        "SELECT 1 FROM users WHERE kind = 'registered' AND lower(username) = lower($1)",
        [username],
      );
      if (taken.rowCount === 0) break;
      username = `${input.username.slice(0, 16)}${attempt}`;
    }

    // Emails from providers are not trusted for linking to existing accounts.
    const { rows } = await client.query<UserRow>(
      `INSERT INTO users (kind, username, avatar_url) VALUES ('registered', $1, $2) RETURNING ${USER_COLUMNS}`,
      [username, input.avatarUrl],
    );
    await client.query(
      "INSERT INTO oauth_accounts (provider, provider_account_id, user_id) VALUES ($1, $2, $3)",
      [input.provider, input.providerAccountId, rows[0].id],
    );
    await client.query("COMMIT");
    return toUser(rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** Creates a session and returns the raw token to store in a cookie. */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = sessionExpiry();
  await getPool().query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [
    hashSessionToken(token),
    userId,
    expiresAt,
  ]);
  return { token, expiresAt };
}

/** Resolves a session token to its user, or null if missing or expired. */
export async function getUserBySessionToken(token: string): Promise<User | null> {
  const { rows } = await getPool().query<UserRow>(
    `UPDATE users u SET last_seen_at = now() FROM sessions s
     WHERE s.token_hash = $1 AND s.expires_at > now() AND u.id = s.user_id
     RETURNING ${USER_COLUMNS.replace(/(\w+)/g, "u.$1")}`,
    [hashSessionToken(token)],
  );
  return rows[0] ? toUser(rows[0]) : null;
}

export async function deleteSession(token: string): Promise<void> {
  await getPool().query("DELETE FROM sessions WHERE token_hash = $1", [hashSessionToken(token)]);
}

/** OAuth providers linked to a user, in a stable order. */
export async function getLinkedProviders(userId: string): Promise<OAuthProvider[]> {
  const { rows } = await getPool().query<{ provider: OAuthProvider }>(
    "SELECT provider FROM oauth_accounts WHERE user_id = $1 ORDER BY provider",
    [userId],
  );
  return rows.map((row) => row.provider);
}
