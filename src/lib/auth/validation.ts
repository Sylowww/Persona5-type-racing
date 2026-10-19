// Server-side validation for account input. Error codes are mapped to
// translated messages by the UI.

export type ValidationError =
  | "usernameLength"
  | "usernameChars"
  | "emailInvalid"
  | "passwordLength";

import type { ZodType } from "zod";
import { emailSchema, passwordSchema, usernameSchema } from "../schemas";

export { PASSWORD_MAX, PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from "../schemas";

/** The first error code of a schema check (the schemas carry the codes as messages), or null when valid. */
function firstError<Code extends ValidationError>(schema: ZodType, value: string): Code | null {
  const result = schema.safeParse(value);
  return result.success ? null : (result.error.issues[0].message as Code);
}

export function validateUsername(value: string): Extract<ValidationError, "usernameLength" | "usernameChars"> | null {
  return firstError(usernameSchema, value);
}

export function validateEmail(value: string): ValidationError | null {
  return firstError(emailSchema, value);
}

export function validatePassword(value: string): ValidationError | null {
  return firstError(passwordSchema, value);
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Display name for a new guest, e.g. "Guest-4821". */
export function guestUsername(random: () => number = Math.random): string {
  return `Guest-${Math.floor(1000 + random() * 9000)}`;
}
