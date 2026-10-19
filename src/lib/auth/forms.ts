// Parses and validates the sign-up / sign-in forms on the server.
// Error codes are translated by the UI (dictionary `auth.errors`).
import type { Locale } from "@/i18n/locales";
import { z } from "zod";
import { emailSchema, passwordSchema, usernameSchema } from "../schemas";
import { PASSWORD_MAX, type ValidationError } from "./validation";

export type AuthErrorCode =
  | ValidationError
  | "required"
  | "usernameTaken"
  | "emailTaken"
  | "invalidCredentials"
  | "unexpected";

export type SignUpField = "username" | "email" | "password";
export type SignInField = "email" | "password";
export type GuestField = "username";

type FormValues = { get(name: string): FormDataEntryValue | null };

export type ParseResult<Field extends string, Values> =
  | { ok: true; values: Values }
  | { ok: false; errors: Partial<Record<Field, AuthErrorCode>> };

function text(form: FormValues, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

/** An empty field is `required`; any other problem keeps the code carried by the schema. */
const required = (schema: z.ZodType<string, string>) => z.string().trim().min(1, { message: "required" }).pipe(schema);

const signUpSchema = z.object({ username: required(usernameSchema), email: required(emailSchema), password: z.string().min(1, { message: "required" }).pipe(passwordSchema) });
const signInSchema = z.object({ email: required(z.string()), password: z.string().min(1, { message: "required" }) });
const guestSchema = z.object({ username: required(usernameSchema) });

/** Runs a form schema; on failure, the first error code of each field. */
function parseForm<Field extends string, Values>(schema: z.ZodType<Values>, values: Record<Field, string>): ParseResult<Field, Values> {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, values: result.data };
  const errors: Partial<Record<Field, AuthErrorCode>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as Field;
    errors[field] ??= issue.message as AuthErrorCode;
  }
  return { ok: false, errors };
}

export function parseSignUpForm(
  form: FormValues,
): ParseResult<SignUpField, { username: string; email: string; password: string }> {
  return parseForm(signUpSchema, { username: text(form, "username"), email: text(form, "email"), password: text(form, "password") });
}

export function parseSignInForm(form: FormValues): ParseResult<SignInField, { email: string; password: string }> {
  const parsed = parseForm(signInSchema, { email: text(form, "email"), password: text(form, "password") });
  if (!parsed.ok) return parsed;
  // Never hash oversized input; it can only be a wrong password anyway.
  if (parsed.values.password.length > PASSWORD_MAX) return { ok: false, errors: { password: "invalidCredentials" } };
  return parsed;
}

/** A guest only picks a nickname (same rules as usernames, but guest names may repeat). */
export function parseGuestForm(form: FormValues): ParseResult<GuestField, { username: string }> {
  return parseForm(guestSchema, { username: text(form, "username") });
}

const LOCAL_PATH = /^\/[A-Za-z0-9/_-]*$/;

/**
 * Where to go after a sign-in step: only a path inside the app in the same language (no other site, no
 * protocol-relative `//`), otherwise the home page.
 */
export function safeNextPath(locale: Locale, next: unknown): string {
  const home = `/${locale}`;
  if (typeof next !== "string" || next.length > 200 || !LOCAL_PATH.test(next) || next.includes("//")) return home;
  return next === home || next.startsWith(`${home}/`) ? next : home;
}
