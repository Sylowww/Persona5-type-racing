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
    <section className="flex flex-col gap-4 border-l-4 border-primary-container bg-surface-container-low p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-headline-md uppercase italic tracking-wide text-secondary">{dictionary.title}</h2>
          <p className="text-on-surface-variant">{dictionary.text}</p>
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
          className="btn-primary"
        >
          <Icon name="bolt" size={20} filled />
          {dictionary.button}
        </button>
      </div>
      {result && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container-high pt-4 text-on-surface">
          <p>{result.state === "none" ? dictionary.none : errors[result.error]}</p>
          {result.state === "none" && result.canCreate && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => createPublicLobby(locale))}
              className="btn-ghost"
            >
              {dictionary.create}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
