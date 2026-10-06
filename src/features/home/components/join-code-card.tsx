"use client";

import { useActionState } from "react";
import { Icon } from "@/components/ui/icon";
import { LOBBY_CODE_LENGTH } from "@/lib/lobby-code";
import { FormError } from "@/features/auth/components/form-error";
import { joinLobby, type JoinFormState } from "@/features/lobby/actions";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type JoinCodeCardProps = {
  dictionary: Dictionary["home"]["joinCode"];
  locale: Locale;
  /** Prefilled when opening an invite link. */
  defaultCode?: string;
};

export function JoinCodeCard({ dictionary, locale, defaultCode = "" }: JoinCodeCardProps) {
  const [state, action, pending] = useActionState<JoinFormState, FormData>(joinLobby, { error: null, code: defaultCode });

  return (
    <section className="relative">
      <div className="absolute -inset-0.5 translate-x-2 translate-y-2 rotate-[0.5deg] bg-surface-container-lowest" />
      <div className="relative h-full rotate-[-0.5deg] bg-surface-container-high p-4 shadow-hard-md shadow-secondary">
        <div className="flex items-center justify-between">
          <span className="font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">
            {dictionary.eyebrow}
          </span>
          <Icon name="pin" size={20} className="text-secondary" />
        </div>
        <h2 className="mt-2 font-hud text-headline-sm font-black uppercase italic tracking-wider text-secondary">
          {dictionary.title}
        </h2>
        <form action={action} className="mt-2 flex items-center gap-1">
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
            className="w-full min-w-0 bg-surface-container-lowest px-3 py-2 font-hud text-headline-sm font-black uppercase tracking-widest text-secondary-fixed shadow-inner placeholder:text-surface-variant focus:bg-surface-container focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 bg-primary-container px-4 py-2 font-hud text-headline-sm font-black uppercase italic text-on-primary-container shadow-hard-sm transition-colors hover:bg-secondary-container hover:text-on-secondary-fixed"
          >
            {dictionary.submit}
          </button>
        </form>
        {state.error && (
          <div className="mt-2">
            <FormError message={dictionary.errors[state.error]} />
          </div>
        )}
      </div>
    </section>
  );
}
