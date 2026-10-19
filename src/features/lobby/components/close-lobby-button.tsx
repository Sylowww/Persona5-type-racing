"use client";

import { useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import type { Locale } from "@/i18n/locales";
import { closeLobbyForAll } from "../actions";

type CloseLobbyButtonProps = {
  code: string;
  locale: Locale;
  label: string;
  confirmMessage: string;
};

/** Host only: closes the lobby for everyone after a confirmation. */
export function CloseLobbyButton({ code, locale, label, confirmMessage }: CloseLobbyButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (window.confirm(confirmMessage)) startTransition(async () => void (await closeLobbyForAll(code, locale)));
      }}
      className="flex -skew-x-6 items-center gap-2 bg-surface-container px-4 py-2 font-hud text-headline-sm font-black uppercase italic text-error shadow-hard-sm transition-transform hover:-translate-y-0.5 hover:bg-error-container hover:text-on-error-container disabled:opacity-60"
    >
      <Icon name="block" size={20} />
      <span>{label}</span>
    </button>
  );
}
