"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { createPublicLobby, quickRace, type QuickRaceResult } from "@/features/lobby/actions";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type QuickRaceCardProps = { dictionary: Dictionary["lobbies"]["quickRace"]; errors: Dictionary["lobbies"]["errors"]; locale: Locale };

/** « Faire une course » (JOIN-03): one click into the public lobby closest to full. */
export function QuickRaceCard({ dictionary, errors, locale }: QuickRaceCardProps) {
  const [result, setResult] = useState<QuickRaceResult | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-3 bg-primary-container p-4 text-on-primary-container shadow-hard-xl shadow-secondary-fixed sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="font-display text-headline-md uppercase italic">{dictionary.title}</h2>
          <p className="text-[14px]">{dictionary.text}</p>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const first = await quickRace(locale);
              // One lobby at a time (SALLE-06): ask before leaving the current one.
              const isBusy = first.state === "error" && first.error === "alreadyInLobby";
              setResult(isBusy && window.confirm(errors.alreadyInLobby) ? await quickRace(locale, true) : first);
            })
          }
          className="flex -skew-x-6 items-center gap-2 bg-secondary-fixed px-5 py-2 font-hud text-headline-sm font-black uppercase italic text-on-secondary-fixed shadow-hard-sm transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-70"
        >
          <Icon name="bolt" size={22} filled className="skew-x-6" />
          <span className="skew-x-6">{dictionary.button}</span>
        </button>
      </div>
      {result && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest px-4 py-3 text-on-surface">
          <p>{result.state === "none" ? dictionary.none : errors[result.error]}</p>
          {result.state === "none" && result.canCreate && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => createPublicLobby(locale))}
              className="bg-primary-container px-3 py-1 font-hud text-label-hud font-black uppercase text-on-primary-container shadow-hard-xs"
            >
              {dictionary.create}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
