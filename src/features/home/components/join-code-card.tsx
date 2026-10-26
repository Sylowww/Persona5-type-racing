"use client";

import { useActionState } from "react";
import { Icon } from "@/components/ui/icon";
import { LOBBY_CODE_LENGTH } from "@/lib/lobby-code";
import { FormError } from "@/features/auth/components/form-error";
import { formatMessage } from "@/i18n/format";
import { joinLobby, type JoinFormState } from "@/features/lobby/actions";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type JoinCodeCardProps = {
  dictionary: Dictionary["home"]["joinCode"];
  locale: Locale;
  /** Prefilled when opening a lobby link. */
  defaultCode?: string;
  /** Why that lobby cannot be joined, shown before any attempt (e.g. it is private). */
  initialError?: JoinFormState["error"];
};

export function JoinCodeCard({ dictionary, locale, defaultCode = "", initialError = null }: JoinCodeCardProps) {
  const [state, action, pending] = useActionState<JoinFormState, FormData>(joinLobby, { error: initialError, code: defaultCode });

  return (
    <section className="panel flex h-full flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">{dictionary.eyebrow}</span>
        <Icon name="pin" size={22} className="text-primary-container" />
      </div>
      <h2 className="font-display text-headline-sm uppercase italic tracking-wide text-secondary md:text-headline-md">{dictionary.title}</h2>
      <form action={action} className="mt-auto flex items-stretch gap-2 pt-2">
        <input type="hidden" name="locale" value={locale} />
        <label htmlFor="lobby-code" className="sr-only">
          {dictionary.label}
        </label>
        <input
          id="lobby-code"
          name="code"
          type="text"
          autoComplete="off"
          maxLength={LOBBY_CODE_LENGTH}
          defaultValue={state.code}
          placeholder={dictionary.placeholder}
          className="w-full min-w-0 border border-surface-container-highest bg-surface-container-lowest px-3 py-2 font-hud text-headline-sm font-black uppercase tracking-widest text-secondary-fixed placeholder:text-surface-bright focus:border-secondary-fixed"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 bg-primary-container px-4 py-2 font-hud text-label-hud font-black uppercase tracking-widest text-on-primary-container transition-colors hover:bg-secondary-container hover:text-on-secondary-fixed"
        >
          {dictionary.submit}
        </button>
      </form>
      {state.error && (
        <div className="mt-2 flex flex-col gap-2">
          <FormError message={formatMessage(dictionary.errors[state.error], { code: state.current ?? "" })} />
          {state.error === "alreadyInLobby" && (
            // Same form, sent again with the player's agreement to leave their current lobby (SALLE-06).
            <form action={action}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="code" value={state.code} />
              <input type="hidden" name="leaveCurrent" value="1" />
              <button
                type="submit"
                disabled={pending}
                className="w-full bg-secondary-fixed px-3 py-1.5 font-hud text-label-hud font-black uppercase text-on-secondary-fixed"
              >
                {dictionary.leaveAndJoin}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
