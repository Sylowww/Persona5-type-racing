// Accounts created by the E2E tests, and the rule that recognizes them so they can be deleted after a run.
// No Playwright import: the rule is also unit tested.

/** Reserved test domain (RFC 2606): no real person can own an address here. */
export const TEST_EMAIL_DOMAIN = "e2e.test";
/** Every test username starts with this. */
export const TEST_USERNAME_PREFIX = "e2e_";
/** Same rule as `isTestAccount`, for the database. */
export const TEST_USERNAME_SQL_PATTERN = "^e2e_[a-z0-9_]+$";

const TEST_USERNAME_PATTERN = new RegExp(TEST_USERNAME_SQL_PATTERN);
let counter = 0;

/** A fresh username such as `e2e_host_lx2k9a1` (at most 20 characters). */
export function testUsername(role: string): string {
  counter += 1;
  const unique = `${Date.now().toString(36)}${counter}${Math.floor(Math.random() * 100)}`;
  return `${TEST_USERNAME_PREFIX}${role}_${unique}`.slice(0, 20);
}

export function testEmail(username: string): string {
  return `${username}@${TEST_EMAIL_DOMAIN}`;
}

/** Both the test username and the test email domain are required, so a real account never matches. */
export function isTestAccount(username: string, email: string | null): boolean {
  return TEST_USERNAME_PATTERN.test(username) && email !== null && email.toLowerCase().endsWith(`@${TEST_EMAIL_DOMAIN}`);
}
