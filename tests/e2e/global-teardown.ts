import pg from "pg";
import { TEST_EMAIL_DOMAIN, TEST_USERNAME_SQL_PATTERN } from "./test-accounts";

/**
 * Deletes the accounts the E2E tests created (their sessions and races go with them).
 * A row is deleted only if it matches every rule: registered, test username, test email domain,
 * and no linked OAuth identity. Real accounts never match.
 */
export default async function globalTeardown() {
  if (!process.env.DATABASE_URL) {
    try {
      process.loadEnvFile(".env");
    } catch {
      // No .env: nothing to clean.
    }
  }
  if (!process.env.DATABASE_URL) return;

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM users u
       WHERE u.kind = 'registered'
         AND u.username ~ $1
         AND right(lower(u.email), length($2)) = $2
         AND NOT EXISTS (SELECT 1 FROM oauth_accounts o WHERE o.user_id = u.id)`,
      [TEST_USERNAME_SQL_PATTERN, `@${TEST_EMAIL_DOMAIN}`],
    );
    console.log(`E2E cleanup: deleted ${rowCount ?? 0} test account(s).`);
  } finally {
    await pool.end();
  }
}
