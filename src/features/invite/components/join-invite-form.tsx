"use client";

import { useActionState } from "react";
import { AuthSubmit } from "@/features/auth/components/auth-submit";
import { FormError } from "@/features/auth/components/form-error";
import { joinWithInviteLink, type InviteErrorCode } from "@/features/lobby/actions";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type JoinInviteFormProps = { token: string; locale: Locale; dictionary: Dictionary["invite"] };

/** Joins the lobby of an invite link; the server checks the link and binds it to this address. */
export function JoinInviteForm({ token, locale, dictionary }: JoinInviteFormProps) {
  const [error, action, pending] = useActionState<InviteErrorCode | null>(() => joinWithInviteLink(token, locale), null);

  return (
    <form action={action} className="flex flex-col gap-4">
      {error && <FormError message={dictionary.errors[error]} />}
      <AuthSubmit label={dictionary.join} pendingLabel={dictionary.pending} pending={pending} />
    </form>
  );
}
