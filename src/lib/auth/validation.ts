// Server-side validation for account input. Error codes are mapped to
// translated messages by the UI.

export type ValidationError =
  | "usernameLength"
  | "usernameChars"
  | "emailInvalid"
  | "passwordLength";

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const USERNAME_PATTERN = /^[A-Za-z0-9_-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(value: string): Extract<ValidationError, "usernameLength" | "usernameChars"> | null {
  const username = value.trim();
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) return "usernameLength";
  if (!USERNAME_PATTERN.test(username)) return "usernameChars";
  return null;
}

export function validateEmail(value: string): ValidationError | null {
  const email = value.trim();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? null : "emailInvalid";
}

export function validatePassword(value: string): ValidationError | null {
  return value.length < PASSWORD_MIN || value.length > PASSWORD_MAX ? "passwordLength" : null;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Display name for a new guest, e.g. "Guest-4821". */
export function guestUsername(random: () => number = Math.random): string {
  return `Guest-${Math.floor(1000 + random() * 9000)}`;
}
