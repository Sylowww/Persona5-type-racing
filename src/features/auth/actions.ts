"use server";

import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { parseGuestForm, parseSignInForm, parseSignUpForm, safeNextPath, type AuthErrorCode } from "@/lib/auth/forms";
import { endSession, getCurrentUser, startSession } from "@/lib/auth/session";
import { getLobbyStore } from "@/lib/lobby-server";
import { lobbyCodeSchema, localeSchema } from "@/lib/schemas";
import { createAccount, createGuest, verifyCredentials } from "@/lib/users";

export type AuthFormState = {
  errors: Partial<Record<"username" | "email" | "password" | "form", AuthErrorCode>>;
  /** Echoed back so the form keeps what was typed; never includes the password. */
  values: { username?: string; email?: string };
};

function localeFrom(form: FormData): Locale {
  const locale = form.get("locale");
  return localeSchema.catch("fr").parse(locale);
}

function textValue(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.slice(0, 254) : "";
}

export async function signUp(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  const locale = localeFrom(form);
  const values = { username: textValue(form, "username"), email: textValue(form, "email") };

  const parsed = parseSignUpForm(form);
  if (!parsed.ok) return { errors: parsed.errors, values };

  const current = await getCurrentUser();
  if (current?.kind === "registered") redirect(`/${locale}`);

  // A guest keeps its history: the guest row is upgraded instead of replaced.
  const result = await createAccount({ ...parsed.values, guestId: current?.kind === "guest" ? current.id : undefined });
  if (!result.ok) {
    return { errors: result.error === "emailTaken" ? { email: "emailTaken" } : { username: "usernameTaken" }, values };
  }

  await endSession();
  await startSession(result.user.id);
  redirect(`/${locale}`);
}

export async function signIn(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  const locale = localeFrom(form);
  const values = { email: textValue(form, "email") };

  const parsed = parseSignInForm(form);
  if (!parsed.ok) return { errors: parsed.errors, values };

  const user = await verifyCredentials(parsed.values.email, parsed.values.password);
  // Same message for unknown email and wrong password.
  if (!user) return { errors: { form: "invalidCredentials" }, values };

  await endSession();
  await startSession(user.id);
  redirect(`/${locale}`);
}

/**
 * Plays without an account: creates a guest with the chosen nickname and a session cookie, then goes back to
 * `next`. When `next` is a lobby, the guest joins it right away (if that fails, the lobby page explains why).
 */
export async function continueAsGuest(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  const locale = localeFrom(form);
  const next = safeNextPath(locale, form.get("next"));
  const values = { username: textValue(form, "username") };

  if (!(await getCurrentUser())) {
    const parsed = parseGuestForm(form);
    if (!parsed.ok) return { errors: parsed.errors, values };
    const guest = await createGuest(parsed.values.username);
    await startSession(guest.id);
    const code = lobbyCodeSchema.safeParse(next.match(/^\/[a-z]{2}\/lobby\/([^/]+)$/)?.[1]).data;
    if (code) getLobbyStore().join(code, { id: guest.id, name: guest.username, character: guest.character });
  }
  redirect(next);
}

export async function signOut(form: FormData): Promise<void> {
  await endSession();
  redirect(`/${localeFrom(form)}`);
}
