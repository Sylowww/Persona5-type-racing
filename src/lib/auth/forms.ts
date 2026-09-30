// Parses and validates the sign-up / sign-in forms on the server.
// Error codes are translated by the UI (dictionary `auth.errors`).
import {
  PASSWORD_MAX,
  validateEmail,
  validatePassword,
  validateUsername,
  type ValidationError,
} from "./validation";

export type AuthErrorCode =
  | ValidationError
  | "required"
  | "usernameTaken"
  | "emailTaken"
  | "invalidCredentials"
  | "unexpected";

export type SignUpField = "username" | "email" | "password";
export type SignInField = "email" | "password";

type FormValues = { get(name: string): FormDataEntryValue | null };

export type ParseResult<Field extends string, Values> =
  | { ok: true; values: Values }
  | { ok: false; errors: Partial<Record<Field, AuthErrorCode>> };

function text(form: FormValues, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

export function parseSignUpForm(
  form: FormValues,
): ParseResult<SignUpField, { username: string; email: string; password: string }> {
  const username = text(form, "username").trim();
  const email = text(form, "email").trim();
  const password = text(form, "password");

  const errors: Partial<Record<SignUpField, AuthErrorCode>> = {};
  const usernameError = username ? validateUsername(username) : "required";
  const emailError = email ? validateEmail(email) : "required";
  const passwordError = password ? validatePassword(password) : "required";
  if (usernameError) errors.username = usernameError;
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values: { username, email, password } };
}

export function parseSignInForm(form: FormValues): ParseResult<SignInField, { email: string; password: string }> {
  const email = text(form, "email").trim();
  const password = text(form, "password");

  const errors: Partial<Record<SignInField, AuthErrorCode>> = {};
  if (!email) errors.email = "required";
  if (!password) errors.password = "required";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  // Never hash oversized input; it can only be a wrong password anyway.
  if (password.length > PASSWORD_MAX) return { ok: false, errors: { password: "invalidCredentials" } };
  return { ok: true, values: { email, password } };
}
