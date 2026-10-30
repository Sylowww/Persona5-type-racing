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
      className="btn-ghost px-3 py-2 text-error enabled:hover:bg-error-container enabled:hover:text-on-error-container"
    >
      <Icon name="block" size={18} />
      <span>{label}</span>
    </button>
  );
}
