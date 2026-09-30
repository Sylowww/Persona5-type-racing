"use client";

import { useActionState } from "react";
import { signUp, type AuthFormState } from "@/features/auth/actions";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthSubmit } from "@/features/auth/components/auth-submit";
import { FormError } from "@/features/auth/components/form-error";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import { USERNAME_MAX } from "@/lib/auth/validation";

const initialState: AuthFormState = { errors: {}, values: {} };

type SignUpFormProps = { locale: Locale; dictionary: Dictionary["auth"] };

export function SignUpForm({ locale, dictionary }: SignUpFormProps) {
  const [state, action, pending] = useActionState(signUp, initialState);
  const { errors } = state;

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      {errors.form && <FormError message={dictionary.errors[errors.form]} />}
      <AuthField
        name="username"
        icon="person"
        autoComplete="username"
        maxLength={USERNAME_MAX}
        label={dictionary.fields.username}
        hint={dictionary.fields.usernameHint}
        defaultValue={state.values.username}
        error={errors.username && dictionary.errors[errors.username]}
      />
      <AuthField
        name="email"
        type="email"
        icon="mail"
        autoComplete="email"
        label={dictionary.fields.email}
        defaultValue={state.values.email}
        error={errors.email && dictionary.errors[errors.email]}
      />
      <AuthField
        name="password"
        type="password"
        icon="lock"
        autoComplete="new-password"
        label={dictionary.fields.password}
        hint={dictionary.fields.passwordHint}
        error={errors.password && dictionary.errors[errors.password]}
      />
      <AuthSubmit label={dictionary.signUp.submit} pendingLabel={dictionary.signUp.pending} pending={pending} />
    </form>
  );
}
