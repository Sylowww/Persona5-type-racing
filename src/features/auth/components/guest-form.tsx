"use client";

import { useActionState } from "react";
import { continueAsGuest, type AuthFormState } from "@/features/auth/actions";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthSubmit } from "@/features/auth/components/auth-submit";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import { USERNAME_MAX } from "@/lib/auth/validation";

const initialState: AuthFormState = { errors: {}, values: {} };

type GuestFormProps = { locale: Locale; next: string; dictionary: Dictionary["auth"] };

export function GuestForm({ locale, next, dictionary }: GuestFormProps) {
  const [state, action, pending] = useActionState(continueAsGuest, initialState);
  const { errors } = state;

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next} />
      <AuthField
        name="username"
        icon="person"
        autoComplete="nickname"
        maxLength={USERNAME_MAX}
        label={dictionary.guest.nickname}
        hint={dictionary.fields.usernameHint}
        defaultValue={state.values.username}
        error={errors.username && dictionary.errors[errors.username]}
      />
      <AuthSubmit label={dictionary.guest.submit} pendingLabel={dictionary.guest.pending} pending={pending} />
    </form>
  );
}
