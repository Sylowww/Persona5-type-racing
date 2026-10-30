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
    // A tilted calling-card slip: red tab on top, the code typed into a yellow slot.
    <section className="relative flex h-full -rotate-1 flex-col gap-4 border-4 border-secondary bg-surface-container-lowest px-5 pt-8 pb-5 shadow-[8px_8px_0_var(--color-primary-container)]">
      <span className="absolute -top-4 left-4 flex -skew-x-12 items-center gap-2 bg-primary-container px-3 py-1 font-hud text-label-hud font-black uppercase tracking-widest text-on-primary-container shadow-hard-sm">
        <Icon name="pin" size={18} />
        {dictionary.eyebrow}
      </span>
      <h2 className="font-display text-[clamp(32px,3.6vw,48px)] uppercase italic leading-none tracking-wide text-secondary [text-shadow:3px_3px_0_var(--color-primary-container)]">
        {dictionary.title}
      </h2>
      <form action={action} className="mt-auto flex items-stretch gap-3 pt-2">
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
          className="w-full min-w-0 border-2 border-secondary-fixed bg-surface-container-low px-3 py-2 font-hud text-headline-sm font-black uppercase tracking-[0.3em] text-secondary-fixed placeholder:text-surface-bright"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 -skew-x-12 bg-primary-container px-5 py-2 font-hud text-label-hud font-black uppercase tracking-widest text-on-primary-container shadow-hard-md transition-colors hover:bg-secondary-fixed hover:text-on-secondary-fixed"
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
                className="w-full -skew-x-6 bg-secondary-fixed px-3 py-1.5 font-hud text-label-hud font-black uppercase text-on-secondary-fixed shadow-hard-sm"
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
