"use client";

import { useActionState } from "react";
import { signIn, type AuthFormState } from "@/features/auth/actions";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthSubmit } from "@/features/auth/components/auth-submit";
import { FormError } from "@/features/auth/components/form-error";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

const initialState: AuthFormState = { errors: {}, values: {} };

type SignInFormProps = { locale: Locale; dictionary: Dictionary["auth"] };

export function SignInForm({ locale, dictionary }: SignInFormProps) {
  const [state, action, pending] = useActionState(signIn, initialState);
  const { errors } = state;

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      {errors.form && <FormError message={dictionary.errors[errors.form]} />}
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
        autoComplete="current-password"
        label={dictionary.fields.password}
        error={errors.password && dictionary.errors[errors.password]}
      />
      <AuthSubmit label={dictionary.signIn.submit} pendingLabel={dictionary.signIn.pending} pending={pending} />
    </form>
  );
}
